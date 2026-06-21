import { render, screen, within } from "@testing-library/react"
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
})
