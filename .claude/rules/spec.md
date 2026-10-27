---
paths:
  - "RULES-EN.md"
  - "RULES-PT.md"
  - "GRAMMAR.md"
  - "AST_SCHEMA.md"
  - "MESSAGES.md"
  - "TEST_SUITE.md"
  - "PRD.md"
  - "CHANGELOG.md"
  - "HEALTH.md"
  - "golden-files/**"
  - "packages/messages/**"
---

# Editing the specification

- **A new rule has a fixed order:** `AST_SCHEMA.md` §1.3 first (code + phase + `data` keys), then `RULES-EN.md` and `RULES-PT.md`, then `MESSAGES.md` in both languages, then a golden file. A code without a phase has no position in the emitted array and cannot be tested.
- **Admission criteria (`RULES-EN.md` §0.4):** a rule must not presuppose that the user controls the system it judges, and its fix must differ from every existing rule's fix. A rule rejected on these grounds is a healthy outcome; record the rejection.
- **`RULES-EN.md` and `RULES-PT.md` change together**, in the same pass, and share one editorial version.
- **A normative pass closes with two entries:** `CHANGELOG.md` for what changed, and `HEALTH.md` for what it did to the model, through the `health-check` skill.
- **Two version axes, never mixed** (`CHANGELOG.md`, top): the ODDS Language Version is what a `.odds` file means and travels in the share URL; each document also has its own editorial version. A normative file names its current version in its own `## Changelog` section, so bump it there and in `CHANGELOG.md`.
- **Deliberate asymmetry:** ODDS splits classic Customer/Supplier into the position-aware `C` and `S`, so declaring only one of them is a `warning`, while declaring one side of `SK`/`P` is an `error`.
- **Removed for good:** the `[SW]` tag (`-x-` carries Separate Ways on its own, and writing `[SW]` yields `REMOVED_CONSTRUCT`), severity in a code's name (it lives only in `severity`), and `message` on `Diagnostic`. Check C6 of `npm run health` enforces all three.
- **`messages.json` is generated:** edit the tables in `MESSAGES.md`, then run `npm run generate:messages`. A test fails when the two drift.
- **The golden files arbitrate spans** (`TEST_SUITE.md` §4) and assert the whole diagnostic array by structural equality.
