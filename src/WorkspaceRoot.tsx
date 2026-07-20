import App from "./App.tsx"
import { shouldForceWorkspaceRecoveryFixture } from "./workspaceRecoveryFixture"

function WorkspaceRoot() {
  if (shouldForceWorkspaceRecoveryFixture()) {
    throw new Error("Fixture workspace render failure")
  }

  return <App />
}

export { WorkspaceRoot }
