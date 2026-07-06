export function normalizedWorkspaceTimestamp(value: string): string {
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp)) {
    throw new Error("workspace timestamp must be a valid date string")
  }
  return new Date(timestamp).toISOString()
}
