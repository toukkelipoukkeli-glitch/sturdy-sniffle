import { describe, expect, it } from "vitest"

import { buildOfferExportFixture, serializeOfferExportFixture } from "./exportFixtures"

describe("offer export fixtures", () => {
  it("builds reusable PDF-ready offer and calendar follow-up fixtures", () => {
    const fixture = buildOfferExportFixture()

    expect(fixture).toMatchObject({
      fixtureVersion: "offer-export-fixtures.v1",
      offer: {
        offerNumber: "OFFER-019",
        customer: {
          name: "Baltic Hydraulics",
        },
      },
      document: {
        documentVersion: "offer-document.v1",
        totalLabel: "EUR 500.00",
      },
      followUpPlan: {
        warnings: [],
        events: [
          {
            kind: "offer_follow_up",
            startAt: "2026-06-24T06:00:00.000Z",
            endAt: "2026-06-24T06:30:00.000Z",
            metadata: {
              followUpTaskId: "fu-019",
              offerId: "offer-019",
              offerNumber: "OFFER-019",
            },
          },
        ],
      },
    })
  })

  it("serializes stable export snapshots for document and calendar outputs", () => {
    const serialized = serializeOfferExportFixture()

    expect(serialized.offerDocumentText).toMatchInlineSnapshot(`
      "Offer OFFER-019
      Customer: Baltic Hydraulics
      Issued: 2026-06-19
      Valid until: 2026-07-03
      Total: EUR 500.00

      Offer summary
      Customer: Baltic Hydraulics
      Contact: Mikael Laine
      Email: mikael.laine@baltic.example
      RFQ: rfq-019
      Subject: Turned spacer RFQ
      Issued: 2026-06-19
      Valid until: 2026-07-03
      Revision: 1
      Total excluding VAT: EUR 500.00

      Pricing
      Part | Process | Qty | Unit price | Line total | Lead time
      FB-TURN-019 | CNC turning | 1 | EUR 500.00 | EUR 500.00 | 3 working days

      Assumptions
      Part | Assumption | Value
      FB-TURN-019 | material yield factor | 1.08
      FB-TURN-019 | stock weight kg per part | 0.8686
      FB-TURN-019 | cycle minutes per part | 22
      FB-TURN-019 | margin percent | 25
      FB-TURN-019 | material removal ratio | 0.44
      FB-TURN-019 | rush multiplier | 1.5
      FB-TURN-019 | tolerance class | +/- 0.05 mm
      FB-TURN-019 | finish | Passivated

      Review flags
      Part | Flag
      FB-TURN-019 | Minimum order adjustment applied.

      Revision history
      Current revision: Revision 1 (2026-06-19) by FactoryBid OS: Initial draft
      Rev | Date | By | Reason
      1 | 2026-06-19 | FactoryBid OS | Initial draft
      - Revision 1: Initial draft (2026-06-19, FactoryBid OS)

      Notes
      Rush lead time included.
      Passivation included as outside service.

      Terms
      Key terms: VAT: Prices exclude VAT.; Calculation basis: Material and machining assumptions follow the attached calculation.; Delivery start: Lead time starts after written approval and final drawing release.
      VAT: Prices exclude VAT.
      Calculation basis: Material and machining assumptions follow the attached calculation.
      Delivery start: Lead time starts after written approval and final drawing release.

      Prices exclude VAT unless otherwise stated.
      Lead times start after written approval and final drawing release."
    `)
    expect(serialized.followUpPlanJson).toMatchInlineSnapshot(`
      "{
        "events": [
          {
            "description": "Follow up with Baltic Hydraulics about offer OFFER-019.",
            "endAt": "2026-06-24T06:30:00.000Z",
            "kind": "offer_follow_up",
            "metadata": {
              "customerName": "Baltic Hydraulics",
              "followUpTaskId": "fu-019",
              "offerId": "offer-019",
              "offerNumber": "OFFER-019",
              "source": "offer_follow_up"
            },
            "startAt": "2026-06-24T06:00:00.000Z",
            "timezone": "Europe/Helsinki",
            "title": "Follow up: OFFER-019"
          }
        ],
        "warnings": []
      }
      "
    `)
    expect(serialized.offerDocumentJson).toContain('"documentVersion": "offer-document.v1"')
  })
})
