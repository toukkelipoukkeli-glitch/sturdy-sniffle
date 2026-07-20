const workspaceRecoveryFixtureKey = "factorybid.forceWorkspaceRenderErrorOnce"

function clearWorkspaceRecoveryFixture() {
  if (typeof window === "undefined") {
    return
  }

  try {
    window.sessionStorage.removeItem(workspaceRecoveryFixtureKey)
  } catch {
    // Session storage can be unavailable in hardened browser contexts.
  }
}

function shouldForceWorkspaceRecoveryFixture() {
  if (typeof window === "undefined") {
    return false
  }

  try {
    return window.sessionStorage.getItem(workspaceRecoveryFixtureKey) === "true"
  } catch {
    return false
  }
}

export { clearWorkspaceRecoveryFixture, shouldForceWorkspaceRecoveryFixture }
