import type { QuoteProcessKey } from "../quoting/registry"
import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { rankQuoteQueue, type QuoteQueueItem, type QuoteQueueStatus } from "./quoteQueue"

export const CAPACITY_COMMITMENT_VERSION = "capacity-commitment.v1"

export type CapacityCommitmentStatus = "on_track" | "at_risk" | "overbooked"
export type CapacityItemCommitmentStatus = "committed" | "late" | "unplanned"

export interface CapacityQueueItem extends QuoteQueueItem {
  estimatedWorkMinutes: number
}

export type CapacityMinutesByProcess = Partial<Record<QuoteProcessKey, number>>

export interface CapacityCommitmentInput {
  items: CapacityQueueItem[]
  now: string
  planningDays: number
  dailyCapacityMinutesByProcess: CapacityMinutesByProcess
}

export interface CapacityAllocationDay {
  date: string
  minutes: number
}

export interface CapacityItemCommitment {
  itemId: string
  process: QuoteProcessKey
  requiredMinutes: number
  allocatedMinutes: number
  unplannedMinutes: number
  dueDate: string
  startDate?: string
  completionDate?: string
  status: CapacityItemCommitmentStatus
  latenessDays: number
  allocations: CapacityAllocationDay[]
}

export interface CapacityProcessCommitment {
  process: QuoteProcessKey
  status: CapacityCommitmentStatus
  demandMinutes: number
  availableMinutes: number
  remainingCapacityMinutes: number
  overloadMinutes: number
  committedItemCount: number
  lateItemCount: number
  unplannedItemCount: number
  commitments: CapacityItemCommitment[]
}

export interface CapacityCommitmentPlan {
  capacityVersion: typeof CAPACITY_COMMITMENT_VERSION
  generatedAt: string
  planningStartDate: string
  planningEndDate: string
  planningDays: number
  status: CapacityCommitmentStatus
  totalDemandMinutes: number
  totalAvailableMinutes: number
  totalOverloadMinutes: number
  processPlans: CapacityProcessCommitment[]
}

const openStatuses: ReadonlySet<QuoteQueueStatus> = new Set(["new", "triage", "estimating", "ready"])
const millisecondsPerDay = 86_400_000

export function buildCapacityCommitmentPlan(input: CapacityCommitmentInput): CapacityCommitmentPlan {
  const generatedAt = normalizeIsoTimestamp(input.now, "now")
  const planningDays = positiveInteger(input.planningDays, "planningDays")
  const planningStartDate = utcDateOnly(generatedAt)
  const planningDates = Array.from({ length: planningDays }, (_, index) => addUtcDays(planningStartDate, index))
  const normalizedCapacity = normalizeCapacity(input.dailyCapacityMinutesByProcess)
  const workMinutesById = new Map(input.items.map((item) => [item.id, item.estimatedWorkMinutes]))
  const rankedItems = rankQuoteQueue(input.items, { now: generatedAt })
    .filter((item) => openStatuses.has(item.status))
    .map((item) => ({ ...item, estimatedWorkMinutes: positiveInteger(workMinutesById.get(item.id) ?? 0, "estimatedWorkMinutes") }))
  const processPlans = [...groupItemsByProcess(rankedItems).entries()]
    .map(([process, items]) => buildProcessCommitment(process, items, planningDates, normalizedCapacity[process] ?? 0))
    .sort((left, right) => statusWeight(right.status) - statusWeight(left.status) || compareLex(left.process, right.process))

  return {
    capacityVersion: CAPACITY_COMMITMENT_VERSION,
    generatedAt,
    planningStartDate,
    planningEndDate: planningDates[planningDates.length - 1],
    planningDays,
    status: summarizeStatus(processPlans.map((plan) => plan.status)),
    totalDemandMinutes: processPlans.reduce((total, plan) => total + plan.demandMinutes, 0),
    totalAvailableMinutes: processPlans.reduce((total, plan) => total + plan.availableMinutes, 0),
    totalOverloadMinutes: processPlans.reduce((total, plan) => total + plan.overloadMinutes, 0),
    processPlans,
  }
}

function buildProcessCommitment(
  process: QuoteProcessKey,
  items: Array<CapacityQueueItem & { rank: number }>,
  planningDates: string[],
  dailyCapacityMinutes: number,
): CapacityProcessCommitment {
  const remainingCapacityByDate = new Map(planningDates.map((date) => [date, dailyCapacityMinutes]))
  const commitments = [...items]
    .sort((left, right) => left.rank - right.rank || compareLex(left.id, right.id))
    .map((item) => allocateItem(item, remainingCapacityByDate, planningDates))
  const demandMinutes = items.reduce((total, item) => total + item.estimatedWorkMinutes, 0)
  const availableMinutes = dailyCapacityMinutes * planningDates.length
  const overloadMinutes = commitments.reduce((total, commitment) => total + commitment.unplannedMinutes, 0)
  const lateItemCount = commitments.filter((commitment) => commitment.status === "late").length
  const unplannedItemCount = commitments.filter((commitment) => commitment.status === "unplanned").length

  return {
    process,
    status: summarizeStatus(commitments.map((commitment) => commitmentStatusToPlanStatus(commitment.status))),
    demandMinutes,
    availableMinutes,
    remainingCapacityMinutes: [...remainingCapacityByDate.values()].reduce((total, minutes) => total + minutes, 0),
    overloadMinutes,
    committedItemCount: commitments.filter((commitment) => commitment.status === "committed").length,
    lateItemCount,
    unplannedItemCount,
    commitments,
  }
}

function allocateItem(
  item: CapacityQueueItem,
  remainingCapacityByDate: Map<string, number>,
  planningDates: string[],
): CapacityItemCommitment {
  const allocations: CapacityAllocationDay[] = []
  let remainingRequiredMinutes = item.estimatedWorkMinutes

  for (const date of planningDates) {
    if (remainingRequiredMinutes === 0) {
      break
    }

    const remainingCapacity = remainingCapacityByDate.get(date) ?? 0
    const minutes = Math.min(remainingCapacity, remainingRequiredMinutes)
    if (minutes <= 0) {
      continue
    }

    allocations.push({ date, minutes })
    remainingCapacityByDate.set(date, remainingCapacity - minutes)
    remainingRequiredMinutes -= minutes
  }

  const allocatedMinutes = item.estimatedWorkMinutes - remainingRequiredMinutes
  const completionDate = allocations.at(-1)?.date
  const dueDate = utcDateOnly(item.dueAt)
  const latenessDays = completionDate ? Math.max(0, daysBetween(dueDate, completionDate)) : 0
  const status: CapacityItemCommitmentStatus =
    remainingRequiredMinutes > 0 ? "unplanned" : latenessDays > 0 ? "late" : "committed"

  return {
    itemId: item.id,
    process: item.process,
    requiredMinutes: item.estimatedWorkMinutes,
    allocatedMinutes,
    unplannedMinutes: remainingRequiredMinutes,
    dueDate,
    startDate: allocations[0]?.date,
    completionDate,
    status,
    latenessDays,
    allocations,
  }
}

function groupItemsByProcess(items: Array<CapacityQueueItem & { rank: number }>): Map<QuoteProcessKey, Array<CapacityQueueItem & { rank: number }>> {
  const groups = new Map<QuoteProcessKey, Array<CapacityQueueItem & { rank: number }>>()
  for (const item of items) {
    const group = groups.get(item.process)
    if (group) {
      group.push(item)
    } else {
      groups.set(item.process, [item])
    }
  }
  return groups
}

function normalizeCapacity(capacity: CapacityMinutesByProcess): CapacityMinutesByProcess {
  return Object.fromEntries(
    Object.entries(capacity).map(([process, minutes]) => [process, nonNegativeInteger(minutes ?? 0, `${process} capacity`)]),
  ) as CapacityMinutesByProcess
}

function summarizeStatus(statuses: CapacityCommitmentStatus[]): CapacityCommitmentStatus {
  if (statuses.includes("overbooked")) {
    return "overbooked"
  }

  if (statuses.includes("at_risk")) {
    return "at_risk"
  }

  return "on_track"
}

function commitmentStatusToPlanStatus(status: CapacityItemCommitmentStatus): CapacityCommitmentStatus {
  switch (status) {
    case "committed":
      return "on_track"
    case "late":
      return "at_risk"
    case "unplanned":
      return "overbooked"
  }
}

function statusWeight(status: CapacityCommitmentStatus) {
  switch (status) {
    case "overbooked":
      return 2
    case "at_risk":
      return 1
    case "on_track":
      return 0
  }
}

function utcDateOnly(value: string) {
  const date = new Date(normalizeIsoTimestamp(value.includes("T") ? value : `${value}T00:00:00Z`, "date"))
  return date.toISOString().slice(0, 10)
}

function addUtcDays(date: string, days: number) {
  const timestamp = Date.parse(`${date}T00:00:00.000Z`) + days * millisecondsPerDay
  return new Date(timestamp).toISOString().slice(0, 10)
}

function daysBetween(leftDate: string, rightDate: string) {
  return Math.round((Date.parse(`${rightDate}T00:00:00.000Z`) - Date.parse(`${leftDate}T00:00:00.000Z`)) / millisecondsPerDay)
}

function positiveInteger(value: number, key: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${key} must be a positive integer`)
  }
  return value
}

function nonNegativeInteger(value: number, key: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${key} must be a non-negative integer`)
  }
  return value
}
