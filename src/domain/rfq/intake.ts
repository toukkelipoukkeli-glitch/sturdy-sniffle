export type RfqSourceProvider = "manual" | "gmail" | "calendar" | "import" | "mock"

export type RfqAttachmentKind =
  | "email_body"
  | "drawing"
  | "cad"
  | "spreadsheet"
  | "photo"
  | "other"

export type RfqProcessKey =
  | "cnc_milling"
  | "cnc_turning"
  | "sheet_metal"
  | "plastic"
  | "wire_edm"
  | "fabrication"

export type RfqCurrencyCode = "EUR" | "USD" | "GBP"

export type RfqPriority = "low" | "normal" | "rush"

export interface RfqIntakeSource {
  provider: RfqSourceProvider
  externalId?: string
  label?: string
}

export interface RfqAttachmentInput {
  fileName: string
  contentType?: string
  sizeBytes?: number
  extractedText?: string
}

export interface RfqIntakeInput {
  subject: string
  bodyText?: string
  senderEmail?: string
  senderName?: string
  receivedAt: string
  source: RfqIntakeSource
  attachments?: RfqAttachmentInput[]
}

export interface RfqAttachmentDraft extends RfqAttachmentInput {
  kind: RfqAttachmentKind
}

export interface RfqExtractedField {
  key: string
  value: string
  confidence: number
  source: RfqIntakeSource
  reviewed: false
}

export interface RfqPartDraft {
  partNumber: string
  description?: string
  process?: RfqProcessKey
  materialText?: string
  quantity?: number
  dimensions?: {
    lengthMm?: number
    widthMm?: number
    heightMm?: number
    thicknessMm?: number
  }
  attachmentNames: string[]
}

export interface ParsedRfqIntake {
  subject: string
  summary?: string
  priority: RfqPriority
  currency: RfqCurrencyCode
  receivedAt: number
  dueAt?: number
  contactEmail?: string
  customerName?: string
  extractedFields: RfqExtractedField[]
  attachments: RfqAttachmentDraft[]
  parts: RfqPartDraft[]
}

const processPatterns: Array<{
  process: RfqProcessKey
  confidence: number
  patterns: RegExp[]
}> = [
  {
    process: "wire_edm",
    confidence: 0.91,
    patterns: [/\bwire\s*edm\b/i, /\bedm\b/i, /\bspark erosion\b/i],
  },
  {
    process: "sheet_metal",
    confidence: 0.88,
    patterns: [/\bsheet metal\b/i, /\blaser cut/i, /\bbending\b/i, /\bpress brake\b/i],
  },
  {
    process: "cnc_turning",
    confidence: 0.86,
    patterns: [/\bcnc turning\b/i, /\bturned\b/i, /\blathe\b/i],
  },
  {
    process: "cnc_milling",
    confidence: 0.84,
    patterns: [/\bcnc\b/i, /\bmilling\b/i, /\bmill\b/i, /\bmachined\b/i],
  },
  {
    process: "plastic",
    confidence: 0.82,
    patterns: [/\bplastic\b/i, /\bpom\b/i, /\bpeek\b/i, /\bpolycarbonate\b/i],
  },
  {
    process: "fabrication",
    confidence: 0.8,
    patterns: [/\bfabrication\b/i, /\bweld/i, /\bassembly\b/i],
  },
]

const materialPatterns: Array<{ pattern: RegExp; value: string; confidence: number }> = [
  { pattern: /\baluminium\s*(?:en\s*aw[-\s]*)?(6061|6082|7075)\b/i, value: "Aluminum $1", confidence: 0.9 },
  { pattern: /\baluminum\s*(6061|6082|7075)\b/i, value: "Aluminum $1", confidence: 0.9 },
  { pattern: /\bstainless\s*(?:steel)?\s*(304|316|316l)\b/i, value: "Stainless steel $1", confidence: 0.88 },
  { pattern: /\baisi\s*(304|316|316l)\b/i, value: "Stainless steel $1", confidence: 0.86 },
  { pattern: /\bsteel\s*(s355|s235|1018|4140)\b/i, value: "Steel $1", confidence: 0.84 },
  { pattern: /\b(pom|peek|ptfe|abs|polycarbonate)\b/i, value: "$1", confidence: 0.82 },
]

const quantityPatterns = [
  /\bqty\.?\s*[:=]?\s*(\d{1,7})\b/gi,
  /\bquantity\s*[:=]?\s*(\d{1,7})\b/gi,
  /\b(\d{1,7})\s*(?:pcs|pieces|kpl)\b/gi,
]

const partPatterns = [
  /\bpart(?:\s*(?:no|number))?\s*[:#]\s*([A-Z0-9][A-Z0-9._/-]{1,40})/gi,
  /\bpn\s*[:#]\s*([A-Z0-9][A-Z0-9._/-]{1,40})/gi,
  /\bdrawing\s*[:#]\s*([A-Z0-9][A-Z0-9._/-]{1,40})/gi,
]

const datePatterns = [
  /\b(?:due|deadline|quote by|needed by|target date)\s*[:=]?\s*(\d{4}-\d{1,2}-\d{1,2})\b/i,
  /\b(?:due|deadline|quote by|needed by|target date)\s*[:=]?\s*(\d{1,2}[./]\d{1,2}[./]\d{2,4})\b/i,
]

export function parseRfqIntake(input: RfqIntakeInput): ParsedRfqIntake {
  const receivedAt = parseRequiredDate(input.receivedAt, "receivedAt")
  const attachments = (input.attachments ?? []).map(classifyAttachment)
  const combinedText = [input.subject, input.bodyText, ...attachments.map((item) => item.extractedText)]
    .filter(Boolean)
    .join("\n")
  const source = input.source
  const extractedFields: RfqExtractedField[] = []

  const contactEmail = normalizeEmail(input.senderEmail)
  if (contactEmail) {
    extractedFields.push(field("contact_email", contactEmail, 0.98, source))
  }

  const customerName = inferCustomerName(input.senderName, contactEmail)
  if (customerName) {
    extractedFields.push(field("customer_name", customerName, 0.72, source))
  }

  const dueAt = extractDueAt(combinedText)
  if (dueAt !== undefined) {
    extractedFields.push(field("due_at", new Date(dueAt).toISOString(), 0.86, source))
  }

  const currency = extractCurrency(combinedText)
  extractedFields.push(field("currency", currency, currency === "EUR" ? 0.7 : 0.82, source))

  const priority = extractPriority(combinedText)
  extractedFields.push(field("priority", priority, priority === "normal" ? 0.66 : 0.84, source))

  const process = extractProcess(combinedText)
  if (process) {
    extractedFields.push(field("process", process.process, process.confidence, source))
  }

  const material = extractMaterial(combinedText)
  if (material) {
    extractedFields.push(field("material", material.value, material.confidence, source))
  }

  const quantities = extractQuantities(combinedText)
  for (const quantity of quantities) {
    extractedFields.push(field("quantity", String(quantity), 0.82, source))
  }

  const dimensions = extractDimensions(combinedText)
  if (dimensions) {
    extractedFields.push(field("dimensions_mm", formatDimensions(dimensions), 0.78, source))
  }

  const tolerance = extractTolerance(combinedText)
  if (tolerance) {
    extractedFields.push(field("tolerance", tolerance, 0.76, source))
  }

  const partNumbers = extractPartNumbers(combinedText)
  for (const partNumber of partNumbers) {
    extractedFields.push(field("part_number", partNumber, 0.81, source))
  }

  return {
    subject: input.subject.trim(),
    summary: summarize(input.subject, input.bodyText),
    priority,
    currency,
    receivedAt,
    dueAt,
    contactEmail,
    customerName,
    extractedFields: dedupeFields(extractedFields),
    attachments,
    parts: buildPartDrafts({
      partNumbers,
      process: process?.process,
      materialText: material?.value,
      quantities,
      dimensions,
      attachments,
    }),
  }
}

export function classifyAttachment(input: RfqAttachmentInput): RfqAttachmentDraft {
  const lowerName = input.fileName.toLowerCase()
  const contentType = input.contentType?.toLowerCase()
  const kind = classifyAttachmentKind(lowerName, contentType)

  return {
    ...input,
    kind,
  }
}

function classifyAttachmentKind(fileName: string, contentType?: string): RfqAttachmentKind {
  if (contentType?.startsWith("image/") || /\.(png|jpe?g|webp|heic)$/i.test(fileName)) {
    return "photo"
  }

  if (/\.(step|stp|iges|igs|stl|dxf|dwg|x_t|x_b|3mf)$/i.test(fileName)) {
    return "cad"
  }

  if (contentType === "application/pdf" || /\.(pdf)$/i.test(fileName)) {
    return "drawing"
  }

  if (/\.(xlsx?|csv|tsv|ods)$/i.test(fileName)) {
    return "spreadsheet"
  }

  return "other"
}

function parseRequiredDate(value: string, fieldName: string): number {
  const timestamp = Date.parse(value)
  if (Number.isNaN(timestamp)) {
    throw new Error(`Invalid ${fieldName}: ${value}`)
  }

  return timestamp
}

function extractDueAt(text: string): number | undefined {
  for (const pattern of datePatterns) {
    const match = pattern.exec(text)
    if (!match?.[1]) {
      continue
    }

    const parsed = parseDateToken(match[1])
    if (parsed !== undefined) {
      return parsed
    }
  }

  return undefined
}

function parseDateToken(value: string): number | undefined {
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(value)) {
    return Date.parse(`${value}T12:00:00.000Z`)
  }

  const numeric = /^(\d{1,2})[./](\d{1,2})[./](\d{2,4})$/.exec(value)
  if (!numeric) {
    return undefined
  }

  const day = Number(numeric[1])
  const month = Number(numeric[2])
  const rawYear = Number(numeric[3])
  const year = rawYear < 100 ? 2000 + rawYear : rawYear
  const timestamp = Date.UTC(year, month - 1, day, 12)

  return Number.isNaN(timestamp) ? undefined : timestamp
}

function extractCurrency(text: string): RfqCurrencyCode {
  if (/\b(?:usd|dollars?)\b|\$/i.test(text)) {
    return "USD"
  }

  if (/\b(?:gbp|pounds?|sterling)\b|£/i.test(text)) {
    return "GBP"
  }

  return "EUR"
}

function extractPriority(text: string): RfqPriority {
  if (/\b(?:urgent|rush|asap|expedite|kiire)\b/i.test(text)) {
    return "rush"
  }

  if (/\b(?:no rush|when possible|low priority)\b/i.test(text)) {
    return "low"
  }

  return "normal"
}

function extractProcess(text: string): { process: RfqProcessKey; confidence: number } | undefined {
  for (const candidate of processPatterns) {
    if (candidate.patterns.some((pattern) => pattern.test(text))) {
      return { process: candidate.process, confidence: candidate.confidence }
    }
  }

  return undefined
}

function extractMaterial(text: string): { value: string; confidence: number } | undefined {
  for (const material of materialPatterns) {
    const match = material.pattern.exec(text)
    if (match) {
      return {
        value: material.value.replace("$1", match[1]?.toUpperCase() ?? "").trim(),
        confidence: material.confidence,
      }
    }
  }

  return undefined
}

function extractQuantities(text: string): number[] {
  const quantities = new Set<number>()

  for (const pattern of quantityPatterns) {
    pattern.lastIndex = 0
    for (const match of text.matchAll(pattern)) {
      const rawQuantity = match[1]
      const quantity = Number(rawQuantity)
      if (Number.isInteger(quantity) && quantity > 0) {
        quantities.add(quantity)
      }
    }
  }

  return [...quantities]
}

function extractPartNumbers(text: string): string[] {
  const partNumbers = new Set<string>()

  for (const pattern of partPatterns) {
    pattern.lastIndex = 0
    for (const match of text.matchAll(pattern)) {
      const partNumber = match[1]?.replace(/[),.;:]+$/, "")
      if (partNumber) {
        partNumbers.add(partNumber)
      }
    }
  }

  return [...partNumbers]
}

function extractDimensions(text: string): RfqPartDraft["dimensions"] | undefined {
  const match = /\b(\d+(?:[.,]\d+)?)\s*x\s*(\d+(?:[.,]\d+)?)(?:\s*x\s*(\d+(?:[.,]\d+)?))?\s*mm\b/i.exec(text)
  if (!match) {
    return undefined
  }

  return {
    lengthMm: parseDecimal(match[1]),
    widthMm: parseDecimal(match[2]),
    heightMm: match[3] ? parseDecimal(match[3]) : undefined,
  }
}

function extractTolerance(text: string): string | undefined {
  const isoMatch = /\bISO\s*2768[-\s]?[a-zA-Z]{1,2}\b/i.exec(text)
  if (isoMatch) {
    return isoMatch[0].replace(/\s+/g, " ").toUpperCase()
  }

  const plusMinusMatch = /(?:±|\+\/-)\s*(\d+(?:[.,]\d+)?)\s*mm\b/i.exec(text)
  if (plusMinusMatch) {
    return `+/- ${plusMinusMatch[1].replace(",", ".")} mm`
  }

  return undefined
}

function parseDecimal(value: string): number {
  return Number(value.replace(",", "."))
}

function formatDimensions(dimensions: NonNullable<RfqPartDraft["dimensions"]>): string {
  const values = [dimensions.lengthMm, dimensions.widthMm, dimensions.heightMm].filter((value) => value !== undefined)
  return `${values.join(" x ")} mm`
}

function normalizeEmail(email?: string): string | undefined {
  const value = email?.trim().toLowerCase()
  return value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value : undefined
}

function inferCustomerName(senderName?: string, email?: string): string | undefined {
  const trimmedName = senderName?.trim()
  if (trimmedName) {
    return trimmedName
  }

  const domain = email?.split("@")[1]?.split(".")[0]
  if (!domain || ["gmail", "outlook", "hotmail", "icloud", "yahoo"].includes(domain)) {
    return undefined
  }

  return domain
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function field(
  key: string,
  value: string,
  confidence: number,
  source: RfqIntakeSource,
): RfqExtractedField {
  return {
    key,
    value,
    confidence,
    source,
    reviewed: false,
  }
}

function dedupeFields(fields: RfqExtractedField[]): RfqExtractedField[] {
  const seen = new Set<string>()
  const unique: RfqExtractedField[] = []

  for (const item of fields) {
    const fingerprint = `${item.key}:${item.value.toLowerCase()}`
    if (!seen.has(fingerprint)) {
      seen.add(fingerprint)
      unique.push(item)
    }
  }

  return unique
}

function summarize(subject: string, bodyText?: string): string | undefined {
  const text = bodyText?.replace(/\s+/g, " ").trim()
  if (!text) {
    return subject.trim()
  }

  return text.length > 180 ? `${text.slice(0, 177).trimEnd()}...` : text
}

function buildPartDrafts(input: {
  partNumbers: string[]
  process?: RfqProcessKey
  materialText?: string
  quantities: number[]
  dimensions?: RfqPartDraft["dimensions"]
  attachments: RfqAttachmentDraft[]
}): RfqPartDraft[] {
  const partNumbers = input.partNumbers.length > 0 ? input.partNumbers : inferPartNumbersFromAttachments(input.attachments)
  const primaryQuantity = input.quantities[0]
  const attachmentNames = input.attachments
    .filter((attachment) => attachment.kind === "cad" || attachment.kind === "drawing")
    .map((attachment) => attachment.fileName)

  return partNumbers.map((partNumber) => ({
    partNumber,
    process: input.process,
    materialText: input.materialText,
    quantity: primaryQuantity,
    dimensions: input.dimensions,
    attachmentNames,
  }))
}

function inferPartNumbersFromAttachments(attachments: RfqAttachmentDraft[]): string[] {
  const names = attachments
    .filter((attachment) => attachment.kind === "cad" || attachment.kind === "drawing")
    .map((attachment) => attachment.fileName.replace(/\.[^.]+$/, ""))
    .filter(Boolean)

  return [...new Set(names)]
}
