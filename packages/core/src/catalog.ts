import { designSystemCatalog } from './catalogs/design-system-v1/index.js'
import { assertValidCatalog } from './validate.js'
import type { AnswerSet, Catalog, Category, Question } from './types.js'

/** The catalogs bundled with the tool, keyed by id. */
export const builtinCatalogs: Record<string, Catalog> = {
  [designSystemCatalog.id]: designSystemCatalog,
}

export const DEFAULT_CATALOG_ID = designSystemCatalog.id

export function getCatalog(id: string = DEFAULT_CATALOG_ID): Catalog {
  const catalog = builtinCatalogs[id]
  if (!catalog) {
    const available = Object.keys(builtinCatalogs).join(', ')
    throw new Error(`Unknown catalog "${id}". Available: ${available}`)
  }
  return catalog
}

/**
 * Load a community-contributed catalog from parsed JSON/YAML.
 * [IA] This is the extension point that keeps new question sets out of the code.
 */
export function loadCatalog(input: unknown): Catalog {
  assertValidCatalog(input)
  return input
}

export function allQuestions(catalog: Catalog): Question[] {
  return catalog.categories.flatMap((category) => category.questions)
}

export function findQuestion(catalog: Catalog, questionId: string): Question | undefined {
  return allQuestions(catalog).find((question) => question.id === questionId)
}

export function findCategory(catalog: Catalog, categoryId: string): Category | undefined {
  return catalog.categories.find((category) => category.id === categoryId)
}

export function totalQuestions(catalog: Catalog): number {
  return allQuestions(catalog).length
}

/** Drops answers the catalog does not know — used when restoring saved state. */
export function sanitiseAnswers(catalog: Catalog, answers: AnswerSet): AnswerSet {
  const clean: AnswerSet = {}
  for (const question of allQuestions(catalog)) {
    const answer = answers[question.id]
    if (!answer) continue
    if (!question.options.some((option) => option.id === answer.optionId)) continue
    clean[question.id] = answer
  }
  return clean
}
