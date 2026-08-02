# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

This repository currently contains **only specification documents** — no source code, build tooling, or git repository has been initialized yet. Before writing code, check whether that has changed (`ls`, `git status`) since this file may be stale relative to the actual state of the repo.

- `PRD.md` — Product requirements for ODDS (Open Domain Driven Specification): a client-side, browser-only DSL and interactive "playground" for writing DDD (Domain-Driven Design) context maps as text and rendering them as diagrams.
- `RULES-EN.md` / `RULES-PT.md` — The DDD conceptual reference (Team Relationships, Context Map Patterns) and the full semantic validation spec for the ODDS language, in English and Portuguese respectively. These two files are parallel translations — keep them in sync if either is edited.

## What ODDS is (read PRD.md and RULES-EN.md before implementing)

ODDS is a declarative DSL for describing DDD strategic design: Domains → Subdomains (`core` | `supporting` | `generic`) → Bounded Contexts, plus a Context Map of relationships between contexts. The product is a **100% client-side** web playground (no backend, no data leaves the browser) that parses the DSL, renders it as a live diagram, and runs semantic validation against it.

Key design constraints from the PRD that should shape any implementation:
- **No server-side execution or storage.** Parsing, validation, and rendering all happen locally in the browser. Sharing is done via a shareable URL with the design state encoded into it, not a backend.
- Two diagram views are required: a relationship-flow view and a nested-containment view.
- Auto-save of the current workspace and theme (light/dark) to local storage.
- Export to high-resolution vector images.

### DSL grammar (block syntax)

```
domain [DomainName] {
  subdomain [core | supporting | generic] [SubdomainName] {
    context [ContextName]
    context [NextContextName] [OptionalAttribute]
  }
}
```

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

- **Critical errors** (block rendering): orphan context (context outside a subdomain), orphan subdomain (subdomain outside a domain), phantom reference (relationship references an undeclared context), invalid subdomain type (anything other than `core`/`supporting`/`generic`), misplaced tags (upstream-only tag on the downstream side or vice versa), separation conflict (integration tags combined with `-x-`/`SW`), role conflict (`C` and `S` on the same relationship), and CF+ACL mutual exclusivity.
- **Design warnings** (render but flag): a `core` subdomain context accepting `CF` or depending on `BBM` (should use `ACL` instead), generic subdomains acting as broad upstream without `OHS`, excessive use of `SK` across the architecture, and undocumented integration contracts (a relationship arrow with no pattern tag — this warning does **not** apply to `-x-` lines, where no tag is expected).

The suggested implementation approach (RULES-EN.md, "Summary for AST Implementation") is a two-pass visitor over the AST: first collect all declared contexts and their parent subdomain's type into a symbol table, then traverse relationship nodes to cross-reference existence and validate positional/conflict rules on tags.

## Working in this repo before code exists

If asked to scaffold the implementation, confirm the target stack with the user rather than assuming one — the PRD specifies product behavior and constraints (client-side only, DSL grammar, validation rules) but not a framework, parser toolchain, or diagram-rendering library. Once real source and tooling exist, this file should be updated with actual build/lint/test commands and the real code architecture.
