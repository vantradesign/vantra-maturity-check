import { allQuestions } from '../src/catalog.js'
import type { AnswerSet, Catalog, OptionScore } from '../src/types.js'

/** Answer every question with the option worth exactly `score` points. */
export function answerAll(catalog: Catalog, score: OptionScore): AnswerSet {
  const answers: AnswerSet = {}
  for (const question of allQuestions(catalog)) {
    const option = question.options.find((candidate) => candidate.score === score)
    if (!option) throw new Error(`Question ${question.id} has no option worth ${score}`)
    answers[question.id] = { questionId: question.id, optionId: option.id }
  }
  return answers
}

export function answerCategory(
  catalog: Catalog,
  categoryId: string,
  score: OptionScore,
): AnswerSet {
  const answers: AnswerSet = {}
  const category = catalog.categories.find((candidate) => candidate.id === categoryId)
  if (!category) throw new Error(`Unknown category ${categoryId}`)
  for (const question of category.questions) {
    const option = question.options.find((candidate) => candidate.score === score)
    if (!option) throw new Error(`Question ${question.id} has no option worth ${score}`)
    answers[question.id] = { questionId: question.id, optionId: option.id }
  }
  return answers
}
