import { describe, expect, it } from 'vitest'
import { getCatalog } from '../src/catalog.js'
import {
  findLevel,
  levelForScore,
  partialScore,
  round2,
  scoreAssessment,
  scoreCategory,
} from '../src/scoring.js'
import type { AnswerSet } from '../src/types.js'
import { answerAll, answerCategory } from './helpers.js'

const catalog = getCatalog()
const AT = '2026-01-01T00:00:00.000Z'

describe('round2', () => {
  it('rounds to two decimals without float noise', () => {
    expect(round2(1.005)).toBe(1.01)
    expect(round2(3.333333)).toBe(3.33)
    expect(round2(4)).toBe(4)
  })
})

describe('levelForScore', () => {
  const bands: Array<[number, number]> = [
    [1, 1],
    [1.49, 1],
    [1.5, 2],
    [2.49, 2],
    [2.5, 3],
    [3.49, 3],
    [3.5, 4],
    [4.49, 4],
    [4.5, 5],
    [5, 5],
  ]

  it.each(bands)('maps %s to level %s', (score, expected) => {
    expect(levelForScore(catalog.levels, score)).toBe(expected)
  })

  it('returns null when there is no score', () => {
    expect(levelForScore(catalog.levels, null)).toBeNull()
    expect(findLevel(catalog, null)).toBeUndefined()
  })

  it('resolves the level object for a level number', () => {
    expect(findLevel(catalog, 5)?.id).toBe('optimising')
  })
})

describe('scoreCategory', () => {
  it('returns null for a category without answers', () => {
    const category = catalog.categories[0]!
    const result = scoreCategory(category, {})
    expect(result.score).toBeNull()
    expect(result.answered).toBe(0)
    expect(result.completion).toBe(0)
  })

  it('is a weighted mean, not a plain mean', () => {
    const category = catalog.categories[0]!
    const [first, second] = [category.questions[0]!, category.questions[1]!]
    // doc-01 has weight 3, doc-02 has weight 2.
    const answers: AnswerSet = {
      [first.id]: {
        questionId: first.id,
        optionId: first.options.find((option) => option.score === 5)!.id,
      },
      [second.id]: {
        questionId: second.id,
        optionId: second.options.find((option) => option.score === 1)!.id,
      },
    }
    const expected = round2((3 * 5 + 2 * 1) / (3 + 2))
    expect(scoreCategory(category, answers).score).toBe(expected)
    expect(expected).not.toBe(3) // the unweighted mean would be 3
  })

  it('ignores answers that point at an unknown option', () => {
    const category = catalog.categories[0]!
    const question = category.questions[0]!
    const result = scoreCategory(category, {
      [question.id]: { questionId: question.id, optionId: 'not-a-real-option' },
    })
    expect(result.score).toBeNull()
  })
})

describe('scoreAssessment', () => {
  it('scores a fully worst-case run as level 1', () => {
    const result = scoreAssessment(catalog, answerAll(catalog, 1), { completedAt: AT })
    expect(result.overall.score).toBe(1)
    expect(result.overall.level).toBe(1)
    expect(result.overall.completion).toBe(1)
    expect(result.overall.answered).toBe(24)
  })

  it('scores a fully best-case run as level 5', () => {
    const result = scoreAssessment(catalog, answerAll(catalog, 5), { completedAt: AT })
    expect(result.overall.score).toBe(5)
    expect(result.overall.level).toBe(5)
    expect(result.categories.every((category) => category.level === 5)).toBe(true)
  })

  it('weights the four categories equally in the overall score', () => {
    // One category at 5, the other three at 1 => (5 + 1 + 1 + 1) / 4 = 2.
    const answers: AnswerSet = {
      ...answerAll(catalog, 1),
      ...answerCategory(catalog, 'documentation', 5),
    }
    const result = scoreAssessment(catalog, answers, { completedAt: AT })
    expect(result.overall.score).toBe(2)
  })

  it('reports an empty run without inventing a score', () => {
    const result = scoreAssessment(catalog, {}, { completedAt: AT })
    expect(result.overall.score).toBeNull()
    expect(result.overall.level).toBeNull()
    expect(result.overall.completion).toBe(0)
    expect(result.categories.every((category) => category.score === null)).toBe(true)
  })

  it('ignores unanswered categories in the overall mean', () => {
    const result = scoreAssessment(catalog, answerCategory(catalog, 'adoption', 4), {
      completedAt: AT,
    })
    expect(result.overall.score).toBe(4)
    expect(result.overall.completion).toBe(0.25)
  })

  it('carries catalog identity and timestamp into the result', () => {
    const result = scoreAssessment(catalog, {}, { completedAt: AT })
    expect(result.catalogId).toBe('design-system')
    expect(result.catalogVersion).toBe(catalog.version)
    expect(result.completedAt).toBe(AT)
  })

  it('defaults the timestamp to now when none is injected', () => {
    const result = scoreAssessment(catalog, {})
    expect(Number.isNaN(Date.parse(result.completedAt))).toBe(false)
  })
})

describe('partialScore', () => {
  it('reports the running score of a half-finished run', () => {
    expect(partialScore(catalog, answerCategory(catalog, 'governance', 3))).toBe(3)
    expect(partialScore(catalog, {})).toBeNull()
  })
})
