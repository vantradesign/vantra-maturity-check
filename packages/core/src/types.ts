/**
 * Domain model of the assessment engine.
 *
 * [IA] Nothing in here is specific to design systems. A catalog is just
 * "categories of weighted questions with graded answers, mapped onto five
 * maturity levels", so the same engine can carry an API-governance or
 * content-ops catalog later without a code change.
 */

export type Locale = 'de' | 'en'

/** Every user-facing string in a catalog must exist in all supported locales. */
export type LocalizedText = Record<Locale, string>

export const LOCALES: readonly Locale[] = ['en', 'de']

export const DEFAULT_LOCALE: Locale = 'en'

/** 1 = supporting signal, 2 = standard, 3 = load-bearing practice. */
export type Weight = 1 | 2 | 3

/** Maturity points an answer option is worth. Identical range as the levels. */
export type OptionScore = 1 | 2 | 3 | 4 | 5

export type LevelNumber = 1 | 2 | 3 | 4 | 5

export interface AnswerOption {
  /** Stable, human-readable id — used in exports and share links. */
  id: string
  score: OptionScore
  label: LocalizedText
}

/**
 * A published model or standard a question was derived from.
 *
 * [Product] Attribution is what makes an assessment arguable. When a design
 * system lead disagrees with question 14, the answer should be "here is where
 * the criterion comes from", not "we thought it sounded right".
 */
export interface CatalogSource {
  /** Short id referenced by questions, e.g. `curtis`. */
  id: string
  /** Title of the work, in its original language. Never translated. */
  name: string
  publisher: string
  url?: string
}

export interface QuestionSource {
  /** Must match a `CatalogSource.id` declared on the catalog. */
  ref: string
  /** Which criterion of that model this question draws on. */
  criterion?: string
}

export interface Question {
  id: string
  categoryId: string
  weight: Weight
  prompt: LocalizedText
  /** Why this question matters. Shown as helper text, never as a requirement. */
  help: LocalizedText
  options: AnswerOption[]
  /** [UX] Free-text notes are always optional and never scored. */
  allowNote: boolean
  /** Where the criterion comes from. Optional in the schema, required by
   *  convention in the bundled catalog and enforced by its tests. */
  sources?: QuestionSource[]
}

export interface Category {
  id: string
  name: LocalizedText
  description: LocalizedText
  questions: Question[]
}

export interface MaturityLevel {
  level: LevelNumber
  id: string
  name: LocalizedText
  summary: LocalizedText
  /** Inclusive lower bound on the 1.00–5.00 score scale. */
  minScore: number
}

export interface NextStep {
  id: string
  /** Array order is the recommended execution order. */
  title: LocalizedText
  detail: LocalizedText
  /** Rough effort hint: S = days, M = weeks, L = a quarter. */
  effort: 'S' | 'M' | 'L'
}

/** categoryId -> level ("1".."5") -> at least three prioritised steps. */
export type NextStepsMap = Record<string, Record<string, NextStep[]>>

export interface Catalog {
  /** Version of the *schema*, not of the content. */
  schemaVersion: 1
  id: string
  /** Semver of the content. Bumping it invalidates stored results. */
  version: string
  name: LocalizedText
  description: LocalizedText
  locales: Locale[]
  levels: MaturityLevel[]
  categories: Category[]
  nextSteps: NextStepsMap
  /** Bibliography. Questions cite entries from here by id. */
  sources?: CatalogSource[]
}

export interface Answer {
  questionId: string
  /** `AnswerOption.id` of the selected option. */
  optionId: string
  note?: string
}

/** questionId -> answer. Unanswered questions are simply absent. */
export type AnswerSet = Record<string, Answer>

export interface CategoryResult {
  categoryId: string
  /** Weighted mean on the 1.00–5.00 scale, or null if nothing was answered. */
  score: number | null
  level: LevelNumber | null
  answered: number
  total: number
  /** 0–1. */
  completion: number
}

export interface AssessmentResult {
  catalogId: string
  catalogVersion: string
  /** ISO 8601. Injected, never read from the clock inside the scorer. */
  completedAt: string
  overall: {
    score: number | null
    level: LevelNumber | null
    answered: number
    total: number
    completion: number
  }
  categories: CategoryResult[]
}

/**
 * Coarse context about the team being assessed.
 *
 * [Product] A score means little on its own: three people supporting forty
 * products is a different situation from eight supporting four. These bands
 * exist so a result can later be compared against similar teams.
 *
 * [Privacy] Every field is optional, every value is a fixed band, and there is
 * deliberately no free-text field, no company name and no sector. Bands are
 * wide enough that a combination of all three does not single anybody out.
 * Anything narrower would be a re-identification risk dressed up as insight.
 */
export type TeamSizeBand = 'none' | '1-2' | '3-5' | '6-10' | '11+'

export type ConsumerCountBand = '1-2' | '3-5' | '6-10' | '11-25' | '26+'

export type SystemAgeBand = 'under-1' | '1-2' | '3-5' | 'over-5'

export const TEAM_SIZE_BANDS: readonly TeamSizeBand[] = ['none', '1-2', '3-5', '6-10', '11+']

export const CONSUMER_COUNT_BANDS: readonly ConsumerCountBand[] = [
  '1-2',
  '3-5',
  '6-10',
  '11-25',
  '26+',
]

export const SYSTEM_AGE_BANDS: readonly SystemAgeBand[] = ['under-1', '1-2', '3-5', 'over-5']

export interface AssessmentContext {
  /** People working on the design system itself, in full-time equivalents. */
  teamSize?: TeamSizeBand
  /** Product teams or squads consuming the system. */
  consumers?: ConsumerCountBand
  /** Years since the system started, however informally. */
  systemAge?: SystemAgeBand
}

export interface ValidationIssue {
  path: string
  message: string
}
