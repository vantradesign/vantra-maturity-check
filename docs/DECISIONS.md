# Decisions

Short records of choices that are expensive to reverse. Each says what was decided, why, and what was rejected — the rejected options matter most, because they are the ones that get proposed again.

## 1. The web app is the primary surface; the CLI is secondary

**Decided:** the browser is where this tool is meant to be used. The CLI stays at its current scope and gains no further product features beyond CI use.

**Why:** the people who can honestly answer "is accessibility behaviour documented per component" are design system leads, designers and design ops. A meaningful share of them will not run `npx`. A maturity check also works best as a workshop instrument — a shared screen, all five options visible at once, the freedom to jump back to question 7 — which a terminal prompt list structurally cannot offer.

**Why the CLI was still built first:** it forced `@vantra-design/maturity-core` to be pure, dependency-free and platform-neutral before any framework could leak into it. That was the right engineering sequencing, and the web app inherits a tested engine.

**Consequence:** do not invest in CLI features that duplicate the web app. The CLI's remaining differentiator is running non-interactively in CI against a stored answers file.

## 2. Offline by default, with the benchmark contract defined up front

**Decided:** the tool makes no network calls. `packages/core/src/benchmark.ts` defines the wire format for an optional, anonymous benchmark contribution, but no endpoint exists and nothing is sent.

**Why define it now:** the payload shape determines whether data collected on day one is comparable with data collected in a year. Retrofitting the team-context bands later would invalidate everything gathered before. Writing the consent copy now also means the CLI and the web app cannot end up promising different things.

**Why not collect yet:** an endpoint means a database, a retention policy, a privacy notice and DSGVO obligations. That work should follow evidence that people finish the assessment at all, not precede it.

**The claim today** — no account, no telemetry, no network calls — stays true and unqualified. When submission ships it becomes: _nothing leaves your machine unless you explicitly opt in, and your notes never do, by construction._

**What makes that claim honest:** `toBenchmarkSubmission()` reads only option scores and fixed context bands. There is no code path from `Answer.note` into a submission, and `test/benchmark.test.ts` asserts that every string in a built payload is a known id, band or structural key. If that test fails, the consent copy has become a lie.

**Privacy details that are deliberate, not incidental:**

- The timestamp is reduced to `YYYY-MM`. A precise timestamp plus a score profile identifies a submission.
- Scores are sent, not option ids. The number is the datum.
- Context is three wide bands, all optional. No company, no sector, no free text.
- Unknown context values are dropped rather than forwarded, so a future UI bug cannot leak a field the contract never anticipated.

## 3. No self-hosted tier with a database

**Decided:** rejected. The static bundle is the self-host story — deploy the files anywhere, nothing leaves the network, no database, no payment.

**Why:** the idea contradicts itself. Benchmarks require pooled data, so a single-tenant instance can never show "the median comparable team sits at 2.6". Meanwhile the motivation for self-hosting — data must not leave our infrastructure — is already fully satisfied by a client-side-only app. A self-hosted deployment with a database would cost a storage adapter, config surface, migrations, docs and support, in exchange for nothing the free static version does not already provide.

**What people might actually pay for, if this is ever monetised:** aggregation across several product teams, longitudinal tracking over quarters, percentile position against comparable organisations, board-ready exports. That is a team-analytics product with auth and orgs — a deliberate, separate project, not a hosting fee on a 24-question assessment.

## 4. Catalog credibility before a second surface

**Decided:** question provenance, a written methodology, an assumption audit and a next-step level review come before the web app is built.

**Why:** the questions are the product; both surfaces are renderers. A polished UI over questions nobody can defend is a worse asset than a plain UI over questions that hold up when a design system lead pushes back on question 14.

## 5. The npm scope is `@vantra-design`, not `@vantra`

**Decided:** publish as `@vantra-design/maturity-check` and `@vantra-design/maturity-core`. Both packages were renamed before the first publish.

**Why:** the org already owns and publishes under `@vantra-design` — `@vantra-design/core` is on npm at `0.1.2` — and `vantra-governance-suite/DECISIONS.md` §1 fixes that scope for the whole organisation. This repo had been authored against a third spelling, `@vantra`, which was registered nowhere and matched no other package in the org.

**Why it had to be settled before publishing rather than after:** an npm name can be unpublished for 72 hours and is then burned permanently. Shipping under `@vantra` would have split the org's npm surface across two scopes for good, and made the governance-suite decision record false.

**Rejected:** registering the `@vantra` org because `npx @vantra/maturity-check` is shorter to type. Three characters of convenience is not worth a permanently fragmented namespace, and the scope's availability was never verified.

**Note on the three spellings** — all correct in their own namespace, which is exactly why this is easy to get wrong:

| Namespace           | Spelling         |
| ------------------- | ---------------- |
| GitHub organisation | `vantradesign`   |
| npm scope           | `@vantra-design` |
| Domain              | `vantra.design`  |
