import { describe, expect, it } from "vitest"

import { buildProcessDemoQuotes, PROCESS_DEMO_QUOTES_VERSION } from "./processDemoQuotes"

describe("process demo quotes", () => {
  it("builds deterministic non-CNC registry demos in UI order", () => {
    const demos = buildProcessDemoQuotes()

    expect(PROCESS_DEMO_QUOTES_VERSION).toBe("process-demo-quotes.v1")
    expect(demos.map((demo) => demo.process)).toEqual(["sheet_metal", "plastic", "wire_edm", "fabrication"])
    expect(demos.map((demo) => demo.quote.totalCents)).toEqual([54905, 97096, 580974, 150710])
    expect(demos.every((demo) => demo.quote.process === demo.process)).toBe(true)
    expect(demos.every((demo) => demo.quote.breakdown.length > 0)).toBe(true)
  })
})
