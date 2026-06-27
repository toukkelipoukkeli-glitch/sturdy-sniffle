import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import App, { ProcessQuotePreviewCard } from "./App"
import { CNC_CALCULATOR_VERSION } from "./domain/quoting/cnc"
import { aluminumBracketFixture, rushTurnedSpacerFixture } from "./domain/quoting/cnc.fixtures"
import { buildProcessDemoQuotes } from "./domain/quoting/processDemoQuotes"
import { buildProcessQuotePreview } from "./domain/quoting/processQuotePreview"
import { calculateQuote } from "./domain/quoting/registry"
import { calculateWorkspaceCncQuote } from "./domain/workspace/workspaceCncQuote"

function totalText(container: HTMLElement): string {
  return container.querySelector(".total-box span")?.textContent ?? ""
}

const originalClipboard = navigator.clipboard

describe("FactoryBid workspace (component)", () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: originalClipboard,
    })
  })

  it("renders the dense operator workspace with the first RFQ selected and a computed quote", () => {
    const { container } = render(<App />)
    expect(screen.getByRole("heading", { name: "FactoryBid OS" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "CNC bracket FB-204-A" })).toBeInTheDocument()
    expect(screen.getByLabelText("Part preview")).toHaveTextContent("3D CAD preview")
    expect(screen.getByLabelText("Attachments")).toHaveTextContent("3D CAD model")
    expect(screen.getByLabelText("Attachments")).toHaveTextContent("PDF drawing")
    const calendarPlan = screen.getByLabelText("RFQ calendar plan preview")
    expect(calendarPlan).toHaveTextContent("2 drafts")
    expect(calendarPlan).toHaveTextContent("Quote work: CNC bracket FB-204-A")
    expect(calendarPlan).toHaveTextContent("30 Jun, 12.00 - 30 Jun, 14.00")
    expect(calendarPlan).toHaveTextContent("Quote due: CNC bracket FB-204-A")
    expect(calendarPlan).toHaveTextContent("30 Jun, 14.30 - 30 Jun, 15.00")
    const processDemos = screen.getByLabelText("Non-CNC registry demos")
    expect(processDemos).toHaveTextContent("v1")
    expect(processDemos).toHaveTextContent("Sheet metal")
    expect(processDemos).toHaveTextContent("sheet-metal.v1")
    expect(within(processDemos).getByRole("button", { name: /Sheet metal/ })).toHaveTextContent("Best price")
    expect(within(processDemos).getByRole("button", { name: /Sheet metal/ })).toHaveTextContent("Fastest lead")
    expect(processDemos).toHaveTextContent("Wire EDM")
    expect(within(processDemos).getByRole("button", { name: /Wire EDM/ })).toBeInTheDocument()
    expect(processDemos).toHaveTextContent("Read-only registry fixture. Process-specific editable inputs are not enabled yet.")
    // The deterministic engine produces a quote on first render (no AI required).
    expect(totalText(container)).toMatch(/€\d/)
  })

  it("previews non-CNC registry process quotes without enabling fake edits", async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    })
    render(<App />)

    const processDemos = screen.getByLabelText("Non-CNC registry demos")
    const selector = within(processDemos).getByLabelText("Process quote preview selector")
    expect(within(selector).getByRole("button", { name: /Sheet metal/ })).toHaveAttribute("aria-pressed", "true")
    expect(within(processDemos).getByLabelText("Selected non-CNC quote preview")).toHaveTextContent("SM-120-BRACKET")

    fireEvent.click(within(selector).getByRole("button", { name: /Wire EDM/ }))

    expect(within(selector).getByRole("button", { name: /Wire EDM/ })).toHaveAttribute("aria-pressed", "true")
    const comparison = within(processDemos).getByLabelText("Process quote comparison summary")
    expect(comparison).toHaveTextContent("Best price")
    expect(comparison).toHaveTextContent("Sheet metal")
    expect(comparison).toHaveTextContent("+€5,260.69")
    expect(comparison).toHaveTextContent("+9d lead")
    const selectedPreview = within(processDemos).getByLabelText("Selected non-CNC quote preview")
    expect(selectedPreview).toHaveTextContent("EDM-KEY-077")
    expect(within(selectedPreview).getByLabelText("Process quote assumptions")).toHaveTextContent("stock weight kg per part")
    expect(within(selectedPreview).getByLabelText("Process quote review flags")).toHaveTextContent("No calculator flags")
    const inputReadiness = within(selectedPreview).getByLabelText("Process input readiness")
    expect(inputReadiness).toHaveTextContent("Editable inputs blocked")
    expect(inputReadiness).toHaveTextContent("wire settings")
    const plannedFields = within(inputReadiness).getByLabelText("Planned process input fields")
    expect(plannedFields).toHaveTextContent("Wire diameter")
    expect(plannedFields).toHaveTextContent("Finish passes")
    const inputDraft = within(inputReadiness).getByLabelText("Read-only process input draft")
    expect(inputDraft).toHaveTextContent("Fixture draft 4/5")
    expect(inputDraft).toHaveTextContent("Wire diameter")
    expect(inputDraft).toHaveTextContent("Missing fixture value")
    expect(inputDraft).toHaveTextContent("2 skim passes")
    const checklist = within(selectedPreview).getByLabelText("Process quote operator checklist")
    expect(checklist).toHaveTextContent("Calculator ready")
    expect(checklist).toHaveTextContent("Input model read-only")
    expect(checklist).toHaveTextContent("Offer wiring pending")
    expect(checklist).toHaveTextContent("No calculator flags on this fixture.")
    await user.click(within(selectedPreview).getByRole("button", { name: "Copy summary" }))
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1))
    const [copiedText] = writeText.mock.calls[0] ?? [""]
    expect(copiedText).toContain("Process: Wire EDM")
    expect(copiedText).toContain("Part: EDM-KEY-077")
    expect(copiedText).toContain("Best price: Sheet metal (EUR 549.05)")
    expect(copiedText).toContain("Selected delta: +EUR 5260.69, +9 days lead")
    expect(copiedText).toContain("Required groups: stock dimensions, cut length, wire settings, inspection scope")
    expect(copiedText).toContain("Planned fields: Stock size, Cut length, Wire diameter, Finish passes, Inspection level")
    expect(copiedText).toContain("Draft coverage: 4/5 required fields populated from registry_fixture")
    expect(copiedText).toContain("Wire diameter: Missing fixture value")
    await waitFor(() => {
      expect(within(selectedPreview).getByRole("status")).toHaveTextContent("Process preview summary copied.")
    })
    await user.click(within(selector).getByRole("button", { name: /Plastic machining/ }))
    const plasticPreview = within(processDemos).getByLabelText("Selected non-CNC quote preview")
    expect(within(plasticPreview).getByRole("button", { name: "Copy summary" })).toBeInTheDocument()
    expect(within(plasticPreview).getByRole("status")).toHaveTextContent("Copy a read-only summary for estimator review.")
    expect(plasticPreview).toHaveTextContent(
      "Read-only registry fixture. Process-specific editable inputs are not enabled yet.",
    )
  })

  it("surfaces non-empty non-CNC preview review flags", () => {
    const preview = buildProcessQuotePreview(buildProcessDemoQuotes(), "fabrication")
    render(<ProcessQuotePreviewCard preview={{ ...preview, reviewFlags: ["Requires operator review before release"] }} />)

    const selectedPreview = screen.getByLabelText("Selected non-CNC quote preview")
    expect(within(selectedPreview).getByLabelText("Process quote review flags")).toHaveTextContent(
      "Requires operator review before release",
    )
  })

  it("requires a valid due date before creating a manual RFQ", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole("button", { name: "New RFQ" }))
    const dialog = screen.getByRole("dialog", { name: "Create RFQ" })
    await user.type(within(dialog).getByLabelText("Customer *"), "Acme Manufacturing")
    await user.type(within(dialog).getByLabelText("Part number *"), "ACME-101")
    await user.clear(within(dialog).getByLabelText("Due date"))

    expect(within(dialog).getByRole("button", { name: "Create RFQ" })).toBeDisabled()
  })

  it("stores winter manual RFQ due dates at Helsinki noon for calendar planning", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole("button", { name: "New RFQ" }))
    const dialog = screen.getByRole("dialog", { name: "Create RFQ" })
    await user.type(within(dialog).getByLabelText("Customer *"), "Acme Manufacturing")
    await user.type(within(dialog).getByLabelText("Part number *"), "ACME-101")
    fireEvent.change(within(dialog).getByLabelText("Due date"), { target: { value: "2026-01-15" } })
    await user.click(within(dialog).getByRole("button", { name: "Create RFQ" }))

    const stored = JSON.parse(window.localStorage.getItem("factorybid.workspace.v1") ?? "{}")
    expect(stored.workItems.find((item: { id: string }) => item.id === stored.selectedId)?.dueAt).toBe("2026-01-15T10:00:00.000Z")

    const calendarPlan = screen.getByLabelText("RFQ calendar plan preview")
    expect(calendarPlan).toHaveTextContent("Quote work: ACME-101")
    expect(calendarPlan).toHaveTextContent("15 Jan, 09.00 - 15 Jan, 11.00")
    expect(calendarPlan).toHaveTextContent("Quote due: ACME-101")
    expect(calendarPlan).toHaveTextContent("15 Jan, 11.30 - 15 Jan, 12.00")
  })

  it("recomputes the quote deterministically when a costing assumption changes", async () => {
    const user = userEvent.setup()
    const { container } = render(<App />)
    const before = totalText(container)
    const quantity = screen.getByLabelText("Quantity")
    await user.clear(quantity)
    await user.type(quantity, "60")
    expect(totalText(container)).not.toBe(before)
    expect(totalText(container)).toMatch(/€\d/)
  })

  it("recomputes the quote when editable costing rates change", async () => {
    const user = userEvent.setup()
    const { container } = render(<App />)
    const before = totalText(container)

    const margin = screen.getByLabelText("Margin percent")
    await user.clear(margin)
    await user.type(margin, "18.5")

    expect(totalText(container)).not.toBe(before)
    expect(screen.getByText("margin percent").closest(".assumption-row")).toHaveTextContent("18.5")
  })

  it("toggles the Rush queue filter to narrow and restore the queue", async () => {
    const user = userEvent.setup()
    render(<App />)
    const queue = screen.getByRole("complementary", { name: "RFQ queue" })
    expect(within(queue).getByRole("button", { name: /North Forge/ })).toBeInTheDocument()

    const rush = within(queue).getByRole("button", { name: "Rush" })
    await user.click(rush)
    expect(rush).toHaveAttribute("aria-pressed", "true")
    expect(within(queue).queryByRole("button", { name: /North Forge/ })).toBeNull()
    expect(within(queue).getByRole("button", { name: /Baltic Hydraulics/ })).toBeInTheDocument()

    await user.click(rush)
    expect(rush).toHaveAttribute("aria-pressed", "false")
    expect(within(queue).getByRole("button", { name: /North Forge/ })).toBeInTheDocument()
  })

  it("switches between triage, costing, and offer views", async () => {
    const user = userEvent.setup()
    render(<App />)
    const tabs = screen.getByRole("navigation", { name: "Workspace views" })
    await user.click(within(tabs).getByRole("button", { name: "Offer" }))
    expect(screen.getByRole("heading", { name: "Offer draft" })).toBeInTheDocument()
    await user.click(within(tabs).getByRole("button", { name: "Triage" }))
    expect(screen.getByRole("heading", { name: "RFQ intake" })).toBeInTheDocument()
  })

  it("records workspace actions with the deterministic local operator context", async () => {
    const user = userEvent.setup()
    render(<App />)

    const queue = screen.getByRole("complementary", { name: "RFQ queue" })
    await user.click(within(queue).getByRole("button", { name: /Baltic Hydraulics/ }))
    await user.click(screen.getByRole("button", { name: "Triage" }))
    await user.click(screen.getByRole("button", { name: /Move to estimating/i }))

    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem("factorybid.workspace.v1") ?? "{}")
      const actions = stored.actionsById?.[stored.selectedId] ?? []
      expect(actions.at(-1)).toMatchObject({
        actor: "Sari",
        kind: "status_change",
        occurredAt: "2026-06-20T06:00:00.000Z",
        toStatus: "estimating",
      })
    })
  })

  it("edits RFQ intake fields and feeds the readiness model", async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole("button", { name: "Triage" }))

    const editor = screen.getByRole("region", { name: "Editable RFQ fields" })
    expect(within(editor).getAllByText("GMAIL 96%").length).toBeGreaterThan(0)

    const subject = within(editor).getByLabelText("RFQ subject")
    await user.clear(subject)
    await user.type(subject, "CNC bracket FB-204-B")
    expect(screen.getByRole("heading", { name: "CNC bracket FB-204-B" })).toBeInTheDocument()

    await user.selectOptions(within(editor).getByLabelText("RFQ process"), "cnc_turning")
    await user.selectOptions(within(editor).getByLabelText("RFQ material"), "aluminum_7075")
    expect(screen.getByLabelText("RFQ tags")).toHaveTextContent("CNC turning")
    expect(screen.getByLabelText("RFQ tags")).toHaveTextContent("Aluminum 7075")

    const customer = within(editor).getByLabelText("RFQ customer")
    await user.clear(customer)
    expect(screen.getByLabelText("RFQ intake readiness")).toHaveTextContent("Customer name is missing")

    await user.type(customer, "North Forge Works")
    expect(screen.getByLabelText("RFQ intake readiness")).not.toHaveTextContent("Customer name is missing")
  })

  it("normalizes edited customer whitespace before approval policy selection", async () => {
    const user = userEvent.setup()
    render(<App />)

    const queue = screen.getByRole("complementary", { name: "RFQ queue" })
    await user.click(within(queue).getByRole("button", { name: /Baltic Hydraulics/ }))
    await user.click(screen.getByRole("button", { name: "Triage" }))

    const editor = screen.getByRole("region", { name: "Editable RFQ fields" })
    const customer = within(editor).getByLabelText("RFQ customer")
    await user.clear(customer)
    await user.type(customer, "Baltic Hydraulics ")

    await user.click(screen.getByRole("button", { name: "Offer" }))
    expect(screen.getByLabelText("Quote approval policy")).toHaveTextContent("Payment terms")
  })

  it("acknowledges CAD manufacturability flags with a persistent operator note", async () => {
    const user = userEvent.setup()
    window.localStorage.clear()
    const { unmount } = render(<App />)

    const queue = screen.getByRole("complementary", { name: "RFQ queue" })
    await user.click(within(queue).getByRole("button", { name: /Baltic Hydraulics/ }))

    expect(screen.getByLabelText("Manufacturability flags")).toHaveTextContent("metadata only review")
    const override = screen.getByLabelText("CAD review override")
    await user.type(within(override).getByLabelText("CAD review note"), "Drawing is enough for turning setup.")
    await user.click(within(override).getByRole("button", { name: "Acknowledge flags" }))

    expect(screen.queryByLabelText("Manufacturability flags")).toBeNull()
    expect(screen.getByLabelText("CAD review override")).toHaveTextContent("Drawing is enough for turning setup.")

    unmount()
    render(<App />)
    const restoredQueue = screen.getByRole("complementary", { name: "RFQ queue" })
    await user.click(within(restoredQueue).getByRole("button", { name: /Baltic Hydraulics/ }))
    expect(screen.queryByLabelText("Manufacturability flags")).toBeNull()
    const restoredOverride = screen.getByLabelText("CAD review override")
    expect(restoredOverride).toHaveTextContent("Drawing is enough for turning setup.")

    await user.click(within(restoredOverride).getByRole("button", { name: "Reopen flags" }))
    expect(screen.getByLabelText("Manufacturability flags")).toHaveTextContent("metadata only review")
    expect(screen.getByLabelText("CAD review override")).not.toHaveTextContent("Drawing is enough for turning setup.")
  })

  it("stores CAD dimension material and process correction notes", () => {
    const { unmount } = render(<App />)

    const queue = screen.getByRole("complementary", { name: "RFQ queue" })
    fireEvent.click(within(queue).getByRole("button", { name: /Baltic Hydraulics/ }))

    const override = screen.getByLabelText("CAD review override")
    fireEvent.change(within(override).getByLabelText("Dimension correction note"), { target: { value: "Spacer length is 78 mm on revised drawing." } })
    fireEvent.change(within(override).getByLabelText("Material correction note"), { target: { value: "Use 316L certificate batch from customer note." } })
    fireEvent.change(within(override).getByLabelText("Process correction note"), { target: { value: "Review turning setup with passivation supplier." } })
    fireEvent.click(within(override).getByRole("button", { name: "Save corrections" }))

    expect(screen.getByLabelText("CAD correction notes")).toHaveTextContent("Spacer length is 78 mm")
    expect(screen.getByLabelText("CAD correction notes")).toHaveTextContent("Use 316L")
    expect(screen.getByLabelText("CAD correction notes")).toHaveTextContent("passivation supplier")
    expect(screen.getByLabelText("CAD review override")).toHaveTextContent("Saved CAD corrections")
    expect(screen.getByLabelText("CAD review override")).not.toHaveTextContent("Acknowledged 0 flags")
    expect(screen.getByText("cad review dimensions")).toBeInTheDocument()
    expect(screen.getByText("cad review material")).toBeInTheDocument()
    expect(screen.getByText("cad review process")).toBeInTheDocument()

    unmount()
    render(<App />)
    const restoredQueue = screen.getByRole("complementary", { name: "RFQ queue" })
    fireEvent.click(within(restoredQueue).getByRole("button", { name: /Baltic Hydraulics/ }))
    expect(screen.getByLabelText("CAD correction notes")).toHaveTextContent("Spacer length is 78 mm")
    expect(screen.getByLabelText("CAD correction notes")).toHaveTextContent("Use 316L")
    expect(screen.getByLabelText("CAD correction notes")).toHaveTextContent("passivation supplier")
    expect(screen.getByText("cad review dimensions")).toBeInTheDocument()
    expect(screen.getByText("cad review material")).toBeInTheDocument()
    expect(screen.getByText("cad review process")).toBeInTheDocument()

    const restoredOverride = screen.getByLabelText("CAD review override")
    fireEvent.change(within(restoredOverride).getByLabelText("Dimension correction note"), { target: { value: "" } })
    fireEvent.change(within(restoredOverride).getByLabelText("Material correction note"), { target: { value: "" } })
    fireEvent.change(within(restoredOverride).getByLabelText("Process correction note"), { target: { value: "" } })
    fireEvent.click(within(restoredOverride).getByRole("button", { name: "Save corrections" }))

    expect(screen.queryByLabelText("CAD correction notes")).toBeNull()
    expect(screen.getByLabelText("CAD review override")).toHaveTextContent("Cleared CAD corrections")
    expect(screen.getByLabelText("CAD review override")).not.toHaveTextContent("Acknowledged 0 flags")
    expect(screen.queryByText("cad review dimensions")).toBeNull()
    expect(screen.queryByText("cad review material")).toBeNull()
    expect(screen.queryByText("cad review process")).toBeNull()
  })

  it("persists an operator-selected primary attachment for part preview", async () => {
    const user = userEvent.setup()
    const { unmount } = render(<App />)

    const preview = screen.getByLabelText("Part preview")
    expect(preview).toHaveTextContent("FB-204-A.step")

    const attachments = within(preview).getByLabelText("Attachments")
    const drawingRow = within(attachments).getByText("FB-204-A.pdf").closest(".attachment-row")
    expect(drawingRow).not.toBeNull()
    await user.click(within(drawingRow as HTMLElement).getByRole("button", { name: "Set primary" }))

    expect(screen.getByLabelText("Part preview")).toHaveTextContent("FB-204-A.pdf")
    const stored = JSON.parse(window.localStorage.getItem("factorybid.workspace.v1") ?? "{}")
    expect(stored.primaryAttachmentById?.[stored.selectedId]).toBe("FB-204-A.pdf")

    unmount()
    render(<App />)
    expect(screen.getByLabelText("Part preview")).toHaveTextContent("FB-204-A.pdf")
  })

  it("edits offer validity, terms, and notes in the exported draft", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole("button", { name: "Offer" }))
    fireEvent.change(screen.getByLabelText("Offer valid until"), { target: { value: "2026-07-10" } })
    fireEvent.change(screen.getByLabelText("Offer revision note"), { target: { value: "Buyer requested updated validity." } })
    fireEvent.change(screen.getByLabelText("Offer terms"), { target: { value: "Payment: Net 14 days\nDelivery: FCA Helsinki" } })
    fireEvent.change(screen.getByLabelText("Offer notes"), { target: { value: "Customer-facing note for the revised offer." } })

    const offerText = screen.getByLabelText("Plain text offer") as HTMLTextAreaElement
    expect(offerText.value).toContain("Valid until: 2026-07-10")
    expect(offerText.value).toContain("Payment: Net 14 days")
    expect(offerText.value).toContain("Customer-facing note for the revised offer.")
  })

  it("records manager release review and unlocks the release plan once the RFQ is ready", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole("button", { name: "Offer" }))
    const releaseGate = screen.getByLabelText("Quote release gate")
    await user.click(within(releaseGate).getByRole("button", { name: "Mark reviewed" }))
    expect(releaseGate).toHaveTextContent("Reviewed by Sari")

    await user.click(screen.getByRole("button", { name: "Triage" }))
    await user.click(screen.getByRole("button", { name: "Create follow-up" }))
    await user.click(screen.getByRole("button", { name: "Move to ready" }))

    await user.click(screen.getByRole("button", { name: "Offer" }))
    const releasePlan = screen.getByLabelText("Offer release command plan")
    expect(releasePlan).toHaveTextContent("Release commands ready")
    expect(releasePlan).toHaveTextContent("manager reviewed")
    expect(releasePlan).toHaveTextContent("Draft offer email")
    const calendarDrafts = within(releasePlan).getByLabelText("Offer release calendar drafts")
    expect(calendarDrafts).toHaveTextContent("Follow up: OFFER-204")
    expect(calendarDrafts).toHaveTextContent("03 Jul, 10.00 - 03 Jul, 10.30")
    expect(calendarDrafts).toHaveTextContent("Europe/Helsinki")
    expect(calendarDrafts).toHaveTextContent("Follow up with North Forge about offer OFFER-204.")

    const executionAudit = screen.getByLabelText("Offer release execution audit")
    await user.click(within(executionAudit).getByRole("button", { name: "Execute release" }))

    expect(executionAudit).toHaveTextContent("Execution completed")
    expect(executionAudit).toHaveTextContent("commit")
    expect(executionAudit).toHaveTextContent("Release execution has been recorded.")
    expect(within(executionAudit).getByRole("button", { name: "Release executed" })).toBeDisabled()
  })

  it("guards local release execution against duplicate clicks", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole("button", { name: "Offer" }))
    const releaseGate = screen.getByLabelText("Quote release gate")
    await user.click(within(releaseGate).getByRole("button", { name: "Mark reviewed" }))
    await user.click(screen.getByRole("button", { name: "Triage" }))
    await user.click(screen.getByRole("button", { name: "Move to ready" }))
    await user.click(screen.getByRole("button", { name: "Offer" }))

    const executionAudit = screen.getByLabelText("Offer release execution audit")
    const execute = within(executionAudit).getByRole("button", { name: "Execute release" })
    fireEvent.click(execute)
    fireEvent.click(execute)

    await waitFor(() => expect(executionAudit).toHaveTextContent("Execution completed"))
    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem("factorybid.workspace.v1") ?? "{}")
      expect(stored.releaseExecutionRunsById?.[stored.selectedId]).toHaveLength(1)
    })
  })

  it("rejects restored release executions with malformed calendar events", async () => {
    const user = userEvent.setup()
    const { unmount } = render(<App />)

    await user.click(screen.getByRole("button", { name: "Offer" }))
    const releaseGate = screen.getByLabelText("Quote release gate")
    await user.click(within(releaseGate).getByRole("button", { name: "Mark reviewed" }))
    await user.click(screen.getByRole("button", { name: "Triage" }))
    await user.click(screen.getByRole("button", { name: "Move to ready" }))
    await user.click(screen.getByRole("button", { name: "Offer" }))

    const executionAudit = screen.getByLabelText("Offer release execution audit")
    await user.click(within(executionAudit).getByRole("button", { name: "Execute release" }))
    await waitFor(() => expect(executionAudit).toHaveTextContent("Execution completed"))

    const stored = JSON.parse(window.localStorage.getItem("factorybid.workspace.v1") ?? "{}")
    stored.activeView = "offer"
    const selectedRuns = stored.releaseExecutionRunsById?.[stored.selectedId]
    selectedRuns[0].calendarEvents = [
      {
        endAt: "2026-06-25T10:30:00.000Z",
        kind: "offer_follow_up",
        metadata: { invalid: 42 },
        startAt: "2026-06-25T10:00:00.000Z",
        timezone: "Europe/Helsinki",
        title: "Follow up offer",
      },
    ]
    window.localStorage.setItem("factorybid.workspace.v1", JSON.stringify(stored))
    unmount()

    render(<App />)
    expect(screen.getByRole("heading", { name: "Offer draft" })).toBeInTheDocument()
    const restoredExecutionAudit = screen.getByLabelText("Offer release execution audit")
    expect(restoredExecutionAudit).toHaveTextContent("Blocked before execution")
    expect(within(restoredExecutionAudit).getByText("Mode").closest(".metric")).toHaveTextContent("dry run")
    expect(within(restoredExecutionAudit).queryByRole("button", { name: "Release executed" })).toBeNull()
  })
})

describe("calculateWorkspaceCncQuote", () => {
  it("preserves CNC registry pricing and metadata for milling and turning fixtures", () => {
    for (const input of [aluminumBracketFixture, rushTurnedSpacerFixture]) {
      const registryQuote = calculateQuote({ process: input.process, input })
      const workspaceQuote = calculateWorkspaceCncQuote(input)

      expect(workspaceQuote.totalCents).toBe(registryQuote.totalCents)
      expect(workspaceQuote.unitPriceCents).toBe(registryQuote.unitPriceCents)
      expect(workspaceQuote.unitRemainderCents).toBe(registryQuote.unitRemainderCents)
      expect(workspaceQuote.breakdown).toStrictEqual(registryQuote.breakdown)
      expect(workspaceQuote.assumptions).toStrictEqual(registryQuote.assumptions)
      expect(workspaceQuote.warnings).toStrictEqual(registryQuote.warnings)
      expect(workspaceQuote.process).toBe(input.process)
      expect(workspaceQuote.calculatorVersion).toBe(CNC_CALCULATOR_VERSION)
    }
  })
})
