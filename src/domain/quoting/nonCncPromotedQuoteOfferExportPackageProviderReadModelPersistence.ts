import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank } from "../shared/stringValidation"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_ARTIFACT_KEYS,
  fingerprintNonCncPromotedQuoteOfferExportPackagePayload,
  type NonCncPromotedQuoteOfferExportPackageArtifactKey,
} from "./nonCncPromotedQuoteOfferExportPackagePlan"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_VERSION,
  type NonCncPromotedQuoteOfferExportPackageProviderMode,
  type NonCncPromotedQuoteOfferExportPackageProviderResultStatus,
} from "./nonCncPromotedQuoteOfferExportPackageProvider"
import {
  NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_READ_MODEL_VERSION,
  type NonCncPromotedQuoteOfferExportPackageProviderReadModel,
  type NonCncPromotedQuoteOfferExportPackageProviderReadModelStatus,
} from "./nonCncPromotedQuoteOfferExportPackageProviderReadModel"

export const NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_READ_MODEL_PERSISTENCE_VERSION =
  "non-cnc-promoted-quote-offer-export-package-provider-read-model-persistence.v1"

export interface NonCncPromotedQuoteOfferExportPackageProviderReadModelRecord {
  persistenceVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_READ_MODEL_PERSISTENCE_VERSION
  readModelVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_READ_MODEL_VERSION
  providerVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_VERSION
  readModelFingerprint: string
  recordedAt: string
  actor: string
  status: NonCncPromotedQuoteOfferExportPackageProviderReadModelStatus
  providerStatus: NonCncPromotedQuoteOfferExportPackageProviderResultStatus
  mode: NonCncPromotedQuoteOfferExportPackageProviderMode
  planId: string
  planFingerprint: string
  artifactOutcomeCount: number
  readyOutcomeCount: number
  blockedOutcomeCount: number
  artifactOutcomeKeys: NonCncPromotedQuoteOfferExportPackageArtifactKey[]
  blockerCount: number
  warningCount: number
}

export interface NonCncPromotedQuoteOfferExportPackageProviderReadModelPersistenceSnapshot {
  persistenceVersion: typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_READ_MODEL_PERSISTENCE_VERSION
  recordCount: number
  records: NonCncPromotedQuoteOfferExportPackageProviderReadModelRecord[]
  latestReadModel?: NonCncPromotedQuoteOfferExportPackageProviderReadModelRecord
  readModelFingerprints: string[]
  planIds: string[]
  planFingerprints: string[]
  artifactOutcomeKeys: NonCncPromotedQuoteOfferExportPackageArtifactKey[]
  statusCounts: Partial<Record<NonCncPromotedQuoteOfferExportPackageProviderReadModelStatus, number>>
  providerStatusCounts: Partial<Record<NonCncPromotedQuoteOfferExportPackageProviderResultStatus, number>>
  modeCounts: Partial<Record<NonCncPromotedQuoteOfferExportPackageProviderMode, number>>
  artifactOutcomeCount: number
  readyOutcomeCount: number
  blockedOutcomeCount: number
  blockerCount: number
  warningCount: number
}

export interface NonCncPromotedQuoteOfferExportPackageProviderReadModelPersistenceAdapter {
  recordReadModel(
    readModel: NonCncPromotedQuoteOfferExportPackageProviderReadModel,
    input: NonCncPromotedQuoteOfferExportPackageProviderReadModelPersistenceInput,
  ): Promise<NonCncPromotedQuoteOfferExportPackageProviderReadModelPersistenceSnapshot>
  snapshot(): NonCncPromotedQuoteOfferExportPackageProviderReadModelPersistenceSnapshot
}

export interface NonCncPromotedQuoteOfferExportPackageProviderReadModelPersistenceInput {
  actor: string
  recordedAt: string
}

export interface LocalNonCncPromotedQuoteOfferExportPackageProviderReadModelPersistenceInitialSnapshot {
  records?: NonCncPromotedQuoteOfferExportPackageProviderReadModelRecord[]
}

export interface LocalNonCncPromotedQuoteOfferExportPackageProviderReadModelPersistenceOptions {
  initialSnapshot?: LocalNonCncPromotedQuoteOfferExportPackageProviderReadModelPersistenceInitialSnapshot
}

export function createLocalNonCncPromotedQuoteOfferExportPackageProviderReadModelPersistence({
  initialSnapshot,
}: LocalNonCncPromotedQuoteOfferExportPackageProviderReadModelPersistenceOptions = {}): NonCncPromotedQuoteOfferExportPackageProviderReadModelPersistenceAdapter {
  let snapshotState = normalizeSnapshot(initialSnapshot)

  return {
    async recordReadModel(readModel, input) {
      const record = buildProviderReadModelRecord(readModel, input)
      snapshotState = normalizeSnapshot({
        records: [
          ...snapshotState.records,
          record,
        ],
      })
      return snapshot()
    },
    snapshot,
  }

  function snapshot(): NonCncPromotedQuoteOfferExportPackageProviderReadModelPersistenceSnapshot {
    return cloneSnapshot(snapshotState)
  }
}

export function buildProviderReadModelRecord(
  readModel: NonCncPromotedQuoteOfferExportPackageProviderReadModel,
  { actor, recordedAt }: NonCncPromotedQuoteOfferExportPackageProviderReadModelPersistenceInput,
): NonCncPromotedQuoteOfferExportPackageProviderReadModelRecord {
  const normalizedRecord: NonCncPromotedQuoteOfferExportPackageProviderReadModelRecord = {
    actor: nonBlank(actor, "actor"),
    artifactOutcomeCount: nonNegativeInteger(readModel.artifactOutcomeCount, "artifactOutcomeCount"),
    artifactOutcomeKeys: readModel.artifactOutcomeKeys.map((key, index) => normalizeArtifactKey(key, index)),
    blockedOutcomeCount: nonNegativeInteger(readModel.blockedOutcomeCount, "blockedOutcomeCount"),
    blockerCount: nonNegativeInteger(readModel.blockerLabels.length, "blockerCount"),
    mode: readModel.mode,
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_READ_MODEL_PERSISTENCE_VERSION,
    planFingerprint: readModel.planFingerprint,
    planId: readModel.planId,
    providerStatus: readModel.providerStatus,
    providerVersion: readModel.providerVersion,
    readModelFingerprint: fingerprintReadModel(readModel),
    readModelVersion: readModel.readModelVersion,
    readyOutcomeCount: nonNegativeInteger(readModel.readyOutcomeCount, "readyOutcomeCount"),
    recordedAt: normalizeIsoTimestamp(recordedAt, "recordedAt"),
    status: readModel.status,
    warningCount: nonNegativeInteger(readModel.reviewWarnings.length, "warningCount"),
  }

  return normalizeRecord(normalizedRecord)
}

function normalizeSnapshot(
  snapshot: LocalNonCncPromotedQuoteOfferExportPackageProviderReadModelPersistenceInitialSnapshot | undefined,
): NonCncPromotedQuoteOfferExportPackageProviderReadModelPersistenceSnapshot {
  const recordsByFingerprint = new Map<string, NonCncPromotedQuoteOfferExportPackageProviderReadModelRecord>()
  for (const record of snapshot?.records ?? []) {
    const normalized = normalizeRecord(record)
    const existing = recordsByFingerprint.get(normalized.readModelFingerprint)
    if (!existing || sortNewestFirst(normalized, existing) < 0) {
      recordsByFingerprint.set(normalized.readModelFingerprint, normalized)
    }
  }
  const records = [...recordsByFingerprint.values()].sort(sortNewestFirst)

  return {
    artifactOutcomeCount: records.reduce((total, record) => total + record.artifactOutcomeCount, 0),
    artifactOutcomeKeys: uniqueSorted(records.flatMap((record) => record.artifactOutcomeKeys)),
    blockedOutcomeCount: records.reduce((total, record) => total + record.blockedOutcomeCount, 0),
    blockerCount: records.reduce((total, record) => total + record.blockerCount, 0),
    latestReadModel: records[0],
    modeCounts: countModes(records),
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_READ_MODEL_PERSISTENCE_VERSION,
    planFingerprints: uniqueSorted(records.map((record) => record.planFingerprint)),
    planIds: uniqueSorted(records.map((record) => record.planId)),
    providerStatusCounts: countProviderStatuses(records),
    readyOutcomeCount: records.reduce((total, record) => total + record.readyOutcomeCount, 0),
    readModelFingerprints: uniqueSorted(records.map((record) => record.readModelFingerprint)),
    recordCount: records.length,
    records,
    statusCounts: countStatuses(records),
    warningCount: records.reduce((total, record) => total + record.warningCount, 0),
  }
}

function normalizeRecord(
  record: NonCncPromotedQuoteOfferExportPackageProviderReadModelRecord,
): NonCncPromotedQuoteOfferExportPackageProviderReadModelRecord {
  const normalized = {
    actor: nonBlank(record.actor, "actor"),
    artifactOutcomeCount: nonNegativeInteger(record.artifactOutcomeCount, "artifactOutcomeCount"),
    artifactOutcomeKeys: record.artifactOutcomeKeys.map((key, index) => normalizeArtifactKey(key, index)),
    blockedOutcomeCount: nonNegativeInteger(record.blockedOutcomeCount, "blockedOutcomeCount"),
    blockerCount: nonNegativeInteger(record.blockerCount, "blockerCount"),
    mode: normalizeMode(record.mode),
    persistenceVersion: normalizePersistenceVersion(record.persistenceVersion),
    planFingerprint: nonBlank(record.planFingerprint, "planFingerprint"),
    planId: nonBlank(record.planId, "planId"),
    providerStatus: normalizeProviderStatus(record.providerStatus),
    providerVersion: normalizeProviderVersion(record.providerVersion),
    readModelFingerprint: nonBlank(record.readModelFingerprint, "readModelFingerprint"),
    readModelVersion: normalizeReadModelVersion(record.readModelVersion),
    readyOutcomeCount: nonNegativeInteger(record.readyOutcomeCount, "readyOutcomeCount"),
    recordedAt: normalizeIsoTimestamp(record.recordedAt, "recordedAt"),
    status: normalizeStatus(record.status),
    warningCount: nonNegativeInteger(record.warningCount, "warningCount"),
  }

  if (normalized.artifactOutcomeKeys.length !== normalized.artifactOutcomeCount) {
    throw new Error("artifactOutcomeCount must match artifactOutcomeKeys length")
  }
  if (new Set(normalized.artifactOutcomeKeys).size !== normalized.artifactOutcomeKeys.length) {
    throw new Error("artifactOutcomeKeys must be unique")
  }
  if (normalized.status === "ready_to_commit") {
    validateReadyRecord(normalized)
  } else {
    validateBlockedRecord(normalized)
  }

  return normalized
}

function validateReadyRecord(record: NonCncPromotedQuoteOfferExportPackageProviderReadModelRecord): void {
  if (record.providerStatus !== "applied") {
    throw new Error("ready provider read-model records must have applied provider status")
  }
  if (record.artifactOutcomeCount <= 0) {
    throw new Error("ready provider read-model records must include artifact outcomes")
  }
  if (record.readyOutcomeCount !== record.artifactOutcomeCount || record.blockedOutcomeCount !== 0) {
    throw new Error("ready provider read-model records must have only ready outcomes")
  }
  if (record.blockerCount !== 0) {
    throw new Error("ready provider read-model records cannot include blockers")
  }
}

function validateBlockedRecord(record: NonCncPromotedQuoteOfferExportPackageProviderReadModelRecord): void {
  if (record.readyOutcomeCount !== 0) {
    throw new Error("blocked provider read-model records cannot include ready outcomes")
  }
  if (record.blockedOutcomeCount === 0 && record.blockerCount === 0) {
    throw new Error("blocked provider read-model records must include blocked outcomes or blockers")
  }
}

function cloneSnapshot(
  snapshot: NonCncPromotedQuoteOfferExportPackageProviderReadModelPersistenceSnapshot,
): NonCncPromotedQuoteOfferExportPackageProviderReadModelPersistenceSnapshot {
  return {
    artifactOutcomeCount: snapshot.artifactOutcomeCount,
    artifactOutcomeKeys: [...snapshot.artifactOutcomeKeys],
    blockedOutcomeCount: snapshot.blockedOutcomeCount,
    blockerCount: snapshot.blockerCount,
    latestReadModel: snapshot.latestReadModel ? cloneRecord(snapshot.latestReadModel) : undefined,
    modeCounts: { ...snapshot.modeCounts },
    persistenceVersion: snapshot.persistenceVersion,
    planFingerprints: [...snapshot.planFingerprints],
    planIds: [...snapshot.planIds],
    providerStatusCounts: { ...snapshot.providerStatusCounts },
    readyOutcomeCount: snapshot.readyOutcomeCount,
    readModelFingerprints: [...snapshot.readModelFingerprints],
    recordCount: snapshot.recordCount,
    records: snapshot.records.map(cloneRecord),
    statusCounts: { ...snapshot.statusCounts },
    warningCount: snapshot.warningCount,
  }
}

function cloneRecord(
  record: NonCncPromotedQuoteOfferExportPackageProviderReadModelRecord,
): NonCncPromotedQuoteOfferExportPackageProviderReadModelRecord {
  return {
    ...record,
    artifactOutcomeKeys: [...record.artifactOutcomeKeys],
  }
}

function fingerprintReadModel(readModel: NonCncPromotedQuoteOfferExportPackageProviderReadModel): string {
  return `non-cnc-promoted-quote-offer-export-provider-read-model-${fingerprintNonCncPromotedQuoteOfferExportPackagePayload(
    stableJson({
      artifactOutcomeCount: readModel.artifactOutcomeCount,
      artifactOutcomeKeys: readModel.artifactOutcomeKeys,
      blockedOutcomeCount: readModel.blockedOutcomeCount,
      blockerLabels: readModel.blockerLabels,
      mode: readModel.mode,
      planFingerprint: readModel.planFingerprint,
      planId: readModel.planId,
      providerStatus: readModel.providerStatus,
      providerVersion: readModel.providerVersion,
      readyOutcomeCount: readModel.readyOutcomeCount,
      readModelVersion: readModel.readModelVersion,
      reviewWarnings: readModel.reviewWarnings,
      status: readModel.status,
    }),
  )}`
}

function sortNewestFirst(
  left: NonCncPromotedQuoteOfferExportPackageProviderReadModelRecord,
  right: NonCncPromotedQuoteOfferExportPackageProviderReadModelRecord,
): number {
  return (
    compareLex(right.recordedAt, left.recordedAt) ||
    compareLex(left.readModelFingerprint, right.readModelFingerprint) ||
    compareLex(left.planId, right.planId) ||
    compareLex(left.planFingerprint, right.planFingerprint) ||
    compareLex(left.status, right.status) ||
    compareLex(left.providerStatus, right.providerStatus) ||
    compareLex(left.mode, right.mode) ||
    compareLex(left.actor, right.actor) ||
    compareNumber(left.artifactOutcomeCount, right.artifactOutcomeCount) ||
    compareNumber(left.readyOutcomeCount, right.readyOutcomeCount) ||
    compareNumber(left.blockedOutcomeCount, right.blockedOutcomeCount) ||
    compareNumber(left.blockerCount, right.blockerCount) ||
    compareNumber(left.warningCount, right.warningCount)
  )
}

function countStatuses(
  records: NonCncPromotedQuoteOfferExportPackageProviderReadModelRecord[],
): Partial<Record<NonCncPromotedQuoteOfferExportPackageProviderReadModelStatus, number>> {
  return records.reduce<Partial<Record<NonCncPromotedQuoteOfferExportPackageProviderReadModelStatus, number>>>(
    (counts, record) => {
      counts[record.status] = (counts[record.status] ?? 0) + 1
      return counts
    },
    {},
  )
}

function countProviderStatuses(
  records: NonCncPromotedQuoteOfferExportPackageProviderReadModelRecord[],
): Partial<Record<NonCncPromotedQuoteOfferExportPackageProviderResultStatus, number>> {
  return records.reduce<Partial<Record<NonCncPromotedQuoteOfferExportPackageProviderResultStatus, number>>>(
    (counts, record) => {
      counts[record.providerStatus] = (counts[record.providerStatus] ?? 0) + 1
      return counts
    },
    {},
  )
}

function countModes(
  records: NonCncPromotedQuoteOfferExportPackageProviderReadModelRecord[],
): Partial<Record<NonCncPromotedQuoteOfferExportPackageProviderMode, number>> {
  return records.reduce<Partial<Record<NonCncPromotedQuoteOfferExportPackageProviderMode, number>>>((counts, record) => {
    counts[record.mode] = (counts[record.mode] ?? 0) + 1
    return counts
  }, {})
}

function uniqueSorted<T extends string>(values: T[]): T[] {
  return [...new Set(values)].sort(compareLex)
}

function nonNegativeInteger(value: number, fieldName: string): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${fieldName} must be a non-negative safe integer`)
  }
  return value
}

function compareNumber(left: number, right: number): number {
  return left - right
}

function normalizePersistenceVersion(
  version: NonCncPromotedQuoteOfferExportPackageProviderReadModelRecord["persistenceVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_READ_MODEL_PERSISTENCE_VERSION {
  if (version !== NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_READ_MODEL_PERSISTENCE_VERSION) {
    throw new Error(
      "persistenceVersion is not a supported non-CNC offer export package provider read-model persistence version",
    )
  }
  return version
}

function normalizeReadModelVersion(
  version: NonCncPromotedQuoteOfferExportPackageProviderReadModelRecord["readModelVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_READ_MODEL_VERSION {
  if (version !== NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_READ_MODEL_VERSION) {
    throw new Error("readModelVersion is not a supported non-CNC offer export package provider read-model version")
  }
  return version
}

function normalizeProviderVersion(
  version: NonCncPromotedQuoteOfferExportPackageProviderReadModelRecord["providerVersion"],
): typeof NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_VERSION {
  if (version !== NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_PROVIDER_VERSION) {
    throw new Error("providerVersion is not a supported non-CNC offer export package provider version")
  }
  return version
}

function normalizeStatus(
  status: NonCncPromotedQuoteOfferExportPackageProviderReadModelStatus,
): NonCncPromotedQuoteOfferExportPackageProviderReadModelStatus {
  if (status !== "blocked" && status !== "ready_to_commit") {
    throw new Error("status is not a supported non-CNC offer export package provider read-model status")
  }
  return status
}

function normalizeProviderStatus(
  status: NonCncPromotedQuoteOfferExportPackageProviderResultStatus,
): NonCncPromotedQuoteOfferExportPackageProviderResultStatus {
  if (status !== "applied" && status !== "blocked") {
    throw new Error("providerStatus must be applied or blocked")
  }
  return status
}

function normalizeMode(mode: NonCncPromotedQuoteOfferExportPackageProviderMode): NonCncPromotedQuoteOfferExportPackageProviderMode {
  if (mode !== "local" && mode !== "mock") {
    throw new Error("mode must be local or mock")
  }
  return mode
}

function normalizeArtifactKey(value: string, index: number): NonCncPromotedQuoteOfferExportPackageArtifactKey {
  const normalized = nonBlank(value, `artifactOutcomeKeys[${index}]`)
  if (!NON_CNC_PROMOTED_QUOTE_OFFER_EXPORT_PACKAGE_ARTIFACT_KEYS.includes(normalized as NonCncPromotedQuoteOfferExportPackageArtifactKey)) {
    throw new Error(`artifactOutcomeKeys[${index}] must be a valid offer export package artifact key`)
  }
  return normalized as NonCncPromotedQuoteOfferExportPackageArtifactKey
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`
  }
  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableJson(entryValue)}`)
      .join(",")}}`
  }
  return JSON.stringify(value)
}
