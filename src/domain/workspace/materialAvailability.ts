import type { QuoteProcessKey } from "../quoting/registry"
import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import type { QuoteQueuePriority, QuoteQueueStatus } from "./quoteQueue"

export const MATERIAL_AVAILABILITY_VERSION = "material-availability.v1"

export type MaterialCertificateStatus = "ready" | "missing" | "expired"
export type MaterialAvailabilityStatus = "covered" | "needs_purchase" | "at_risk" | "blocked"
export type MaterialAvailabilityIssueCode =
  | "missing_supplier"
  | "purchase_required"
  | "purchase_due_soon"
  | "purchase_overdue"
  | "certificate_missing"
  | "certificate_expired"

export interface MaterialRequirementItem {
  id: string
  customerName: string
  subject: string
  dueAt: string
  materialName: string
  priority: QuoteQueuePriority
  process: QuoteProcessKey
  receivedAt: string
  requiredKg: number
  status: QuoteQueueStatus
}

export interface MaterialInventoryLot {
  id: string
  materialName: string
  availableKg: number
  reservedKg?: number
  certificateStatus?: MaterialCertificateStatus
  location?: string
}

export interface MaterialSupplierOption {
  match: string
  supplierName: string
  leadTimeDays: number
  minimumOrderKg?: number
}

export interface MaterialAvailabilityInput {
  items: MaterialRequirementItem[]
  inventoryLots: MaterialInventoryLot[]
  now: string
  supplierOptions?: MaterialSupplierOption[]
  defaultLeadTimeDays?: number
  purchaseBufferDays?: number
}

export interface MaterialAllocation {
  lotId: string
  materialName: string
  location?: string
  allocatedKg: number
  certificateStatus: MaterialCertificateStatus
}

export interface MaterialAvailabilityIssue {
  code: MaterialAvailabilityIssueCode
  message: string
}

export interface MaterialAvailabilityCommitment {
  itemId: string
  customerName: string
  subject: string
  materialName: string
  requiredKg: number
  allocatedKg: number
  purchaseKg: number
  supplierName?: string
  requestBy?: string
  dueDate: string
  status: MaterialAvailabilityStatus
  issues: MaterialAvailabilityIssue[]
  allocations: MaterialAllocation[]
}

export interface MaterialAvailabilityPlan {
  materialAvailabilityVersion: typeof MATERIAL_AVAILABILITY_VERSION
  generatedAt: string
  status: MaterialAvailabilityStatus
  itemCount: number
  materialCount: number
  totalRequiredKg: number
  totalAllocatedKg: number
  totalPurchaseKg: number
  coveredCount: number
  needsPurchaseCount: number
  atRiskCount: number
  blockedCount: number
  commitments: MaterialAvailabilityCommitment[]
}

interface NormalizedLot extends MaterialInventoryLot {
  remainingKg: number
}

const openStatuses: ReadonlySet<QuoteQueueStatus> = new Set(["new", "triage", "estimating", "ready"])
const millisecondsPerDay = 86_400_000

export function buildMaterialAvailabilityPlan(input: MaterialAvailabilityInput): MaterialAvailabilityPlan {
  const generatedAt = normalizeIsoTimestamp(input.now, "now")
  const generatedDate = utcDateOnly(generatedAt)
  const supplierOptions = normalizeSupplierOptions(input.supplierOptions ?? [])
  const defaultLeadTimeDays = positiveInteger(input.defaultLeadTimeDays ?? 7, "defaultLeadTimeDays")
  const purchaseBufferDays = nonNegativeInteger(input.purchaseBufferDays ?? 1, "purchaseBufferDays")
  const lotsByMaterial = groupLotsByMaterial(input.inventoryLots.map(normalizeLot))
  const commitments = input.items
    .filter((item) => openStatuses.has(item.status))
    .sort(compareMaterialRequirementPriority)
    .map((item) =>
      buildCommitment(item, lotsByMaterial, {
        defaultLeadTimeDays,
        generatedDate,
        purchaseBufferDays,
        supplierOptions,
      }),
    )
    .sort(
      (left, right) =>
        statusWeight(right.status) - statusWeight(left.status) ||
        compareLex(left.dueDate, right.dueDate) ||
        compareLex(left.customerName, right.customerName) ||
        compareLex(left.itemId, right.itemId),
    )

  return {
    materialAvailabilityVersion: MATERIAL_AVAILABILITY_VERSION,
    generatedAt,
    status: summarizeStatus(commitments.map((commitment) => commitment.status)),
    itemCount: commitments.length,
    materialCount: new Set(commitments.map((commitment) => materialKey(commitment.materialName))).size,
    totalRequiredKg: roundKg(commitments.reduce((total, commitment) => total + commitment.requiredKg, 0)),
    totalAllocatedKg: roundKg(commitments.reduce((total, commitment) => total + commitment.allocatedKg, 0)),
    totalPurchaseKg: roundKg(commitments.reduce((total, commitment) => total + commitment.purchaseKg, 0)),
    coveredCount: commitments.filter((commitment) => commitment.status === "covered").length,
    needsPurchaseCount: commitments.filter((commitment) => commitment.status === "needs_purchase").length,
    atRiskCount: commitments.filter((commitment) => commitment.status === "at_risk").length,
    blockedCount: commitments.filter((commitment) => commitment.status === "blocked").length,
    commitments,
  }
}

function buildCommitment(
  item: MaterialRequirementItem,
  lotsByMaterial: Map<string, NormalizedLot[]>,
  context: {
    defaultLeadTimeDays: number
    generatedDate: string
    purchaseBufferDays: number
    supplierOptions: MaterialSupplierOption[]
  },
): MaterialAvailabilityCommitment {
  const materialName = nonBlank(item.materialName, "materialName")
  const requiredKg = positiveNumber(item.requiredKg, "requiredKg")
  const dueDate = utcDateOnly(item.dueAt)
  const allocations = allocateFromLots(requiredKg, lotsByMaterial.get(materialKey(materialName)) ?? [])
  const allocatedKg = roundKg(allocations.reduce((total, allocation) => total + allocation.allocatedKg, 0))
  const missingKg = roundKg(requiredKg - allocatedKg)
  const supplierOption = findSupplierOption(materialName, context.supplierOptions)
  const purchaseKg =
    missingKg > 0 ? roundKg(Math.max(missingKg, supplierOption?.minimumOrderKg ?? 0)) : 0
  const leadTimeDays = supplierOption?.leadTimeDays ?? context.defaultLeadTimeDays
  const supplierName = purchaseKg > 0 ? supplierOption?.supplierName : undefined
  const requestBy = purchaseKg > 0 ? addUtcDays(addUtcDays(dueDate, -context.purchaseBufferDays), -leadTimeDays) : undefined
  const issues = buildIssues({
    allocations,
    generatedDate: context.generatedDate,
    purchaseKg,
    requestBy,
    supplierName,
  })

  return {
    itemId: nonBlank(item.id, "id"),
    customerName: nonBlank(item.customerName, "customerName"),
    subject: nonBlank(item.subject, "subject"),
    materialName,
    requiredKg,
    allocatedKg,
    purchaseKg,
    supplierName,
    requestBy,
    dueDate,
    status: statusFromIssues(issues),
    issues,
    allocations,
  }
}

function allocateFromLots(requiredKg: number, lots: NormalizedLot[]): MaterialAllocation[] {
  const allocations: MaterialAllocation[] = []
  let remainingKg = requiredKg

  for (const lot of lots) {
    if (remainingKg <= 0) {
      break
    }
    if (lot.remainingKg <= 0) {
      continue
    }

    const allocatedKg = roundKg(Math.min(lot.remainingKg, remainingKg))
    lot.remainingKg = roundKg(lot.remainingKg - allocatedKg)
    remainingKg = roundKg(remainingKg - allocatedKg)
    allocations.push({
      lotId: lot.id,
      materialName: lot.materialName,
      location: lot.location,
      allocatedKg,
      certificateStatus: lot.certificateStatus ?? "ready",
    })
  }

  return allocations
}

function buildIssues(input: {
  allocations: MaterialAllocation[]
  generatedDate: string
  purchaseKg: number
  requestBy?: string
  supplierName?: string
}): MaterialAvailabilityIssue[] {
  const issues: MaterialAvailabilityIssue[] = []
  if (input.allocations.some((allocation) => allocation.certificateStatus === "expired")) {
    issues.push({
      code: "certificate_expired",
      message: "Allocated material has an expired certificate.",
    })
  }
  if (input.allocations.some((allocation) => allocation.certificateStatus === "missing")) {
    issues.push({
      code: "certificate_missing",
      message: "Allocated material is missing certificate paperwork.",
    })
  }

  if (input.purchaseKg <= 0) {
    return issues
  }

  if (!input.supplierName) {
    issues.push({
      code: "missing_supplier",
      message: "No approved supplier is matched to the material purchase gap.",
    })
    return issues
  }

  const requestBy = input.requestBy ?? input.generatedDate
  const daysUntilRequest = daysBetween(input.generatedDate, requestBy)
  if (daysUntilRequest < 0) {
    issues.push({
      code: "purchase_overdue",
      message: `Material purchase was due by ${requestBy}.`,
    })
  } else if (daysUntilRequest <= 1) {
    issues.push({
      code: "purchase_due_soon",
      message: `Material purchase is due by ${requestBy}.`,
    })
  } else {
    issues.push({
      code: "purchase_required",
      message: `${formatKg(input.purchaseKg)} kg must be purchased.`,
    })
  }

  return issues
}

function normalizeLot(lot: MaterialInventoryLot): NormalizedLot {
  const availableKg = nonNegativeNumber(lot.availableKg, "inventoryLot.availableKg")
  const reservedKg = nonNegativeNumber(lot.reservedKg ?? 0, "inventoryLot.reservedKg")
  return {
    id: nonBlank(lot.id, "inventoryLot.id"),
    materialName: nonBlank(lot.materialName, "inventoryLot.materialName"),
    availableKg,
    reservedKg,
    certificateStatus: lot.certificateStatus ?? "ready",
    location: lot.location ? nonBlank(lot.location, "inventoryLot.location") : undefined,
    remainingKg: roundKg(Math.max(0, availableKg - reservedKg)),
  }
}

function normalizeSupplierOptions(options: MaterialSupplierOption[]): MaterialSupplierOption[] {
  return options
    .map((option) => {
      const match = materialKey(nonBlank(option.match, "supplierOption.match"))
      if (!match) {
        throw new Error("supplierOption.match must include at least one alphanumeric character")
      }
      return {
        match,
        supplierName: nonBlank(option.supplierName, "supplierOption.supplierName"),
        leadTimeDays: positiveInteger(option.leadTimeDays, "supplierOption.leadTimeDays"),
        minimumOrderKg:
          option.minimumOrderKg === undefined ? undefined : positiveNumber(option.minimumOrderKg, "supplierOption.minimumOrderKg"),
      }
    })
    .sort(
      (left, right) =>
        right.match.length - left.match.length ||
        compareLex(left.match, right.match) ||
        compareLex(left.supplierName, right.supplierName),
    )
}

function groupLotsByMaterial(lots: NormalizedLot[]): Map<string, NormalizedLot[]> {
  const groups = new Map<string, NormalizedLot[]>()
  for (const lot of lots) {
    const key = materialKey(lot.materialName)
    const group = groups.get(key)
    if (group) {
      group.push(lot)
    } else {
      groups.set(key, [lot])
    }
  }
  for (const group of groups.values()) {
    group.sort(
      (left, right) =>
        certificateWeight(left.certificateStatus ?? "ready") - certificateWeight(right.certificateStatus ?? "ready") ||
        compareLex(left.id, right.id),
    )
  }
  return groups
}

function findSupplierOption(materialName: string, options: MaterialSupplierOption[]): MaterialSupplierOption | undefined {
  const key = materialKey(materialName)
  return options
    .filter((option) => key.includes(option.match))
    .sort(
      (left, right) =>
        right.match.length - left.match.length ||
        compareLex(left.match, right.match) ||
        compareLex(left.supplierName, right.supplierName),
    )[0]
}

function compareMaterialRequirementPriority(left: MaterialRequirementItem, right: MaterialRequirementItem) {
  return (
    priorityWeight(right.priority) - priorityWeight(left.priority) ||
    compareLex(utcDateOnly(left.dueAt), utcDateOnly(right.dueAt)) ||
    compareLex(left.receivedAt, right.receivedAt) ||
    compareLex(left.customerName, right.customerName) ||
    compareLex(left.id, right.id)
  )
}

function statusFromIssues(issues: MaterialAvailabilityIssue[]): MaterialAvailabilityStatus {
  if (issues.some((issue) => issue.code === "missing_supplier" || issue.code === "certificate_expired")) {
    return "blocked"
  }
  if (issues.some((issue) => issue.code === "purchase_due_soon" || issue.code === "purchase_overdue" || issue.code === "certificate_missing")) {
    return "at_risk"
  }
  if (issues.length > 0) {
    return "needs_purchase"
  }
  return "covered"
}

function summarizeStatus(statuses: MaterialAvailabilityStatus[]): MaterialAvailabilityStatus {
  if (statuses.includes("blocked")) {
    return "blocked"
  }
  if (statuses.includes("at_risk")) {
    return "at_risk"
  }
  if (statuses.includes("needs_purchase")) {
    return "needs_purchase"
  }
  return "covered"
}

function statusWeight(status: MaterialAvailabilityStatus) {
  switch (status) {
    case "blocked":
      return 3
    case "at_risk":
      return 2
    case "needs_purchase":
      return 1
    case "covered":
      return 0
  }
}

function priorityWeight(priority: QuoteQueuePriority) {
  return priority === "rush" ? 1 : 0
}

function certificateWeight(status: MaterialCertificateStatus) {
  switch (status) {
    case "ready":
      return 0
    case "missing":
      return 1
    case "expired":
      return 2
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

function materialKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

function nonBlank(value: string, key: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    throw new Error(`${key} is required`)
  }
  return trimmed
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

function positiveNumber(value: number, key: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${key} must be a positive number`)
  }
  return roundKg(value)
}

function nonNegativeNumber(value: number, key: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${key} must be a non-negative number`)
  }
  return roundKg(value)
}

function roundKg(value: number) {
  return Math.round(value * 1000) / 1000
}

function formatKg(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")
}
