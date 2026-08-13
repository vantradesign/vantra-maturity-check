import pc from 'picocolors'
import {
  findCategory,
  findLevel,
  recommendationsFor,
  scoreBar,
  t,
  ui,
  type AssessmentResult,
  type Catalog,
  type LevelNumber,
  type Locale,
} from '@vantra-design/maturity-core'

/**
 * [UX] Terminal report. Colour carries no information on its own — every bar is
 * accompanied by the numeric score and the level name, so the output stays
 * readable in a non-colour terminal, in a CI log and for colour-blind readers.
 * `picocolors` was chosen over `chalk` purely for install weight; it also
 * honours NO_COLOR out of the box.
 */

function colourFor(level: LevelNumber | null): (input: string) => string {
  switch (level) {
    case 1:
      return pc.red
    case 2:
      return pc.yellow
    case 3:
      return pc.cyan
    case 4:
      return pc.green
    case 5:
      return pc.magenta
    default:
      return pc.gray
  }
}

export function formatScore(score: number | null, locale: Locale): string {
  if (score === null) return '—'
  return locale === 'de' ? score.toFixed(2).replace('.', ',') : score.toFixed(2)
}

export function renderTerminalReport(
  catalog: Catalog,
  result: AssessmentResult,
  locale: Locale,
): string {
  const lines: string[] = []
  const overallLevel = findLevel(catalog, result.overall.level)
  const paint = colourFor(result.overall.level)

  lines.push('')
  lines.push(pc.bold(`${ui('reportTitle', locale)} · ${t(catalog.name, locale)}`))
  lines.push('')
  lines.push(
    `${ui('overallScore', locale)}: ${paint(
      pc.bold(`${formatScore(result.overall.score, locale)} / ${formatScore(5, locale)}`),
    )}  ${pc.dim(
      `${ui('level', locale)} ${result.overall.level ?? '—'} · ${
        overallLevel ? t(overallLevel.name, locale) : ui('notAnswered', locale)
      }`,
    )}`,
  )
  if (overallLevel) {
    lines.push(pc.dim(t(overallLevel.summary, locale)))
  }
  lines.push('')

  const labelWidth = Math.max(
    ...catalog.categories.map((category) => t(category.name, locale).length),
  )
  for (const categoryResult of result.categories) {
    const category = findCategory(catalog, categoryResult.categoryId)
    const level = findLevel(catalog, categoryResult.level)
    const label = (category ? t(category.name, locale) : categoryResult.categoryId).padEnd(
      labelWidth,
    )
    const bar = colourFor(categoryResult.level)(scoreBar(categoryResult.score))
    lines.push(
      `  ${label}  ${bar}  ${formatScore(categoryResult.score, locale).padStart(5)}  ${pc.dim(
        level
          ? `${ui('level', locale)} ${categoryResult.level} · ${t(level.name, locale)}`
          : ui('notAnswered', locale),
      )}`,
    )
  }

  lines.push('')
  lines.push(pc.bold(ui('nextSteps', locale)))
  for (const recommendation of recommendationsFor(catalog, result)) {
    const category = findCategory(catalog, recommendation.categoryId)
    lines.push('')
    lines.push(`  ${pc.underline(category ? t(category.name, locale) : recommendation.categoryId)}`)
    recommendation.steps.forEach((step, index) => {
      lines.push(`   ${index + 1}. ${t(step.title, locale)} ${pc.dim(`[${step.effort}]`)}`)
      lines.push(`      ${pc.dim(t(step.detail, locale))}`)
    })
  }

  lines.push('')
  lines.push(pc.dim(ui('encouragement', locale)))
  lines.push('')

  return lines.join('\n')
}
