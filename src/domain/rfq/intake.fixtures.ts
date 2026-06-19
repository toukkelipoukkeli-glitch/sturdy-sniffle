import type { RfqIntakeInput } from "./intake"

export const cncBracketEmail: RfqIntakeInput = {
  subject: "RFQ: CNC bracket PN FB-204-A",
  senderEmail: "sari.virtanen@northforge.fi",
  senderName: "North Forge",
  receivedAt: "2026-06-15T08:30:00.000Z",
  source: {
    provider: "gmail",
    externalId: "gmail-thread-001",
    label: "Inbox",
  },
  bodyText:
    "Hello, please quote part: FB-204-A. CNC milling, aluminum 6082, qty 25 pcs. Dimensions 120 x 80 x 6 mm. Tolerance ISO 2768-m. Deadline 2026-06-30. Budget in EUR.",
  attachments: [
    {
      fileName: "FB-204-A.step",
      contentType: "model/step",
      sizeBytes: 245760,
    },
    {
      fileName: "FB-204-A.pdf",
      contentType: "application/pdf",
      sizeBytes: 98304,
    },
  ],
}

export const rushSheetMetalEmail: RfqIntakeInput = {
  subject: "Urgent laser cut plates",
  senderEmail: "procurement@example-fab.com",
  receivedAt: "2026-06-16T11:10:00.000Z",
  source: {
    provider: "gmail",
    externalId: "gmail-thread-002",
  },
  bodyText:
    "Need quote by 20.06.2026 for sheet metal laser cutting and bending. Material stainless 316L, quantity: 100 pieces, +/- 0.20 mm. Please price in USD.",
  attachments: [
    {
      fileName: "plate_set.dxf",
      contentType: "application/dxf",
    },
    {
      fileName: "requirements.xlsx",
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  ],
}
