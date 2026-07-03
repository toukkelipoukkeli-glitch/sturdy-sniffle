import { nonBlank, optionalTrim } from "../shared/stringValidation"
import type { OfferEmailDraftPackage } from "./offerEmailDraftPackage"
import { fingerprintOfferEmailDraftPackage } from "./offerEmailDraftPackagePersistence"
import type { OfferReleaseCommandOutcomeInput } from "./offerReleaseExecution"

export const OFFER_EMAIL_DRAFT_PROVIDER_VERSION = "offer-email-draft-provider.v1"

export type OfferEmailDraftProviderMode = "local" | "mock"
export type OfferEmailDraftProviderResultStatus = "applied" | "blocked"

export interface OfferEmailDraftProviderResult {
  providerVersion: typeof OFFER_EMAIL_DRAFT_PROVIDER_VERSION
  mode: OfferEmailDraftProviderMode
  status: OfferEmailDraftProviderResultStatus
  packageFingerprint: string
  blockerLabels: string[]
  warnings: string[]
  externalId?: string
  message?: string
  commandOutcome?: OfferReleaseCommandOutcomeInput
}

export interface OfferEmailDraftProvider {
  draftEmail(emailPackage: OfferEmailDraftPackage): Promise<OfferEmailDraftProviderResult>
}

export interface LocalOfferEmailDraftProviderOptions {
  externalIdPrefix?: string
  mode?: OfferEmailDraftProviderMode
}

export function createLocalOfferEmailDraftProvider({
  externalIdPrefix = "local-email-draft",
  mode = "local",
}: LocalOfferEmailDraftProviderOptions = {}): OfferEmailDraftProvider {
  const normalizedPrefix = nonBlank(externalIdPrefix, "externalIdPrefix")
  const normalizedMode = normalizeMode(mode)

  return {
    async draftEmail(emailPackage) {
      const validation = validateReadyPackage(emailPackage)
      const packageFingerprint = fingerprintOfferEmailDraftPackage(emailPackage)
      if (validation.blockerLabels.length > 0) {
        return {
          blockerLabels: validation.blockerLabels,
          mode: normalizedMode,
          packageFingerprint,
          providerVersion: OFFER_EMAIL_DRAFT_PROVIDER_VERSION,
          status: "blocked",
          warnings: [],
        }
      }

      const externalId = `${normalizedPrefix}:${packageFingerprint}`
      const message = `Email draft prepared locally for ${validation.recipient}.`
      const warnings = [`${providerModeLabel(normalizedMode)} email draft provider recorded the package; no external Gmail call was made.`]
      const commandOutcome = {
        externalId,
        key: validation.commandKey,
        message,
        status: "applied",
        warnings,
      } satisfies OfferReleaseCommandOutcomeInput

      return {
        blockerLabels: [],
        commandOutcome,
        externalId,
        message,
        mode: normalizedMode,
        packageFingerprint,
        providerVersion: OFFER_EMAIL_DRAFT_PROVIDER_VERSION,
        status: "applied",
        warnings,
      }
    },
  }
}

function validateReadyPackage(emailPackage: OfferEmailDraftPackage): {
  blockerLabels: string[]
  commandKey: string
  recipient: string
} {
  const blockerLabels = [...emailPackage.blockerLabels]
  const commandKey = optionalTrim(emailPackage.commandKey)
  const recipient = optionalTrim(emailPackage.recipient)
  const subject = optionalTrim(emailPackage.subject)
  const body = optionalTrim(emailPackage.body)

  if (emailPackage.status !== "ready") {
    blockerLabels.push(`Email draft package is ${emailPackage.status}; provider draft is blocked.`)
  }
  if (!commandKey) {
    blockerLabels.push("Email draft package is missing a release command key.")
  }
  if (!recipient) {
    blockerLabels.push("Email draft package is missing a recipient.")
  }
  if (!subject) {
    blockerLabels.push("Email draft package is missing a subject.")
  }
  if (!body) {
    blockerLabels.push("Email draft package is missing body copy.")
  }
  if (emailPackage.attachmentFileNames.length === 0) {
    blockerLabels.push("Email draft package must include at least one attachment.")
  }

  return {
    blockerLabels: uniqueNonBlank(blockerLabels),
    commandKey: commandKey ?? "",
    recipient: recipient ?? "",
  }
}

function normalizeMode(mode: OfferEmailDraftProviderMode): OfferEmailDraftProviderMode {
  if (mode !== "local" && mode !== "mock") {
    throw new Error("email draft provider mode must be local or mock")
  }
  return mode
}

function providerModeLabel(mode: OfferEmailDraftProviderMode): string {
  return mode === "mock" ? "Mock" : "Local"
}

function uniqueNonBlank(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))]
}
