import { describe, expect, it } from 'vitest'
import { getCatalog } from '../src/catalog.js'
import { assertValidCatalog, isValidCatalog, validateCatalog } from '../src/validate.js'
import type { Catalog } from '../src/types.js'

const base = getCatalog()

function clone(): Catalog {
  return JSON.parse(JSON.stringify(base)) as Catalog
}

function paths(input: unknown): string[] {
  return validateCatalog(input).map((issue) => issue.path)
}

describe('validateCatalog', () => {
  it('accepts the bundled catalog', () => {
    expect(isValidCatalog(base)).toBe(true)
  })

  it('rejects non-objects', () => {
    expect(validateCatalog(null)).toEqual([{ path: '', message: 'catalog must be an object' }])
    expect(validateCatalog([])[0]?.message).toBe('catalog must be an object')
  })

  it('rejects an unsupported schema version', () => {
    const catalog = clone()
    catalog.schemaVersion = 2 as unknown as 1
    expect(paths(catalog)).toContain('schemaVersion')
  })

  it('rejects an empty id or version', () => {
    const catalog = clone()
    catalog.id = ''
    catalog.version = ''
    expect(paths(catalog)).toEqual(expect.arrayContaining(['id', 'version']))
  })

  it('rejects an unknown locale list', () => {
    const catalog = clone()
    catalog.locales = ['fr' as unknown as 'en']
    expect(paths(catalog)).toContain('locales')
  })

  it('reports a missing translation with a precise path', () => {
    const catalog = clone()
    delete (catalog.categories[0]!.questions[0]!.prompt as Record<string, string>).de
    expect(paths(catalog)).toContain('categories[0].questions[0].prompt.de')
  })

  it('requires exactly five ordered levels', () => {
    const catalog = clone()
    catalog.levels = catalog.levels.slice(0, 4)
    expect(paths(catalog)).toContain('levels')

    const reordered = clone()
    ;[reordered.levels[0], reordered.levels[1]] = [reordered.levels[1]!, reordered.levels[0]!]
    expect(paths(reordered)).toContain('levels[0].level')
  })

  it('rejects duplicate question ids', () => {
    const catalog = clone()
    catalog.categories[1]!.questions[0]!.id = catalog.categories[0]!.questions[0]!.id
    expect(paths(catalog)).toContain('categories[1].questions[0].id')
  })

  it('rejects duplicate category ids', () => {
    const catalog = clone()
    catalog.categories[1]!.id = catalog.categories[0]!.id
    expect(paths(catalog)).toContain('categories[1].id')
  })

  it('rejects a category with too few questions', () => {
    const catalog = clone()
    catalog.categories[0]!.questions = catalog.categories[0]!.questions.slice(0, 2)
    expect(paths(catalog)).toContain('categories[0].questions')
  })

  it('rejects an out-of-range weight', () => {
    const catalog = clone()
    catalog.categories[0]!.questions[0]!.weight = 4 as unknown as 3
    expect(paths(catalog)).toContain('categories[0].questions[0].weight')
  })

  it('rejects duplicate option scores inside one question', () => {
    const catalog = clone()
    const question = catalog.categories[0]!.questions[0]!
    question.options[1]!.score = question.options[0]!.score
    expect(paths(catalog)).toContain('categories[0].questions[0].options[1].score')
  })

  it('rejects a question whose categoryId does not match its parent', () => {
    const catalog = clone()
    catalog.categories[0]!.questions[0]!.categoryId = 'somewhere-else'
    expect(paths(catalog)).toContain('categories[0].questions[0].categoryId')
  })

  it('requires three next steps per category and level', () => {
    const catalog = clone()
    catalog.nextSteps.documentation!['3'] = catalog.nextSteps.documentation!['3']!.slice(0, 1)
    expect(paths(catalog)).toContain('nextSteps.documentation.3')
  })

  it('rejects an invalid effort value', () => {
    const catalog = clone()
    catalog.nextSteps.adoption!['1']![0]!.effort = 'XL' as unknown as 'L'
    expect(paths(catalog)).toContain('nextSteps.adoption.1[0].effort')
  })

  it('reports a category without any next steps', () => {
    const catalog = clone()
    delete catalog.nextSteps.governance
    expect(paths(catalog)).toContain('nextSteps.governance')
  })

  it('reports a missing nextSteps object entirely', () => {
    const catalog = clone()
    catalog.nextSteps = undefined as unknown as Catalog['nextSteps']
    expect(paths(catalog)).toContain('nextSteps')
  })

  it('reports a catalog without categories', () => {
    const catalog = clone()
    catalog.categories = []
    expect(paths(catalog)).toContain('categories')
  })
})

describe('assertValidCatalog', () => {
  it('passes silently for a valid catalog', () => {
    expect(() => assertValidCatalog(base)).not.toThrow()
  })

  it('lists the issues it found', () => {
    expect(() => assertValidCatalog({})).toThrow(/Invalid catalog \(9 issue\(s\)\)/)
  })

  it('caps the message at ten issues and counts the rest', () => {
    const catalog = clone()
    catalog.levels = catalog.levels.map((level) => ({ ...level, name: {}, summary: {} })) as never
    expect(() => assertValidCatalog(catalog)).toThrow(/and \d+ more/)
  })
})
