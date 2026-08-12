import type {
  Answer,
  AnswerSet,
  AssessmentResult,
  Catalog,
  Category,
  CategoryResult,
  LevelNumber,
  MaturityLevel,
  Question,
} from './types.js'

/**
 * The whole scoring model in one place — deliberately small and pure.
 *
 * [IA] Formula (also documented verbatim in SCORING.md):
 *   category score = Σ(weight_q × points_q) / Σ(weight_q)  over answered q
 *   overall score  = arithmetic mean of the category scores that have answers
 *
 * The overall score treats the four dimensions as equally important on
 * purpose. Weighting it by question count would let the category with the most
 * questions quietly dominate the headline number, which is not a claim the
 * model makes.
 */

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/** Highest level whose `minScore` the score reaches. */
export function levelForScore(levels: MaturityLevel[], score: number | null): LevelNumber | null {
  if (score === null) return null
  const sorted = [...levels].sort((a, b) => a.minScore - b.minScore)
  let match: LevelNumber | null = sorted[0]?.level ?? null
  for (const level of sorted) {
    if (score >= level.minScore) match = level.level
  }
  return match
}

export function findLevel(catalog: Catalog, level: LevelNumber | null): MaturityLevel | undefined {
  if (level === null) return undefined
  return catalog.levels.find((entry) => entry.level === level)
}

function pointsFor(question: Question, answer: Answer | undefined): number | null {
  if (!answer) return null
  const option = question.options.find((candidate) => candidate.id === answer.optionId)
  return option ? option.score : null
}

export function scoreCategory(
  category: Category,
  answers: AnswerSet,
): Omit<CategoryResult, 'level'> {
  let weightedPoints = 0
  let weightSum = 0
  let answered = 0

  for (const question of category.questions) {
    const points = pointsFor(question, answers[question.id])
    if (points === null) continue
    weightedPoints += question.weight * points
    weightSum += question.weight
    answered += 1
  }

  const total = category.questions.length
  return {
    categoryId: category.id,
    score: weightSum === 0 ? null : round2(weightedPoints / weightSum),
    answered,
    total,
    completion: total === 0 ? 0 : round2(answered / total),
  }
}

export interface ScoreOptions {
  /** Injected so results are reproducible in tests and in snapshot diffs. */
  completedAt?: string
}

export function scoreAssessment(
  catalog: Catalog,
  answers: AnswerSet,
  options: ScoreOptions = {},
): AssessmentResult {
  const categories: CategoryResult[] = catalog.categories.map((category) => {
    const partial = scoreCategory(category, answers)
    return { ...partial, level: levelForScore(catalog.levels, partial.score) }
  })

  const scored = categories.filter((category) => category.score !== null)
  const overallScore =
    scored.length === 0
      ? null
      : round2(scored.reduce((sum, category) => sum + (category.score ?? 0), 0) / scored.length)

  const answered = categories.reduce((sum, category) => sum + category.answered, 0)
  const total = categories.reduce((sum, category) => sum + category.total, 0)

  return {
    catalogId: catalog.id,
    catalogVersion: catalog.version,
    completedAt: options.completedAt ?? new Date().toISOString(),
    overall: {
      score: overallScore,
      level: levelForScore(catalog.levels, overallScore),
      answered,
      total,
      completion: total === 0 ? 0 : round2(answered / total),
    },
    categories,
  }
}

/**
 * [UX] Running score after each category, so the CLI and the web app can offer
 * "show me where we stand so far" without duplicating the maths.
 */
export function partialScore(catalog: Catalog, answers: AnswerSet): number | null {
  return scoreAssessment(catalog, answers, { completedAt: '1970-01-01T00:00:00.000Z' }).overall
    .score
}
