import * as p from '@clack/prompts'
import pc from 'picocolors'
import {
  partialScore,
  t,
  ui,
  type AnswerSet,
  type Catalog,
  type Locale,
  type Question,
} from '@vantra/maturity-core'
import { m } from './messages.js'
import { formatScore } from './render.js'

/**
 * [UX] Why @clack/prompts over inquirer:
 *  - it renders a persistent, connected transcript of what has already been
 *    answered, which is exactly the "where am I in this" feedback a 24-question
 *    survey needs;
 *  - cancellation (Ctrl-C) is a first-class, typed signal rather than a thrown
 *    error, so we can exit without writing half a file;
 *  - it is one dependency instead of inquirer's tree.
 * The trade-off is a smaller prompt vocabulary, which this flow does not need.
 */

export interface InteractiveOptions {
  catalog: Catalog
  locale: Locale
  /** Answers restored from a previous run; shown as the pre-selected option. */
  initialAnswers?: AnswerSet
  /** Ask for an optional free-text note after each question. */
  askNotes?: boolean
}

export interface InteractiveResult {
  answers: AnswerSet
  cancelled: boolean
}

function questionLabel(question: Question, locale: Locale, index: number, total: number): string {
  return `${pc.dim(`${m('questionCounter', locale)} ${index}/${total}`)}  ${t(
    question.prompt,
    locale,
  )}`
}

/** Sentinel option id. Prefixed so it can never collide with a catalog id. */
const SKIP = '__skip__'

export async function runInteractive(options: InteractiveOptions): Promise<InteractiveResult> {
  const { catalog, locale, initialAnswers = {}, askNotes = true } = options
  const answers: AnswerSet = { ...initialAnswers }
  const total = catalog.categories.reduce((sum, category) => sum + category.questions.length, 0)
  let index = 0

  for (const [categoryIndex, category] of catalog.categories.entries()) {
    // [UX] Questions arrive one dimension at a time, never as a wall of 24.
    p.note(
      t(category.description, locale),
      `${m('categoryIntro', locale)}: ${t(category.name, locale)}`,
    )

    for (const question of category.questions) {
      index += 1
      const selected = await p.select({
        message: questionLabel(question, locale, index, total),
        options: [
          ...question.options.map((option) => ({
            value: option.id,
            label: t(option.label, locale),
          })),
          { value: SKIP, label: pc.dim(m('skip', locale)) },
        ],
        initialValue: answers[question.id]?.optionId,
      })
      if (p.isCancel(selected)) return { answers, cancelled: true }

      if (selected === SKIP) {
        delete answers[question.id]
        continue
      }

      answers[question.id] = { questionId: question.id, optionId: selected }

      if (askNotes && question.allowNote) {
        const note = await p.text({
          message: m('addNote', locale),
          placeholder: m('notePlaceholder', locale),
          defaultValue: '',
        })
        if (p.isCancel(note)) return { answers, cancelled: true }
        if (typeof note === 'string' && note.trim() !== '') {
          answers[question.id] = { ...answers[question.id]!, note: note.trim() }
        }
      }
    }

    // [UX] Optional running score between dimensions: motivating for teams that
    // want it, invisible for teams that do not.
    const isLast = categoryIndex === catalog.categories.length - 1
    if (!isLast) {
      const show = await p.confirm({ message: m('showPartial', locale), initialValue: false })
      if (p.isCancel(show)) return { answers, cancelled: true }
      if (show) {
        p.note(
          `${formatScore(partialScore(catalog, answers), locale)} / ${formatScore(5, locale)}`,
          `${m('partialScore', locale)} · ${ui('scoringNote', locale)}`,
        )
      }
    }
  }

  return { answers, cancelled: false }
}
