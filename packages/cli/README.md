# @vantra/maturity-check

> The CLI of the **Vantra Maturity Check**. Installed commands: `vantra-maturity-check` and the short alias `vmc`.

An interactive CLI that scores your design system across four dimensions — **documentation, versioning, governance, adoption** — and hands back three prioritised next steps per dimension.

No account, no telemetry, no network calls. Everything happens on your machine.

```bash
npx @vantra/maturity-check
```

## What you get

24 questions, roughly ten minutes, then a report like this:

```text
Maturity report · Design System

Overall score: 2.75 / 5.00  Level 3 · Established

  Documentation  ████████░░   4.00  Level 4 · Managed
  Versioning     ███░░░░░░░   2.00  Level 2 · Emerging
  Governance     █████░░░░░   3.00  Level 3 · Established
  Adoption       ███░░░░░░░   2.00  Level 2 · Emerging

Next steps
  Versioning
   1. Automate the release so anyone can run it [M]
      A release that only one person can perform is an availability risk …
```

Each next step is tied to the level you are actually at, so a level-2 team is never handed level-5 advice.

## Usage

```bash
# Interactive run, language taken from your shell locale
npx @vantra/maturity-check

# German, write both exports without being asked
npx @vantra/maturity-check --lang de --markdown report.md --json result.json

# Resume from a previous run and only revisit what changed
npx @vantra/maturity-check --from result.json

# Re-render a report from an export, no prompts (CI-friendly)
npx @vantra/maturity-check report --from result.json --markdown report.md

# Print the bundled question catalog as JSON
npx @vantra/maturity-check catalog > catalog.json
```

### Options

| Option                  | Description                                           |
| ----------------------- | ----------------------------------------------------- |
| `-l, --lang <en\|de>`   | Output language. Defaults to `$LANG`, then English.   |
| `-c, --catalog <id>`    | Question catalog to use. Defaults to `design-system`. |
| `-m, --markdown [path]` | Write a Markdown report.                              |
| `-j, --json [path]`     | Write a JSON export containing answers and result.    |
| `-f, --from <path>`     | Restore answers from a previous JSON export.          |
| `--no-notes`            | Skip the optional note prompt after each question.    |

Colour output honours `NO_COLOR`. Every bar is accompanied by its numeric score and level name, so nothing is conveyed by colour alone.

## Comparing over time

The JSON export is the whole persistence story: run the check, keep the file, run it again next quarter and diff the two.

```bash
npx @vantra/maturity-check --json 2026-q1.json
# … a quarter later …
npx @vantra/maturity-check --from 2026-q1.json --json 2026-q2.json
diff <(jq .result.categories 2026-q1.json) <(jq .result.categories 2026-q2.json)
```

Free-text notes are written to local exports only. They are never encoded into a share link.

## How the score works

- Each answer is worth 1–5 points; each question carries a weight of 1–3.
- A category score is the weighted mean of its answered questions.
- The overall score is the unweighted mean of the four category scores, so one dimension cannot dominate.
- Unanswered questions are excluded rather than counted as zero — skipping is not punished.
- Score bands: `< 1.5` level 1, `< 2.5` level 2, `< 3.5` level 3, `< 4.5` level 4, otherwise level 5.

The number is a conversation starter, not a grade. Two honest runs a quarter apart tell you more than any single score.

## Bring your own questions

The engine is domain-agnostic. A catalog is plain JSON validated against [`catalog.schema.json`](../core/schema/catalog.schema.json), so the same tool can assess API governance or content operations. See [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Requirements

Node.js ≥ 20.11.

## License

MIT © Vantra Design
