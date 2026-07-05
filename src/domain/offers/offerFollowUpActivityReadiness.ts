import { compareLex } from "../shared/deterministic"
import { nonNegativeInteger } from "../shared/numberValidation"
import { nonBlank } from "../shared/stringValidation"
import {
  OFFER_FOLLOW_UP_ACTIVITY_READ_VERSION,
  type OfferFollowUpActivityReadSummary,
} from "./offerFollowUpActivityReadPersistence"

export const OFFER_FOLLOW_UP_ACTIVITY_READINESS_VERSION = "offer-follow-up-activity-readiness.v1"

export type OfferFollowUpActivityReadinessStatus = "partial" | "pending" | "recorded" | "review"

export interface OfferFollowUpActivityReadinessInput {
  expectedFollowUpTaskIds?: string[]
  summary: OfferFollowUpActivityReadSummary
}

export interface OfferFollowUpActivityReadiness {
  readinessVersion: typeof OFFER_FOLLOW_UP_ACTIVITY_READINESS_VERSION
  status: OfferFollowUpActivityReadinessStatus
  totalActivities: number
  expectedTaskCount: number
  recordedTaskCount: number
  missingTaskCount: number
  unexpectedTaskCount: number
  unmatchedActivityCount: number
  expectedFollowUpTaskIds: string[]
  recordedFollowUpTaskIds: string[]
  missingFollowUpTaskIds: string[]
  unexpectedFollowUpTaskIds: string[]
  nextActions: string[]
  latestActivityMessage?: string
}

export function buildOfferFollowUpActivityReadiness({
  expectedFollowUpTaskIds = [],
  summary,
}: OfferFollowUpActivityReadinessInput): OfferFollowUpActivityReadiness {
  if (summary.readVersion !== OFFER_FOLLOW_UP_ACTIVITY_READ_VERSION) {
    throw new Error("offer follow-up activity read version is not supported")
  }

  const totalActivities = nonNegativeInteger(summary.totalActivities, "summary.totalActivities")
  const expectedIds = uniqueSorted(expectedFollowUpTaskIds, "expectedFollowUpTaskIds")
  const recordedIds = uniqueSorted(summary.recordedFollowUpTaskIds, "summary.recordedFollowUpTaskIds")
  const expected = new Set(expectedIds)
  const recorded = new Set(recordedIds)
  const missingIds = expectedIds.filter((taskId) => !recorded.has(taskId))
  const unexpectedIds = expectedIds.length > 0 ? recordedIds.filter((taskId) => !expected.has(taskId)) : []
  const unmatchedActivityCount = Math.max(0, totalActivities - recordedIds.length)
  const status = activityReadinessStatus({
    expectedIds,
    missingIds,
    recordedIds,
    totalActivities,
    unexpectedIds,
    unmatchedActivityCount,
  })

  return {
    expectedFollowUpTaskIds: expectedIds,
    expectedTaskCount: expectedIds.length,
    latestActivityMessage: summary.latestActivity?.message,
    missingFollowUpTaskIds: missingIds,
    missingTaskCount: missingIds.length,
    nextActions: nextActionsForStatus({
      missingIds,
      status,
      unexpectedIds,
      unmatchedActivityCount,
    }),
    readinessVersion: OFFER_FOLLOW_UP_ACTIVITY_READINESS_VERSION,
    recordedFollowUpTaskIds: recordedIds,
    recordedTaskCount: recordedIds.length,
    status,
    totalActivities,
    unexpectedFollowUpTaskIds: unexpectedIds,
    unexpectedTaskCount: unexpectedIds.length,
    unmatchedActivityCount,
  }
}

function activityReadinessStatus(input: {
  expectedIds: string[]
  missingIds: string[]
  recordedIds: string[]
  totalActivities: number
  unexpectedIds: string[]
  unmatchedActivityCount: number
}): OfferFollowUpActivityReadinessStatus {
  if (input.missingIds.length > 0) {
    return "partial"
  }
  if (input.unexpectedIds.length > 0 || (input.totalActivities > 0 && input.recordedIds.length === 0)) {
    return "review"
  }
  if (input.expectedIds.length === 0 && input.recordedIds.length === 0) {
    return input.totalActivities > 0 ? "review" : "pending"
  }
  if (input.unmatchedActivityCount > 0) {
    return "review"
  }
  return "recorded"
}

function nextActionsForStatus(input: {
  missingIds: string[]
  status: OfferFollowUpActivityReadinessStatus
  unexpectedIds: string[]
  unmatchedActivityCount: number
}): string[] {
  if (input.status === "pending") {
    return ["No persisted follow-up activities have been recorded yet."]
  }
  if (input.status === "partial") {
    return [`Record ${plural(input.missingIds.length, "missing follow-up activity")} for ${listIds(input.missingIds)}.`]
  }
  if (input.status === "review") {
    const actions = []
    if (input.unexpectedIds.length > 0) {
      actions.push(`Review ${plural(input.unexpectedIds.length, "unexpected follow-up task id")}: ${listIds(input.unexpectedIds)}.`)
    }
    if (input.unmatchedActivityCount > 0) {
      actions.push(`Review ${plural(input.unmatchedActivityCount, "persisted follow-up activity message")} without a recognized task id.`)
    }
    return actions.length > 0 ? actions : ["Review persisted follow-up activity coverage before writing more activity records."]
  }
  return ["Persisted follow-up activity coverage is complete."]
}

function uniqueSorted(values: string[], fieldName: string): string[] {
  return [...new Set(values.map((value, index) => nonBlank(value, `${fieldName}[${index}]`)))].sort(compareLex)
}

function plural(count: number, singular: string): string {
  return `${count} ${singular}${count === 1 ? "" : "s"}`
}

function listIds(values: string[]): string {
  const visible = values.slice(0, 6)
  const overflow = values.length - visible.length
  return overflow > 0 ? `${visible.join(", ")} and ${overflow} more` : visible.join(", ")
}
