import {
  designSystemCatalog,
  resolveLocale,
  sanitiseAnswers,
  scoreAssessment,
  t as translate,
  type AnswerSet,
  type AssessmentResult,
  type Catalog,
  type Locale,
  type LocalizedText,
} from '@vantra-design/maturity-core'
import { messages, type MessageKey } from '~/i18n/messages'

/**
 * All assessment state for the app.
 *
 * [Engineering] There is no store library and no server. Answers live in
 * `useState` for the session and in `localStorage` across visits, which is the
 * whole persistence story — see docs/DECISIONS.md. Restoring happens in
 * `onMounted` rather than during setup so the prerendered HTML and the first
 * client render agree; a hydration mismatch on the very first paint would be a
 * strange way to open a tool about discipline.
 */

const STORAGE_KEY = 'vantra-maturity-check.v1'

interface StoredState {
  catalogVersion: string
  answers: AnswerSet
  locale: Locale
}

export function useCatalog(): Catalog {
  return designSystemCatalog
}

export function useLocale() {
  return useState<Locale>('locale', () => 'en')
}

/** Translate a catalog string into the current locale. */
export function useT() {
  const locale = useLocale()
  return (text: LocalizedText | undefined) => translate(text, locale.value)
}

/**
 * Translate one of the app's own strings, filling `{name}` placeholders.
 * Returns a computed-friendly function: it reads `locale` on every call, so
 * every caller re-renders when the language switch is used.
 */
export function useMessages() {
  const locale = useLocale()
  return (key: MessageKey, values: Record<string, string | number> = {}) => {
    const text = translate(messages[key], locale.value)
    return Object.entries(values).reduce(
      (result, [name, value]) => result.replaceAll(`{${name}}`, String(value)),
      text,
    )
  }
}

export function useAnswers() {
  return useState<AnswerSet>('answers', () => ({}))
}

/**
 * True while the displayed answers came from a share link rather than from this
 * device.
 *
 * [UX] Two things depend on it: the result page says so out loud, and `persist()`
 * refuses to write. Without the second, `app.vue`'s `watch([answers, locale],
 * persist)` overwrites the visitor's own stored answers the instant a shared link
 * is decoded — silently, before they touch anything.
 */
export function useIsSharedView() {
  return useState<boolean>('isSharedView', () => false)
}

export function useAssessment() {
  const catalog = useCatalog()
  const answers = useAnswers()
  const locale = useLocale()
  const isSharedView = useIsSharedView()

  const total = computed(() => catalog.categories.reduce((sum, c) => sum + c.questions.length, 0))
  const answered = computed(() => Object.keys(answers.value).length)
  const progress = computed(() => (total.value === 0 ? 0 : answered.value / total.value))
  const isComplete = computed(() => answered.value === total.value)

  /**
   * Recomputed on every answer. The engine is pure and the catalog is 24
   * questions, so this is cheaper than keeping a second copy of the truth in
   * sync with the first.
   */
  const result = computed<AssessmentResult>(() =>
    scoreAssessment(catalog, answers.value, { completedAt: new Date().toISOString() }),
  )

  function select(questionId: string, optionId: string) {
    answers.value = {
      ...answers.value,
      [questionId]: { ...answers.value[questionId], questionId, optionId },
    }
  }

  function setNote(questionId: string, note: string) {
    const existing = answers.value[questionId]
    if (!existing) return
    const trimmed = note.trim()
    answers.value = {
      ...answers.value,
      [questionId]: trimmed === '' ? { ...existing, note: undefined } : { ...existing, note },
    }
  }

  function answeredIn(categoryId: string): number {
    const category = catalog.categories.find((entry) => entry.id === categoryId)
    if (!category) return 0
    return category.questions.filter((question) => answers.value[question.id]).length
  }

  function reset() {
    answers.value = {}
    isSharedView.value = false
    if (import.meta.client) localStorage.removeItem(STORAGE_KEY)
  }

  function restore(): void {
    if (!import.meta.client) return

    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        const stored = JSON.parse(raw) as StoredState
        // A catalog major bump changes what an answer means. Minor and patch
        // versions stay compatible, and unknown ids are dropped either way.
        const storedMajor = stored.catalogVersion?.split('.')[0]
        const currentMajor = catalog.version.split('.')[0]
        if (storedMajor === currentMajor) {
          answers.value = sanitiseAnswers(catalog, stored.answers ?? {})
          if (stored.locale) locale.value = stored.locale
        }
      } catch {
        // A corrupt entry is not worth an error message: start clean.
        localStorage.removeItem(STORAGE_KEY)
      }
    } else {
      locale.value = resolveLocale(navigator.language)
    }
  }

  function persist(): void {
    if (!import.meta.client) return
    // Someone else's result is not this device's state. See useIsSharedView().
    if (isSharedView.value) return

    const state: StoredState = {
      catalogVersion: catalog.version,
      answers: answers.value,
      locale: locale.value,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }

  return {
    catalog,
    answers,
    locale,
    isSharedView,
    total,
    answered,
    progress,
    isComplete,
    result,
    select,
    setNote,
    answeredIn,
    reset,
    restore,
    persist,
  }
}

/** Step order for the wizard, derived from the catalog rather than hardcoded. */
export function useSteps() {
  const catalog = useCatalog()
  return catalog.categories.map((category, index) => ({
    id: category.id,
    index,
    number: index + 1,
    of: catalog.categories.length,
    previous: index > 0 ? catalog.categories[index - 1]!.id : null,
    next: index < catalog.categories.length - 1 ? catalog.categories[index + 1]!.id : null,
  }))
}
