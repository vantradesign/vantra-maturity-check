---
'@vantra-design/maturity-check': minor
'@vantra-design/maturity-core': minor
---

First working release: an interactive CLI that scores a design system across documentation, versioning, governance and adoption, and returns three level-appropriate next steps per dimension.

- 24 bilingual (EN/DE) questions with weighted, graded answer options and per-question help text
- Weighted scoring with equal weight per dimension; unanswered questions are excluded rather than counted as zero
- Terminal, Markdown and JSON output rendered by the shared engine, so every surface produces the identical report
- JSON exports can be re-imported (`--from`) to compare two runs over time
- URL-safe share payloads that never carry free-text notes
- Catalogs are validated data, so the engine can assess other domains without a code change
- The interactive flow is covered end to end by tests that drive the built binary through stdin
