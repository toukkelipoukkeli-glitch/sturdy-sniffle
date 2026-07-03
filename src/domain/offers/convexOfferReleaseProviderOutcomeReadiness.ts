import { nonBlank, optionalTrim } from "../shared/stringValidation"
import {
  OFFER_RELEASE_PROVIDER_OUTCOME_READINESS_VERSION,
  type OfferReleaseProviderOutcomeReadiness,
  type OfferReleaseProviderOutcomeReadinessStatus,
} from "./offerReleaseProviderOutcomeReadiness"

export interface ConvexOfferReleaseProviderOutcomeReadinessPayload {
  readinessKey: string
  readinessVersion: typeof OFFER_RELEASE_PROVIDER_OUTCOME_READINESS_VERSION
  status: OfferReleaseProviderOutcomeReadinessStatus
  offerId: string
  offerNumber: string
  rfqId: string
  expectedCommandCount: number
  latestCommandCount: number
  appliedCommandCount: number
  failedCommandCount: number
  missingCommandCount: number
  blockerLabels: string[]
  nextActions: string[]
  latestOutcomeFingerprint?: string
}

export interface BuildConvexOfferReleaseProviderOutcomeReadinessPayloadOptions {
  readinessKey?: string
  offerId?: string
}

export type ConvexOfferReleaseProviderOutcomeReadinessRecord = ConvexOfferReleaseProviderOutcomeReadinessPayload

export function buildConvexOfferReleaseProviderOutcomeReadinessPayload(
  readiness: OfferReleaseProviderOutcomeReadiness,
  options: BuildConvexOfferReleaseProviderOutcomeReadinessPayloadOptions = {},
): ConvexOfferReleaseProviderOutcomeReadinessPayload {
  const offerId = nonBlank(options.offerId ?? readiness.offerId, "offerId")
  const offerNumber = nonBlank(readiness.offerNumber, "readiness.offerNumber")
  const rfqId = nonBlank(readiness.rfqId, "readiness.rfqId")
  const status = normalizeStatus(readiness.status)
  const latestOutcomeFingerprint = optionalTrim(readiness.latestOutcomeFingerprint)

  return {
    appliedCommandCount: nonNegativeInteger(readiness.appliedCommandCount, "readiness.appliedCommandCount"),
    blockerLabels: normalizeTextList(readiness.blockerLabels),
    expectedCommandCount: nonNegativeInteger(readiness.expectedCommandCount, "readiness.expectedCommandCount"),
    failedCommandCount: nonNegativeInteger(readiness.failedCommandCount, "readiness.failedCommandCount"),
    latestCommandCount: nonNegativeInteger(readiness.latestCommandCount, "readiness.latestCommandCount"),
    ...(latestOutcomeFingerprint ? { latestOutcomeFingerprint } : {}),
    missingCommandCount: nonNegativeInteger(readiness.missingCommandCount, "readiness.missingCommandCount"),
    nextActions: normalizeTextList(readiness.nextActions),
    offerId,
    offerNumber,
    readinessKey: options.readinessKey
      ? nonBlank(options.readinessKey, "readinessKey")
      : buildReadinessKey({
          offerId,
          readinessVersion: normalizeVersion(readiness.readinessVersion),
          rfqId,
          status,
        }),
    readinessVersion: normalizeVersion(readiness.readinessVersion),
    rfqId,
    status,
  }
}

export function buildOfferReleaseProviderOutcomeReadinessFromConvex(
  record: ConvexOfferReleaseProviderOutcomeReadinessRecord,
): OfferReleaseProviderOutcomeReadiness {
  return {
    appliedCommandCount: nonNegativeInteger(record.appliedCommandCount, "record.appliedCommandCount"),
    blockerLabels: normalizeTextList(record.blockerLabels),
    expectedCommandCount: nonNegativeInteger(record.expectedCommandCount, "record.expectedCommandCount"),
    failedCommandCount: nonNegativeInteger(record.failedCommandCount, "record.failedCommandCount"),
    latestCommandCount: nonNegativeInteger(record.latestCommandCount, "record.latestCommandCount"),
    ...(optionalTrim(record.latestOutcomeFingerprint) ? { latestOutcomeFingerprint: optionalTrim(record.latestOutcomeFingerprint) } : {}),
    missingCommandCount: nonNegativeInteger(record.missingCommandCount, "record.missingCommandCount"),
    nextActions: normalizeTextList(record.nextActions),
    offerId: nonBlank(record.offerId, "record.offerId"),
    offerNumber: nonBlank(record.offerNumber, "record.offerNumber"),
    readinessVersion: normalizeVersion(record.readinessVersion),
    rfqId: nonBlank(record.rfqId, "record.rfqId"),
    status: normalizeStatus(record.status),
  }
}

function normalizeStatus(status: OfferReleaseProviderOutcomeReadinessStatus): OfferReleaseProviderOutcomeReadinessStatus {
  if (status !== "blocked" && status !== "ready") {
    throw new Error("provider outcome readiness status must be blocked or ready")
  }
  return status
}

function normalizeVersion(
  version: typeof OFFER_RELEASE_PROVIDER_OUTCOME_READINESS_VERSION,
): typeof OFFER_RELEASE_PROVIDER_OUTCOME_READINESS_VERSION {
  if (version !== OFFER_RELEASE_PROVIDER_OUTCOME_READINESS_VERSION) {
    throw new Error("provider outcome readiness version is not supported")
  }
  return version
}

function nonNegativeInteger(value: number, fieldName: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${fieldName} must be a non-negative integer`)
  }
  return value
}

function normalizeTextList(values: string[]): string[] {
  return values.map((value) => optionalTrim(value)).filter((value): value is string => Boolean(value))
}

function buildReadinessKey(input: {
  offerId: string
  readinessVersion: typeof OFFER_RELEASE_PROVIDER_OUTCOME_READINESS_VERSION
  rfqId: string
  status: OfferReleaseProviderOutcomeReadinessStatus
}): string {
  return ["offer-provider-outcome-readiness", input.offerId, input.rfqId, input.readinessVersion, input.status]
    .map(sanitizeKeyPart)
    .join(":")
}

function sanitizeKeyPart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
