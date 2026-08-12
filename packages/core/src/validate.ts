import { LOCALES, type Catalog, type Locale, type ValidationIssue } from './types.js'

/**
 * Hand-rolled validator instead of Ajv.
 *
 * [Engineering] `@vantra/maturity-core` ships with zero runtime dependencies so it can be
 * inlined into a static site without pulling a schema compiler into the client
 * bundle. `schema/catalog.schema.json` stays the normative contract for
 * contributors and editors; this function is the runtime guard that produces
 * readable, path-prefixed messages.
 */

const VALID_WEIGHTS = new Set([1, 2, 3])
const VALID_SCORES = new Set([1, 2, 3, 4, 5])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function checkLocalized(
  value: unknown,
  path: string,
  locales: Locale[],
  issues: ValidationIssue[],
): void {
  if (!isRecord(value)) {
    issues.push({ path, message: 'must be an object with one string per locale' })
    return
  }
  for (const locale of locales) {
    const text = value[locale]
    if (typeof text !== 'string' || text.trim() === '') {
      issues.push({ path: `${path}.${locale}`, message: 'missing or empty translation' })
    }
  }
}

export function validateCatalog(input: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  if (!isRecord(input)) return [{ path: '', message: 'catalog must be an object' }]

  if (input.schemaVersion !== 1) {
    issues.push({ path: 'schemaVersion', message: 'only schema version 1 is supported' })
  }
  for (const key of ['id', 'version'] as const) {
    if (typeof input[key] !== 'string' || (input[key] as string).trim() === '') {
      issues.push({ path: key, message: 'must be a non-empty string' })
    }
  }

  const locales = Array.isArray(input.locales)
    ? input.locales.filter((locale): locale is Locale =>
        (LOCALES as readonly string[]).includes(locale as string),
      )
    : []
  if (locales.length === 0) {
    issues.push({ path: 'locales', message: `must list at least one of: ${LOCALES.join(', ')}` })
  }

  checkLocalized(input.name, 'name', locales, issues)
  checkLocalized(input.description, 'description', locales, issues)

  // Levels ------------------------------------------------------------------
  const levels = Array.isArray(input.levels) ? input.levels : []
  if (levels.length !== 5) {
    issues.push({ path: 'levels', message: 'exactly five maturity levels are required' })
  }
  levels.forEach((level, index) => {
    const path = `levels[${index}]`
    if (!isRecord(level)) {
      issues.push({ path, message: 'must be an object' })
      return
    }
    if (typeof level.level !== 'number' || level.level !== index + 1) {
      issues.push({ path: `${path}.level`, message: `must be ${index + 1} (levels are ordered)` })
    }
    if (typeof level.minScore !== 'number') {
      issues.push({ path: `${path}.minScore`, message: 'must be a number' })
    }
    checkLocalized(level.name, `${path}.name`, locales, issues)
    checkLocalized(level.summary, `${path}.summary`, locales, issues)
  })

  // Categories & questions ---------------------------------------------------
  const categories = Array.isArray(input.categories) ? input.categories : []
  if (categories.length === 0) {
    issues.push({ path: 'categories', message: 'at least one category is required' })
  }
  const questionIds = new Set<string>()
  const categoryIds: string[] = []

  categories.forEach((category, categoryIndex) => {
    const path = `categories[${categoryIndex}]`
    if (!isRecord(category)) {
      issues.push({ path, message: 'must be an object' })
      return
    }
    const categoryId = typeof category.id === 'string' ? category.id : ''
    if (categoryId === '')
      issues.push({ path: `${path}.id`, message: 'must be a non-empty string' })
    if (categoryIds.includes(categoryId)) {
      issues.push({ path: `${path}.id`, message: `duplicate category id "${categoryId}"` })
    }
    categoryIds.push(categoryId)

    checkLocalized(category.name, `${path}.name`, locales, issues)
    checkLocalized(category.description, `${path}.description`, locales, issues)

    const questions = Array.isArray(category.questions) ? category.questions : []
    if (questions.length < 5 || questions.length > 8) {
      issues.push({
        path: `${path}.questions`,
        message: 'a category must hold between 5 and 8 questions to stay answerable in one sitting',
      })
    }

    questions.forEach((question, questionIndex) => {
      const qPath = `${path}.questions[${questionIndex}]`
      if (!isRecord(question)) {
        issues.push({ path: qPath, message: 'must be an object' })
        return
      }
      const questionId = typeof question.id === 'string' ? question.id : ''
      if (questionId === '') {
        issues.push({ path: `${qPath}.id`, message: 'must be a non-empty string' })
      } else if (questionIds.has(questionId)) {
        issues.push({ path: `${qPath}.id`, message: `duplicate question id "${questionId}"` })
      }
      questionIds.add(questionId)

      if (question.categoryId !== categoryId) {
        issues.push({ path: `${qPath}.categoryId`, message: `must equal "${categoryId}"` })
      }
      if (typeof question.weight !== 'number' || !VALID_WEIGHTS.has(question.weight)) {
        issues.push({ path: `${qPath}.weight`, message: 'must be 1, 2 or 3' })
      }
      checkLocalized(question.prompt, `${qPath}.prompt`, locales, issues)
      checkLocalized(question.help, `${qPath}.help`, locales, issues)

      const options = Array.isArray(question.options) ? question.options : []
      if (options.length < 4 || options.length > 5) {
        issues.push({ path: `${qPath}.options`, message: 'must offer 4 or 5 graded options' })
      }
      const seenScores = new Set<number>()
      options.forEach((option, optionIndex) => {
        const oPath = `${qPath}.options[${optionIndex}]`
        if (!isRecord(option)) {
          issues.push({ path: oPath, message: 'must be an object' })
          return
        }
        if (typeof option.id !== 'string' || option.id.trim() === '') {
          issues.push({ path: `${oPath}.id`, message: 'must be a non-empty string' })
        }
        if (typeof option.score !== 'number' || !VALID_SCORES.has(option.score)) {
          issues.push({ path: `${oPath}.score`, message: 'must be an integer from 1 to 5' })
        } else if (seenScores.has(option.score)) {
          issues.push({ path: `${oPath}.score`, message: 'options must have distinct scores' })
        } else {
          seenScores.add(option.score)
        }
        checkLocalized(option.label, `${oPath}.label`, locales, issues)
      })
    })
  })

  // Next steps ---------------------------------------------------------------
  const nextSteps = isRecord(input.nextSteps) ? input.nextSteps : undefined
  if (!nextSteps) {
    issues.push({ path: 'nextSteps', message: 'must be an object keyed by category id' })
  } else {
    for (const categoryId of categoryIds) {
      const perLevel = nextSteps[categoryId]
      if (!isRecord(perLevel)) {
        issues.push({ path: `nextSteps.${categoryId}`, message: 'missing next steps for category' })
        continue
      }
      for (const level of [1, 2, 3, 4, 5]) {
        const steps = perLevel[String(level)]
        const path = `nextSteps.${categoryId}.${level}`
        if (!Array.isArray(steps) || steps.length < 3) {
          issues.push({ path, message: 'at least three prioritised next steps are required' })
          continue
        }
        steps.forEach((step, stepIndex) => {
          const sPath = `${path}[${stepIndex}]`
          if (!isRecord(step)) {
            issues.push({ path: sPath, message: 'must be an object' })
            return
          }
          if (typeof step.id !== 'string' || step.id.trim() === '') {
            issues.push({ path: `${sPath}.id`, message: 'must be a non-empty string' })
          }
          if (!['S', 'M', 'L'].includes(step.effort as string)) {
            issues.push({ path: `${sPath}.effort`, message: 'must be "S", "M" or "L"' })
          }
          checkLocalized(step.title, `${sPath}.title`, locales, issues)
          checkLocalized(step.detail, `${sPath}.detail`, locales, issues)
        })
      }
    }
  }

  return issues
}

export function assertValidCatalog(input: unknown): asserts input is Catalog {
  const issues = validateCatalog(input)
  if (issues.length > 0) {
    const detail = issues
      .slice(0, 10)
      .map((issue) => `  - ${issue.path || '<root>'}: ${issue.message}`)
      .join('\n')
    const more = issues.length > 10 ? `\n  … and ${issues.length - 10} more` : ''
    throw new Error(`Invalid catalog (${issues.length} issue(s)):\n${detail}${more}`)
  }
}

export function isValidCatalog(input: unknown): input is Catalog {
  return validateCatalog(input).length === 0
}
