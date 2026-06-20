const isoTimestampPattern =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|[+-]\d{2}:\d{2})$/

export function compareLex(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

export function normalizeIsoTimestamp(value: string, key: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    throw new Error(`${key} is required`)
  }

  const match = isoTimestampPattern.exec(trimmed)
  if (!match) {
    throw new Error(`${key} must be a valid ISO timestamp`)
  }

  const [, yearText, monthText, dayText, hourText, minuteText, secondText, fractionText, zoneText] = match
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  const hour = Number(hourText)
  const minute = Number(minuteText)
  const second = Number(secondText)
  const millisecond = Number((fractionText ?? "").padEnd(3, "0"))
  const offsetMinutes = parseOffsetMinutes(zoneText)

  if (month < 1 || month > 12 || hour > 23 || minute > 59 || second > 59 || Number.isNaN(offsetMinutes)) {
    throw new Error(`${key} must be a valid ISO timestamp`)
  }

  const localUtcMillis = Date.UTC(year, month - 1, day, hour, minute, second, millisecond)
  const localDate = new Date(localUtcMillis)
  if (
    localDate.getUTCFullYear() !== year ||
    localDate.getUTCMonth() !== month - 1 ||
    localDate.getUTCDate() !== day ||
    localDate.getUTCHours() !== hour ||
    localDate.getUTCMinutes() !== minute ||
    localDate.getUTCSeconds() !== second ||
    localDate.getUTCMilliseconds() !== millisecond
  ) {
    throw new Error(`${key} must be a valid ISO timestamp`)
  }

  return new Date(localUtcMillis - offsetMinutes * 60_000).toISOString()
}

function parseOffsetMinutes(zoneText: string): number {
  if (zoneText === "Z") {
    return 0
  }

  const sign = zoneText[0] === "-" ? -1 : 1
  const hours = Number(zoneText.slice(1, 3))
  const minutes = Number(zoneText.slice(4, 6))
  if (hours > 23 || minutes > 59) {
    return Number.NaN
  }
  return sign * (hours * 60 + minutes)
}
