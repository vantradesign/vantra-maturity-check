import type { AssessmentResult, Catalog, LevelNumber, NextStep } from './types.js'

export interface CategoryRecommendation {
  categoryId: string
  level: LevelNumber | null
  steps: NextStep[]
}

/**
 * [UX] A score without a next action is a judgement, not help. Every category
 * therefore always resolves to at least three concrete steps — including the
 * "not answered yet" case, where we hand back the level-1 starter steps.
 */
export function stepsFor(
  catalog: Catalog,
  categoryId: string,
  level: LevelNumber | null,
  limit = 3,
): NextStep[] {
  const perLevel = catalog.nextSteps[categoryId]
  if (!perLevel) return []
  const steps = perLevel[String(level ?? 1)] ?? []
  return steps.slice(0, limit)
}

export function recommendationsFor(
  catalog: Catalog,
  result: AssessmentResult,
  limit = 3,
): CategoryRecommendation[] {
  return result.categories.map((category) => ({
    categoryId: category.categoryId,
    level: category.level,
    steps: stepsFor(catalog, category.categoryId, category.level, limit),
  }))
}

/**
 * [PM] Where to start on Monday: the weakest scored category first, ties broken
 * by catalog order so the output is deterministic.
 */
export function weakestCategories(result: AssessmentResult, limit = 2): string[] {
  return result.categories
    .filter((category) => category.score !== null)
    .map((category, index) => ({ ...category, index }))
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0) || a.index - b.index)
    .slice(0, limit)
    .map((category) => category.categoryId)
}
