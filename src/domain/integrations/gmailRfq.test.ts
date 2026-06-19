import { describe, expect, it } from "vitest"

import {
  buildRfqIntakeFromGmailMessage,
  createGmailRfqIntakeAdapter,
  createMockGmailRfqProvider,
  parseGmailRfqMessage,
  type GmailRfqMessage,
  type GmailRfqMessageProvider,
} from "./gmailRfq"

const cncRfqMessage: GmailRfqMessage = {
  id: "msg-001",
  threadId: "thread-001",
  subject: "RFQ: CNC bracket PN FB-204-A",
  fromHeader: '"North Forge" <sari.virtanen@northforge.fi>',
  receivedAt: "2026-06-15T08:30:00+03:00",
  labelIds: ["INBOX", "RFQ"],
  plainText:
    "Hello, please quote part: FB-204-A. CNC milling, aluminum 6082, qty 25 pcs. Dimensions 120 x 80 x 6 mm. Tolerance ISO 2768-m. Deadline 2026-06-30. Budget in EUR.",
  attachments: [
    {
      id: "att-001",
      fileName: "FB-204-A.step",
      mimeType: "model/step",
      sizeBytes: 245760,
    },
    {
      id: "att-002",
      fileName: "FB-204-A.pdf",
      mimeType: "application/pdf",
      sizeBytes: 98304,
    },
  ],
}

const htmlSheetMetalMessage: GmailRfqMessage = {
  id: "msg-002",
  threadId: "thread-002",
  subject: "Urgent laser cut plates",
  senderEmail: "PROCUREMENT@EXAMPLE-FAB.COM",
  receivedAt: "2026-06-16T11:10:00.000Z",
  htmlText:
    "<p>Need quote by 20.06.2026 for sheet metal laser cutting and bending.</p><p>Material stainless 316L, quantity: 100 pieces, +/- 0.20 mm. Please price in USD.</p>",
  attachments: [
    {
      fileName: "plate_set.dxf",
      mimeType: "application/dxf",
    },
  ],
}

describe("Gmail RFQ intake adapter", () => {
  it("normalizes Gmail message payloads into RFQ intake inputs", () => {
    const intake = buildRfqIntakeFromGmailMessage(cncRfqMessage)

    expect(intake).toMatchObject({
      subject: "RFQ: CNC bracket PN FB-204-A",
      senderEmail: "sari.virtanen@northforge.fi",
      senderName: "North Forge",
      receivedAt: "2026-06-15T05:30:00.000Z",
      source: {
        provider: "gmail",
        externalId: "thread-001:msg-001",
        label: "INBOX,RFQ",
      },
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
    })
  })

  it("parses normalized Gmail messages through the deterministic RFQ parser", () => {
    const parsed = parseGmailRfqMessage(cncRfqMessage)

    expect(parsed.contactEmail).toBe("sari.virtanen@northforge.fi")
    expect(parsed.customerName).toBe("North Forge")
    expect(parsed.currency).toBe("EUR")
    expect(parsed.parts).toEqual([
      {
        partNumber: "FB-204-A",
        process: "cnc_milling",
        materialText: "Aluminum 6082",
        quantity: 25,
        dimensions: {
          lengthMm: 120,
          widthMm: 80,
          heightMm: 6,
        },
        attachmentNames: ["FB-204-A.step", "FB-204-A.pdf"],
      },
    ])
  })

  it("uses the configured provider and preserves mock source provenance", async () => {
    const adapter = createGmailRfqIntakeAdapter({
      provider: createMockGmailRfqProvider({
        messages: [cncRfqMessage, htmlSheetMetalMessage],
      }),
    })

    const result = await adapter.ingest({ query: "laser", maxResults: 1 })

    expect(result).toMatchObject({
      provider: "mock",
      status: "succeeded",
      query: "laser",
      warnings: [],
    })
    expect(result.records).toHaveLength(1)
    expect(result.records[0]?.intakeInput.source.provider).toBe("mock")
    expect(result.records[0]?.parsed.priority).toBe("rush")
    expect(result.records[0]?.parsed.currency).toBe("USD")
    expect(result.records[0]?.parsed.parts[0]).toMatchObject({
      process: "sheet_metal",
      materialText: "Stainless steel 316L",
      quantity: 100,
    })
  })

  it("falls back to a mock provider when the primary Gmail adapter fails", async () => {
    const failingProvider: GmailRfqMessageProvider = {
      provider: "gmail",
      adapterVersion: "gmail.live.test",
      async search() {
        throw new Error("Gmail auth revoked")
      },
    }
    const adapter = createGmailRfqIntakeAdapter({
      provider: failingProvider,
      fallbackProvider: createMockGmailRfqProvider({ messages: [cncRfqMessage] }),
    })

    const result = await adapter.ingest({ query: "rfq" })

    expect(result.status).toBe("fallback")
    expect(result.provider).toBe("mock")
    expect(result.records).toHaveLength(1)
    expect(result.warnings).toEqual([
      "Gmail RFQ provider gmail failed: Gmail auth revoked.",
      "Used mock RFQ intake fallback.",
    ])
  })

  it("rejects invalid messages and search requests", async () => {
    expect(() =>
      buildRfqIntakeFromGmailMessage({
        ...cncRfqMessage,
        subject: " ",
      }),
    ).toThrow("message.subject is required")

    await expect(createMockGmailRfqProvider().search({ query: "rfq", maxResults: 0 })).rejects.toThrow(
      "maxResults must be a positive integer",
    )
  })
})
