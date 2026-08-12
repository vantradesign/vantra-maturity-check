# Methodology

How the questions were chosen, how the score is calculated, and — the part most maturity models leave out — what this instrument cannot tell you.

Read this before quoting a number from it in a planning meeting.

## What this measures

Whether a set of practices is **in place and repeatable**. Not whether your design system is good, and not whether your products are well designed.

A team can score 4.5 while shipping components nobody enjoys using, and a team can score 2.0 while running a genuinely beloved system that happens to live in one person's head. The second team's risk is real — it is one resignation away from a rewrite — which is what the score is trying to surface. But it is a statement about process resilience, not about craft.

## Where the questions come from

The catalog does not invent a new maturity model. It takes criteria that recur across published models and turns them into questions a team can answer honestly in fifteen minutes.

Every question in `packages/core/src/catalogs/design-system-v1/` carries a `sources` array naming the models it derives from and the specific criterion it draws on. The bibliography lives in `meta.json` under `sources`. A test in `packages/core/test/provenance.test.ts` fails the build if a question has no citation, if a citation names no criterion, or if it references a source that is not declared.

The models drawn on:

| Id         | Work                                                                       | Used mainly for                                                              |
| ---------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `sparkbox` | Design System Maturity Model, Sparkbox                                     | Documentation coverage, adoption measurement, support                        |
| `rangle`   | Design System Maturity Model, Rangle.io                                    | Distribution, tooling, design–code parity                                    |
| `curtis`   | Nathan Curtis' governance, contribution and adoption writing (EightShapes) | Contribution models, team funding, deprecation, enablement                   |
| `invision` | Design Maturity Model, InVision                                            | Organisational investment, leadership positioning                            |
| `cmmi`     | Capability Maturity Model Integration                                      | The level logic itself: ad hoc → repeatable → defined → managed → optimising |
| `semver`   | Semantic Versioning 2.0.0                                                  | Version discipline, breaking-change communication                            |
| `wcag`     | WCAG 2.2, W3C                                                              | Accessibility documentation and sign-off                                     |

The URLs in the bibliography point at publisher level rather than at deep links, because deep links to blog posts rot faster than the ideas in them. Citing a model is not an endorsement by its authors, and none of them were involved in this tool.

## How the score is calculated

The full rules, with examples, are in [`SCORING.md`](../SCORING.md). In short:

1. Each answer option is worth **1 to 5 points**. Option 5 always describes a practice that is automated, measured or contractual — never merely "we are good at this".
2. Each question has a **weight of 1 to 3**. Weight 3 marks a practice that other practices depend on: you cannot deprecate what you never versioned.
3. A **category score** is the weighted mean of its answered questions.
4. The **overall score** is the _unweighted_ mean of the four category scores.
5. Unanswered questions are excluded rather than counted as zero. Skipping is not punished.
6. **Level bands:** <1.5 → 1, <2.5 → 2, <3.5 → 3, <4.5 → 4, otherwise 5.

### Two choices worth arguing with

**Categories are weighted equally.** Documentation counts as much as adoption, which is defensible as a default and wrong for many teams. A system with 95% adoption and thin documentation is in a different position from the reverse, and one overall number cannot express that. This is why the report always shows the four category scores, and why the level bands are wide: the category profile carries more information than the single figure on top of it.

**Level 5 is deliberately hard.** Reaching it requires automation and measurement, not diligence. Most healthy design systems sit at 3. If your result feels harsh, compare the _shape_ across categories and the change over time rather than the absolute number.

## What the catalog assumes

Every assessment encodes a worldview. These are the assumptions built into this one, stated so you can decide whether they hold for you.

- **A code implementation exists.** Distribution, versioning and deprecation questions assume the system ships as something teams install. A Figma-only system will score low on versioning in a way that may not reflect a real problem.
- **The system serves more than one consuming team.** Governance, contribution and adoption questions lose meaning when the design system team and the product team are the same three people.
- **The organisation is large enough for the top options to exist.** `gov-01` in particular tops out at "a funded core team plus federated contributors", which a fifteen-person company cannot reach and does not need. Its help text says so, but the arithmetic still caps small teams at a lower ceiling. Comparing your score against a similar band of team size matters more than the raw figure.
- **A web-oriented toolchain.** The vocabulary (packages, registries, component workshops) fits web work best. Native mobile or multi-platform systems can answer every question, but the wording will occasionally feel like a translation.
- **Self-report is honest.** There is no evidence check anywhere in this tool. A team that wants a flattering number will get one. The questions are written to make self-deception awkward — asking _how you know_ your adoption number right after asking what it is — but they cannot prevent it.
- **One respondent speaks for the team.** Running it separately with a designer, an engineer and a product manager and then comparing answers is usually more informative than the score itself. Disagreement about the current state is a finding.

## What the score cannot do

- **Predict outcomes.** No study links a score here to delivery speed or product quality. The relationships are plausible and widely reported by practitioners; they are not measured.
- **Compare across organisations.** Not yet, and not honestly, until pooled data exists. Comparison is the motivation behind the benchmark contract described in [`DECISIONS.md`](./DECISIONS.md), which today collects nothing.
- **Serve as an evaluation of a person.** A low score is a description of an under-resourced situation, usually a decision made above the team. Using this in a performance review is a misuse of it, and the report's wording deliberately gives no ammunition for that.

## Changing the catalog

The content carries its own semantic version, separate from the package version.

- **Patch** — typos, clearer wording, translation fixes. Scores stay comparable.
- **Minor** — added help text, new sources, an added question. Old results remain broadly comparable; the added question simply counts as unanswered.
- **Major** — changed option scores, changed weights, removed or reworded questions in a way that changes what an answer means. Stored results from earlier versions are no longer comparable and should not be charted against new ones.

Every export records `catalogVersion` so a future comparison can tell whether it is allowed to draw the line between two points.
