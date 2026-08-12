import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CATALOG_ID,
  allQuestions,
  findCategory,
  findQuestion,
  getCatalog,
  loadCatalog,
  sanitiseAnswers,
  totalQuestions,
} from '../src/catalog.js'
import { LOCALES } from '../src/types.js'
import { validateCatalog } from '../src/validate.js'

const catalog = getCatalog()

describe('bundled design-system catalog', () => {
  it('passes its own validation without a single issue', () => {
    expect(validateCatalog(catalog)).toEqual([])
  })

  it('covers exactly the four in-scope dimensions', () => {
    expect(catalog.categories.map((category) => category.id)).toEqual([
      'documentation',
      'versioning',
      'governance',
      'adoption',
    ])
  })

  it('has no placeholder content in any locale', () => {
    const serialised = JSON.stringify(catalog).toLowerCase()
    for (const forbidden of ['lorem', 'ipsum', 'tbd', 'todo', 'placeholder']) {
      expect(serialised).not.toContain(forbidden)
    }
  })

  it('translates every question and option into every declared locale', () => {
    for (const question of allQuestions(catalog)) {
      for (const locale of LOCALES) {
        expect(question.prompt[locale]?.length ?? 0).toBeGreaterThan(0)
        expect(question.help[locale]?.length ?? 0).toBeGreaterThan(0)
        for (const option of question.options) {
          expect(option.label[locale]?.length ?? 0).toBeGreaterThan(0)
        }
      }
    }
  })

  it('offers at least three next steps for every category and level', () => {
    for (const category of catalog.categories) {
      for (const level of [1, 2, 3, 4, 5]) {
        const steps = catalog.nextSteps[category.id]?.[String(level)] ?? []
        expect(steps.length).toBeGreaterThanOrEqual(3)
        for (const step of steps) {
          for (const locale of LOCALES) {
            expect(step.title[locale]?.length ?? 0).toBeGreaterThan(0)
            expect(step.detail[locale]?.length ?? 0).toBeGreaterThan(0)
          }
        }
      }
    }
  })

  it('keeps question ids globally unique', () => {
    const ids = allQuestions(catalog).map((question) => question.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('exposes 24 questions in total', () => {
    expect(totalQuestions(catalog)).toBe(24)
  })
})

describe('catalog lookup helpers', () => {
  it('resolves the default catalog by id', () => {
    expect(getCatalog(DEFAULT_CATALOG_ID).id).toBe('design-system')
  })

  it('throws a helpful error for an unknown catalog', () => {
    expect(() => getCatalog('api-governance')).toThrow(/Unknown catalog/)
  })

  it('finds questions and categories by id', () => {
    expect(findQuestion(catalog, 'gov-01')?.categoryId).toBe('governance')
    expect(findCategory(catalog, 'adoption')?.questions.length).toBe(6)
    expect(findQuestion(catalog, 'nope-99')).toBeUndefined()
  })

  it('accepts a valid catalog through loadCatalog', () => {
    expect(loadCatalog(structuredClone(catalog)).id).toBe(catalog.id)
  })

  it('rejects an invalid catalog with a readable message', () => {
    expect(() => loadCatalog({ schemaVersion: 2 })).toThrow(/Invalid catalog/)
  })
})

describe('sanitiseAnswers', () => {
  it('drops unknown questions and unknown options', () => {
    const clean = sanitiseAnswers(catalog, {
      'doc-01': { questionId: 'doc-01', optionId: 'all' },
      'doc-02': { questionId: 'doc-02', optionId: 'does-not-exist' },
      'ghost-01': { questionId: 'ghost-01', optionId: 'all' },
    })
    expect(Object.keys(clean)).toEqual(['doc-01'])
  })
})
