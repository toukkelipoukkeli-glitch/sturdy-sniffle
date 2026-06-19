import { describe, expect, it } from "vitest"

import { rankFeatureBacklogItems, scoreFeatureBacklogItem, type FeatureBacklogInput } from "./featureScout"

const baseCreatedAt = Date.parse("2026-06-19T12:00:00.000Z")

describe("feature scout backlog scoring", () => {
  it("scores high-impact, low-risk ideas as now candidates", () => {
    const scored = scoreFeatureBacklogItem({
      title: "Auto-detect sheet metal bend risks",
      description: "Flag tight flanges and bend counts before quote approval.",
      source: "operator",
      quoteAccuracyImpact: 5,
      timeSavedImpact: 4.5,
      integrationRisk: 1,
      reviewability: 4.5,
      createdAt: baseCreatedAt,
    })

    expect(scored).toMatchObject({
      title: "Auto-detect sheet metal bend risks",
      status: "scored",
      updatedAt: baseCreatedAt,
      score: {
        scoreVersion: "feature-scout.v1",
        priorityScore: 92,
        priority: "now",
      },
    })
    expect(scored.score.rationale).toContain("High reviewability makes this suitable for a small, testable PR slice.")
  })

  it("demotes high-risk ideas even when their benefits are strong", () => {
    const scored = scoreFeatureBacklogItem({
      title: "Live ERP writeback",
      description: "Push accepted offers directly into the customer ERP.",
      source: "customer",
      quoteAccuracyImpact: 4.5,
      timeSavedImpact: 5,
      integrationRisk: 5,
      reviewability: 2,
      createdAt: baseCreatedAt,
    })

    expect(scored.score.priorityScore).toBe(70)
    expect(scored.score.priority).toBe("next")
    expect(scored.score.rationale).toContain(
      "High integration risk prevents immediate planning without a smaller proof slice.",
    )
  })

  it("ranks scored ideas by score, then lower risk, then title", () => {
    const items: FeatureBacklogInput[] = [
      {
        title: "Zeta high-risk integration",
        description: "Large integration with moderate reviewability.",
        source: "research",
        quoteAccuracyImpact: 4,
        timeSavedImpact: 4,
        integrationRisk: 3,
        reviewability: 3,
        createdAt: baseCreatedAt,
      },
      {
        title: "Alpha lower-risk workflow",
        description: "Same score profile but easier integration.",
        source: "operator",
        quoteAccuracyImpact: 4,
        timeSavedImpact: 4,
        integrationRisk: 2,
        reviewability: 2.25,
        createdAt: baseCreatedAt,
      },
      {
        title: "Beta tiny polish",
        description: "Small cosmetic improvement.",
        source: "reviewer",
        quoteAccuracyImpact: 1,
        timeSavedImpact: 1,
        integrationRisk: 1,
        reviewability: 5,
        createdAt: baseCreatedAt,
      },
    ]

    expect(rankFeatureBacklogItems(items).map((item) => item.title)).toEqual([
      "Alpha lower-risk workflow",
      "Zeta high-risk integration",
      "Beta tiny polish",
    ])
  })

  it("rejects invalid backlog inputs", () => {
    expect(() =>
      scoreFeatureBacklogItem({
        title: " ",
        description: "Missing title",
        source: "system",
        quoteAccuracyImpact: 1,
        timeSavedImpact: 1,
        integrationRisk: 1,
        reviewability: 1,
        createdAt: baseCreatedAt,
      }),
    ).toThrow("title is required")

    expect(() =>
      scoreFeatureBacklogItem({
        title: "Invalid score",
        description: "Score is out of range",
        source: "system",
        quoteAccuracyImpact: 6,
        timeSavedImpact: 1,
        integrationRisk: 1,
        reviewability: 1,
        createdAt: baseCreatedAt,
      }),
    ).toThrow("quoteAccuracyImpact must be a number from 0 to 5")
  })
})
