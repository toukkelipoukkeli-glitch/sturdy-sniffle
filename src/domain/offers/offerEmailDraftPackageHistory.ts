import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank, optionalTrim } from "../shared/stringValidation"
import type { OfferEmailDraftPackageStatus } from "./offerEmailDraftPackage"
import type {
  OfferEmailDraftPackagePersistenceRecord,
  OfferEmailDraftPackagePersistenceSnapshot,
} from "./offerEmailDraftPackagePersistence"

export const OFFER_EMAIL_DRAFT_PACKAGE_HISTORY_VERSION = "offer-email-draft-package-history.v1"

export interface OfferEmailDraftPackageHistorySummary {
  historyVersion: typeof OFFER_EMAIL_DRAFT_PACKAGE_HISTORY_VERSION
  totalPackages: number
  latestPackage?: OfferEmailDraftPackageHistoryRecordSummary
  statusCounts: Partial<Record<OfferEmailDraftPackageStatus, number>>
  blockedPackageCount: number
  readyPackageCount: number
  attachmentCount: number
  blockerCount: number
  warningCount: number
  recipientSummaries: OfferEmailDraftPackageRecipientSummary[]
}

export interface OfferEmailDraftPackageHistoryRecordSummary {
  packageFingerprint: string
  recordedAt: string
  recordedBy: string
  status: OfferEmailDraftPackageStatus
  offerId: string
  offerNumber: string
  rfqId: string
  releaseAt: string
  attachmentCount: number
  blockerCount: number
  warningCount: number
  nextActionCount: number
  commandKey?: string
  recipient?: string
  subject?: string
}

export interface OfferEmailDraftPackageRecipientSummary {
  recipient: string
  packageCount: number
  latestRecordedAt: string
  statuses: OfferEmailDraftPackageStatus[]
}

export function summarizeOfferEmailDraftPackageHistory(
  snapshot: Pick<OfferEmailDraftPackagePersistenceSnapshot, "records">,
): OfferEmailDraftPackageHistorySummary {
  const records = snapshot.records.map(normalizeRecordSummary).sort(sortNewestFirst)
  const statusCounts = countStatuses(records)

  return {
    attachmentCount: records.reduce((total, record) => total + record.attachmentCount, 0),
    blockedPackageCount: statusCounts.blocked ?? 0,
    blockerCount: records.reduce((total, record) => total + record.blockerCount, 0),
    historyVersion: OFFER_EMAIL_DRAFT_PACKAGE_HISTORY_VERSION,
    latestPackage: records[0],
    readyPackageCount: statusCounts.ready ?? 0,
    recipientSummaries: summarizeRecipients(records),
    statusCounts,
    totalPackages: records.length,
    warningCount: records.reduce((total, record) => total + record.warningCount, 0),
  }
}

function normalizeRecordSummary(
  record: OfferEmailDraftPackagePersistenceRecord,
): OfferEmailDraftPackageHistoryRecordSummary {
  const commandKey = optionalTrim(record.commandKey)
  const recipient = optionalTrim(record.recipient)
  const subject = optionalTrim(record.emailPackage.subject)
  return {
    attachmentCount: record.attachmentFileNames.length,
    blockerCount: record.blockerLabels.length,
    nextActionCount: record.emailPackage.nextActions.length,
    offerId: nonBlank(record.offerId, "record.offerId"),
    offerNumber: nonBlank(record.offerNumber, "record.offerNumber"),
    packageFingerprint: nonBlank(record.packageFingerprint, "record.packageFingerprint"),
    recordedAt: normalizeIsoTimestamp(record.recordedAt, "record.recordedAt"),
    recordedBy: nonBlank(record.recordedBy, "record.recordedBy"),
    releaseAt: normalizeIsoTimestamp(record.releaseAt, "record.releaseAt"),
    rfqId: nonBlank(record.rfqId, "record.rfqId"),
    status: normalizeStatus(record.status),
    warningCount: record.warningLabels.length,
    ...(commandKey ? { commandKey } : {}),
    ...(recipient ? { recipient } : {}),
    ...(subject ? { subject } : {}),
  }
}

function sortNewestFirst(
  left: OfferEmailDraftPackageHistoryRecordSummary,
  right: OfferEmailDraftPackageHistoryRecordSummary,
): number {
  return (
    compareLex(right.recordedAt, left.recordedAt) ||
    compareLex(left.packageFingerprint, right.packageFingerprint) ||
    compareLex(left.status, right.status) ||
    compareLex(left.offerId, right.offerId)
  )
}

function countStatuses(
  records: OfferEmailDraftPackageHistoryRecordSummary[],
): Partial<Record<OfferEmailDraftPackageStatus, number>> {
  return records.reduce<Partial<Record<OfferEmailDraftPackageStatus, number>>>((counts, record) => {
    counts[record.status] = (counts[record.status] ?? 0) + 1
    return counts
  }, {})
}

function summarizeRecipients(
  records: OfferEmailDraftPackageHistoryRecordSummary[],
): OfferEmailDraftPackageRecipientSummary[] {
  const byRecipient = new Map<string, OfferEmailDraftPackageHistoryRecordSummary[]>()
  for (const record of records) {
    if (!record.recipient) {
      continue
    }
    const recipientRecords = byRecipient.get(record.recipient)
    if (recipientRecords) {
      recipientRecords.push(record)
    } else {
      byRecipient.set(record.recipient, [record])
    }
  }

  return [...byRecipient.entries()]
    .map(([recipient, recipientRecords]) => {
      const sortedRecords = [...recipientRecords].sort(sortNewestFirst)
      return {
        latestRecordedAt: sortedRecords[0].recordedAt,
        packageCount: sortedRecords.length,
        recipient,
        statuses: [...new Set(sortedRecords.map((record) => record.status))].sort(compareLex),
      }
    })
    .sort((left, right) => compareLex(right.latestRecordedAt, left.latestRecordedAt) || compareLex(left.recipient, right.recipient))
}

function normalizeStatus(status: OfferEmailDraftPackageStatus): OfferEmailDraftPackageStatus {
  if (status !== "blocked" && status !== "ready") {
    throw new Error("email draft package history status must be blocked or ready")
  }
  return status
}
