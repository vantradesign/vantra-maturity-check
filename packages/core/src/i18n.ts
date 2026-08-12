import { DEFAULT_LOCALE, LOCALES, type Locale, type LocalizedText } from './types.js'

/** Narrowing helper for untrusted input (CLI flags, URL params, browser prefs). */
export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

/**
 * Resolve a locale from an arbitrary tag such as `de-DE`, `DE` or `en_GB`.
 * Falls back to the default locale instead of throwing: a wrong language is a
 * cosmetic problem, an aborted assessment is not.
 */
export function resolveLocale(tag: string | undefined | null): Locale {
  if (!tag) return DEFAULT_LOCALE
  const primary = tag.toLowerCase().replace('_', '-').split('-')[0]
  return isLocale(primary) ? primary : DEFAULT_LOCALE
}

/** Read a localized string, falling back to the default locale then to any value. */
export function t(text: LocalizedText | undefined, locale: Locale): string {
  if (!text) return ''
  return text[locale] ?? text[DEFAULT_LOCALE] ?? Object.values(text)[0] ?? ''
}

const UI_STRINGS = {
  appName: { en: 'Vantra Maturity Check', de: 'Vantra Maturity Check' },
  overallScore: { en: 'Overall score', de: 'Gesamtscore' },
  category: { en: 'Category', de: 'Kategorie' },
  score: { en: 'Score', de: 'Score' },
  level: { en: 'Level', de: 'Level' },
  nextSteps: { en: 'Next steps', de: 'Nächste Schritte' },
  notes: { en: 'Your notes', de: 'Eure Notizen' },
  completion: { en: 'Answered', de: 'Beantwortet' },
  notAnswered: { en: 'not answered', de: 'nicht beantwortet' },
  effort: { en: 'Effort', de: 'Aufwand' },
  effortS: { en: 'days', de: 'Tage' },
  effortM: { en: 'weeks', de: 'Wochen' },
  effortL: { en: 'a quarter', de: 'ein Quartal' },
  reportTitle: { en: 'Maturity report', de: 'Reifegrad-Report' },
  generatedAt: { en: 'Generated', de: 'Erstellt am' },
  catalogLabel: { en: 'Question catalog', de: 'Fragenkatalog' },
  scoringNote: {
    en: 'Scores are weighted means on a 1.00–5.00 scale. See SCORING.md for the exact formula.',
    de: 'Die Scores sind gewichtete Mittelwerte auf einer Skala von 1,00–5,00. Die genaue Formel steht in SCORING.md.',
  },
  encouragement: {
    en: 'This is a snapshot, not a verdict. Pick the first two steps per category and re-run the check in a quarter.',
    de: 'Das ist eine Momentaufnahme, kein Urteil. Nehmt euch die ersten zwei Schritte pro Kategorie vor und wiederholt den Check in einem Quartal.',
  },
} as const satisfies Record<string, LocalizedText>

export type UiKey = keyof typeof UI_STRINGS

/** UI copy that belongs to the engine's own output (reports), not to a catalog. */
export function ui(key: UiKey, locale: Locale): string {
  return t(UI_STRINGS[key], locale)
}
