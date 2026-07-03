import { describe, expect, it } from "vitest"

import { cadMetadataFileBelongsToPart, cadMetadataFileMatches } from "./cadMetadataFileMatch"

describe("CAD metadata filename matching", () => {
  it("matches filenames case-insensitively while allowing equivalent separator boundaries", () => {
    expect(cadMetadataFileMatches("FB-204-A.step", "fb-204-a.STEP")).toBe(true)
    expect(cadMetadataFileMatches("fb_204_a.STEP", "FB-204-A.step")).toBe(true)
  })

  it("keeps distinct segment boundaries from collapsing into the same attachment", () => {
    expect(cadMetadataFileMatches("ab-c.step", "a-bc.step")).toBe(false)
    expect(cadMetadataFileMatches("FB-204-A.step", "FB-204-A.pdf")).toBe(false)
  })

  it("matches part-number fallbacks on complete filename segments", () => {
    expect(cadMetadataFileBelongsToPart("FB-204-A-rev2.step", "FB-204-A")).toBe(true)
    expect(cadMetadataFileBelongsToPart("FB-204-A2.step", "FB-204-A")).toBe(false)
  })
})
