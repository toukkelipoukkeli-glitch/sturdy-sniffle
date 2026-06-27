import { describe, expect, it } from "vitest"

import { buildProcessInputDraft, PROCESS_INPUT_DRAFT_VERSION } from "./processInputDraft"

describe("process input draft", () => {
  it("hydrates sheet metal planned fields from registry fixtures", () => {
    expect(buildProcessInputDraft("sheet_metal")).toEqual({
      draftVersion: PROCESS_INPUT_DRAFT_VERSION,
      editable: false,
      populatedRequiredCount: 4,
      process: "sheet_metal",
      requiredCount: 4,
      source: "registry_fixture",
      status: "ready_for_read_only_review",
      values: [
        {
          group: "blank dimensions",
          key: "blankSizeMm",
          label: "Blank size",
          required: true,
          sourcePath: "laserBentBracketFixture.blank",
          status: "populated",
          value: "250 x 120 mm",
          valueKind: "dimension",
        },
        {
          group: "material and thickness",
          key: "materialThicknessMm",
          label: "Material thickness",
          required: true,
          sourcePath: "laserBentBracketFixture.blank.thicknessMm",
          status: "populated",
          value: "2 mm",
          valueKind: "dimension",
        },
        {
          group: "cutting route",
          key: "cutLengthMm",
          label: "Cut length",
          required: true,
          sourcePath: "laserBentBracketFixture.operation.cuttingLengthMm",
          status: "populated",
          value: "1450 mm",
          valueKind: "dimension",
        },
        {
          group: "bend operations",
          key: "bendCount",
          label: "Bend count",
          required: true,
          sourcePath: "laserBentBracketFixture.operation.bendCount",
          status: "populated",
          value: "3 bends",
          valueKind: "quantity",
        },
      ],
    })
  })

  it("keeps missing fixture values explicit for unfinished input models", () => {
    const wireDraft = buildProcessInputDraft("wire_edm")

    expect(wireDraft.status).toBe("missing_fixture_values")
    expect(wireDraft.populatedRequiredCount).toBe(4)
    expect(wireDraft.requiredCount).toBe(5)
    expect(wireDraft.values.find((value) => value.key === "wireDiameterMm")).toMatchObject({
      label: "Wire diameter",
      status: "missing",
      value: "Missing fixture value",
    })
    expect(wireDraft.values.find((value) => value.key === "finishPasses")).toMatchObject({
      sourcePath: "toolSteelKeywayFixture.operation.skimPasses",
      value: "2 skim passes",
    })
  })
})
