import { describe, expect, it } from 'vitest'
import { getCatalog } from '../src/catalog.js'
import { scoreAssessment } from '../src/scoring.js'
import {
  BENCHMARK_CONSENT,
  BENCHMARK_PAYLOAD_VERSION,
  toBenchmarkSubmission,
} from '../src/benchmark.js'
import { LOCALES, type AnswerSet, type AssessmentContext } from '../src/types.js'
import { answerAll } from './helpers.js'

const catalog = getCatalog()
const AT = '2026-02-02T09:00:00.000Z'

/** Every string anywhere in the payload, however deeply nested. */
function collectStrings(value: unknown, found: string[] = []): string[] {
  if (typeof value === 'string') found.push(value)
  else if (Array.isArray(value)) for (const item of value) collectStrings(item, found)
  else if (value && typeof value === 'object') {
    for (const [key, nested] of Object.entries(value)) {
      found.push(key)
      collectStrings(nested, found)
    }
  }
  return found
}

describe('toBenchmarkSubmission', () => {
  it('carries the scores, not the chosen option ids', () => {
    const answers = answerAll(catalog, 4)
    const result = scoreAssessment(catalog, answers, { completedAt: AT })
    const submission = toBenchmarkSubmission(catalog, result, answers)

    expect(submission.v).toBe(BENCHMARK_PAYLOAD_VERSION)
    expect(submission.catalogId).toBe(catalog.id)
    expect(submission.catalogVersion).toBe(catalog.version)
    expect(Object.keys(submission.scores)).toHaveLength(24)
    expect(new Set(Object.values(submission.scores))).toEqual(new Set([4]))
    expect(submission.overall.score).toBe(4)
    expect(submission.overall.answered).toBe(24)
    expect(submission.categories).toHaveLength(4)
  })

  it('reduces the timestamp to a month, because a full one is a fingerprint', () => {
    const answers = answerAll(catalog, 3)
    const result = scoreAssessment(catalog, answers, { completedAt: AT })
    const submission = toBenchmarkSubmission(catalog, result, answers)

    expect(submission.period).toBe('2026-02')
    expect(JSON.stringify(submission)).not.toContain('09:00:00')
  })

  /**
   * The load-bearing test of this module. If it ever fails, the privacy promise
   * in BENCHMARK_CONSENT has become a lie.
   */
  it('cannot carry a free-text note', () => {
    const answers = answerAll(catalog, 2)
    const secrets: string[] = []
    for (const [index, questionId] of Object.keys(answers).entries()) {
      const secret = `SECRET-NOTE-${index}-acme-internal-roadmap`
      secrets.push(secret)
      answers[questionId] = { ...answers[questionId]!, note: secret }
    }

    const result = scoreAssessment(catalog, answers, { completedAt: AT })
    const serialised = JSON.stringify(toBenchmarkSubmission(catalog, result, answers))

    for (const secret of secrets) expect(serialised).not.toContain(secret)
    expect(serialised).not.toContain('SECRET-NOTE')
    expect(serialised).not.toContain('note')
  })

  it('contains nothing but known ids, bands and structural keys', () => {
    const answers = answerAll(catalog, 5)
    const result = scoreAssessment(catalog, answers, { completedAt: AT })
    const submission = toBenchmarkSubmission(catalog, result, answers, {
      teamSize: '3-5',
      consumers: '11-25',
      systemAge: 'over-5',
    })

    const questionIds = catalog.categories.flatMap((category) =>
      category.questions.map((question) => question.id),
    )
    const allowed = new Set<string>([
      ...questionIds,
      ...catalog.categories.map((category) => category.id),
      catalog.id,
      catalog.version,
      '2026-02',
      '3-5',
      '11-25',
      'over-5',
      // Structural keys of the payload itself.
      'v',
      'catalogId',
      'catalogVersion',
      'period',
      'scores',
      'overall',
      'score',
      'level',
      'answered',
      'total',
      'categories',
      'id',
      'context',
      'teamSize',
      'consumers',
      'systemAge',
    ])

    const unexpected = collectStrings(submission).filter((value) => !allowed.has(value))
    expect(unexpected).toEqual([])
  })

  it('drops answers whose option the catalog no longer knows', () => {
    const answers: AnswerSet = answerAll(catalog, 3)
    const firstId = Object.keys(answers)[0]!
    answers[firstId] = { questionId: firstId, optionId: 'option-removed-in-v2' }

    const result = scoreAssessment(catalog, answers, { completedAt: AT })
    const submission = toBenchmarkSubmission(catalog, result, answers)

    expect(submission.scores[firstId]).toBeUndefined()
    expect(Object.keys(submission.scores)).toHaveLength(23)
  })

  it('omits unanswered questions instead of scoring them zero', () => {
    const answers = answerAll(catalog, 3)
    const ids = Object.keys(answers)
    delete answers[ids[0]!]
    delete answers[ids[1]!]

    const result = scoreAssessment(catalog, answers, { completedAt: AT })
    const submission = toBenchmarkSubmission(catalog, result, answers)

    expect(Object.keys(submission.scores)).toHaveLength(22)
    expect(submission.overall.answered).toBe(22)
    expect(submission.overall.total).toBe(24)
  })
})

describe('context sanitising', () => {
  const answers = answerAll(catalog, 3)
  const result = scoreAssessment(catalog, answers, { completedAt: AT })

  it('omits the context entirely when none was given', () => {
    expect(toBenchmarkSubmission(catalog, result, answers).context).toBeUndefined()
  })

  it('keeps recognised bands', () => {
    const submission = toBenchmarkSubmission(catalog, result, answers, {
      teamSize: 'none',
      consumers: '1-2',
      systemAge: 'under-1',
    })
    expect(submission.context).toEqual({
      teamSize: 'none',
      consumers: '1-2',
      systemAge: 'under-1',
    })
  })

  it('drops values that are not a known band', () => {
    // The shape a hand-edited export or a future UI bug could produce.
    const hostile = {
      teamSize: 'Acme Corp, Berlin office',
      consumers: '3-5',
      systemAge: { toString: () => 'nice try' },
    } as unknown as AssessmentContext

    const submission = toBenchmarkSubmission(catalog, result, answers, hostile)

    expect(submission.context).toEqual({ consumers: '3-5' })
    expect(JSON.stringify(submission)).not.toContain('Acme')
  })

  it('omits the context when every field was rejected', () => {
    const submission = toBenchmarkSubmission(catalog, result, answers, {
      teamSize: 'enormous',
    } as unknown as AssessmentContext)
    expect(submission.context).toBeUndefined()
  })
})

describe('consent copy', () => {
  it('exists in every supported locale', () => {
    for (const text of Object.values(BENCHMARK_CONSENT)) {
      for (const locale of LOCALES) {
        expect(text[locale]?.length ?? 0).toBeGreaterThan(0)
      }
    }
  })

  it('states both what is sent and what is not', () => {
    expect(BENCHMARK_CONSENT.whatIsSent).toBeDefined()
    expect(BENCHMARK_CONSENT.whatIsNotSent!.en).toContain('notes')
    expect(BENCHMARK_CONSENT.whatIsNotSent!.de).toContain('Notizen')
  })
})
