import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest"

import { WorkspaceErrorBoundary } from "./WorkspaceErrorBoundary"

function ThrowingWorkspace() {
  throw new Error("Fixture quote panel failed")
  return null
}

function HealthyWorkspace() {
  return <div>Recovered workspace</div>
}

describe("WorkspaceErrorBoundary", () => {
  let consoleError: MockInstance

  beforeEach(() => {
    consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined)
  })

  afterEach(() => {
    consoleError.mockRestore()
  })

  it("renders a recovery panel when the workspace throws during render", () => {
    render(
      <WorkspaceErrorBoundary>
        <ThrowingWorkspace />
      </WorkspaceErrorBoundary>,
    )

    expect(screen.getByRole("alert", { name: "Workspace error" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "FactoryBid OS needs a refresh" })).toBeInTheDocument()
    expect(screen.getByText("Workspace render failed. Please reload and contact support if the issue persists.")).toBeInTheDocument()
    expect(screen.queryByText("Fixture quote panel failed")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Reload workspace" })).toBeInTheDocument()
  })

  it("recovers after reset when the next render succeeds", async () => {
    const user = userEvent.setup()
    let shouldThrow = true

    function MaybeWorkspace() {
      if (shouldThrow) {
        throw new Error("Transient workspace render failure")
      }

      return <HealthyWorkspace />
    }

    const { rerender } = render(
      <WorkspaceErrorBoundary>
        <MaybeWorkspace />
      </WorkspaceErrorBoundary>,
    )

    shouldThrow = false
    await user.click(screen.getByRole("button", { name: "Reload workspace" }))
    rerender(
      <WorkspaceErrorBoundary>
        <MaybeWorkspace />
      </WorkspaceErrorBoundary>,
    )

    expect(screen.getByText("Recovered workspace")).toBeInTheDocument()
    expect(screen.queryByRole("alert", { name: "Workspace error" })).not.toBeInTheDocument()
  })
})
