# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

This repository currently contains **only specification documents** — no source code or build tooling exists yet. Before writing code, check whether that has changed (`ls`, `git status`) since this file may be stale relative to the actual state of the repo.

- `PRD.md` — Product requirements for ODDS (Open Domain Driven Specification): a client-side, browser-only DSL and interactive "playground" for writing DDD (Domain-Driven Design) context maps as text and rendering them as diagrams.
- `RULES-EN.md` / `RULES-PT.md` — The DDD conceptual reference (Team Relationships, Context Map Patterns), the Context Properties (metadata) reference, and the full semantic validation spec for the ODDS language, in English and Portuguese respectively. These two files are parallel translations — keep them in sync if either is edited.
- `GRAMMAR.md` — The authoritative EBNF syntax for the ODDS language (lexical rules, block structure, Context Map syntax). This is the source of truth for anything about the *form* of a valid `.odds` file, as opposed to `RULES.md`, which covers *meaning*.
- `AST_SCHEMA.md` — TypeScript interfaces for the Abstract Syntax Tree the parser must produce, derived 1:1 from `GRAMMAR.md`. This is the data contract between the parser, the semantic validator (Visitor), and the visualizer.
- `TEST_SUITE.md` + `golden-files/` — A golden-file conformance suite (one `<case>/input.odds` + `<case>/expected.json` pair per `DiagnosticCode`, plus auxiliary cases). This is the executable spec: "make the parser/validator pass these N cases" instead of implementing prose rules from scratch. Keep in sync with `GRAMMAR.md`/`AST_SCHEMA.md` — any grammar or AST change should be checked against these cases (spans especially are a target spec, not yet verified against a real parser).
- `GRILLING.md` — ⚠️ **Read this before treating any of the documents above as final.** It records a completed design-review session (25 decisions, D1–D25) that supersedes parts of every other spec file: `[SW]` is removed from the language, external systems become first-class, severity gains a third level, `message` leaves the `Diagnostic` contract, critical errors stop blocking rendering, and ~10 new lint rules are added. **Those decisions are not yet propagated** — by deliberate policy, everything accumulated in `GRILLING.md` and is applied in a single final pass (the only exception already applied is `RULES-EN.md`/`RULES-PT.md` §3). §3 of that file lists every decision with the artifacts it changes; §4 lists the propagation work by file and the order it must be executed in.

## What ODDS is (read PRD.md and RULES-EN.md before implementing)

ODDS is a declarative DSL for describing DDD strategic design: Domains → Subdomains (`core` | `supporting` | `generic`) → Bounded Contexts, plus a Context Map of relationships between contexts. The product is a **100% client-side** web playground (no backend, no data leaves the browser) that parses the DSL, renders it as a live diagram, and runs semantic validation against it.

Key design constraints from the PRD that should shape any implementation:
- **No server-side execution or storage.** Parsing, validation, and rendering all happen locally in the browser. Sharing is done via a shareable URL with the design state encoded into it, not a backend.
- Two diagram views are required: a relationship-flow view and a nested-containment view.
- Auto-save of the current workspace and theme (light/dark) to local storage.
- Export to high-resolution vector images.

### DSL grammar

See `GRAMMAR.md` §2–3 for the authoritative, versioned EBNF (block structure, `context` properties, and the `mapping` block syntax) — don't duplicate it here; it drifts. `title` is optional at all three levels (`domain`/`subdomain`/`context`) and, when present, must be the first line of its block. `context` properties are all optional and order-free among themselves.

### Relationship connectors (Context Map)

| Connector | Meaning |
|---|---|
| `-->` | Upstream (left) → Downstream (right) |
| `<--` | Downstream (left) ← Upstream (right) |
| `<->` | Mutually Dependent |
| `-x-` | Free (no link) |

### Context map pattern tags (bracketed on a relationship line)

`OHS`, `PL`, `S` are **upstream-only** tags. `ACL`, `CF`, `C` are **downstream-only** tags. `SK` and `P` are mutual/symmetric (require `<->`). `SW` marks Separate Ways (must not co-occur with any integration tag). `BBM` flags a Big Ball of Mud system. Note: ODDS deliberately splits classic DDD's single Customer/Supplier pattern into two position-aware tags (`C` and `S`) so each side of a relationship can be validated independently — this is an intentional extension, not a reproduction of the literature.

### Validation model: Critical Errors vs. Design Warnings

The spec (RULES-EN.md) is the authoritative source for exact error/warning strings and trigger conditions. Any parser/validator implementation must distinguish:

- **Critical errors** (block rendering): orphan context (context outside a subdomain), orphan subdomain (subdomain outside a domain), phantom reference (relationship references an undeclared context), duplicate context declaration (same context name reused anywhere in the domain), invalid domain cardinality (a file must declare exactly one `domain`), invalid subdomain type (anything other than `core`/`supporting`/`generic`), misplaced tags (upstream-only tag on the downstream side or vice versa), separation conflict (integration tags combined with `-x-`/`SW`), role conflict (`C` and `S` on the same relationship), and CF+ACL mutual exclusivity.
  - **Layering note (GRAMMAR.md §5.1 / v0.1.9):** orphan context/subdomain are *not* Visitor findings — the grammar stays structurally strict (a `context_decl` is only ever valid inside a `subdomain_decl`, and vice versa for `subdomain`/`domain`), so a misplaced one never becomes a real AST node. The **parser** must instead detect it via panic-mode error recovery (discard the malformed declaration, emit the diagnostic with its span, keep parsing the rest of the file) rather than aborting AST generation the way a plain `SYNTAX_ERROR` would. Invalid subdomain type, by contrast, *is* pure Visitor territory: `GRAMMAR.md` v0.1.8 opened `subdomain_type` to a free `identifier` specifically so the parser never rejects it — validating the value against `core`/`supporting`/`generic` is entirely the Visitor's job (`AST_SCHEMA.md` v0.1.1–0.1.2).
- **Design warnings** (render but flag): a `core` subdomain context accepting `CF` or depending on `BBM` (should use `ACL` instead), generic subdomains acting as broad upstream without `OHS`, excessive use of `SK` across the architecture, and undocumented integration contracts (a relationship arrow with no pattern tag — this warning does **not** apply to `-x-` lines, where no tag is expected).

The suggested implementation approach (RULES-EN.md, "Summary for AST Implementation") is a three-step visitor over the AST: Step 0, verify exactly one `Domain` node exists (stop and report if not); Step 1, traverse subdomains, collecting each declared context and its parent subdomain's type into a symbol table while flagging name collisions; Step 2, traverse relationship nodes to cross-reference existence against that table and validate positional/conflict rules on tags. `AST_SCHEMA.md` §1 is the authoritative list of stable `DiagnosticCode`s (syntax and semantic) — add a code there before adding a new rule to RULES.md.

## Agent skills

### Issue tracker

Issues live in GitHub Issues (github.com/fbadaro/odds). See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context layout — `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Working in this repo before code exists

If asked to scaffold the implementation, confirm the target stack with the user rather than assuming one — the PRD specifies product behavior and constraints (client-side only, DSL grammar, validation rules) but not a framework, parser toolchain, or diagram-rendering library. Once real source and tooling exist, this file should be updated with actual build/lint/test commands and the real code architecture.
