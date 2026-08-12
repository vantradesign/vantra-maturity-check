import {
  CONSUMER_COUNT_BANDS,
  SYSTEM_AGE_BANDS,
  TEAM_SIZE_BANDS,
  type AnswerSet,
  type AssessmentContext,
  type AssessmentResult,
  type Catalog,
  type LevelNumber,
  type LocalizedText,
  type OptionScore,
} from './types.js'

/**
 * The wire format for an optional, anonymous benchmark contribution.
 *
 * [Product] Comparison is the thing a maturity score is actually missing:
 * "3.1" means little, "3.1, where the median comparable team sits at 2.6"
 * changes a planning conversation. That requires pooled data, which is why
 * this exists at all.
 *
 * [Privacy] Nothing here is collected today — no endpoint exists, and the tool
 * still makes no network calls. This module is the contract, defined before
 * the UI is built, so that:
 *
 *  1. the payload can never drift into carrying free text,
 *  2. the CLI and the web app promise users the identical thing,
 *  3. data collected on day one is comparable with data collected later.
 *
 * The guarantee is structural, not a matter of discipline: this builder reads
 * only option *scores* and fixed context bands. There is no code path from an
 * `Answer.note` into a `BenchmarkSubmission`, and a test asserts that every
 * string in a built payload matches a known-safe shape.
 */

export const BENCHMARK_PAYLOAD_VERSION = 1

export interface BenchmarkSubmission {
  v: number
  /** Which catalog, and which content version of it, produced these scores. */
  catalogId: string
  catalogVersion: string
  /**
   * Month only (`YYYY-MM`). A full timestamp is a fingerprint: combined with a
   * score profile it can identify a specific submission. A month is all a
   * trend line needs.
   */
  period: string
  /** questionId -> score. Option ids are omitted; the number is the datum. */
  scores: Record<string, OptionScore>
  overall: {
    score: number | null
    level: LevelNumber | null
    /** How much of the catalog was answered, so partial runs can be filtered. */
    answered: number
    total: number
  }
  categories: Array<{
    id: string
    score: number | null
    level: LevelNumber | null
  }>
  context?: AssessmentContext
}

/** `2026-02-02T09:00:00.000Z` -> `2026-02`. */
function toPeriod(isoTimestamp: string): string {
  return isoTimestamp.slice(0, 7)
}

/**
 * Build the anonymous payload for a completed assessment.
 *
 * Pure and side-effect free: it never sends anything. Transport is the caller's
 * job, and must only happen after an explicit, unchecked-by-default opt-in.
 */
export function toBenchmarkSubmission(
  catalog: Catalog,
  result: AssessmentResult,
  answers: AnswerSet,
  context?: AssessmentContext,
): BenchmarkSubmission {
  const scores: Record<string, OptionScore> = {}

  for (const category of catalog.categories) {
    for (const question of category.questions) {
      const answer = answers[question.id]
      if (!answer) continue
      const option = question.options.find((candidate) => candidate.id === answer.optionId)
      // An answer referencing an unknown option is dropped rather than guessed:
      // a wrong number pollutes the benchmark for everybody.
      if (option) scores[question.id] = option.score
    }
  }

  const submission: BenchmarkSubmission = {
    v: BENCHMARK_PAYLOAD_VERSION,
    catalogId: result.catalogId,
    catalogVersion: result.catalogVersion,
    period: toPeriod(result.completedAt),
    scores,
    overall: {
      score: result.overall.score,
      level: result.overall.level,
      answered: result.overall.answered,
      total: result.overall.total,
    },
    categories: result.categories.map((category) => ({
      id: category.categoryId,
      score: category.score,
      level: category.level,
    })),
  }

  const cleanContext = sanitiseContext(context)
  if (cleanContext) submission.context = cleanContext

  return submission
}

/**
 * Keep only recognised band values. Anything else — a stray free-text field
 * from a future UI, a hand-edited JSON export — is dropped rather than
 * forwarded.
 */
function sanitiseContext(context: AssessmentContext | undefined): AssessmentContext | undefined {
  if (!context) return undefined

  const clean: AssessmentContext = {}
  if (context.teamSize && TEAM_SIZE_BANDS.includes(context.teamSize)) {
    clean.teamSize = context.teamSize
  }
  if (context.consumers && CONSUMER_COUNT_BANDS.includes(context.consumers)) {
    clean.consumers = context.consumers
  }
  if (context.systemAge && SYSTEM_AGE_BANDS.includes(context.systemAge)) {
    clean.systemAge = context.systemAge
  }

  return Object.keys(clean).length > 0 ? clean : undefined
}

/**
 * Consent copy, defined once so the CLI and the web app cannot make different
 * promises. Written in plain language: if a sentence needs a lawyer to parse,
 * it is not informed consent.
 */
export const BENCHMARK_CONSENT: Record<string, LocalizedText> = {
  question: {
    en: 'Contribute this result to the anonymous benchmark?',
    de: 'Dieses Ergebnis anonym zum Benchmark beitragen?',
  },
  explanation: {
    en: 'Pooled results let everyone see how their score compares to similar teams. Contributing is optional and the check works exactly the same either way.',
    de: 'Gesammelte Ergebnisse zeigen allen, wie ihr Score im Vergleich zu ähnlichen Teams liegt. Der Beitrag ist freiwillig, der Check funktioniert in beiden Fällen identisch.',
  },
  whatIsSent: {
    en: 'Sent: your score per question, the month, and the team-size bands you chose.',
    de: 'Gesendet werden: euer Score pro Frage, der Monat und die gewählten Team-Größenbänder.',
  },
  whatIsNotSent: {
    en: 'Never sent: your notes, your company, your name, or anything you typed.',
    de: 'Niemals gesendet werden: eure Notizen, eure Firma, euer Name oder irgendetwas, das ihr getippt habt.',
  },
  declineHint: {
    en: 'Declining changes nothing about your report.',
    de: 'Eine Ablehnung ändert nichts an eurem Report.',
  },
}
