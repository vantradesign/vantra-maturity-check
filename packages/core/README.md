# @vantra-design/maturity-core

The scoring engine, question catalog and report renderer behind [`@vantra-design/maturity-check`](../cli/README.md). Zero runtime dependencies, no I/O, no `process` access — it runs unchanged in Node and in the browser.

## Why this is a separate package

The CLI and the web app must produce **byte-identical reports** for the same answers. The only way to guarantee that is to have exactly one implementation of scoring and rendering, consumed by both.

## Usage

```ts
import {
  getCatalog,
  scoreAssessment,
  renderMarkdownReport,
  recommendationsFor,
} from '@vantra-design/maturity-core'

const catalog = getCatalog()

const answers = {
  'doc-01': { questionId: 'doc-01', optionId: 'most' },
  'gov-01': { questionId: 'gov-01', optionId: 'named-owner' },
}

const result = scoreAssessment(catalog, answers)
result.overall // { score, level, answered, total, completion }

renderMarkdownReport(catalog, result, { locale: 'de', answers })
recommendationsFor(catalog, result) // three next steps per category
```

## API

| Export                                                | Purpose                                                        |
| ----------------------------------------------------- | -------------------------------------------------------------- |
| `getCatalog(id?)`, `builtinCatalogs`                  | Access the bundled catalogs.                                   |
| `loadCatalog(json)`                                   | Validate and load a community catalog.                         |
| `scoreAssessment(catalog, answers, opts?)`            | Full result, injectable `completedAt` for deterministic tests. |
| `scoreCategory`, `partialScore`, `levelForScore`      | Scoring primitives.                                            |
| `recommendationsFor`, `stepsFor`, `weakestCategories` | Level-aware next steps.                                        |
| `renderMarkdownReport`, `scoreBar`, `toJsonExport`    | Report output.                                                 |
| `encodeAnswers`, `decodeAnswers`                      | URL-safe share payloads, notes stripped.                       |
| `validateCatalog`, `assertValidCatalog`               | Dependency-free structural validation with precise paths.      |
| `t`, `ui`, `resolveLocale`, `isLocale`                | Localisation helpers.                                          |

## Scoring

- Answer options are worth 1–5 points; questions carry a weight of 1–3.
- Category score = weighted mean of answered questions.
- Overall score = unweighted mean of category scores, so every dimension counts equally regardless of question count.
- Unanswered questions are excluded, never treated as zero.
- Bands: `< 1.5` → 1, `< 2.5` → 2, `< 3.5` → 3, `< 4.5` → 4, else 5.

`scoreAssessment` accepts `{ completedAt }` so results are reproducible in tests and diffable across runs.

## Share links

`encodeAnswers` produces a base64url payload containing only question ids and option ids — **never** the free-text notes. `decodeAnswers` never throws: it returns `null` for corrupt input, and otherwise reports which answers were dropped and whether the payload came from a different catalog version.

## Custom catalogs

A catalog is data, not code. Validate your own against [`schema/catalog.schema.json`](./schema/catalog.schema.json), then:

```ts
import { loadCatalog } from '@vantra-design/maturity-core'

const catalog = loadCatalog(JSON.parse(await readFile('api-governance.json', 'utf-8')))
```

Requirements enforced by `validateCatalog`: five ordered levels, 5–8 questions per category, 4–5 options per question with unique scores, a translation for every declared locale, and at least three next steps for every category and level.

## License

MIT © Vantra Design
