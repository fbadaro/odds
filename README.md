# ODDS

**Open Domain Driven Specification.** Write the strategic design of Domain-Driven Design as text. A linter judges it, and the playground draws it as a map while you type.

[**Try the playground →**](https://fbadaro.github.io/odds/) · [The language](#the-language-in-one-minute) · [Specification](#specification-first) · [Architecture](docs/ARCHITECTURE.md) · [Português](README.pt-BR.md)

[![CI](https://github.com/fbadaro/odds/actions/workflows/ci.yml/badge.svg)](https://github.com/fbadaro/odds/actions/workflows/ci.yml)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/odds-dark.svg">
  <img alt="The ODDS project drawn as an ODDS map: Validation in the core subdomain, Parsing, Layout and Playground in supporting subdomains, Messages in a generic one, with Chevrotain and Base UI as external contexts" src="docs/odds-light.svg">
</picture>

<sub>This map is ODDS itself, written in ODDS ([`docs/odds.odds`](docs/odds.odds)) and drawn by its own layout. `npm run generate:map` regenerates it, and a test fails if the picture falls behind the file.</sub>

## Why ODDS

**Text, not drawings.** A Context Map in a drawing tool goes stale the day after the workshop. A `.odds` file lives next to the code, shows up in diffs, and gets reviewed in pull requests.

**An opinionated linter.** ODDS does more than check that a file is well formed: it judges the design. The 35 diagnostic codes come in three severities:

- `error`: the model is incoherent.
- `warning`: the design is risky.
- `info`: documentation hygiene.

```odds
// Checkout lives in a core subdomain, PaymentGateway in a generic one
mapping {
  Checkout [CF] <-- PaymentGateway
}
```

```text
warning CONFORMIST_CORE      Strategic risk: the Core Domain context `Checkout` is conforming
                             to another system's model. Consider an `[ACL]` to protect your
                             competitive advantage.
warning GENERIC_WITHOUT_OHS  `PaymentGateway` is Upstream and belongs to the generic subdomain
                             `Payments`, but exposes no `[OHS]`. Generic solutions should provide
                             well-defined services; without one, the coupling is hidden.
```

**Disagree on the record.** A conscious decision against a rule is architecture worth keeping, so a suppression lives in the file, names one code, and requires a justification. It never reaches an `error`.

```odds
// odds-disable-next-line CONFORMIST_CORE: corporate ERP, business decision, cost accepted
Checkout [CF] <-- CorporateERP
```

**The map never blanks out.** Every half-typed file is a syntax error, so no severity blocks the map: an invalid relationship is drawn as a dashed red line. Only a file with no tree at all freezes the last good map, and that map is marked stale.

**No server.** Parsing, validation and drawing run in the browser, and the file never leaves it.

| | [Context Mapper](https://contextmapper.org/) | ODDS |
|---|---|---|
| Runs on | Xtext/Java, an IDE plugin or Gitpod | The browser, with nothing to install |
| Opinion | Neutral notation | A catalogue of DDD practice that judges the design |
| Feedback | Model generation | Diagnostics as you type, each tied to its line and to the element on the map |

## The language in one minute

```odds
domain ECommerce {
  subdomain core Sales {
    description: "Turn intent to buy into a paid order"
    context Checkout
  }
  subdomain generic Payments {
    context PaymentGateway { maturity: mature  team: "Payments Squad" }
  }
  external {
    context Stripe
  }
  mapping {
    Checkout       [ACL] <-- [OHS, PL] PaymentGateway
    PaymentGateway [ACL] <--           Stripe
  }
}
```

A file holds one `domain`. Inside it come the `subdomain`s, typed `core`, `supporting` or `generic`, each holding its Bounded Contexts. After them comes one `external` block for third parties, and last the `mapping`. Properties such as `team` or `maturity` are documentation, and no rule ever reads them. Tags are the contracts the linter validates.

| Connector | Team Relationship |
|---|---|
| `A --> B` | A is upstream, B downstream |
| `A <-- B` | A is downstream, B upstream |
| `A <-> B` | Mutually dependent |
| `A -x- B` | Separate Ways: a deliberate decision not to integrate |

| Tag | Pattern | Where it goes |
|---|---|---|
| `OHS` · `PL` · `S` | Open-Host Service · Published Language · Supplier | Upstream side of `-->` / `<--` |
| `ACL` · `CF` · `C` | Anti-Corruption Layer · Conformist · Customer | Downstream side of `-->` / `<--` |
| `SK` · `P` | Shared Kernel · Partnership | Both sides of `<->` |
| `BBM` | Big Ball of Mud, which describes the system rather than the contract | Any connector, any side |

The grammar is in [`GRAMMAR.md`](GRAMMAR.md), and every rule with its rationale is in [`RULES-EN.md`](RULES-EN.md).

## The playground

- **Two views of one map.**
  - The **flow view** answers *"how does this integrate?"*, with lines and tags.
  - The **containment view** answers *"how is this organised?"*, with territories and no lines.

  Switching views moves no piece.
- **Navigation.** Select a context to light up its relationships, a territory to focus its subdomain, or a line to isolate one relationship. The inspector shows what the file declares about the selection, together with the diagnostics that concern it.
- **Diagnostics panel.** It counts and filters by severity. Clicking a diagnostic takes you to the line and to the element on the map.
- **Export.** The map exports as an SVG that carries its error markers, because an export without them would document a model that was never valid.
- **Interface language.** The interface is in Brazilian Portuguese for now (ADR-0024). The diagnostic catalogue is already in Portuguese and English.

**Not there yet:**
- [sharing a design by URL](https://github.com/fbadaro/odds/issues/10);
- [auto-save](https://github.com/fbadaro/odds/issues/11);
- [working offline](https://github.com/fbadaro/odds/issues/13);
- [the ghost piece for an unresolved reference](https://github.com/fbadaro/odds/issues/12).

## Specification first

The specification was written before the code, and it is normative: when the two disagree, the code is wrong or the disagreement is a finding.

| Question | Source |
|---|---|
| What a `.odds` file means | [`RULES-EN.md`](RULES-EN.md), with [`RULES-PT.md`](RULES-PT.md) as its translation |
| The syntax | [`GRAMMAR.md`](GRAMMAR.md) |
| The AST, and every diagnostic code with its phase and data | [`AST_SCHEMA.md`](AST_SCHEMA.md) |
| Message text, in Portuguese and English | [`MESSAGES.md`](MESSAGES.md) |
| Expected output | [`TEST_SUITE.md`](TEST_SUITE.md) and the 44 [`golden-files/`](golden-files/) |
| Product requirements | [`PRD.md`](PRD.md) |
| The visual system | [`DESIGN.md`](DESIGN.md) |
| The words the project uses | [`GLOSSARY.md`](GLOSSARY.md) |
| What changed in the language | [`CHANGELOG.md`](CHANGELOG.md), the ODDS Language Version |
| Why things are the way they are | [`docs/adr/`](docs/adr/) |

`npm run check:spec` keeps the documents consistent with each other. Among its checks, C17 requires a version bump whenever a pass changes what a `.odds` file means.

## Development

```bash
npm install          # Node 22.12+; npm workspaces
npm run dev          # the playground, on Vite
npm test             # every package and the app, golden files included
npm run typecheck
npm run lint         # the app
npm run check:spec   # the specification's mechanical checks (Python 3, stdlib)
```

| Path | Owns |
|---|---|
| [`packages/core`](packages/core) | Lexer, parser, AST and validator. It knows no message text or locale. |
| [`packages/messages`](packages/messages) | `Diagnostic` and locale in, sentence out, generated from `MESSAGES.md` |
| [`packages/layout`](packages/layout) | Honeycomb geometry and SVG, with no DOM |
| [`apps/playground`](apps/playground) | The product: React 19, Zustand, Base UI, Vite |
| [`golden-files/`](golden-files/) | The specification's executable suite |

[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) has the pipeline, the package boundaries and how the map degrades. [`AGENTS.md`](AGENTS.md) has the working conventions:
- issues are written in Portuguese;
- a branch is named `feature/XXXX-name` after its issue;
- commits follow Conventional Commits, in English.

## License

No license has been chosen yet. Until a `LICENSE` file lands, default copyright applies.

## Related work

[Context Mapper](https://contextmapper.org/) is the prior art for text-based context mapping. [`REFERENCES.md`](REFERENCES.md) lists the other tools and inspirations.
