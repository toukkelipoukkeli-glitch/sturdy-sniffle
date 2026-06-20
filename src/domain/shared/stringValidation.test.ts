import { describe, expect, it } from "vitest"

import { nonBlank, optionalTrim } from "./stringValidation"

describe("string validation helpers", () => {
  it("normalizes optional strings without turning blanks into values", () => {
    expect(optionalTrim("  North Forge  ")).toBe("North Forge")
    expect(optionalTrim("   ")).toBeUndefined()
    expect(optionalTrim(undefined)).toBeUndefined()
  })

  it("rejects required blank strings with a field-specific error", () => {
    expect(nonBlank("  OFFER-204  ", "offerNumber")).toBe("OFFER-204")
    expect(() => nonBlank(" ", "offerNumber")).toThrow("offerNumber is required")
  })
})
