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
  - "golden-files/**"
  - "packages/messages/**"
  - "scripts/**"
---

# Editing the specification

- **A new rule has a fixed order:** `AST_SCHEMA.md` §1.3 first (code + phase + `data` keys), then `RULES-EN.md` and `RULES-PT.md`, then `MESSAGES.md` in both languages, then a golden file. A code without a phase has no position in the emitted array and cannot be tested.
- **Admission criteria (`RULES-EN.md` §0.4):** a rule must not presuppose that the user controls the system it judges, and its fix must differ from every existing rule's fix. A rule rejected on these grounds is a healthy outcome; record the rejection.
- **`RULES-EN.md` and `RULES-PT.md` change together**, in the same pass; check C5 of `npm run check:spec` compares their structure.
- **A normative pass closes green on `npm run check:spec`.** If it changed what a `.odds` file means, it also adds a short entry under *ODDS Language Version* in `CHANGELOG.md`, bumped by the table there (`RULES-EN.md` §6). That version travels in the share URL; the documents carry no version of their own, and the rest of the history is in git.
- **Deliberate asymmetry:** ODDS splits classic Customer/Supplier into the position-aware `C` and `S`, so declaring only one of them is a `warning`, while declaring one side of `SK`/`P` is an `error`.
- **Removed for good:** the `[SW]` tag (`-x-` carries Separate Ways on its own, and writing `[SW]` yields `REMOVED_CONSTRUCT`), severity in a code's name (it lives only in `severity`), and `message` on `Diagnostic`. Check C6 of `npm run check:spec` enforces all three.
- **`messages.json` is generated:** edit the tables in `MESSAGES.md`, then run `npm run generate:messages`. A test fails when the two drift.
- **The golden files arbitrate spans** (`TEST_SUITE.md` §4) and assert the whole diagnostic array by structural equality.
