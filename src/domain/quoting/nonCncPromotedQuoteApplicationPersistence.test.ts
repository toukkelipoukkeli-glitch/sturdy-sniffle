import { describe, expect, it } from "vitest"

import { buildNonCncQuotePromotionActionSummary } from "./nonCncQuotePromotionActions"
import { buildNonCncQuotePromotionCommandPackage, type NonCncQuotePromotionCommandPackage } from "./nonCncQuotePromotionCommandPackage"
import { buildNonCncQuotePromotionDraft } from "./nonCncQuotePromotionDraft"
import { buildNonCncQuotePromotionExecutionOutcomeDraft } from "./nonCncQuotePromotionExecutionOutcomeDraft"
import { buildNonCncQuotePromotionOutcomeCommitRun } from "./nonCncQuotePromotionOutcomeCommit"
import { createLocalNonCncQuotePromotionPersistence } from "./nonCncQuotePromotionPersistence"
import { buildNonCncQuotePromotionPlan } from "./nonCncQuotePromotionPlan"
import { buildNonCncQuotePromotionReadModel, type NonCncQuotePromotionReadModel } from "./nonCncQuotePromotionReadModel"
import {
  buildNonCncPromotedQuoteApplicationPlan,
  type NonCncPromotedQuoteApplicationPlan,
} from "./nonCncPromotedQuoteApplicationPlan"
import {
  createLocalNonCncPromotedQuoteApplicationPersistence,
  NON_CNC_PROMOTED_QUOTE_APPLICATION_PERSISTENCE_VERSION,
  type NonCncPromotedQuoteApplicationPersistenceSnapshot,
} from "./nonCncPromotedQuoteApplicationPersistence"
import { buildProcessDemoQuotes } from "./processDemoQuotes"
import { buildProcessQuotePreview, type ProcessQuotePreview } from "./processQuotePreview"

const request = {
  requestedAt: "2026-06-28T14:30:00.000Z",
  requestedBy: "FactoryBid Operator",
  targetRfqId: "rfq-demo-204",
}

describe("non-CNC promoted quote application persistence", () => {
  it("records ready application plans with quote snapshots and command totals", async () => {
    const adapter = createLocalNonCncPromotedQuoteApplicationPersistence()
    const applicationPlan = await buildReadyApplicationPlan()

    const snapshot = await adapter.recordApplication({
      applicationPlan,
      recordedAt: request.requestedAt,
      recordedBy: request.requestedBy,
    })

    expect(snapshot).toMatchObject({
      applicationReadyIds: [applicationPlan.applicationId],
      blockedApplicationIds: [],
      commandCount: 3,
      persistenceVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_PERSISTENCE_VERSION,
      readyCommandCount: 3,
      recordCount: 1,
      statusCounts: { ready: 1 },
      warningCount: 0,
    })
    expect(snapshot.latestRecord).toMatchObject({
      applicationId: applicationPlan.applicationId,
      applicationRecordId: `non-cnc-promoted-quote-application-record:${applicationPlan.applicationId}`,
      commandCount: 3,
      disposition: "application_ready",
      quoteSnapshot: {
        partNumber: "SM-120-BRACKET",
        process: "sheet_metal",
        totalCents: 54905,
      },
      readyCommandCount: 3,
      recordedBy: request.requestedBy,
      status: "ready",
    })
    expect(snapshot.latestRecord?.commands.map((command) => command.externalId)).toEqual([
      "quote:rfq-demo-204:sm-120-bracket:sheet-metal-v1",
      "offer-readiness:rfq-demo-204:sheet-metal:54905",
      "offer-builder:rfq-demo-204:non-cnc-promotion-rfq-demo-204-sheet-metal-sm-120-bracket-sheet-metal-v1:non-cnc-quote-promotion-command-package-v1",
    ])
  })

  it("records blocked application plans without quote snapshots or command external ids", async () => {
    const adapter = createLocalNonCncPromotedQuoteApplicationPersistence()
    const applicationPlan = await buildBlockedApplicationPlan()

    const snapshot = await adapter.recordApplication({
      applicationPlan,
      recordedAt: request.requestedAt,
      recordedBy: request.requestedBy,
    })

    expect(snapshot).toMatchObject({
      applicationReadyIds: [],
      blockedApplicationIds: [applicationPlan.applicationId],
      commandCount: 3,
      readyCommandCount: 0,
      recordCount: 1,
      statusCounts: { blocked: 1 },
    })
    expect(snapshot.latestRecord).toMatchObject({
      disposition: "review_only",
      quoteSnapshot: undefined,
      status: "blocked",
    })
    expect(snapshot.latestRecord?.commands.every((command) => command.externalId === undefined)).toBe(true)
    expect(snapshot.latestRecord?.blockerLabels).toContain("Promoted quote read model is not ready.")
  })

  it("normalizes seeded snapshots with duplicate application records", async () => {
    const applicationPlan = await buildReadyApplicationPlan()
    const newestRecord = buildSeedRecord(applicationPlan, "2026-06-28T14:15:00.000Z")
    const staleRecord = buildSeedRecord(applicationPlan, "2026-06-28T14:00:00.000Z")
    const adapter = createLocalNonCncPromotedQuoteApplicationPersistence({
      initialSnapshot: {
        records: [newestRecord, staleRecord],
      },
    })

    const snapshot = adapter.snapshot()

    expect(snapshot.recordCount).toBe(1)
    expect(snapshot.applicationReadyIds).toEqual([applicationPlan.applicationId])
    expect(snapshot.latestRecord?.recordedAt).toBe("2026-06-28T14:15:00.000Z")
  })

  it("clones snapshots and records before returning them", async () => {
    const adapter = createLocalNonCncPromotedQuoteApplicationPersistence()
    const applicationPlan = await buildReadyApplicationPlan()
    const snapshot = await adapter.recordApplication({
      applicationPlan,
      recordedAt: request.requestedAt,
      recordedBy: request.requestedBy,
    })

    snapshot.records[0]!.quoteSnapshot!.partNumber = "MUTATED"
    snapshot.records[0]!.commands[0]!.externalId = "mutated"
    const repeatedSnapshot = adapter.snapshot()

    expect(repeatedSnapshot.records[0]?.quoteSnapshot?.partNumber).toBe("SM-120-BRACKET")
    expect(repeatedSnapshot.records[0]?.commands[0]?.externalId).toBe("quote:rfq-demo-204:sm-120-bracket:sheet-metal-v1")
  })

  it("rejects inconsistent seeded records", async () => {
    const applicationPlan = await buildReadyApplicationPlan()
    const record = buildSeedRecord(applicationPlan, request.requestedAt)

    expect(
      () =>
        createLocalNonCncPromotedQuoteApplicationPersistence({
          initialSnapshot: { records: [{ ...record, applicationRecordId: "wrong" }] },
        }),
    ).toThrow("applicationRecordId must match applicationId")
    expect(
      () =>
        createLocalNonCncPromotedQuoteApplicationPersistence({
          initialSnapshot: { records: [{ ...record, readyCommandCount: 2 }] },
        }),
    ).toThrow("readyCommandCount must equal ready command count")
    expect(
      () =>
        createLocalNonCncPromotedQuoteApplicationPersistence({
          initialSnapshot: { records: [{ ...record, status: "blocked", disposition: "review_only" }] },
        }),
    ).toThrow("blocked application records must not include a quoteSnapshot")
    expect(
      () =>
        createLocalNonCncPromotedQuoteApplicationPersistence({
          initialSnapshot: {
            records: [
              {
                ...record,
                disposition: "review_only",
                quoteSnapshot: undefined,
                status: "blocked",
              },
            ],
          },
        }),
    ).toThrow("blocked application records must not include command external ids")
  })
})

async function buildReadyApplicationPlan(): Promise<NonCncPromotedQuoteApplicationPlan> {
  const readModel = await buildPromotedReadModel()
  return buildNonCncPromotedQuoteApplicationPlan({ ...request, readModel })
}

async function buildBlockedApplicationPlan(): Promise<NonCncPromotedQuoteApplicationPlan> {
  const readModel = await buildPromotedReadModel()
  const blockedModel: NonCncQuotePromotionReadModel = {
    ...readModel,
    blockerLabels: ["No committed promotion execution run recorded."],
    offerBuilderExternalId: undefined,
    offerReadinessExternalId: undefined,
    quoteExternalId: undefined,
    quoteSnapshot: undefined,
    status: "blocked",
  }
  return buildNonCncPromotedQuoteApplicationPlan({ ...request, readModel: blockedModel })
}

async function buildPromotedReadModel(): Promise<NonCncQuotePromotionReadModel> {
  const commandPackage = await buildReadyPackage()
  const outcomeDraft = buildNonCncQuotePromotionExecutionOutcomeDraft(commandPackage)
  const { executionRun } = buildNonCncQuotePromotionOutcomeCommitRun({
    actor: request.requestedBy,
    commandPackage,
    executedAt: request.requestedAt,
    outcomeDraft,
  })
  if (!executionRun) {
    throw new Error("Expected ready outcome commit run")
  }
  return buildNonCncQuotePromotionReadModel({ commandPackage, executionRun })
}

async function buildReadyPackage(): Promise<NonCncQuotePromotionCommandPackage> {
  const adapter = createLocalNonCncQuotePromotionPersistence()
  const preview = {
    ...buildProcessQuotePreview(buildProcessDemoQuotes(), "sheet_metal"),
    inputPromotionGate: {
      blockerLabels: [],
      blockers: [],
      gateVersion: "process-input-promotion-gate.v1",
      missingRequiredCount: 0,
      nextStep: "Process input draft is ready for quote promotion.",
      status: "ready",
    },
    reviewFlags: [],
  } satisfies ProcessQuotePreview
  const plan = buildNonCncQuotePromotionPlan({ ...request, preview, workspacePromotionPersistence: "configured" })
  const snapshot = await adapter.recordPlan(plan)
  const summary = buildNonCncQuotePromotionActionSummary({ selectedPlanId: plan.planId, snapshot })
  return buildNonCncQuotePromotionCommandPackage(buildNonCncQuotePromotionDraft(summary))
}

function buildSeedRecord(
  applicationPlan: NonCncPromotedQuoteApplicationPlan,
  recordedAt: string,
): NonCncPromotedQuoteApplicationPersistenceSnapshot["records"][number] {
  return {
    applicationId: applicationPlan.applicationId,
    applicationRecordId: `non-cnc-promoted-quote-application-record:${applicationPlan.applicationId}`,
    blockerCount: applicationPlan.blockerLabels.length,
    blockerLabels: [...applicationPlan.blockerLabels],
    commandCount: applicationPlan.commands.length,
    commands: applicationPlan.commands.map((command) => ({ ...command })),
    disposition: "application_ready",
    packageId: applicationPlan.packageId,
    persistenceVersion: NON_CNC_PROMOTED_QUOTE_APPLICATION_PERSISTENCE_VERSION,
    planVersion: applicationPlan.planVersion,
    quoteSnapshot: applicationPlan.quoteSnapshot ? { ...applicationPlan.quoteSnapshot } : undefined,
    readyCommandCount: applicationPlan.commands.filter((command) => command.status === "ready").length,
    recordedAt,
    recordedBy: request.requestedBy,
    reviewWarnings: [...applicationPlan.reviewWarnings],
    selectedPlanId: applicationPlan.selectedPlanId,
    sourceExecutionFingerprint: applicationPlan.sourceExecutionFingerprint,
    status: "ready",
    targetRfqId: applicationPlan.targetRfqId,
    warningCount: applicationPlan.reviewWarnings.length,
  }
}
