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

export interface ValidationIssue {
  path: string
  message: string
}
