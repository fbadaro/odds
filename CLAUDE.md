# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

This repository currently contains **only specification documents** — no source code or build tooling exists yet. Before writing code, check whether that has changed (`ls`, `git status`) since this file may be stale relative to the actual state of the repo.

- `PRD.md` — Product requirements for ODDS (Open Domain Driven Specification): a client-side, browser-only DSL and interactive "playground" for writing DDD (Domain-Driven Design) context maps as text and rendering them as diagrams.
- `RULES-EN.md` / `RULES-PT.md` — The *meaning* of the language: the conceptual model (§0), every validation rule with its code, severity, phase, scope and trigger (§1–§2), the validation pipeline (§3), suppression (§4), rendering (§5) and the compatibility policy (§6). These two files are parallel translations — **keep them in sync in the same pass if either is edited.**
- `GRAMMAR.md` — The authoritative EBNF *form* of a valid `.odds` file (lexical rules, block structure, Context Map syntax).
- `AST_SCHEMA.md` — TypeScript interfaces for the AST the parser must produce, derived 1:1 from `GRAMMAR.md`. §1.3 is the **normative catalogue of every `DiagnosticCode`**, with its phase, default severity and `data` keys — this is the data contract between parser, validator (Visitor) and visualizer.
- `MESSAGES.md` — The message catalogue: one text template per code, PT + EN, with named placeholders. Message text is *not* part of the diagnostic contract; it is rendered from here.
- `TEST_SUITE.md` + `golden-files/` — A golden-file conformance suite (44 cases, one per `DiagnosticCode` plus auxiliaries). This is the executable spec: "make the parser/validator pass these 44 cases" instead of implementing prose rules from scratch.
- `CHANGELOG.md` — Two independent versioning axes: the **ODDS Language Version** (what a `.odds` file *means*, and what travels in the shareable URL) and the editorial version of each document. Do not conflate them.
- `GRILLING.md` — Historical record of the design review that produced the current state (25 decisions, D1–D25). **Its decisions were fully propagated on 2026-08-14** — it is now a *why* document, not a to-do list. Read it when you need the rationale behind a decision; do not read it as pending work. It was deliberately *not* rewritten after propagation, so it still uses names the execution later changed — the glossary right below its closing banner translates every one of them, and the artifact always wins over this file.
- `PROPAGATION-MAP.md` — The *where*, to `GRILLING.md`'s *why*: D1–D25 mapped to the artifact and section each decision actually landed in, verified file by file, plus the six places the plan and the execution diverged. Not normative — read it to answer "was this really propagated, and to where?", never as a source of behaviour. Decisions taken from now on go to `docs/adr/`, not into this table; D1–D25 is a closed set.
- `docs/adr/` — the *why* of everything decided from 2026-09-05 on, one numbered, immutable file per decision, indexed in its `README.md`. Five mandatory sections; the two that carry the weight are **Alternativas consideradas** (what makes a decision reversible — whoever reopens it starts there) and **Reversão** (the signal that would indicate error, the cost of going back, what has been built on top). `ADR-0001` is the mechanism deciding itself. Never edited to change its mind and never deleted — superseded by a later ADR, with the pair linked both ways.
- `HEALTH.md` — The health score of the model: six weighted dimensions (0–100), a typed catalogue of bonuses and penalties, and the open debts. It measures *coherence of the model*, not progress or volume — it is neither a version nor a changelog. **Update it in the same pass as any normative change**, per its §6 protocol. Run `python3 .claude/skills/health-check/scripts/health_check.py` (15 deterministic checks, stdlib only, ~18 lines of output; `-v` for the evidence behind each one, `--json` for `score`/`failures`) instead of reading the file to find out where things stand — the `health-check` skill owns the script and drives the whole flow. Dimensions 3 and 6 are not mechanizable and are scored by a model under the rubrics in §9, criterion by criterion with cited evidence. Five of the checks verify the scoreboard's own arithmetic — against the debt ledger, the rubrics, the history ledger, and the §8 table describing the checks themselves — so a hand-picked score fails.

**When adding a rule, the order is fixed:** `AST_SCHEMA.md` §1.3 first (code + phase + `data` keys), then `RULES.md` (both languages), then `MESSAGES.md` (both languages), then a golden file. A code without a phase has no defined position in the emitted array and cannot be tested. The pass closes with two entries, never one: `CHANGELOG.md` (what changed) and `HEALTH.md` (what it did to the model).

## What ODDS is (read PRD.md and RULES-EN.md before implementing)

ODDS is a declarative DSL for describing DDD strategic design: Domains → Subdomains (`core` | `supporting` | `generic`) → Bounded Contexts, plus an `external { }` block for third-party systems, plus a Context Map of relationships between contexts. The product is a **100% client-side** web playground that parses the DSL, renders it as a live diagram, and runs semantic validation against it.

Key design constraints from the PRD:
- **No server-side execution or storage.** Parsing, validation, and rendering all happen locally in the browser. Sharing is a URL with the design state (and the language version) encoded into it, not a backend.
- Two diagram views are required, with **deliberately different expressive power** (PRD §4.4): a relationship-flow view and a nested-containment view. `[BBM]` appears only in the flow view; the containment view draws the `external` block *outside* the domain boundary.
- Auto-save of the current workspace and theme (light/dark) to local storage.
- Export to high-resolution vector images — **including the error markers** currently on the canvas.

### DSL grammar

See `GRAMMAR.md` §2–3 for the authoritative, versioned EBNF — don't duplicate it here; it drifts. Points worth knowing before you read it:
- A `context` is only ever valid inside a `subdomain` or inside the single, anonymous `external { }` block, which sits between the subdomains and the `mapping`.
- `title` is optional at all three levels and, when present, must be the first line of its block. `context` properties are all optional and order-free among themselves.
- **Comments are not all discardable.** A line comment starting with `odds-disable-next-line` is a suppression directive and must survive to the validator.

### Relationship connectors (Context Map)

| Connector | Meaning |
|---|---|
| `-->` | Upstream (left) → Downstream (right) |
| `<--` | Downstream (left) ← Upstream (right) |
| `<->` | Mutually Dependent |
| `-x-` | Free / **Separate Ways** |

### Tags

There are **nine** tags, in two different categories — the distinction is load-bearing, not cosmetic (`RULES.md` §0.2):

- **Eight Context Map Pattern tags**, each valid only on specific connectors and sides: `OHS`, `PL`, `S` are upstream-only on directional lines; `ACL`, `CF`, `C` are downstream-only on directional lines; `SK` and `P` are valid **only** on `<->` and **must be declared on both sides** (no inference — `INCOMPLETE_MUTUAL_TAG`). Any pattern tag on `-x-` is `SEPARATION_CONFLICT`.
- **`BBM`**, which is *not* a pattern tag. It characterises the system rather than the contract, and is therefore the only annotation with no position rule and no conflict rule — legal on any connector, any side, including `-x-`.

Two things that no longer exist and should not be reintroduced: the `[SW]` tag (the `-x-` connector carries Separate Ways on its own; writing `[SW]` produces `REMOVED_CONSTRUCT`) and the `_WARNING` suffix on code names (severity is a field, never part of the name).

Note: ODDS deliberately splits classic DDD's single Customer/Supplier pattern into two position-aware tags (`C` and `S`) so each side can be validated independently — an intentional extension, not a reproduction of the literature. That is also why declaring only one of them is a `warning`, while declaring only one side of `[SK]`/`[P]` is an `error`.

## Validation model

`RULES-EN.md` is authoritative; `AST_SCHEMA.md` §1.3 is the code catalogue. The five things most likely to be got wrong:

1. **Three severities, and none of them block rendering.** `error` (the model is incoherent) · `warning` (the design is risky) · `info` (hygiene). The diagram **degrades per element** — the offending element is drawn visibly marked. Only a pure `SYNTAX_ERROR` freezes the last good diagram, and that frozen diagram must be marked stale. Every intermediate keystroke is a syntax error, so strict blocking would blank the canvas as the user types.
2. **Diagnostics carry `data`, not `message`.** A `Diagnostic` is `severity` + `code` + `span` + `data: Record<string, string>`. The sentence is rendered separately from `MESSAGES.md`. Never put a locale, an emoji, or a severity word inside the validator core.
3. **Six phases, and the root-error principle.** All rules of the same phase run and report; an element that produced an `error` is recorded as *declared but invalid* and leaves every **later** phase — so no derived diagnostics, and fixing is iterative. Discarded declarations must still be registered (invalid) in the symbol table, or the `ORPHAN_CONTEXT` → `PHANTOM_REFERENCE` cascade comes back.
4. **The emission order is normative** (`RULES.md` §3.3): phase → start line → start column → end column → code alphabetically. The golden files assert the whole array by structural equality.
5. **Relationship identity is the unordered pair `{left, right}`.** One pair, one relationship, one edge — a second line for the same pair is `DUPLICATE_RELATIONSHIP` whether it repeats, contradicts, or splits tags. Aggregate rules count distinct relationships, never lines.

Suppression (`RULES.md` §4) is line-scoped only, with a mandatory justification, lives in the file, silences one code (not the line), and never reaches an `error`.

Two admission criteria are mandatory for any new rule (`RULES.md` §0.4): it must not presuppose that the user controls the system being judged (the authorship principle), and its fix must be distinct from every existing rule's fix. And one boundary must not be crossed: **tags are validatable contracts, context properties are documentation** — no property ever feeds a rule's trigger. That is the promise that lets a user fill in `team` without fear of being judged for it.

## Agent skills

### Issue tracker

Issues live in GitHub Issues (github.com/fbadaro/odds). See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context layout — `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

### Registro de decisões — write ADRs without asking

**Standing authorization (ADR-0001).** When you take a decision that meets all three tests below, write the ADR yourself, in the same pass, without asking permission. Announce it in one line; do not request approval. Asking each time puts friction on the mechanism, and a mechanism with friction stops being used — which is precisely how a decision record dies.

The three tests, all of which must hold:
1. **More than one plausible way out existed.** Applying what `GRAMMAR.md` already mandates is reading a requirement, not deciding.
2. **Someone will reopen it** — or will look at the result in six months and ask "why like this?".
3. **Undoing costs more than redoing.** A variable name is a `sed`; a toolchain is not.

Yes: stack, parser approach, repo structure, layout library, URL payload format, adopting or refusing a dependency, changing a working protocol. No: bug fixes, renames, adding a rule through the fixed cycle above (that closes with `CHANGELOG.md` + `HEALTH.md`, not an ADR — unless the rule required a conceptual choice that `RULES.md` §0.4's two admission criteria don't settle on their own). **When in doubt, write it.**

Invoke the `adr` skill; it owns the format, the allocator (`new_adr.py`) and the closing flow. `health_check.py` **C16** verifies the ledger's integrity — but it cannot detect a decision that was never written down, and that gap is judgment, named in ADR-0001.

## Working in this repo before code exists

If asked to scaffold the implementation, confirm the target stack with the user rather than assuming one — the specs define product behavior, grammar, AST and validation rules, but not a framework, parser toolchain, or diagram-rendering library. Once real source and tooling exist, this file should be updated with actual build/lint/test commands and the real code architecture.

The suite in `golden-files/` is the natural first target: it is executable, it covers every diagnostic code, and its spans are a specification *target* that has never been checked against a real parser — expect to reconcile tokenization details, and fix the suite when the parser is right.
