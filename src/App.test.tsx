import { fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import App from "./App"

function totalText(container: HTMLElement): string {
  return container.querySelector(".total-box span")?.textContent ?? ""
}

describe("FactoryBid workspace (component)", () => {
  it("renders the dense operator workspace with the first RFQ selected and a computed quote", () => {
    const { container } = render(<App />)
    expect(screen.getByRole("heading", { name: "FactoryBid OS" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "CNC bracket FB-204-A" })).toBeInTheDocument()
    // The deterministic engine produces a quote on first render (no AI required).
    expect(totalText(container)).toMatch(/€\d/)
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
    await user.click(screen.getByRole("button", { name: "Move to ready" }))

    await user.click(screen.getByRole("button", { name: "Offer" }))
    const releasePlan = screen.getByLabelText("Offer release command plan")
    expect(releasePlan).toHaveTextContent("Release commands ready")
    expect(releasePlan).toHaveTextContent("manager reviewed")
    expect(releasePlan).toHaveTextContent("Draft offer email")
  })
})
