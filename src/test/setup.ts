import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

// Unmount React trees between tests so component tests don't leak DOM into each other.
afterEach(() => {
  cleanup()
})
