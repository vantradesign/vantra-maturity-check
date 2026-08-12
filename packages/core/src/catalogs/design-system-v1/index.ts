import type { Catalog, Category, NextStep, NextStepsMap, Question } from '../../types.js'
import meta from './meta.json' with { type: 'json' }
import documentationQuestions from './questions/documentation.json' with { type: 'json' }
import versioningQuestions from './questions/versioning.json' with { type: 'json' }
import governanceQuestions from './questions/governance.json' with { type: 'json' }
import adoptionQuestions from './questions/adoption.json' with { type: 'json' }
import documentationSteps from './next-steps/documentation.json' with { type: 'json' }
import versioningSteps from './next-steps/versioning.json' with { type: 'json' }
import governanceSteps from './next-steps/governance.json' with { type: 'json' }
import adoptionSteps from './next-steps/adoption.json' with { type: 'json' }

/**
 * [IA] Content is split one file per category so that a contributor can change
 * the governance questions without ever opening a 900-line JSON blob — and so
 * that a pull request diff stays reviewable. The assembly below is the only
 * code that knows the file layout; `validateCatalog` checks the result.
 */

const questionsByCategory: Record<string, unknown[]> = {
  documentation: documentationQuestions,
  versioning: versioningQuestions,
  governance: governanceQuestions,
  adoption: adoptionQuestions,
}

const stepsByCategory: Record<string, unknown> = {
  documentation: documentationSteps,
  versioning: versioningSteps,
  governance: governanceSteps,
  adoption: adoptionSteps,
}

const categories: Category[] = meta.categories.map((category) => ({
  ...category,
  questions: (questionsByCategory[category.id] ?? []) as unknown as Question[],
})) as unknown as Category[]

const nextSteps: NextStepsMap = Object.fromEntries(
  meta.categories.map((category) => [
    category.id,
    (stepsByCategory[category.id] ?? {}) as Record<string, NextStep[]>,
  ]),
)

export const designSystemCatalog: Catalog = {
  schemaVersion: 1,
  id: meta.id,
  version: meta.version,
  name: meta.name,
  description: meta.description,
  locales: meta.locales,
  levels: meta.levels,
  categories,
  nextSteps,
} as unknown as Catalog
