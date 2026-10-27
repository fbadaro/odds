---
paths:
  - "packages/core/**"
  - "golden-files/**"
---

# Working in @odds/core

## The validation model, where it is most often got wrong

- **Six phases, and the root-error principle read broadly** (`RULES-EN.md` §3.1). Every rule of a phase runs and reports. An element that produced an `error` is *declared but invalid* and leaves the entire later pipeline, taking its children with it, so fixing is iterative by design.
- **A discarded declaration still enters the symbol table, as invalid** (`ProgramNode.discarded`, `GRAMMAR.md` §5.1 step 3). That registration is what keeps one misplaced context from producing `ORPHAN_CONTEXT` plus a false `PHANTOM_REFERENCE`.
- **Emission order is normative** (`RULES-EN.md` §3.3): phase → start line → start column → end column → code alphabetically.
- **A relationship is the unordered pair `{left, right}`.** A second line for the same pair is `DUPLICATE_RELATIONSHIP` whether it repeats, contradicts or splits tags, and aggregate rules count relationships, never lines.
- **Suppression** (`RULES-EN.md` §4) is line-scoped, carries a mandatory justification, silences one code, and stops short of `error`. An `odds-disable-next-line` comment is a directive the lexer keeps for the validator.
- **Span anchors:** `ROLE_CONFLICT` and `PROTECTION_CONFLICT` on the whole tag group, `PL_WITHOUT_OHS` on the tag, `MUTUAL_TAG_WITH_EXTERNAL` once per relationship, `DOMAIN_WITHOUT_CORE` on the `domain` header, `EXCESSIVE_SHARED_KERNEL` on the `mapping` keyword, and `INVALID_DOMAIN_CARDINALITY` with zero domains on the whole file.

## The parser

- Chevrotain's `endColumn` is inclusive, and `AST_SCHEMA.md` §1 wants `end` exclusive. `spanOf()` in `lexer.ts` is the single conversion: read every span through it.
- Chevrotain 11.2.0 tokenizes nothing, silently, from a Unicode property escape (`\p{L}` with the `u` flag). `Identifier` uses a custom matcher so that any Unicode letter starts an identifier, as `GRAMMAR.md` §1 says; a Latin-1 range would pass the PT-BR tests and narrow the grammar. Both behaviours are locked in `test/lexer.test.ts`.
- The three recovery cases of `GRAMMAR.md` §5.1 are explicit productions, with Chevrotain's own recovery off (ADR-0006). They are the only deviations from the EBNF; a fourth one reopens ADR-0002.
- `SYNTAX_ERROR.data.expected` is derived from the grammar by `computeContentAssist`, which is why every token carries a `label` with its grammar literal.
- `PENDING` in `test/conformance.test.ts` is empty and asserts both directions, so a listed case must still fail. Use it only to land a phase in stages.
