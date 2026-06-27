import type { NonCncQuotePromotionPlan, NonCncQuotePromotionQuoteSnapshot } from "./nonCncQuotePromotionPlan"

export const NON_CNC_QUOTE_PROMOTION_PERSISTENCE_VERSION = "non-cnc-quote-promotion-persistence.v1"

export type NonCncQuotePromotionDisposition = "candidate" | "review_only"

export interface NonCncQuotePromotionCommandRecord {
  detail: string
  key: string
  label: string
  status: "blocked" | "ready"
}

export interface NonCncQuotePromotionRecord {
  persistenceVersion: typeof NON_CNC_QUOTE_PROMOTION_PERSISTENCE_VERSION
  planId: string
  planVersion: string
  targetRfqId: string
  recordedAt: string
  recordedBy: string
  status: NonCncQuotePromotionPlan["status"]
  disposition: NonCncQuotePromotionDisposition
  quoteSnapshot: NonCncQuotePromotionQuoteSnapshot
  blockers: string[]
  reviewWarnings: string[]
  commands: NonCncQuotePromotionCommandRecord[]
}

export interface NonCncQuotePromotionPersistenceSnapshot {
  blockedPlanIds: string[]
  candidatePlanIds: string[]
  recordCount: number
  records: NonCncQuotePromotionRecord[]
}

export interface NonCncQuotePromotionPersistenceAdapter {
  recordPlan(plan: NonCncQuotePromotionPlan): Promise<NonCncQuotePromotionPersistenceSnapshot>
  snapshot(): NonCncQuotePromotionPersistenceSnapshot
}

export interface LocalNonCncQuotePromotionPersistenceOptions {
  initialSnapshot?: Partial<NonCncQuotePromotionPersistenceSnapshot>
}

export function createLocalNonCncQuotePromotionPersistence({
  initialSnapshot,
}: LocalNonCncQuotePromotionPersistenceOptions = {}): NonCncQuotePromotionPersistenceAdapter {
  let snapshotState = normalizeSnapshot(initialSnapshot)

  return {
    async recordPlan(plan) {
      const record = buildPromotionRecord(plan)
      snapshotState = normalizeSnapshot({
        records: [...snapshotState.records.filter((candidate) => candidate.planId !== record.planId), record],
      })
      return snapshot()
    },
    snapshot,
  }

  function snapshot(): NonCncQuotePromotionPersistenceSnapshot {
    return cloneSnapshot(snapshotState)
  }
}

function buildPromotionRecord(plan: NonCncQuotePromotionPlan): NonCncQuotePromotionRecord {
  return {
    blockers: [...plan.blockers],
    commands: plan.commands.map((command) => ({ ...command })),
    disposition: plan.status === "blocked" ? "review_only" : "candidate",
    persistenceVersion: NON_CNC_QUOTE_PROMOTION_PERSISTENCE_VERSION,
    planId: plan.planId,
    planVersion: plan.planVersion,
    quoteSnapshot: { ...plan.quoteSnapshot },
    recordedAt: plan.requestedAt,
    recordedBy: plan.requestedBy,
    reviewWarnings: [...plan.reviewWarnings],
    status: plan.status,
    targetRfqId: plan.targetRfqId,
  }
}

function normalizeSnapshot(
  snapshot: Partial<NonCncQuotePromotionPersistenceSnapshot> | undefined,
): NonCncQuotePromotionPersistenceSnapshot {
  const recordsByPlanId = new Map<string, NonCncQuotePromotionRecord>()
  for (const record of snapshot?.records ?? []) {
    recordsByPlanId.set(record.planId, cloneRecord(record))
  }
  const records = [...recordsByPlanId.values()].sort((left, right) => left.planId.localeCompare(right.planId))
  return {
    blockedPlanIds: records.filter((record) => record.disposition === "review_only").map((record) => record.planId),
    candidatePlanIds: records.filter((record) => record.disposition === "candidate").map((record) => record.planId),
    recordCount: records.length,
    records,
  }
}

function cloneSnapshot(snapshot: NonCncQuotePromotionPersistenceSnapshot): NonCncQuotePromotionPersistenceSnapshot {
  return {
    blockedPlanIds: [...snapshot.blockedPlanIds],
    candidatePlanIds: [...snapshot.candidatePlanIds],
    recordCount: snapshot.recordCount,
    records: snapshot.records.map(cloneRecord),
  }
}

function cloneRecord(record: NonCncQuotePromotionRecord): NonCncQuotePromotionRecord {
  return {
    blockers: [...record.blockers],
    commands: record.commands.map((command) => ({ ...command })),
    disposition: record.disposition,
    persistenceVersion: record.persistenceVersion,
    planId: record.planId,
    planVersion: record.planVersion,
    quoteSnapshot: { ...record.quoteSnapshot },
    recordedAt: record.recordedAt,
    recordedBy: record.recordedBy,
    reviewWarnings: [...record.reviewWarnings],
    status: record.status,
    targetRfqId: record.targetRfqId,
  }
}
