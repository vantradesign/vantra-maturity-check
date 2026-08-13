import type { Locale, LocalizedText } from '@vantra-design/maturity-core'
import { t } from '@vantra-design/maturity-core'

/**
 * CLI-only copy. Everything a report contains lives in `@vantra-design/maturity-core` so the web
 * app renders the identical document; only the conversational wrapper below is
 * terminal-specific.
 */
const MESSAGES = {
  intro: {
    en: 'Vantra Maturity Check · Design System',
    de: 'Vantra Maturity Check · Design System',
  },
  welcome: {
    en: '24 questions across four dimensions, about ten minutes. There is no wrong answer — an honest snapshot is worth more than a good score.',
    de: '24 Fragen zu vier Dimensionen, etwa zehn Minuten. Es gibt keine falsche Antwort – eine ehrliche Momentaufnahme ist mehr wert als ein guter Score.',
  },
  chooseLanguage: { en: 'Language', de: 'Sprache' },
  categoryIntro: { en: 'Dimension', de: 'Dimension' },
  questionCounter: { en: 'Question', de: 'Frage' },
  of: { en: 'of', de: 'von' },
  skip: { en: "Skip — I don't know", de: 'Überspringen – ich weiß es nicht' },
  addNote: { en: 'Add a note?', de: 'Notiz hinzufügen?' },
  notePlaceholder: {
    en: 'Optional, stays local and is never part of a share link',
    de: 'Optional, bleibt lokal und landet nie in einem Share-Link',
  },
  showPartial: {
    en: 'Show the score so far?',
    de: 'Zwischenstand anzeigen?',
  },
  partialScore: { en: 'Score so far', de: 'Zwischenstand' },
  exportPrompt: { en: 'Export the result?', de: 'Ergebnis exportieren?' },
  exportMarkdown: { en: 'Markdown report', de: 'Markdown-Report' },
  exportJson: {
    en: 'JSON (to compare against on the next run)',
    de: 'JSON (für den Vergleich beim nächsten Mal)',
  },
  exportNone: { en: 'No, terminal output is enough', de: 'Nein, die Terminal-Ausgabe genügt' },
  written: { en: 'Written', de: 'Gespeichert' },
  outro: {
    en: 'Re-run the check in a quarter and compare the two JSON exports — the delta is the interesting part.',
    de: 'Wiederholt den Check in einem Quartal und vergleicht die beiden JSON-Exporte – der Unterschied ist der interessante Teil.',
  },
  cancelled: {
    en: 'Stopped. Nothing was written.',
    de: 'Abgebrochen. Es wurde nichts geschrieben.',
  },
  noAnswers: {
    en: 'No questions were answered, so there is nothing to score yet.',
    de: 'Es wurde keine Frage beantwortet, daher gibt es noch nichts zu bewerten.',
  },
  resumed: {
    en: 'Restored answers from',
    de: 'Antworten wiederhergestellt aus',
  },
  yes: { en: 'Yes', de: 'Ja' },
  no: { en: 'No', de: 'Nein' },
} as const satisfies Record<string, LocalizedText>

export type MessageKey = keyof typeof MESSAGES

export function m(key: MessageKey, locale: Locale): string {
  return t(MESSAGES[key], locale)
}
