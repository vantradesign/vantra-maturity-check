import type { LocalizedText } from '@vantra/maturity-core'

/**
 * The app's own copy, in both declared locales.
 *
 * [IA] Catalog text (questions, levels, next steps) is translated in the
 * catalog, and report text in `@vantra/maturity-core`'s `ui()`. This file is
 * only for chrome the web app adds around them — page headings, buttons,
 * caveats. Keeping the three separate is what lets the CLI and the web app
 * share the first two without inheriting each other's layout copy.
 *
 * `{name}` placeholders are filled by `useMessages()`. The German is written,
 * not translated word-for-word: it addresses a team as "ihr", which is how a
 * design-system conversation actually sounds in German.
 */
export const messages = {
  skipToContent: { en: 'Skip to content', de: 'Zum Inhalt springen' },
  language: { en: 'Language', de: 'Sprache' },

  footerPrivacy: {
    en: 'Runs entirely in your browser. No account, no telemetry, no network calls.',
    de: 'Läuft vollständig im Browser. Kein Konto, keine Telemetrie, keine Netzwerkaufrufe.',
  },
  footerCatalog: { en: 'Catalog {version}', de: 'Katalog {version}' },
  footerMethodology: { en: 'Methodology', de: 'Methodik' },
  footerSource: { en: 'Source', de: 'Quellcode' },

  introMeta: {
    en: '{count} questions · about ten minutes',
    de: '{count} Fragen · etwa zehn Minuten',
  },
  introTitle: {
    en: 'Where does your design system actually stand?',
    de: 'Wo steht euer Design-System wirklich?',
  },
  introLead: {
    en: 'An honest self-assessment across documentation, versioning, governance and adoption. You get a score, the shape of your strengths, and three concrete next steps per dimension — not a grade.',
    de: 'Eine ehrliche Selbsteinschätzung zu Dokumentation, Versionierung, Governance und Adoption. Ihr bekommt einen Score, das Profil eurer Stärken und drei konkrete nächste Schritte pro Dimension — keine Note.',
  },
  introStart: { en: 'Start the check', de: 'Check starten' },
  introContinue: { en: 'Continue', de: 'Fortsetzen' },
  introSeeResult: { en: 'See your result', de: 'Ergebnis ansehen' },
  introSaved: {
    en: '{answered} of {total} answered, saved on this device',
    de: '{answered} von {total} beantwortet, auf diesem Gerät gespeichert',
  },
  introStepLabel: { en: 'Step {number}', de: 'Schritt {number}' },
  introHonestyTitle: { en: 'What this is, and what it is not', de: 'Was das ist — und was nicht' },
  introHonestyPrivacyLead: {
    en: 'Nothing leaves your browser.',
    de: 'Nichts verlässt euren Browser.',
  },
  introHonestyPrivacy: {
    en: 'No account, no telemetry, no network calls. Your answers and notes stay on this device.',
    de: 'Kein Konto, keine Telemetrie, keine Netzwerkaufrufe. Antworten und Notizen bleiben auf diesem Gerät.',
  },
  introHonestySourcedLead: {
    en: 'Every question is sourced.',
    de: 'Jede Frage hat eine Quelle.',
  },
  introHonestySourced: {
    en: 'Each one names the published maturity model it derives from, so you can argue with it.',
    de: 'Jede nennt das veröffentlichte Reifegradmodell, aus dem sie stammt — damit ihr widersprechen könnt.',
  },
  introHonestyPracticeLead: {
    en: 'It measures practice, not craft.',
    de: 'Gemessen wird die Praxis, nicht die Gestaltung.',
  },
  introHonestyPractice: {
    en: 'A high score means your way of working would survive someone leaving — not that your components are good.',
    de: 'Ein hoher Score heißt, dass eure Arbeitsweise einen Weggang überstehen würde — nicht, dass eure Komponenten gut sind.',
  },

  progressLabel: { en: 'Assessment progress', de: 'Fortschritt der Bewertung' },
  stepOf: { en: 'Step {number} of {total}', de: 'Schritt {number} von {total}' },
  stepSkipNote: {
    en: 'Answer what you know. Skipping a question lowers nothing — unanswered questions are left out of the score entirely.',
    de: 'Beantwortet, was ihr wisst. Überspringen senkt nichts — unbeantwortete Fragen fließen gar nicht in den Score ein.',
  },
  stepAnswered: { en: '{answered} / {total} answered', de: '{answered} / {total} beantwortet' },
  stepBack: { en: 'Back', de: 'Zurück' },
  stepNext: { en: 'Next', de: 'Weiter' },
  stepSeeResult: { en: 'See result', de: 'Ergebnis ansehen' },
  stepSkipToResult: { en: 'Skip to result', de: 'Zum Ergebnis springen' },

  questionNumber: { en: 'Question {number}', de: 'Frage {number}' },
  questionAddNote: { en: 'Add a note', de: 'Notiz hinzufügen' },
  questionEditNote: { en: 'Edit note', de: 'Notiz bearbeiten' },
  questionHideNote: { en: 'Hide note', de: 'Notiz ausblenden' },
  questionNoteLabel: {
    en: 'Note — kept on this device, never scored, never shared',
    de: 'Notiz — bleibt auf diesem Gerät, fließt nicht in den Score ein, wird nie geteilt',
  },
  questionSources: { en: 'Where this question comes from', de: 'Woher diese Frage stammt' },

  tableCaption: { en: 'Score per dimension', de: 'Score pro Dimension' },
  tableDimension: { en: 'Dimension', de: 'Dimension' },
  tableScore: { en: 'Score', de: 'Score' },
  tableLevel: { en: 'Level', de: 'Level' },
  tableAnsweredOf: {
    en: '{answered} of {total} answered',
    de: '{answered} von {total} beantwortet',
  },
  tableNotAnswered: { en: 'Not answered', de: 'Nicht beantwortet' },

  resultLoading: { en: 'Loading your answers…', de: 'Antworten werden geladen…' },
  resultEmptyTitle: { en: 'Nothing to score yet', de: 'Noch nichts zu bewerten' },
  resultEmptyBody: {
    en: 'Answer at least one question and the result appears here. Nothing was lost — there was simply nothing stored on this device.',
    de: 'Beantwortet mindestens eine Frage, dann erscheint hier das Ergebnis. Es ist nichts verloren gegangen — auf diesem Gerät war schlicht nichts gespeichert.',
  },
  resultAnsweredCount: {
    en: '{answered} of {total} questions answered',
    de: '{answered} von {total} Fragen beantwortet',
  },
  resultDropped: {
    en: '{count} answers in this link referenced questions that are no longer in the catalog, and were left out of the score.',
    de: '{count} Antworten in diesem Link bezogen sich auf Fragen, die nicht mehr im Katalog stehen, und wurden nicht gewertet.',
  },
  resultDroppedOne: {
    en: 'One answer in this link referenced a question that is no longer in the catalog, and was left out of the score.',
    de: 'Eine Antwort in diesem Link bezog sich auf eine Frage, die nicht mehr im Katalog steht, und wurde nicht gewertet.',
  },
  resultLevelHeading: { en: 'Level {level} · {name}', de: 'Level {level} · {name}' },
  resultPartial: {
    en: 'Unanswered questions were left out rather than counted as zero, so this reflects only what you answered.',
    de: 'Unbeantwortete Fragen wurden ausgelassen statt als Null gewertet — das Ergebnis zeigt also nur, was ihr beantwortet habt.',
  },
  resultNextTitle: { en: 'What to do next', de: 'Was als Nächstes zu tun ist' },
  resultNextLead: {
    en: 'Three steps per dimension, chosen for the level you are at. The two marked {marker} are your weakest scores — the rest will be easier afterwards.',
    de: 'Drei Schritte pro Dimension, passend zu eurem Level. Die zwei mit {marker} sind eure schwächsten Werte — der Rest fällt danach leichter.',
  },
  resultStartHere: { en: 'Start here', de: 'Hier anfangen' },
  resultExportTitle: { en: 'Take it with you', de: 'Nehmt es mit' },
  resultExportLead: {
    en: 'The JSON file is your record: run the check again next quarter, compare the two, and you have a trend line without anyone operating a database.',
    de: 'Die JSON-Datei ist euer Beleg: Wiederholt den Check im nächsten Quartal, vergleicht beide Dateien — und ihr habt eine Verlaufskurve, ohne dass jemand eine Datenbank betreiben muss.',
  },
  resultDownloadMarkdown: {
    en: 'Download report (Markdown)',
    de: 'Report herunterladen (Markdown)',
  },
  resultDownloadJson: { en: 'Download data (JSON)', de: 'Daten herunterladen (JSON)' },
  resultCopyLink: { en: 'Copy share link', de: 'Link kopieren' },
  resultLinkCopied: { en: 'Link copied', de: 'Link kopiert' },
  resultShareNote: {
    en: 'A share link carries only which option you picked per question. Your notes stay on this device, by construction.',
    de: 'Ein geteilter Link enthält nur, welche Option ihr pro Frage gewählt habt. Eure Notizen bleiben konstruktionsbedingt auf diesem Gerät.',
  },
  resultCaveatTitle: {
    en: 'Before you quote this number',
    de: 'Bevor ihr diese Zahl zitiert',
  },
  resultCaveatBody: {
    en: 'This measures whether practices are in place and repeatable — not whether your design system is good. It is self-reported, so it is only as honest as the answering. A low score usually describes an under-resourced situation, which is a decision made above the team. It is not an evaluation of a person, and it does not belong in a performance review.',
    de: 'Gemessen wird, ob Praktiken existieren und wiederholbar sind — nicht, ob euer Design-System gut ist. Die Angaben sind selbst berichtet und damit nur so ehrlich wie die Antworten. Ein niedriger Score beschreibt meist eine unterausgestattete Situation, und das ist eine Entscheidung oberhalb des Teams. Er bewertet keine Person und gehört in kein Mitarbeitergespräch.',
  },
  resultDelete: {
    en: 'Delete my answers from this device',
    de: 'Meine Antworten von diesem Gerät löschen',
  },

  effortS: { en: 'Days', de: 'Tage' },
  effortM: { en: 'Weeks', de: 'Wochen' },
  effortL: { en: 'A quarter', de: 'Ein Quartal' },
} as const satisfies Record<string, LocalizedText>

export type MessageKey = keyof typeof messages
