import { findCategory, findQuestion } from './catalog.js'
import { t, ui } from './i18n.js'
import { recommendationsFor } from './next-steps.js'
import { findLevel } from './scoring.js'
import type {
  AnswerSet,
  AssessmentContext,
  AssessmentResult,
  Catalog,
  Locale,
  NextStep,
} from './types.js'

/**
 * Report rendering lives in `core` so the CLI export and the web download are
 * byte-for-byte the same document. [UX] The wording is deliberately
 * non-judgemental: the report states where a team is and what to do next, and
 * it never calls a system immature.
 */

export interface ReportOptions {
  locale: Locale
  /** Notes are included in local exports, never in share links. */
  answers?: AnswerSet
  stepsPerCategory?: number
}

function effortLabel(step: NextStep, locale: Locale): string {
  const key = step.effort === 'S' ? 'effortS' : step.effort === 'M' ? 'effortM' : 'effortL'
  return ui(key, locale)
}

function formatScore(score: number | null, locale: Locale): string {
  if (score === null) return ui('notAnswered', locale)
  return locale === 'de' ? score.toFixed(2).replace('.', ',') : score.toFixed(2)
}

/** Ten-cell bar, safe in any monospace terminal and in Markdown. */
export function scoreBar(score: number | null, width = 10): string {
  if (score === null) return '·'.repeat(width)
  const filled = Math.max(0, Math.min(width, Math.round(((score - 1) / 4) * width)))
  return '█'.repeat(filled) + '░'.repeat(width - filled)
}

export function renderMarkdownReport(
  catalog: Catalog,
  result: AssessmentResult,
  options: ReportOptions,
): string {
  const { locale, answers, stepsPerCategory = 3 } = options
  const lines: string[] = []
  const overallLevel = findLevel(catalog, result.overall.level)

  lines.push(`# ${ui('reportTitle', locale)} — ${t(catalog.name, locale)}`)
  lines.push('')
  lines.push(`${ui('generatedAt', locale)}: ${result.completedAt}`)
  lines.push(`${ui('catalogLabel', locale)}: ${catalog.id}@${catalog.version}`)
  lines.push(`${ui('completion', locale)}: ${result.overall.answered}/${result.overall.total}`)
  lines.push('')
  lines.push(`## ${ui('overallScore', locale)}`)
  lines.push('')
  lines.push(
    `**${formatScore(result.overall.score, locale)} / ${formatScore(5, locale)}** — ${ui('level', locale)} ${
      result.overall.level ?? '–'
    }: ${overallLevel ? t(overallLevel.name, locale) : ui('notAnswered', locale)}`,
  )
  if (overallLevel) {
    lines.push('')
    lines.push(t(overallLevel.summary, locale))
  }
  lines.push('')
  lines.push(`## ${ui('category', locale)}`)
  lines.push('')
  lines.push(
    `| ${ui('category', locale)} | ${ui('score', locale)} | ${ui('level', locale)} | ${ui(
      'completion',
      locale,
    )} |`,
  )
  lines.push('| --- | --- | --- | --- |')
  for (const categoryResult of result.categories) {
    const category = findCategory(catalog, categoryResult.categoryId)
    const level = findLevel(catalog, categoryResult.level)
    lines.push(
      `| ${category ? t(category.name, locale) : categoryResult.categoryId} | \`${scoreBar(
        categoryResult.score,
      )}\` ${formatScore(categoryResult.score, locale)} | ${
        level ? `${categoryResult.level} · ${t(level.name, locale)}` : '–'
      } | ${categoryResult.answered}/${categoryResult.total} |`,
    )
  }

  lines.push('')
  lines.push(`## ${ui('nextSteps', locale)}`)
  for (const recommendation of recommendationsFor(catalog, result, stepsPerCategory)) {
    const category = findCategory(catalog, recommendation.categoryId)
    lines.push('')
    lines.push(`### ${category ? t(category.name, locale) : recommendation.categoryId}`)
    lines.push('')
    recommendation.steps.forEach((step, index) => {
      lines.push(
        `${index + 1}. **${t(step.title, locale)}** _(${ui('effort', locale)}: ${effortLabel(
          step,
          locale,
        )})_`,
      )
      lines.push(`   ${t(step.detail, locale)}`)
    })
  }

  const notes = answers
    ? Object.values(answers).filter((answer) => answer.note && answer.note.trim() !== '')
    : []
  if (notes.length > 0) {
    lines.push('')
    lines.push(`## ${ui('notes', locale)}`)
    lines.push('')
    for (const answer of notes) {
      const question = findQuestion(catalog, answer.questionId)
      lines.push(`- **${question ? t(question.prompt, locale) : answer.questionId}**`)
      lines.push(`  ${answer.note?.trim()}`)
    }
  }

  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push(ui('encouragement', locale))
  lines.push('')
  lines.push(ui('scoringNote', locale))
  lines.push('')

  return lines.join('\n')
}

export interface JsonExport {
  tool: string
  toolVersion: string
  locale: Locale
  result: AssessmentResult
  answers: AnswerSet
  /**
   * Coarse team context, when the user provided it. Stored so a later run can
   * pre-fill it, and so an export can be turned into a benchmark submission
   * without asking the same questions again.
   */
  context?: AssessmentContext
}

/**
 * [PM] The JSON export is the poor man's persistence layer: re-running the
 * check next quarter and diffing two files gives a team its trend line without
 * anybody having to operate a database.
 */
export function toJsonExport(
  result: AssessmentResult,
  answers: AnswerSet,
  locale: Locale,
  toolVersion: string,
  context?: AssessmentContext,
): JsonExport {
  const exported: JsonExport = {
    tool: 'vantra-maturity-check',
    toolVersion,
    locale,
    result,
    answers,
  }
  if (context) exported.context = context
  return exported
}
