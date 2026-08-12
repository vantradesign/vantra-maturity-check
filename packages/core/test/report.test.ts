import { describe, expect, it } from 'vitest'
import { getCatalog } from '../src/catalog.js'
import { renderMarkdownReport, scoreBar, toJsonExport } from '../src/report.js'
import { recommendationsFor, stepsFor, weakestCategories } from '../src/next-steps.js'
import { scoreAssessment } from '../src/scoring.js'
import { resolveLocale, t, ui } from '../src/i18n.js'
import { answerAll, answerCategory } from './helpers.js'

const catalog = getCatalog()
const AT = '2026-01-01T00:00:00.000Z'

describe('scoreBar', () => {
  it('renders an empty bar for an unanswered category', () => {
    expect(scoreBar(null)).toBe('··········')
  })

  it('renders proportionally between 1 and 5', () => {
    expect(scoreBar(1)).toBe('░░░░░░░░░░')
    expect(scoreBar(3)).toBe('█████░░░░░')
    expect(scoreBar(5)).toBe('██████████')
  })
})

describe('renderMarkdownReport', () => {
  const result = scoreAssessment(catalog, answerAll(catalog, 2), { completedAt: AT })

  it('renders a complete English report', () => {
    const markdown = renderMarkdownReport(catalog, result, { locale: 'en' })
    expect(markdown).toContain('# Maturity report')
    expect(markdown).toContain('Next steps')
    expect(markdown).toContain('2.00 / 5.00')
    for (const category of catalog.categories) {
      expect(markdown).toContain(category.name.en)
    }
  })

  it('renders a complete German report with a decimal comma', () => {
    const markdown = renderMarkdownReport(catalog, result, { locale: 'de' })
    expect(markdown).toContain('Nächste Schritte')
    expect(markdown).toContain('2,00 / 5,00')
  })

  it('includes notes only when they were provided', () => {
    const answers = answerAll(catalog, 3)
    answers['doc-01'] = {
      questionId: 'doc-01',
      optionId: answers['doc-01']!.optionId,
      note: 'Storybook is hosted internally.',
    }
    const scored = scoreAssessment(catalog, answers, { completedAt: AT })
    const withNotes = renderMarkdownReport(catalog, scored, { locale: 'en', answers })
    expect(withNotes).toContain('Your notes')
    expect(withNotes).toContain('Storybook is hosted internally.')
    expect(renderMarkdownReport(catalog, scored, { locale: 'en' })).not.toContain('Your notes')
  })

  it('stays constructive when nothing was answered', () => {
    const empty = scoreAssessment(catalog, {}, { completedAt: AT })
    const markdown = renderMarkdownReport(catalog, empty, { locale: 'en' })
    expect(markdown).toContain('not answered')
    expect(markdown.toLowerCase()).not.toContain('immature')
    expect(markdown).toContain('Next steps')
  })
})

describe('next steps', () => {
  it('always returns three prioritised steps per category', () => {
    const result = scoreAssessment(catalog, answerAll(catalog, 4), { completedAt: AT })
    const recommendations = recommendationsFor(catalog, result)
    expect(recommendations).toHaveLength(4)
    expect(recommendations.every((entry) => entry.steps.length === 3)).toBe(true)
  })

  it('falls back to level-1 steps when a category is unanswered', () => {
    expect(stepsFor(catalog, 'documentation', null)[0]?.id).toBe('doc-l1-template')
  })

  it('returns nothing for an unknown category', () => {
    expect(stepsFor(catalog, 'nope', 3)).toEqual([])
  })

  it('names the weakest categories first', () => {
    const answers = { ...answerAll(catalog, 4), ...answerCategory(catalog, 'governance', 1) }
    const result = scoreAssessment(catalog, answers, { completedAt: AT })
    expect(weakestCategories(result, 1)).toEqual(['governance'])
  })
})

describe('i18n helpers', () => {
  it('resolves regional tags onto supported locales', () => {
    expect(resolveLocale('de-DE')).toBe('de')
    expect(resolveLocale('en_GB')).toBe('en')
    expect(resolveLocale('fr-FR')).toBe('en')
    expect(resolveLocale(undefined)).toBe('en')
  })

  it('falls back to the default locale for a missing translation', () => {
    expect(t({ en: 'only english' } as never, 'de')).toBe('only english')
    expect(t(undefined, 'en')).toBe('')
  })

  it('exposes engine ui strings in both locales', () => {
    expect(ui('nextSteps', 'de')).toBe('Nächste Schritte')
    expect(ui('nextSteps', 'en')).toBe('Next steps')
  })
})

describe('toJsonExport', () => {
  it('wraps result and answers with tool metadata', () => {
    const answers = answerAll(catalog, 5)
    const result = scoreAssessment(catalog, answers, { completedAt: AT })
    const exported = toJsonExport(result, answers, 'de', '0.1.0')
    expect(exported.tool).toBe('vantra-maturity-check')
    expect(exported.toolVersion).toBe('0.1.0')
    expect(exported.locale).toBe('de')
    expect(exported.result.overall.score).toBe(5)
    expect(Object.keys(exported.answers)).toHaveLength(24)
  })
})
