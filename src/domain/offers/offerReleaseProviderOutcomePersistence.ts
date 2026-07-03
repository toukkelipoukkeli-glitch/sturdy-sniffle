import { compareLex, normalizeIsoTimestamp } from "../shared/deterministic"
import { nonBlank, optionalTrim } from "../shared/stringValidation"
import type { OfferReleaseCommandOutcomeInput } from "./offerReleaseExecution"
import type { OfferReleasePlan } from "./offerReleasePlan"

export const OFFER_RELEASE_PROVIDER_OUTCOME_PERSISTENCE_VERSION = "offer-release-provider-outcome-persistence.v1"

export interface OfferReleaseProviderOutcomePersistenceRecord {
  persistenceVersion: typeof OFFER_RELEASE_PROVIDER_OUTCOME_PERSISTENCE_VERSION
  outcomeFingerprint: string
  recordedAt: string
  recordedBy: string
  offerId: string
  offerNumber: string
  rfqId: string
  releaseAt: string
  planVersion: OfferReleasePlan["planVersion"]
  commandCount: number
  appliedCommandCount: number
  failedCommandCount: number
  releasePlan: OfferReleasePlan
  commandOutcomes: OfferReleaseCommandOutcomeInput[]
}

export interface OfferReleaseProviderOutcomePersistenceSnapshot {
  outcomeCount: number
  appliedOutcomeFingerprints: string[]
  failedOutcomeFingerprints: string[]
  records: OfferReleaseProviderOutcomePersistenceRecord[]
  statusCounts: Partial<Record<OfferReleaseCommandOutcomeInput["status"], number>>
}

export interface OfferReleaseProviderOutcomePersistenceAdapter {
  recordOutcomes(input: {
    releasePlan: OfferReleasePlan
    commandOutcomes: OfferReleaseCommandOutcomeInput[]
    recordedAt?: string
    recordedBy: string
  }): Promise<OfferReleaseProviderOutcomePersistenceSnapshot>
  snapshot(): OfferReleaseProviderOutcomePersistenceSnapshot
}

export interface LocalOfferReleaseProviderOutcomePersistenceOptions {
  initialSnapshot?: Partial<OfferReleaseProviderOutcomePersistenceSnapshot>
}

export function createLocalOfferReleaseProviderOutcomePersistence({
  initialSnapshot,
}: LocalOfferReleaseProviderOutcomePersistenceOptions = {}): OfferReleaseProviderOutcomePersistenceAdapter {
  let snapshotState = normalizeSnapshot(initialSnapshot)

  return {
    async recordOutcomes(input) {
      const record = buildOfferReleaseProviderOutcomePersistenceRecord(input)
      snapshotState = normalizeSnapshot({
        records: [
          ...snapshotState.records.filter((candidate) => candidate.outcomeFingerprint !== record.outcomeFingerprint),
          record,
        ],
      })
      return snapshot()
    },
    snapshot,
  }

  function snapshot(): OfferReleaseProviderOutcomePersistenceSnapshot {
    return cloneSnapshot(snapshotState)
  }
}

export function fingerprintOfferReleaseProviderOutcomes(input: {
  releasePlan: OfferReleasePlan
  commandOutcomes: OfferReleaseCommandOutcomeInput[]
}): string {
  const releasePlan = normalizeReleasePlan(input.releasePlan)
  const commandOutcomes = normalizeCommandOutcomes(input.commandOutcomes)
  const stablePayload = stableJson({
    commandOutcomes,
    offerId: releasePlan.offerId,
    planVersion: releasePlan.planVersion,
    releaseAt: releasePlan.releaseAt,
  })
  return `offer-release-provider-outcomes-${fingerprint(stablePayload)}`
}

export function buildOfferReleaseProviderOutcomePersistenceRecord(input: {
  releasePlan: OfferReleasePlan
  commandOutcomes: OfferReleaseCommandOutcomeInput[]
  recordedAt?: string
  recordedBy: string
}): OfferReleaseProviderOutcomePersistenceRecord {
  const releasePlan = normalizeReleasePlan(input.releasePlan)
  const commandOutcomes = normalizeCommandOutcomes(input.commandOutcomes)
  return {
    appliedCommandCount: commandOutcomes.filter((outcome) => outcome.status === "applied").length,
    commandCount: commandOutcomes.length,
    commandOutcomes,
    failedCommandCount: commandOutcomes.filter((outcome) => outcome.status === "failed").length,
    offerId: releasePlan.offerId,
    offerNumber: releasePlan.offerNumber,
    outcomeFingerprint: fingerprintOfferReleaseProviderOutcomes({ commandOutcomes, releasePlan }),
    persistenceVersion: OFFER_RELEASE_PROVIDER_OUTCOME_PERSISTENCE_VERSION,
    planVersion: releasePlan.planVersion,
    recordedAt: normalizeIsoTimestamp(input.recordedAt ?? releasePlan.releaseAt, "recordedAt"),
    recordedBy: nonBlank(input.recordedBy, "recordedBy"),
    releaseAt: releasePlan.releaseAt,
    releasePlan,
    rfqId: releasePlan.rfqId,
  }
}

function normalizeSnapshot(
  snapshot: Partial<OfferReleaseProviderOutcomePersistenceSnapshot> | undefined,
): OfferReleaseProviderOutcomePersistenceSnapshot {
  const recordsByFingerprint = new Map<string, OfferReleaseProviderOutcomePersistenceRecord>()
  for (const record of snapshot?.records ?? []) {
    const normalizedRecord = normalizeRecord(record)
    recordsByFingerprint.set(normalizedRecord.outcomeFingerprint, normalizedRecord)
  }
  const records = [...recordsByFingerprint.values()].sort(sortRecords)

  return {
    appliedOutcomeFingerprints: records
      .filter((record) => record.failedCommandCount === 0 && record.appliedCommandCount > 0)
      .map((record) => record.outcomeFingerprint),
    failedOutcomeFingerprints: records
      .filter((record) => record.failedCommandCount > 0)
      .map((record) => record.outcomeFingerprint),
    outcomeCount: records.length,
    records,
    statusCounts: countOutcomeStatuses(records),
  }
}

function normalizeRecord(
  record: OfferReleaseProviderOutcomePersistenceRecord,
): OfferReleaseProviderOutcomePersistenceRecord {
  normalizePersistenceVersion(record.persistenceVersion)
  return buildOfferReleaseProviderOutcomePersistenceRecord({
    commandOutcomes: record.commandOutcomes,
    recordedAt: record.recordedAt,
    recordedBy: record.recordedBy,
    releasePlan: record.releasePlan,
  })
}

function cloneSnapshot(
  snapshot: OfferReleaseProviderOutcomePersistenceSnapshot,
): OfferReleaseProviderOutcomePersistenceSnapshot {
  return {
    appliedOutcomeFingerprints: [...snapshot.appliedOutcomeFingerprints],
    failedOutcomeFingerprints: [...snapshot.failedOutcomeFingerprints],
    outcomeCount: snapshot.outcomeCount,
    records: snapshot.records.map(cloneRecord),
    statusCounts: { ...snapshot.statusCounts },
  }
}

function cloneRecord(
  record: OfferReleaseProviderOutcomePersistenceRecord,
): OfferReleaseProviderOutcomePersistenceRecord {
  normalizePersistenceVersion(record.persistenceVersion)
  return buildOfferReleaseProviderOutcomePersistenceRecord({
    commandOutcomes: record.commandOutcomes,
    recordedAt: record.recordedAt,
    recordedBy: record.recordedBy,
    releasePlan: record.releasePlan,
  })
}

function normalizeCommandOutcomes(
  commandOutcomes: OfferReleaseCommandOutcomeInput[],
): OfferReleaseCommandOutcomeInput[] {
  const seenKeys = new Set<string>()
  return commandOutcomes
    .map((outcome) => {
      const key = nonBlank(outcome.key, "commandOutcomes.key")
      if (seenKeys.has(key)) {
        throw new Error(`duplicate provider command outcome ${key}`)
      }
      seenKeys.add(key)
      return {
        key,
        status: normalizeOutcomeStatus(outcome.status, key),
        ...(optionalTrim(outcome.externalId) ? { externalId: optionalTrim(outcome.externalId) } : {}),
        ...(optionalTrim(outcome.message) ? { message: optionalTrim(outcome.message) } : {}),
        warnings: normalizeWarnings(outcome.warnings ?? []),
      }
    })
    .sort(sortOutcomes)
}

function normalizeReleasePlan(releasePlan: OfferReleasePlan): OfferReleasePlan {
  return {
    ...releasePlan,
    commands: releasePlan.commands.map((command) => ({
      ...command,
      ...(command.payload ? { payload: clonePayload(command.payload) } : {}),
    })),
    lifecycleEvents: releasePlan.lifecycleEvents.map((event) => ({ ...event })),
    nextActions: [...releasePlan.nextActions],
    releaseAt: normalizeIsoTimestamp(releasePlan.releaseAt, "releasePlan.releaseAt"),
    warnings: [...releasePlan.warnings],
    workspaceActions: releasePlan.workspaceActions.map((action) => ({ ...action })),
    ...(releasePlan.calendarPlan
      ? {
          calendarPlan: {
            ...releasePlan.calendarPlan,
            events: releasePlan.calendarPlan.events.map((event) => ({ ...event })),
            warnings: [...releasePlan.calendarPlan.warnings],
          },
        }
      : {}),
    ...(releasePlan.lifecyclePreview
      ? {
          lifecyclePreview: {
            ...releasePlan.lifecyclePreview,
            events: releasePlan.lifecyclePreview.events.map((event) => ({ ...event })),
            followUpTasks: releasePlan.lifecyclePreview.followUpTasks.map((task) => ({ ...task })),
          },
        }
      : {}),
  }
}

function clonePayload(
  payload: NonNullable<OfferReleasePlan["commands"][number]["payload"]>,
): NonNullable<OfferReleasePlan["commands"][number]["payload"]> {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [key, Array.isArray(value) ? [...value] : value]),
  )
}

function sortRecords(
  left: OfferReleaseProviderOutcomePersistenceRecord,
  right: OfferReleaseProviderOutcomePersistenceRecord,
): number {
  return (
    compareLex(right.recordedAt, left.recordedAt) ||
    compareLex(left.outcomeFingerprint, right.outcomeFingerprint) ||
    compareLex(left.offerId, right.offerId) ||
    compareLex(left.releaseAt, right.releaseAt)
  )
}

function sortOutcomes(left: OfferReleaseCommandOutcomeInput, right: OfferReleaseCommandOutcomeInput): number {
  return (
    compareLex(left.key, right.key) ||
    compareLex(left.status, right.status) ||
    compareLex(left.externalId ?? "", right.externalId ?? "") ||
    compareLex(left.message ?? "", right.message ?? "")
  )
}

function countOutcomeStatuses(
  records: OfferReleaseProviderOutcomePersistenceRecord[],
): Partial<Record<OfferReleaseCommandOutcomeInput["status"], number>> {
  return records.reduce<Partial<Record<OfferReleaseCommandOutcomeInput["status"], number>>>((counts, record) => {
    for (const outcome of record.commandOutcomes) {
      counts[outcome.status] = (counts[outcome.status] ?? 0) + 1
    }
    return counts
  }, {})
}

function normalizeOutcomeStatus(status: OfferReleaseCommandOutcomeInput["status"], key: string): "applied" | "failed" {
  if (status !== "applied" && status !== "failed") {
    throw new Error(`provider command outcome ${key} status must be applied or failed`)
  }
  return status
}

function normalizeWarnings(warnings: string[]): string[] {
  return [...new Set(warnings.map((warning) => optionalTrim(warning)).filter((warning): warning is string => Boolean(warning)))]
}

function normalizePersistenceVersion(
  version: typeof OFFER_RELEASE_PROVIDER_OUTCOME_PERSISTENCE_VERSION,
): typeof OFFER_RELEASE_PROVIDER_OUTCOME_PERSISTENCE_VERSION {
  if (version !== OFFER_RELEASE_PROVIDER_OUTCOME_PERSISTENCE_VERSION) {
    throw new Error("offer release provider outcome persistence version is not supported")
  }
  return version
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`
  }
  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => compareLex(left, right))
      .map(([key, nested]) => `${JSON.stringify(key)}:${stableJson(nested)}`)
      .join(",")}}`
  }
  return JSON.stringify(value)
}

function fingerprint(value: string): string {
  let hash = 0x811c9dc5
  for (const character of value) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash.toString(16).padStart(8, "0")
}
