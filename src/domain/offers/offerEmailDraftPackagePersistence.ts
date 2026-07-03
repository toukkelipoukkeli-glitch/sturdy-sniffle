import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank, optionalTrim } from "../shared/stringValidation"
import type { OfferEmailDraftPackage, OfferEmailDraftPackageStatus } from "./offerEmailDraftPackage"

export const OFFER_EMAIL_DRAFT_PACKAGE_PERSISTENCE_VERSION = "offer-email-draft-package-persistence.v1"

export interface OfferEmailDraftPackagePersistenceRecord {
  persistenceVersion: typeof OFFER_EMAIL_DRAFT_PACKAGE_PERSISTENCE_VERSION
  packageFingerprint: string
  recordedAt: string
  recordedBy: string
  status: OfferEmailDraftPackageStatus
  offerId: string
  offerNumber: string
  rfqId: string
  releaseAt: string
  attachmentFileNames: string[]
  blockerLabels: string[]
  warningLabels: string[]
  emailPackage: OfferEmailDraftPackage
  commandKey?: string
  recipient?: string
}

export interface OfferEmailDraftPackagePersistenceSnapshot {
  blockedPackageFingerprints: string[]
  packageCount: number
  readyPackageFingerprints: string[]
  records: OfferEmailDraftPackagePersistenceRecord[]
  statusCounts: Partial<Record<OfferEmailDraftPackageStatus, number>>
}

export interface OfferEmailDraftPackagePersistenceAdapter {
  recordPackage(input: {
    emailPackage: OfferEmailDraftPackage
    recordedAt?: string
    recordedBy: string
  }): Promise<OfferEmailDraftPackagePersistenceSnapshot>
  snapshot(): OfferEmailDraftPackagePersistenceSnapshot
}

export interface LocalOfferEmailDraftPackagePersistenceOptions {
  initialSnapshot?: Partial<OfferEmailDraftPackagePersistenceSnapshot>
}

export function createLocalOfferEmailDraftPackagePersistence({
  initialSnapshot,
}: LocalOfferEmailDraftPackagePersistenceOptions = {}): OfferEmailDraftPackagePersistenceAdapter {
  let snapshotState = normalizeSnapshot(initialSnapshot)

  return {
    async recordPackage(input) {
      const record = buildRecord(input)
      snapshotState = normalizeSnapshot({
        records: [
          ...snapshotState.records.filter((candidate) => candidate.packageFingerprint !== record.packageFingerprint),
          record,
        ],
      })
      return snapshot()
    },
    snapshot,
  }

  function snapshot(): OfferEmailDraftPackagePersistenceSnapshot {
    return cloneSnapshot(snapshotState)
  }
}

export function fingerprintOfferEmailDraftPackage(emailPackage: OfferEmailDraftPackage): string {
  const stablePayload = stableJson({
    commandKey: optionalTrim(emailPackage.commandKey) ?? "no-command",
    offerId: nonBlank(emailPackage.offerId, "emailPackage.offerId"),
    releaseAt: normalizeIsoTimestamp(emailPackage.releaseAt, "emailPackage.releaseAt"),
  })
  return `offer-email-draft-package-${fingerprint(stablePayload)}`
}

function buildRecord(input: {
  emailPackage: OfferEmailDraftPackage
  recordedAt?: string
  recordedBy: string
}): OfferEmailDraftPackagePersistenceRecord {
  const emailPackage = clonePackage(input.emailPackage)
  return {
    attachmentFileNames: [...emailPackage.attachmentFileNames],
    blockerLabels: [...emailPackage.blockerLabels],
    emailPackage,
    packageFingerprint: fingerprintOfferEmailDraftPackage(emailPackage),
    persistenceVersion: OFFER_EMAIL_DRAFT_PACKAGE_PERSISTENCE_VERSION,
    recordedAt: normalizeIsoTimestamp(input.recordedAt ?? emailPackage.releaseAt, "recordedAt"),
    recordedBy: nonBlank(input.recordedBy, "recordedBy"),
    releaseAt: emailPackage.releaseAt,
    rfqId: emailPackage.rfqId,
    offerId: emailPackage.offerId,
    offerNumber: emailPackage.offerNumber,
    status: emailPackage.status,
    warningLabels: [...emailPackage.warningLabels],
    ...(emailPackage.commandKey ? { commandKey: emailPackage.commandKey } : {}),
    ...(emailPackage.recipient ? { recipient: emailPackage.recipient } : {}),
  }
}

function normalizeSnapshot(
  snapshot: Partial<OfferEmailDraftPackagePersistenceSnapshot> | undefined,
): OfferEmailDraftPackagePersistenceSnapshot {
  const recordsByFingerprint = new Map<string, OfferEmailDraftPackagePersistenceRecord>()
  for (const record of snapshot?.records ?? []) {
    const normalizedRecord = normalizeRecord(record)
    recordsByFingerprint.set(normalizedRecord.packageFingerprint, normalizedRecord)
  }
  const records = [...recordsByFingerprint.values()].sort(sortRecords)

  return {
    blockedPackageFingerprints: records
      .filter((record) => record.status === "blocked")
      .map((record) => record.packageFingerprint),
    packageCount: records.length,
    readyPackageFingerprints: records.filter((record) => record.status === "ready").map((record) => record.packageFingerprint),
    records,
    statusCounts: countStatuses(records),
  }
}

function normalizeRecord(record: OfferEmailDraftPackagePersistenceRecord): OfferEmailDraftPackagePersistenceRecord {
  const emailPackage = clonePackage(record.emailPackage)
  return {
    attachmentFileNames: [...emailPackage.attachmentFileNames],
    blockerLabels: [...emailPackage.blockerLabels],
    commandKey: optionalTrim(record.commandKey) ?? emailPackage.commandKey,
    emailPackage,
    packageFingerprint: fingerprintOfferEmailDraftPackage(emailPackage),
    persistenceVersion: normalizePersistenceVersion(record.persistenceVersion),
    recordedAt: normalizeIsoTimestamp(record.recordedAt, "recordedAt"),
    recordedBy: nonBlank(record.recordedBy, "recordedBy"),
    recipient: optionalTrim(record.recipient) ?? emailPackage.recipient,
    releaseAt: emailPackage.releaseAt,
    rfqId: emailPackage.rfqId,
    offerId: emailPackage.offerId,
    offerNumber: emailPackage.offerNumber,
    status: emailPackage.status,
    warningLabels: [...emailPackage.warningLabels],
  }
}

function cloneSnapshot(snapshot: OfferEmailDraftPackagePersistenceSnapshot): OfferEmailDraftPackagePersistenceSnapshot {
  return {
    blockedPackageFingerprints: [...snapshot.blockedPackageFingerprints],
    packageCount: snapshot.packageCount,
    readyPackageFingerprints: [...snapshot.readyPackageFingerprints],
    records: snapshot.records.map(cloneRecord),
    statusCounts: { ...snapshot.statusCounts },
  }
}

function cloneRecord(record: OfferEmailDraftPackagePersistenceRecord): OfferEmailDraftPackagePersistenceRecord {
  return {
    attachmentFileNames: [...record.attachmentFileNames],
    blockerLabels: [...record.blockerLabels],
    emailPackage: clonePackage(record.emailPackage),
    packageFingerprint: record.packageFingerprint,
    persistenceVersion: record.persistenceVersion,
    recordedAt: record.recordedAt,
    recordedBy: record.recordedBy,
    releaseAt: record.releaseAt,
    rfqId: record.rfqId,
    offerId: record.offerId,
    offerNumber: record.offerNumber,
    status: record.status,
    warningLabels: [...record.warningLabels],
    ...(record.commandKey ? { commandKey: record.commandKey } : {}),
    ...(record.recipient ? { recipient: record.recipient } : {}),
  }
}

function clonePackage(emailPackage: OfferEmailDraftPackage): OfferEmailDraftPackage {
  return {
    attachmentFileNames: [...emailPackage.attachmentFileNames],
    blockerLabels: [...emailPackage.blockerLabels],
    nextActions: [...emailPackage.nextActions],
    offerId: nonBlank(emailPackage.offerId, "emailPackage.offerId"),
    offerNumber: nonBlank(emailPackage.offerNumber, "emailPackage.offerNumber"),
    packageVersion: emailPackage.packageVersion,
    releaseAt: normalizeIsoTimestamp(emailPackage.releaseAt, "emailPackage.releaseAt"),
    rfqId: nonBlank(emailPackage.rfqId, "emailPackage.rfqId"),
    status: normalizePackageStatus(emailPackage.status),
    summaryHeadline: nonBlank(emailPackage.summaryHeadline, "emailPackage.summaryHeadline"),
    warningLabels: [...emailPackage.warningLabels],
    ...(emailPackage.body ? { body: emailPackage.body } : {}),
    ...(emailPackage.bodyPreview ? { bodyPreview: emailPackage.bodyPreview } : {}),
    ...(emailPackage.commandKey ? { commandKey: emailPackage.commandKey } : {}),
    ...(emailPackage.recipient ? { recipient: emailPackage.recipient } : {}),
    ...(emailPackage.subject ? { subject: emailPackage.subject } : {}),
  }
}

function sortRecords(
  left: OfferEmailDraftPackagePersistenceRecord,
  right: OfferEmailDraftPackagePersistenceRecord,
): number {
  return (
    compareLex(right.recordedAt, left.recordedAt) ||
    compareLex(left.packageFingerprint, right.packageFingerprint) ||
    compareLex(left.status, right.status) ||
    compareLex(left.offerId, right.offerId) ||
    compareLex(left.releaseAt, right.releaseAt)
  )
}

function countStatuses(
  records: OfferEmailDraftPackagePersistenceRecord[],
): Partial<Record<OfferEmailDraftPackageStatus, number>> {
  return records.reduce<Partial<Record<OfferEmailDraftPackageStatus, number>>>((counts, record) => {
    counts[record.status] = (counts[record.status] ?? 0) + 1
    return counts
  }, {})
}

function normalizePackageStatus(status: OfferEmailDraftPackageStatus): OfferEmailDraftPackageStatus {
  if (status !== "blocked" && status !== "ready") {
    throw new Error("email package status must be blocked or ready")
  }
  return status
}

function normalizePersistenceVersion(
  version: typeof OFFER_EMAIL_DRAFT_PACKAGE_PERSISTENCE_VERSION,
): typeof OFFER_EMAIL_DRAFT_PACKAGE_PERSISTENCE_VERSION {
  if (version !== OFFER_EMAIL_DRAFT_PACKAGE_PERSISTENCE_VERSION) {
    throw new Error("offer email draft package persistence version is not supported")
  }
  return version
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value).sort(([left], [right]) => left.localeCompare(right))
    return `{${entries.map(([key, entryValue]) => `${JSON.stringify(key)}:${stableJson(entryValue)}`).join(",")}}`
  }
  return JSON.stringify(value)
}

function fingerprint(value: string): string {
  let hash = 2_166_136_261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16_777_619)
  }
  return (hash >>> 0).toString(16).padStart(8, "0")
}
