import { describe, expect, it } from "vitest"

import { buildDemoWorkspaceSeed, renderDemoWorkspaceSeedManifest, serializeDemoWorkspaceSeed } from "./workspaceSeed"

describe("demo workspace seed", () => {
  it("builds a deterministic local workspace seed from existing domain fixtures", () => {
    const seed = buildDemoWorkspaceSeed()

    expect(seed).toMatchObject({
      generatedAt: "2026-06-20T07:00:00.000Z",
      seedVersion: "demo-workspace-seed.v1",
      tenantId: "factorybid-single-tenant",
    })
    expect(seed.customers.map((customer) => customer.id)).toEqual([
      "customer-baltic",
      "customer-north-forge",
      "customer-arctic",
    ])
    expect(seed.rfqs.map((rfq) => [rfq.id, rfq.status, rfq.priority])).toEqual([
      ["rfq-019", "triage", "rush"],
      ["rfq-204", "estimating", "normal"],
      ["rfq-sheet-urgent", "new", "rush"],
    ])
    expect(seed.quotes).toEqual([
      {
        currency: "EUR",
        id: "quote-019",
        leadTimeDays: 3,
        partNumber: "FB-TURN-019",
        rfqId: "rfq-019",
        totalCents: 50000,
      },
      {
        currency: "EUR",
        id: "quote-204",
        leadTimeDays: 9,
        partNumber: "FB-CNC-204-A",
        rfqId: "rfq-204",
        totalCents: 115418,
      },
    ])
    expect(seed.activities.map((activity) => activity.id)).toEqual([
      "activity-rfq-019-triage",
      "activity-offer-019-follow-up",
    ])
  })

  it("allows callers to stamp tenant and generation metadata without changing fixture contents", () => {
    const seed = buildDemoWorkspaceSeed({
      generatedAt: "2026-06-21T08:00:00.000Z",
      tenantId: "tenant-demo",
    })

    expect(seed.generatedAt).toBe("2026-06-21T08:00:00.000Z")
    expect(seed.tenantId).toBe("tenant-demo")
    expect(seed.offers[0]).toMatchObject({
      currency: "EUR",
      offerNumber: "OFFER-019",
      status: "sent",
      totalCents: 50000,
    })
  })

  it("renders a stable line-oriented manifest for demo import review", () => {
    const manifest = renderDemoWorkspaceSeedManifest(buildDemoWorkspaceSeed())

    expect(manifest).toContain("FactoryBid demo workspace seed demo-workspace-seed.v1\n")
    expect(manifest).toContain("Customers (3)\n- customer-baltic: Baltic Hydraulics [EUR]")
    expect(manifest).toContain("RFQs (3)\n- rfq-019: Turned spacer FB-TURN-019 [triage, rush]")
    expect(manifest).toContain("Quotes (2)\n- quote-019: FB-TURN-019 EUR 500.00 3d")
    expect(manifest).toContain("Offers (1)\n- offer-019: OFFER-019 [sent] EUR 500.00 valid 2026-07-03")
    expect(manifest).toContain("Activities (2)\n- activity-rfq-019-triage: status_change for rfq-019")
    expect(manifest.endsWith("\n")).toBe(true)
  })

  it("serializes the seed into stable JSON and manifest artifacts", () => {
    const serialized = serializeDemoWorkspaceSeed()

    expect(serialized.seedVersion).toBe("demo-workspace-seed.v1")
    expect(serialized.manifestText).toBe(renderDemoWorkspaceSeedManifest(buildDemoWorkspaceSeed()))
    expect(serialized.seedJson).toContain('"seedVersion": "demo-workspace-seed.v1"')
    expect(serialized.seedJson).toContain('"customers": [')
    expect(serialized.seedJson).toContain('"currency": "EUR"')
    expect(serialized.seedJson.endsWith("\n")).toBe(true)
    expect(JSON.parse(serialized.seedJson)).toEqual(buildDemoWorkspaceSeed())
  })
})
