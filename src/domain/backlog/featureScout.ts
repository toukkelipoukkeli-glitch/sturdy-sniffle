export const FEATURE_SCOUT_VERSION = "feature-scout.v1"

export type FeatureBacklogSource = "operator" | "reviewer" | "customer" | "research" | "system"
export type FeatureBacklogStatus = "new" | "scored" | "planned" | "shipped" | "rejected"
export type FeatureBacklogPriority = "now" | "next" | "later" | "park"

export interface FeatureBacklogInput {
  title: string
  description: string
  source: FeatureBacklogSource
  quoteAccuracyImpact: number
  timeSavedImpact: number
  integrationRisk: number
  reviewability: number
  createdAt: number
  updatedAt?: number
}

export interface FeatureBacklogScore {
  scoreVersion: typeof FEATURE_SCOUT_VERSION
  priorityScore: number
  priority: FeatureBacklogPriority
  rationale: string[]
}

export interface ScoredFeatureBacklogItem extends FeatureBacklogInput {
  status: "scored"
  updatedAt: number
  score: FeatureBacklogScore
}

const weights = {
  quoteAccuracyImpact: 0.35,
  timeSavedImpact: 0.3,
  reviewability: 0.2,
  integrationRisk: 0.15,
}

export function scoreFeatureBacklogItem(input: FeatureBacklogInput): ScoredFeatureBacklogItem {
  const normalized = normalizeFeatureBacklogInput(input)
  const weightedScore =
    normalized.quoteAccuracyImpact * weights.quoteAccuracyImpact +
    normalized.timeSavedImpact * weights.timeSavedImpact +
    normalized.reviewability * weights.reviewability +
    (5 - normalized.integrationRisk) * weights.integrationRisk
  const priorityScore = Math.round((weightedScore / 5) * 100)
  const priority = priorityForScore(priorityScore, normalized.integrationRisk)

  return {
    ...normalized,
    status: "scored",
    score: {
      scoreVersion: FEATURE_SCOUT_VERSION,
      priorityScore,
      priority,
      rationale: buildRationale(normalized, priorityScore, priority),
    },
  }
}

export function rankFeatureBacklogItems(items: FeatureBacklogInput[]): ScoredFeatureBacklogItem[] {
  return items
    .map(scoreFeatureBacklogItem)
    .sort(
      (left, right) =>
        right.score.priorityScore - left.score.priorityScore ||
        left.integrationRisk - right.integrationRisk ||
        left.title.localeCompare(right.title),
    )
}

function normalizeFeatureBacklogInput(input: FeatureBacklogInput): FeatureBacklogInput & { updatedAt: number } {
  const createdAt = timestamp(input.createdAt, "createdAt")
  return {
    title: nonBlank(input.title, "title"),
    description: nonBlank(input.description, "description"),
    source: input.source,
    quoteAccuracyImpact: scoreDimension(input.quoteAccuracyImpact, "quoteAccuracyImpact"),
    timeSavedImpact: scoreDimension(input.timeSavedImpact, "timeSavedImpact"),
    integrationRisk: scoreDimension(input.integrationRisk, "integrationRisk"),
    reviewability: scoreDimension(input.reviewability, "reviewability"),
    createdAt,
    updatedAt: timestamp(input.updatedAt ?? createdAt, "updatedAt"),
  }
}

function priorityForScore(priorityScore: number, integrationRisk: number): FeatureBacklogPriority {
  if (priorityScore >= 80 && integrationRisk <= 3) {
    return "now"
  }
  if (priorityScore >= 60) {
    return "next"
  }
  if (priorityScore >= 40) {
    return "later"
  }
  return "park"
}

function buildRationale(
  item: FeatureBacklogInput,
  priorityScore: number,
  priority: FeatureBacklogPriority,
): string[] {
  const rationale = [
    `Priority ${priority} from score ${priorityScore}.`,
    `Quote accuracy impact ${item.quoteAccuracyImpact}/5 and time saved impact ${item.timeSavedImpact}/5 carry the highest weight.`,
  ]

  if (item.integrationRisk >= 4) {
    rationale.push("High integration risk prevents immediate planning without a smaller proof slice.")
  } else if (item.reviewability >= 4) {
    rationale.push("High reviewability makes this suitable for a small, testable PR slice.")
  }

  return rationale
}

function scoreDimension(value: number, key: string): number {
  if (!Number.isFinite(value) || value < 0 || value > 5) {
    throw new Error(`${key} must be a number from 0 to 5`)
  }
  return value
}

function timestamp(value: number, key: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${key} must be a non-negative integer timestamp`)
  }
  return value
}

function nonBlank(value: string, key: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    throw new Error(`${key} is required`)
  }
  return trimmed
}
