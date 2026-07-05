import { describe, expect, it } from "vitest"

import { nonNegativeInteger } from "./numberValidation"

describe("number validation", () => {
  it("accepts non-negative integers", () => {
    expect(nonNegativeInteger(0, "count")).toBe(0)
    expect(nonNegativeInteger(42, "count")).toBe(42)
  })

  it("rejects negative, fractional, and non-finite numbers", () => {
    expect(() => nonNegativeInteger(-1, "count")).toThrow("count must be a non-negative integer")
    expect(() => nonNegativeInteger(1.5, "count")).toThrow("count must be a non-negative integer")
    expect(() => nonNegativeInteger(Number.POSITIVE_INFINITY, "count")).toThrow("count must be a non-negative integer")
  })
})
