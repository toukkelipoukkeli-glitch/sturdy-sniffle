import { describe, expect, it } from "vitest"

import { calculateCncQuote } from "../quoting/cnc"
import { aluminumBracketFixture } from "../quoting/cnc.fixtures"
import type { QuoteReleaseGateDecision, QuoteReleaseGateIssue } from "../workspace/quoteReleaseGate"
import { QUOTE_RELEASE_GATE_VERSION } from "../workspace/quoteReleaseGate"
import { buildCncOfferDraft, type OfferDraft } from "./offer"
import { buildOfferExportPackage, type OfferExportPackage } from "./offerExportPackage"
import {
  buildOfferReleaseExecutionRun,
  OFFER_RELEASE_EXECUTION_VERSION,
} from "./offerReleaseExecution"
import { buildOfferReleasePlan, type OfferReleasePlan } from "./offerReleasePlan"

describe("offer release execution audit", () => {
  it("prepares ready release commands in dry-run mode with stable artifacts", () => {
    const plan = readyReleasePlan()
    const run = buildOfferReleaseExecutionRun({
      actor: "Sari",
      mode: "dry_run",
      plan,
    })

    expect(run).toMatchObject({
      actor: "Sari",
      executedAt: "2026-06-20T06:00:00.000Z",
      executionVersion: OFFER_RELEASE_EXECUTION_VERSION,
      mode: "dry_run",
      offerId: "offer-204",
      offerNumber: "OFFER-204",
      releaseAt: "2026-06-20T06:00:00.000Z",
      rfqId: "rfq-204",
      status: "prepared",
    })
    expect(run.commands.map((command) => [command.key, command.status])).toEqual([
      ["email-draft", "prepared"],
      ["lifecycle-sent", "prepared"],
      ["workspace-status", "prepared"],
      ["lifecycle-follow-up", "prepared"],
      ["calendar-follow-up", "prepared"],
      ["workspace-follow-up", "prepared"],
    ])
    expect(run.commands[0]).toMatchObject({
      idempotencyKey: "offer-release:offer-204:2026-06-20t06-00-00-000z:email-draft",
      kind: "email_draft",
      label: "Draft offer email",
    })
    expect(run.lifecycleEvents.map((event) => event.kind)).toEqual(["sent", "follow_up_scheduled"])
    expect(run.workspaceActions.map((action) => action.kind)).toEqual(["status_change", "follow_up_created"])
    expect(run.calendarEvents.map((event) => event.kind)).toEqual(["offer_follow_up"])
    expect(run.nextActions).toEqual(["Review 6 prepared release commands before committing."])
    expect(run.warnings).toEqual([])
  })

  it("records partial commit failures without losing successful command outcomes", () => {
    const run = buildOfferReleaseExecutionRun({
      actor: "Sari",
      commandOutcomes: [
        {
          key: "calendar-follow-up",
          message: "Calendar quota exhausted",
          status: "failed",
          warnings: ["Retry after quota reset."],
        },
        {
          externalId: "gmail-draft-001",
          key: "email-draft",
          message: "Draft created in Gmail.",
          status: "applied",
        },
      ],
      executedAt: "2026-06-20T09:05:00+03:00",
      mode: "commit",
      plan: readyReleasePlan(),
    })

    expect(run.status).toBe("partial")
    expect(run.executedAt).toBe("2026-06-20T06:05:00.000Z")
    expect(run.commands.find((command) => command.key === "email-draft")).toMatchObject({
      externalId: "gmail-draft-001",
      message: "Draft created in Gmail.",
      status: "applied",
    })
    expect(run.commands.find((command) => command.key === "calendar-follow-up")).toMatchObject({
      message: "Calendar quota exhausted",
      status: "failed",
      warnings: ["Retry after quota reset."],
    })
    expect(run.nextActions).toEqual(["Resolve failed release command: Create follow-up calendar event."])
    expect(run.warnings).toEqual([
      "Create follow-up calendar event: Retry after quota reset.",
      "Create follow-up calendar event failed: Calendar quota exhausted",
    ])
  })

  it("does not materialize artifacts for blocked release plans", () => {
    const offerWithoutEmail = {
      ...offerDraft(),
      customer: {
        contactName: "Nora Buyer",
        name: "North Forge",
      },
    }
    const blockedPlan = buildOfferReleasePlan({
      actor: "sales",
      currentRfqStatus: "estimating",
      exportPackage: offerExportPackage(offerWithoutEmail),
      offer: offerWithoutEmail,
      offerId: "offer-204",
      releaseGate: releaseGate(),
      rfqId: "rfq-204",
      timezone: "Europe/Helsinki",
    })
    const run = buildOfferReleaseExecutionRun({
      actor: "Sari",
      mode: "commit",
      plan: blockedPlan,
    })

    expect(run.status).toBe("blocked")
    expect(run.commands).toEqual([
      expect.objectContaining({
        key: "manager-review:blockers",
        status: "blocked",
      }),
    ])
    expect(run.lifecycleEvents).toEqual([])
    expect(run.workspaceActions).toEqual([])
    expect(run.calendarEvents).toEqual([])
    expect(run.nextActions).toContain("Customer email is required before offer release.")
  })

  it("keeps manager-review plans out of commit execution", () => {
    const plan = reviewedReleasePlanRequired()
    const run = buildOfferReleaseExecutionRun({
      actor: "Sari",
      mode: "commit",
      plan,
    })

    expect(run.status).toBe("needs_review")
    expect(run.commands).toEqual([
      expect.objectContaining({
        key: "manager-review:warnings",
        status: "requires_review",
      }),
    ])
    expect(run.nextActions).toEqual(["Quote approval policy needs manager review."])
    expect(run.lifecycleEvents).toEqual([])
  })

  it("rejects command outcomes that cannot be mapped deterministically", () => {
    const plan = readyReleasePlan()

    expect(() =>
      buildOfferReleaseExecutionRun({
        actor: "Sari",
        commandOutcomes: [
          { key: "email-draft", status: "applied" },
          { key: "email-draft", status: "failed" },
        ],
        mode: "commit",
        plan,
      }),
    ).toThrow("duplicate command outcome email-draft")

    expect(() =>
      buildOfferReleaseExecutionRun({
        actor: "Sari",
        commandOutcomes: [{ key: "unknown-command", status: "applied" }],
        mode: "commit",
        plan,
      }),
    ).toThrow("command outcome unknown-command does not match a release command")

    expect(() =>
      buildOfferReleaseExecutionRun({
        actor: " ",
        mode: "dry_run",
        plan,
      }),
    ).toThrow("actor is required")

    expect(() =>
      buildOfferReleaseExecutionRun({
        actor: "Sari",
        mode: "send_now" as never,
        plan,
      }),
    ).toThrow("mode must be commit or dry_run")

    expect(() =>
      buildOfferReleaseExecutionRun({
        actor: "Sari",
        commandOutcomes: [{ key: "email-draft", status: "queued" as never }],
        mode: "commit",
        plan,
      }),
    ).toThrow("command outcome email-draft status must be applied or failed")
  })
})

function readyReleasePlan(): OfferReleasePlan {
  const offer = offerDraft()
  return buildOfferReleasePlan({
    actor: "sales",
    currentRfqStatus: "ready",
    exportPackage: offerExportPackage(offer),
    followUpDueAt: "2026-06-24T09:00:00+03:00",
    followUpTaskId: "fu-204",
    offer,
    offerId: "offer-204",
    releaseGate: releaseGate(),
    rfqId: "rfq-204",
    timezone: "Europe/Helsinki",
  })
}

function reviewedReleasePlanRequired(): OfferReleasePlan {
  const offer = offerDraft()
  return buildOfferReleasePlan({
    actor: "sales",
    currentRfqStatus: "ready",
    exportPackage: offerExportPackage(offer),
    offer,
    offerId: "offer-204",
    releaseGate: releaseGate({
      issues: [releaseIssue("approval_needs_review", "Quote approval policy needs manager review.")],
      nextActions: ["Quote approval policy needs manager review."],
      status: "needs_review",
      warningCount: 1,
    }),
    rfqId: "rfq-204",
    timezone: "Europe/Helsinki",
  })
}

function offerDraft(): OfferDraft {
  return buildCncOfferDraft({
    customer: {
      contactName: "Nora Buyer",
      email: "nora@example.test",
      name: "North Forge",
    },
    issuedAt: "2026-06-20",
    offerNumber: "OFFER-204",
    quote: calculateCncQuote(aluminumBracketFixture),
    rfqReference: "rfq-204",
    subject: "Aluminum bracket production batch",
    validUntil: "2026-07-04",
  })
}

function offerExportPackage(offer: OfferDraft): OfferExportPackage {
  return buildOfferExportPackage({ offer })
}

function releaseGate(overrides: Partial<QuoteReleaseGateDecision> = {}): QuoteReleaseGateDecision {
  return {
    blockerCount: 0,
    checkedAt: "2026-06-20T09:00:00+03:00",
    checks: [],
    issues: [],
    nextActions: [],
    offerNumber: "OFFER-204",
    releaseGateVersion: QUOTE_RELEASE_GATE_VERSION,
    rfqId: "rfq-204",
    status: "ready",
    warningCount: 0,
    ...overrides,
  }
}

function releaseIssue(code: QuoteReleaseGateIssue["code"], message: string): QuoteReleaseGateIssue {
  return {
    code,
    message,
    severity: "warning",
  }
}
