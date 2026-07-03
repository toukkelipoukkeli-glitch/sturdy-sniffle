import { nonBlank } from "../shared/stringValidation"
import type { OfferEmailDraftProviderResult } from "./offerEmailDraftProvider"
import type { OfferReleaseCommandOutcomeInput } from "./offerReleaseExecution"
import type { OfferReleaseCommand, OfferReleasePlan } from "./offerReleasePlan"

export interface BuildOfferReleaseProviderCommandOutcomesInput {
  emailDraftResult?: OfferEmailDraftProviderResult
  localExternalIdPrefix?: string
  releasePlan: OfferReleasePlan
}

export function buildOfferReleaseProviderCommandOutcomes({
  emailDraftResult,
  localExternalIdPrefix = "local-release",
  releasePlan,
}: BuildOfferReleaseProviderCommandOutcomesInput): OfferReleaseCommandOutcomeInput[] {
  const externalIdPrefix = nonBlank(localExternalIdPrefix, "localExternalIdPrefix")
  if (releasePlan.status !== "ready") {
    return []
  }

  return releasePlan.commands.flatMap((command) => {
    if (command.status !== "ready") {
      return []
    }
    if (command.kind === "email_draft") {
      return [emailDraftCommandOutcome(command, emailDraftResult)]
    }
    return [localCommandOutcome(releasePlan, command, externalIdPrefix)]
  })
}

function emailDraftCommandOutcome(
  command: OfferReleaseCommand,
  emailDraftResult: OfferEmailDraftProviderResult | undefined,
): OfferReleaseCommandOutcomeInput {
  if (emailDraftResult?.status === "applied" && emailDraftResult.commandOutcome?.key === command.key) {
    return cloneCommandOutcome(emailDraftResult.commandOutcome)
  }

  const blockers =
    emailDraftResult === undefined
      ? ["Email draft provider result is required before release execution."]
      : emailDraftResult.blockerLabels.length > 0
        ? emailDraftResult.blockerLabels
        : [
            `Email draft provider outcome ${emailDraftResult.commandOutcome?.key ?? "missing"} does not match release command ${command.key}.`,
          ]
  return {
    key: command.key,
    message: blockers.join(" "),
    status: "failed",
    warnings: emailDraftResult?.warnings ?? [],
  }
}

function localCommandOutcome(
  releasePlan: OfferReleasePlan,
  command: OfferReleaseCommand,
  externalIdPrefix: string,
): OfferReleaseCommandOutcomeInput {
  return {
    externalId: `${externalIdPrefix}:${releasePlan.offerId}:${command.key}`,
    key: command.key,
    message: `${command.label} applied in the local release adapter.`,
    status: "applied",
    warnings:
      command.kind === "calendar_follow_up"
        ? ["Local adapter recorded the command; no external calendar connector call was made."]
        : [],
  }
}

function cloneCommandOutcome(outcome: OfferReleaseCommandOutcomeInput): OfferReleaseCommandOutcomeInput {
  return {
    key: outcome.key,
    status: outcome.status,
    ...(outcome.externalId ? { externalId: outcome.externalId } : {}),
    ...(outcome.message ? { message: outcome.message } : {}),
    ...(outcome.warnings ? { warnings: [...outcome.warnings] } : {}),
  }
}
