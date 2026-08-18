# Vantra Maturity Check

A self-assessment that tells a design-system team **where they actually are** and **what to do next** — across documentation, versioning, governance and adoption.

24 questions. Ten minutes. No account, no telemetry, no network calls.

```bash
npx @vantra-design/maturity-check
```

## Why this exists

Most maturity models are a slide with five columns and no instructions. They tell a team it is "level 2" and leave it there. The gap is never the diagnosis — it is knowing which three things to do on Monday.

So this tool inverts the emphasis: the score exists to select the advice. Every level in every dimension has three concrete, effort-tagged next steps written for a team at exactly that level. A level-2 team is never handed level-5 advice.

## What it measures

| Dimension         | The question behind the questions                      |
| ----------------- | ------------------------------------------------------ |
| **Documentation** | Can a new team use a component without asking anyone?  |
| **Versioning**    | Can you ship a breaking change without breaking trust? |
| **Governance**    | Who decides, how fast, and is that written down?       |
| **Adoption**      | Do teams actually use it, and do you know?             |

Five levels, from **Ad hoc** to **Optimising**, deliberately non-judgemental: the report states where a team is and what to do next. It never calls a system immature.

## Repository layout

```text
packages/
  core/   Scoring engine, question catalog, report renderer — zero dependencies
  cli/    Interactive terminal app (npx @vantra-design/maturity-check)
apps/
  web/    Static assessment site (Nuxt 3 + Tailwind v4, prerendered)
```

`core` has no I/O and no `process` access, so the CLI and the web app run the same code and produce byte-identical reports for the same answers.

## Scoring

- Answer options are worth 1–5 points; questions carry a weight of 1–3, so load-bearing practices count more than nice-to-haves.
- A category score is the **weighted mean** of its answered questions.
- The overall score is the **unweighted mean of the four category scores**, so no dimension can dominate by having more questions.
- Unanswered questions are excluded, never counted as zero — skipping an honest "I don't know" is not punished.
- Bands: `< 1.5` level 1, `< 2.5` level 2, `< 3.5` level 3, `< 4.5` level 4, otherwise level 5.

The number is a conversation starter, not a grade.

## Comparing over time

There is no database. The JSON export _is_ the persistence layer:

```bash
npx @vantra-design/maturity-check --json 2026-q1.json
# … a quarter later …
npx @vantra-design/maturity-check --from 2026-q1.json --json 2026-q2.json
```

Free-text notes stay in local exports and are never encoded into a share link.

## Bring your own questions

The engine is domain-agnostic — a catalog is plain JSON validated against [`catalog.schema.json`](packages/core/schema/catalog.schema.json). The same tool can assess API governance or content operations without a code change. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Development

Requires Node ≥ 20.11 and pnpm 11.

```bash
pnpm install
pnpm test           # core unit tests
pnpm run verify     # lint + typecheck + coverage + build
pnpm run cli        # run the built CLI
```

## Documentation

- [CLI usage](packages/cli/README.md)
- [Engine API](packages/core/README.md)
- [Web app](apps/web/) — the browser-based self-assessment
- [Scoring rules](SCORING.md)
- [Methodology, sources and limitations](docs/METHODOLOGY.md) — where the questions come from, and what the score cannot tell you
- [Decisions](docs/DECISIONS.md) — why there is no backend, and what the benchmark contract commits to
- [Contributing and catalog authoring](CONTRIBUTING.md)

## License

MIT © Vantra Design
