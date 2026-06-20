import { describe, expect, it } from "vitest"

import { compareLex, normalizeIsoTimestamp } from "./deterministic"

describe("deterministic domain helpers", () => {
  it("compares strings without locale-dependent collation", () => {
    expect(compareLex("alpha", "beta")).toBe(-1)
    expect(compareLex("beta", "alpha")).toBe(1)
    expect(compareLex("same", "same")).toBe(0)
  })

  it("normalizes strict ISO timestamps with UTC and offset zones", () => {
    expect(normalizeIsoTimestamp("2026-06-20T09:30:15Z", "createdAt")).toBe("2026-06-20T09:30:15.000Z")
    expect(normalizeIsoTimestamp(" 2026-06-20T12:30:15.25+03:00 ", "createdAt")).toBe(
      "2026-06-20T09:30:15.250Z",
    )
  })

  it("rejects blank, parseable non-ISO, and impossible timestamps", () => {
    expect(() => normalizeIsoTimestamp("", "createdAt")).toThrow("createdAt is required")
    expect(() => normalizeIsoTimestamp("06/20/2026 09:00:00", "createdAt")).toThrow(
      "createdAt must be a valid ISO timestamp",
    )
    expect(() => normalizeIsoTimestamp("2026-06-20T09:00:00", "createdAt")).toThrow(
      "createdAt must be a valid ISO timestamp",
    )
    expect(() => normalizeIsoTimestamp("2026-02-30T09:00:00Z", "createdAt")).toThrow(
      "createdAt must be a valid ISO timestamp",
    )
    expect(() => normalizeIsoTimestamp("2026-06-20T24:00:00Z", "createdAt")).toThrow(
      "createdAt must be a valid ISO timestamp",
    )
    expect(() => normalizeIsoTimestamp("2026-06-20T09:00:00+24:00", "createdAt")).toThrow(
      "createdAt must be a valid ISO timestamp",
    )
  })
})
