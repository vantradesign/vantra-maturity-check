import { describe, expect, it } from 'vitest'
import { getCatalog } from '../src/catalog.js'
import { decodeAnswers, encodeAnswers } from '../src/share.js'
import { scoreAssessment } from '../src/scoring.js'
import { answerAll } from './helpers.js'

const catalog = getCatalog()

describe('share links', () => {
  it('round-trips a complete answer set', () => {
    const answers = answerAll(catalog, 4)
    const decoded = decodeAnswers(catalog, encodeAnswers(catalog, answers))
    expect(decoded).not.toBeNull()
    expect(Object.keys(decoded!.answers).length).toBe(24)
    expect(decoded!.dropped).toEqual([])
    expect(decoded!.versionMismatch).toBe(false)
  })

  it('reproduces the identical score after a round trip', () => {
    const answers = answerAll(catalog, 3)
    const decoded = decodeAnswers(catalog, encodeAnswers(catalog, answers))!
    const at = '2026-01-01T00:00:00.000Z'
    expect(scoreAssessment(catalog, decoded.answers, { completedAt: at })).toEqual(
      scoreAssessment(catalog, answers, { completedAt: at }),
    )
  })

  it('produces a url-safe payload', () => {
    const encoded = encodeAnswers(catalog, answerAll(catalog, 5))
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('never carries free-text notes into the link', () => {
    const answers = answerAll(catalog, 2)
    answers['doc-01'] = {
      questionId: 'doc-01',
      optionId: answers['doc-01']!.optionId,
      note: 'internal roadmap detail',
    }
    const encoded = encodeAnswers(catalog, answers)
    const decoded = decodeAnswers(catalog, encoded)!
    expect(decoded.answers['doc-01']?.note).toBeUndefined()
    expect(encoded).not.toContain('internal')
  })

  it('drops answers the catalog no longer knows', () => {
    const encoded = encodeAnswers(catalog, {
      'doc-01': { questionId: 'doc-01', optionId: 'all' },
      'doc-02': { questionId: 'doc-02', optionId: 'ghost-option' },
      'ghost-01': { questionId: 'ghost-01', optionId: 'whatever' },
    })
    const decoded = decodeAnswers(catalog, encoded)!
    expect(Object.keys(decoded.answers)).toEqual(['doc-01'])
    expect(decoded.dropped.sort()).toEqual(['doc-02', 'ghost-01'])
  })

  it('flags a payload from a different catalog version', () => {
    const encoded = encodeAnswers({ ...catalog, version: '0.9.0' }, answerAll(catalog, 1))
    expect(decodeAnswers(catalog, encoded)!.versionMismatch).toBe(true)
  })

  it('returns null instead of throwing on corrupt input', () => {
    expect(decodeAnswers(catalog, 'not-base64-json')).toBeNull()
    expect(decodeAnswers(catalog, '')).toBeNull()
  })

  it('rejects a payload for another catalog or another payload version', () => {
    const otherCatalog = encodeAnswers({ ...catalog, id: 'api-governance' }, {})
    expect(decodeAnswers(catalog, otherCatalog)).toBeNull()
  })
})
