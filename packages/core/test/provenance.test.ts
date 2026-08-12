import { describe, expect, it } from 'vitest'
import { allQuestions, getCatalog } from '../src/catalog.js'
import { stepsFor } from '../src/next-steps.js'
import { validateCatalog } from '../src/validate.js'
import { LOCALES } from '../src/types.js'

/**
 * Content rules that a reviewer would otherwise have to remember.
 *
 * [Product] The questions are the product; the CLI and the web app are just
 * renderers. These tests encode the editorial standards from CONTRIBUTING.md
 * so that a well-meaning pull request cannot quietly lower them.
 */

const catalog = getCatalog()

describe('question provenance', () => {
  it('declares a bibliography', () => {
    expect(catalog.sources?.length ?? 0).toBeGreaterThan(0)
    for (const source of catalog.sources ?? []) {
      expect(source.name.trim()).not.toBe('')
      expect(source.publisher.trim()).not.toBe('')
    }
  })

  it('cites at least one source per question', () => {
    const uncited = allQuestions(catalog)
      .filter((question) => (question.sources?.length ?? 0) === 0)
      .map((question) => question.id)

    expect(uncited).toEqual([])
  })

  it('names the criterion each citation refers to', () => {
    const vague = allQuestions(catalog)
      .flatMap((question) => (question.sources ?? []).map((source) => ({ question, source })))
      .filter(({ source }) => !source.criterion || source.criterion.trim() === '')
      .map(({ question, source }) => `${question.id} -> ${source.ref}`)

    expect(vague).toEqual([])
  })

  it('rejects a citation that points at an undeclared source', () => {
    const broken = structuredClone(catalog)
    broken.categories[0]!.questions[0]!.sources = [{ ref: 'made-up-model' }]

    const issues = validateCatalog(broken)
    expect(issues.some((issue) => issue.message.includes('made-up-model'))).toBe(true)
  })

  it('rejects two sources sharing an id', () => {
    const broken = structuredClone(catalog)
    broken.sources = [
      { id: 'same', name: 'One', publisher: 'A' },
      { id: 'same', name: 'Two', publisher: 'B' },
    ]

    const issues = validateCatalog(broken)
    expect(issues.some((issue) => issue.message.includes('duplicate source id'))).toBe(true)
  })
})

describe('next-step level appropriateness', () => {
  /**
   * A team at level 1 or 2 has no mandate, no budget and no headcount. A step
   * that starts with hiring or executive sponsorship is not actionable for
   * them — it is an excuse to do nothing. See CONTRIBUTING.md.
   */
  const OUT_OF_REACH = [
    /\bhire\b/i,
    /\bheadcount\b/i,
    /\bexecutive (buy-?in|sponsor)/i,
    /\bbudget approval\b/i,
    /\breorganis[ez]\b/i,
  ]

  it('keeps early-level steps within a team\u2019s own reach', () => {
    const offenders: string[] = []

    for (const category of catalog.categories) {
      for (const level of [1, 2] as const) {
        for (const step of stepsFor(catalog, category.id, level, Number.MAX_SAFE_INTEGER)) {
          const text = `${step.title.en} ${step.detail.en}`
          if (OUT_OF_REACH.some((pattern) => pattern.test(text))) {
            offenders.push(`${category.id} L${level}: ${step.id}`)
          }
        }
      }
    }

    expect(offenders).toEqual([])
  })

  it('does not ask a level-1 team for a quarter-sized effort as its first step', () => {
    const heavyFirstSteps = catalog.categories
      .map((category) => ({
        category: category.id,
        first: stepsFor(catalog, category.id, 1)[0],
      }))
      .filter((entry) => entry.first?.effort === 'L')
      .map((entry) => `${entry.category}: ${entry.first!.id}`)

    expect(heavyFirstSteps).toEqual([])
  })

  it('offers three distinct steps for every category and level', () => {
    for (const category of catalog.categories) {
      for (const level of [1, 2, 3, 4, 5] as const) {
        const steps = stepsFor(catalog, category.id, level, Number.MAX_SAFE_INTEGER)
        expect(steps.length).toBeGreaterThanOrEqual(3)
        expect(new Set(steps.map((step) => step.id)).size).toBe(steps.length)
      }
    }
  })
})

describe('translation parity', () => {
  /**
   * Not a translation-quality check — a drift check. A German string that is
   * suspiciously identical to the English one is usually an untranslated
   * placeholder that slipped through.
   */
  it('translates every question prompt rather than copying the English', () => {
    const untranslated = allQuestions(catalog)
      .filter((question) => question.prompt.de === question.prompt.en)
      .map((question) => question.id)

    expect(untranslated).toEqual([])
  })

  it('translates every answer option', () => {
    const untranslated = allQuestions(catalog)
      .flatMap((question) => question.options.map((option) => ({ question, option })))
      .filter(({ option }) => option.label.de === option.label.en)
      .map(({ question, option }) => `${question.id}.${option.id}`)

    expect(untranslated).toEqual([])
  })

  it('keeps every locale non-empty across questions, options and steps', () => {
    for (const question of allQuestions(catalog)) {
      for (const locale of LOCALES) {
        expect(question.prompt[locale]?.trim()).toBeTruthy()
        expect(question.help[locale]?.trim()).toBeTruthy()
      }
    }
    for (const category of catalog.categories) {
      for (const level of [1, 2, 3, 4, 5] as const) {
        for (const step of stepsFor(catalog, category.id, level, Number.MAX_SAFE_INTEGER)) {
          for (const locale of LOCALES) {
            expect(step.title[locale]?.trim()).toBeTruthy()
            expect(step.detail[locale]?.trim()).toBeTruthy()
          }
        }
      }
    }
  })
})
