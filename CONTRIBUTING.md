# Contributing

Two kinds of contribution matter most here: **better questions** and **better next steps**. Both are data, not code.

## Setup

```bash
pnpm install
pnpm run verify   # lint + typecheck + coverage + build
```

Node ≥ 20.11, pnpm 11. `pnpm run verify` is exactly what CI runs.

## Improving the question catalog

Content lives one file per category, so a change to governance questions never produces a diff in a 900-line blob:

```text
packages/core/src/catalogs/design-system-v1/
  meta.json                 catalog identity, locales, the five levels
  questions/<category>.json 5–8 questions per category
  next-steps/<category>.json  three steps per level, per category
```

Rules the validator enforces (`pnpm test` will tell you precisely which path failed):

- 5–8 questions per category, so a run stays answerable in one sitting.
- 4–5 answer options per question, each with a **distinct** score from 1 to 5.
- Question weight is `1`, `2` or `3`. Reserve `3` for load-bearing practices.
- Every string needs a translation for every declared locale (`en`, `de`).
- At least three next steps for every category **and** every level 1–5.
- Question ids follow `abc-01`; they must be globally unique and stable.

### What makes a good question

- **Observable, not aspirational.** "Is there a changelog?" beats "Do you value transparency?"
- **Answerable from memory.** If a team has to open three tools to answer, the question is too specific.
- **Graded options that describe reality**, including the honest bottom option. Someone has to be able to pick option 1 without feeling accused.
- **Help text that teaches.** The `help` field is often the most valuable part of the tool; use it to explain why the practice matters.
- **Cited.** Every question carries a `sources` array naming the published model it derives from and the criterion it draws on:

  ```json
  "sources": [{ "ref": "curtis", "criterion": "Contribution models" }]
  ```

  Each `ref` must exist in `meta.json` under `sources`; add the work there if it is not listed yet. `packages/core/test/provenance.test.ts` fails the build for an uncited question, a citation without a criterion, or a `ref` that points nowhere. This is not bureaucracy: an assessment nobody can trace is an opinion with a number attached, and the first design system lead who disagrees with a question will ask where it came from.

- **Honest about its assumptions.** If a question only makes sense for a particular size, platform or org shape, say so in the help text and add it to the assumptions list in [`docs/METHODOLOGY.md`](docs/METHODOLOGY.md).

### What makes a good next step

- **Doable by the team reading it.** No "get executive buy-in" as step one.
- **Level-appropriate.** A level-1 team needs "agree on one template", not "automate visual regression".
- **Honestly tagged for effort.** `S` = days, `M` = weeks, `L` = a quarter.
- **Says why, briefly.** One sentence of reasoning is what turns a checklist into an argument a team can take to planning.

The level-1 and level-2 steps are checked automatically against a small vocabulary of things a struggling team cannot do for itself — hiring, headcount, executive sponsorship, budget approval, reorganisation. A step at those levels must be something the team can start on Monday with the authority it already has.

Changing a question id, weight, or option scores changes what stored results mean. Bump `version` in `meta.json`: **minor** for additive wording, **major** for anything that makes previous results non-comparable.

## Adding a whole new catalog

The engine is domain-agnostic. To assess something else — API governance, content operations, accessibility practice — write a catalog that validates against [`packages/core/schema/catalog.schema.json`](packages/core/schema/catalog.schema.json) and load it with `loadCatalog()`. No engine change should be necessary; if one is, that is a bug worth an issue.

## Code changes

- `@vantra-design/maturity-core` must stay dependency-free, pure and platform-neutral: no `fs`, no `process`, no `Date.now()` outside an injectable default. It runs in Node and in the browser.
- Anything user-visible in a report belongs in `core`, so the CLI and the web app cannot drift.
- Tests come with the change. Coverage thresholds are enforced at 80% branches / 90% lines.
- Run `pnpm changeset` and describe the change from the user's point of view.

### Tests

| Command          | What it covers                                                            |
| ---------------- | ------------------------------------------------------------------------- |
| `pnpm test:unit` | The engine: scoring, catalogs, validation, share links, report rendering. |
| `pnpm test:e2e`  | The prompts: spawns the built CLI and answers all 24 questions via stdin. |
| `pnpm test`      | Both, after a build.                                                      |

The e2e suite drives the real binary rather than importing `runInteractive()`, because the parts that break in practice — flag parsing, prompt order, exit codes, files landing on disk — only exist in the assembled program. It pipes stdin instead of allocating a pty, waits for output to go quiet before sending the next key, and asserts on text with ANSI escapes stripped. Never assert on cursor positioning or box-drawing; that is the part that legitimately changes when a dependency updates.

## Commits and pull requests

Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`). Keep pull requests scoped to one thing; a question-wording change and a scoring change should not travel together.

## Reporting a problem

An issue describing a question that felt wrong, ambiguous, or culturally specific to your organisation is a genuinely useful contribution. Include the question id and what you would have wanted to answer.
