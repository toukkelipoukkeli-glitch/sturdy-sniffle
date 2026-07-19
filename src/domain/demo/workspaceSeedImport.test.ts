import { describe, expect, it } from "vitest"

import { buildDemoWorkspaceSeed, serializeDemoWorkspaceSeed, type DemoWorkspaceSeed } from "./workspaceSeed"
import {
  buildDemoWorkspaceImportPlan,
  buildDemoWorkspaceImportPlanFromJson,
  DemoWorkspaceSeedValidationError,
  fingerprintDemoWorkspaceImportPlan,
  parseDemoWorkspaceSeedJson,
  reviewDemoWorkspaceImportFromJson,
  summarizeDemoWorkspaceImportPlan,
  validateDemoWorkspaceSeed,
} from "./workspaceSeedImport"

describe("demo workspace seed import", () => {
  it("builds a deterministic ordered import plan from the demo seed", () => {
    const plan = buildDemoWorkspaceImportPlan(buildDemoWorkspaceSeed())

    expect(plan).toMatchObject({
      generatedAt: "2026-06-20T07:00:00.000Z",
      importPlanVersion: "demo-workspace-import-plan.v1",
      seedVersion: "demo-workspace-seed.v1",
      tenantId: "factorybid-single-tenant",
    })
    expect(plan.operations).toHaveLength(11)
    expect(plan.operations.map((operation) => operation.kind)).toEqual([
      "upsert_customer",
      "upsert_customer",
      "upsert_customer",
      "upsert_rfq",
      "upsert_rfq",
      "upsert_rfq",
      "upsert_quote",
      "upsert_quote",
      "upsert_offer",
      "append_activity",
      "append_activity",
    ])
    expect(plan.operations[0]).toMatchObject({
      customerId: "customer-baltic",
      key: "upsert_customer:customer-baltic",
      tenantId: "factorybid-single-tenant",
    })
    expect(plan.operations[8]).toMatchObject({
      currency: "EUR",
      kind: "upsert_offer",
      key: "upsert_offer:offer-019",
      offerId: "offer-019",
      quoteId: "quote-019",
      rfqId: "rfq-019",
      totalCents: 50000,
    })
  })

  it("parses serialized seed JSON before planning imports", () => {
    const serialized = serializeDemoWorkspaceSeed()

    expect(parseDemoWorkspaceSeedJson(serialized.seedJson)).toEqual(buildDemoWorkspaceSeed())
    expect(buildDemoWorkspaceImportPlanFromJson(serialized.seedJson)).toEqual(
      buildDemoWorkspaceImportPlan(buildDemoWorkspaceSeed()),
    )
  })

  it("summarizes import operation counts for operator review", () => {
    const summary = summarizeDemoWorkspaceImportPlan(buildDemoWorkspaceImportPlan())

    expect(summary).toBe(`FactoryBid demo workspace import demo-workspace-import-plan.v1
Seed: demo-workspace-seed.v1
Tenant: factorybid-single-tenant
Generated: 2026-06-20T07:00:00.000Z
Operations: 11

- upsert_customer: 3
- upsert_rfq: 3
- upsert_quote: 2
- upsert_offer: 1
- append_activity: 2
`)
  })

  it("fingerprints import plans deterministically for idempotent import audits", () => {
    const plan = buildDemoWorkspaceImportPlan()
    const samePlan = buildDemoWorkspaceImportPlanFromJson(serializeDemoWorkspaceSeed().seedJson)
    const retaggedPlan = buildDemoWorkspaceImportPlan(
      buildDemoWorkspaceSeed({
        generatedAt: "2026-06-21T08:00:00.000Z",
        tenantId: "tenant-demo",
      }),
    )

    expect(fingerprintDemoWorkspaceImportPlan(plan)).toBe("demo-import-1eb52340")
    expect(fingerprintDemoWorkspaceImportPlan(samePlan)).toBe(fingerprintDemoWorkspaceImportPlan(plan))
    expect(fingerprintDemoWorkspaceImportPlan(retaggedPlan)).not.toBe(fingerprintDemoWorkspaceImportPlan(plan))
  })

  it("builds a ready pre-write review envelope for valid seed JSON", () => {
    const review = reviewDemoWorkspaceImportFromJson(serializeDemoWorkspaceSeed().seedJson)

    expect(review).toMatchObject({
      blockerLabels: [],
      fingerprint: "demo-import-1eb52340",
      importPlanVersion: "demo-workspace-import-plan.v1",
      nextOperatorMessage: "Review 11 deterministic demo import operations before applying them to a workspace.",
      operationCount: 11,
      operationCounts: {
        append_activity: 2,
        upsert_customer: 3,
        upsert_offer: 1,
        upsert_quote: 2,
        upsert_rfq: 3,
      },
      status: "ready",
    })
    expect(review.summaryText).toContain("FactoryBid demo workspace import demo-workspace-import-plan.v1")
    expect(review.summaryText).toContain("- append_activity: 2")
  })

  it("blocks pre-write reviews for malformed seed JSON with stable operator copy", () => {
    const review = reviewDemoWorkspaceImportFromJson("{not-json")

    expect(review).toEqual({
      blockerLabels: ["$ must be valid JSON"],
      importPlanVersion: "demo-workspace-import-plan.v1",
      nextOperatorMessage: "Fix 1 demo seed validation issue before import planning.",
      operationCount: 0,
      operationCounts: {
        append_activity: 0,
        upsert_customer: 0,
        upsert_offer: 0,
        upsert_quote: 0,
        upsert_rfq: 0,
      },
      status: "blocked",
    })
  })

  it("reports duplicate IDs and broken references with stable paths", () => {
    const invalidSeed = cloneSeed(buildDemoWorkspaceSeed())
    invalidSeed.customers[1] = { ...invalidSeed.customers[1], id: "customer-baltic" }
    invalidSeed.quotes[1] = { ...invalidSeed.quotes[1], rfqId: "missing-rfq" }

    const issues = validateDemoWorkspaceSeed(invalidSeed)

    expect(issues).toContainEqual({
      message: "contains duplicate customer id customer-baltic",
      path: "$.customers",
    })
    expect(issues).toContainEqual({
      message: "references missing id missing-rfq",
      path: "quote quote-204 rfqId",
    })
    expect(() => buildDemoWorkspaceImportPlan(invalidSeed)).toThrow(DemoWorkspaceSeedValidationError)

    const review = reviewDemoWorkspaceImportFromJson(JSON.stringify(invalidSeed))
    expect(review.status).toBe("blocked")
    expect(review.blockerLabels).toContain("$.customers contains duplicate customer id customer-baltic")
    expect(review.blockerLabels).toContain("quote quote-204 rfqId references missing id missing-rfq")
    expect(review.nextOperatorMessage).toBe("Fix 3 demo seed validation issues before import planning.")
  })

  it("rejects malformed JSON and wrong seed versions before planning", () => {
    expect(() => parseDemoWorkspaceSeedJson("{not-json")).toThrow(DemoWorkspaceSeedValidationError)

    const wrongVersion = {
      ...buildDemoWorkspaceSeed(),
      seedVersion: "demo-workspace-seed.v0",
    }
    const wrongCollectionShape = {
      ...buildDemoWorkspaceSeed(),
      customers: "not-an-array",
    }

    expect(() => buildDemoWorkspaceImportPlan(wrongVersion as DemoWorkspaceSeed)).toThrow(
      "demo workspace seed is invalid",
    )
    expect(validateDemoWorkspaceSeed(wrongCollectionShape)).toContainEqual({
      message: "must be an array",
      path: "$.customers",
    })
  })
})

function cloneSeed(seed: DemoWorkspaceSeed): DemoWorkspaceSeed {
  return JSON.parse(JSON.stringify(seed)) as DemoWorkspaceSeed
}
