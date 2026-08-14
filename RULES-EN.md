# RULES: Semantics of the ODDS Language (English)

> This file is the parallel translation of `RULES-PT.md`. **Any edit here must be mirrored there, in the same pass.** `GRAMMAR.md` owns the *form* of a valid `.odds` file; this file owns its *meaning*.
>
> **Message strings do not live here.** A diagnostic is `severity` + `code` + `span` + `data` (`AST_SCHEMA.md` §1.2); the sentence shown to the user is rendered from `MESSAGES.md`, which holds PT and EN side by side. This file defines **triggers, severities and scope** — that is what an implementation has to get right.

---

## 0. The conceptual model

Sections 1 and 2 are a list of rules. This section is the model those rules come from — read it first, because every rule below is an application of something stated here, and every *future* rule has to answer to §0.4 before being written.

### 0.1 ODDS is an opinionated linter

ODDS is not a neutral notation. Beyond checking structural integrity, the tool **passes judgement on the quality of the strategic design** — that is the differentiator against drawing tools and against other text-based context mappers, and it is asserted here rather than left implicit.

An opinionated linter that is ignored is worse than no linter, so opinion is stratified into three severity levels:

| Severity | Meaning | Blocks rendering? | Suppressible? |
|---|---|:---:|:---:|
| `error` | Integrity or coherence of the model is violated. The element is recorded as *declared but invalid* and leaves the pipeline (§3.1). | No — see §5 | ❌ never |
| `warning` | A reasonably consensual DDD pattern is violated. The model is coherent; the design is risky. | No | ✅ |
| `info` | Documentation hygiene or style opinion. | No | ✅ |

The severity of a rule is a property of the rule, recorded in `AST_SCHEMA.md` §1.3. It is **not** encoded in the code name and **not** encoded in the message text — an implementation must never parse a name or a string to find out how serious something is.

### 0.2 Three categories of annotation

A relationship line carries annotations of three different kinds. They are independent, they answer different questions, and confusing them is the source of most of the ambiguity this language had before it was written down:

| Category | Where it lives in the syntax | Question it answers |
|---|---|---|
| **Team Relationship** | the **connector** (`-->`, `<--`, `<->`, `-x-`) | What is the *shape* of the dependency between the two teams? |
| **Context Map Pattern** | the **tag** (`[OHS]`, `[ACL]`, `[SK]`, …) | What *solution* was applied at the boundary, given that shape? |
| **System characterisation** | `[BBM]`, sole occupant | What *kind of system* is this? |

The first two axes are independent in every combination — you choose the shape of the dependency, and separately the pattern applied on top of it. **Separate Ways is the single cell where the two axes degenerate into one point:** it is the pattern whose application is precisely the *absence* of integration, which makes it indistinguishable from the "Free" dependency shape. There is no solution to choose about a non-dependency.

For that reason, and only that reason, ODDS carries Separate Ways on the **connector** and has no `[SW]` tag. `-x-` alone means *Free / Separate Ways*. A tag that can only ever be redundant or wrong carries zero bits: with `[SW]` in the language, `A -x- B`, `A [SW] -x- B`, `A -x- [SW] B` and `A [SW] -x- [SW] B` were four spellings of one meaning, while `A [SW] --> B` was an error that existed only because the tag existed. Nothing was lost by removing it — in practice, any `-x-` line somebody bothers to write *is* a deliberate decision not to integrate. The DDD pattern name survives where it belongs: in the diagram legend and in the pattern table below, not as a token.

`[BBM]` is the third category because it fails the test for both of the others: it does not describe a solution applied over a dependency, and it does not rename the dependency — it characterises the system on one end of it. That is why `[BBM]` is the only annotation with **no position rule and no conflict rule**: it is legal on any connector and on any side (§1.C). Restricting it to directional lines would turn a limitation of one *rule* into a limitation of the *language*, and would make two legitimate statements inexpressible: *"that ERP is a swamp and that is why we decided not to integrate"* (`-x-`) and *"we feed a third party's swamp"* (`[BBM]` downstream).

**Criterion for any future annotation:** does it describe a solution applied over a dependency, does it merely rename the dependency, or does it characterise a system? The first is a tag; the second is a connector and must not become a tag; the third joins `[BBM]`.

### 0.3 A tag qualifies a relationship, never a context

**Every tag has relationship scope, without exception.** A tag qualifies *one side of one specific relationship*, not the context as a whole. `A` may legitimately be `[CF]` with `X` and `[ACL]` with `Y` — those are two different integrations and two different decisions.

This holds for `[BBM]` too, even though `[BBM]` describes the system rather than the contract. Keeping it a tag preserves a boundary that is cheap to explain and worth more than the convenience it costs:

> **tag = validatable contract · property = documentation**

That boundary is what answers, with no further argument, why `maturity: legacy` triggers nothing and why `team` is free text with no consequence (see Context Properties below). Turning `[BBM]` into a context property would have made it the first normative property, and the promise *"fill in `team` without fear of being judged for it"* would have died with it.

**The accepted cost, recorded as a known limitation:** `[BBM]` must be repeated on every line touching that system, and a context can carry `[BBM]` on one line and not on another. The `INCONSISTENT_BBM` rule (§2) exists to close that hole without touching the boundary — it operates over tags, not over properties.

### 0.4 Two admission criteria for every new rule

The catalogue went from 4 rules to 24 in a single design pass, in a product that validates on every keystroke. Without an explicit brake, a 30-line file turns into eight diagnostics and the user learns to ignore the whole panel. **Both criteria below are mandatory for any rule added from now on**, and each rule in §2 records its answer to the first one.

**1. The authorship principle — does the rule presuppose control over the system?**
Exempt what presupposes authorship; keep what describes *the author's own integration decision*. You do not design a third party's API, so a rule demanding they publish an Open-Host Service is unactionable noise. But *how you integrate* with them is entirely your decision, and it is exactly what the map should document — more so with a third party, not less.

> 📝 **Finding recorded during propagation.** With first-class external contexts (§0.5), the flagship application of this principle became *structural* rather than a special case: an external context belongs to no subdomain, so it has no subdomain type, so `GENERIC_WITHOUT_OHS` and the `CORE_*` rules cannot fire against it at all — no exemption clause needed. The principle is not thereby redundant: it remains the admission test every new rule must pass, and it is what keeps `UNDOCUMENTED_CONTRACT` and the tag rules applying to external contexts instead of being waved through with them.

**2. The distinct-fix criterion — does the rule have a fix of its own?**
If fixing X is identical to fixing Y, X and Y are one rule and must be merged. Its first application was the demotion of `EXCESSIVE_SHARED_KERNEL`: once `CORE_IN_SHARED_KERNEL` existed, the aggregate rule was suggesting a fix another rule already suggested, for the dangerous cases; what was left over ("two shared kernels between supporting subdomains") is not alarming, so it dropped to `info` with a higher threshold.

### 0.5 Known limitations, deliberately accepted

These are choices, not oversights. They are written down so nobody has to rediscover them by hitting them.

1. **A Bounded Context belongs to exactly one Subdomain.** In real DDD, problem space and solution space are related n:m — one context can serve two subdomains. ODDS keeps 1:1 deliberately: n:m would destroy the nested containment view the product requires, and this is the same simplification comparable tools make.
2. **One file, one `domain`.** Maps that span multiple domains are impossible by construction. This is what makes "one file = one shareable URL" coherent.
3. **Third-party systems are first class, via the `external { }` block** — you no longer have to lie that Stripe or another company's ERP is a context of one of *your* subdomains. **Assumed contradiction:** the `external` block is declared *inside* `domain { }`, which by definition does not contain it. It is nested there for syntactic reasons (it preserves the invariant that every `context` lives inside a declared block, and the "one file = one domain" premise). The contradiction is named rather than hidden — and it is cancelled in the only place the user would see it: the containment view draws the external block **outside** the domain boundary, touching it (§5).
4. **`[BBM]` must be repeated on every line** touching that system (§0.3), mitigated by `INCONSISTENT_BBM`.
5. **The two views have different expressive power, deliberately.** `[BBM]` is an annotation *of a relationship*, and the containment view has no lines — so a swamp system looks like any other context there. Deriving the mark on the node (marking a context that carries `[BBM]` on *any* relationship) was rejected: it would build a visual inference on data that `INCONSISTENT_BBM` itself admits may be contradictory, making the drawing assert more than the text. The two views answer different questions — *"how is this organised?"* and *"how does this integrate?"* — and integration risk is by definition a question for the second.

---

## 🧠 Team Relationships

These three relationships describe the *shape* of the dependency between two teams or bounded contexts, and map directly to the ODDS connectors (`-->`, `<--`, `<->`, `-x-`).

| Relationship | Description |
|---|---|
| Mutually Dependent | Two teams or bounded contexts are mutually dependent when their software artifacts need to be delivered together to succeed. Failure or a timeline shift in one immediately impacts the other. A lot of coordination and communication is required (see Partnership pattern). Expressed with the `<->` connector. |
| Upstream / Downstream | The upstream team's decisions affect the downstream team, but not the other way around — the upstream team may succeed independently of the downstream team's fate. The downstream team's needs can be addressed in a variety of ways, with a wide range of consequences (see Conformist, Customer-Supplier, and Anti-Corruption Layer patterns). Expressed with `-->` (left side is Upstream) or `<--` (right side is Upstream). |
| Free | No organizational or technical link of any kind exists between the two contexts; changes in one do not influence the success or failure of the other. Expressed with the `-x-` connector — which, per §0.2, also carries the Separate Ways pattern. |

---

## 🧠 Context Map Patterns

These nine patterns describe the technical and social *solution* applied on top of a Team Relationship — the specific contract or protection strategy chosen at the boundary. The last column is how ODDS expresses each one, and is the direct application of §0.2.

| Pattern | Expressed in ODDS as | Description |
|---|---|---|
| Partnership | `[P]`, on both sides of a `<->` | Two teams have a mutual dependency on each other's context to the extent that if either fails, both will fail. The contexts are peers, meaning that there is no ceremony required between expressing needs and receiving due functionality. The winners are those who best coordinate and cooperate. Partnerships can be slower and more difficult due to the complexity of integrated models and schedules. |
| Shared Kernel | `[SK]`, on both sides of a `<->` | Two or more teams share a small, common model, that is blended with their own specialized model. This requires agreement, and is often best used for system-wide standards, such as monetary or others. Note that this is not just a data schema (see Published Language), but a model with both data and behavior (object types). Caution is warranted against overuse or imagining that a reusable library fits the bill. The artifact is a shared, small, model. |
| Customer-Supplier | `[C]` Downstream + `[S]` Upstream | A team has a dependency on another team's Bounded Context, but the teams are not peers. Rather, the dependent is downstream from the upstream dependency. This makes the downstream team subject to the availability of schema and functionality that meets their specific needs. Addressing special needs is left to the discretion of the upstream team, which may impact the downstream team's timeline and capabilities. |
| Conformist | `[CF]`, Downstream only | A downstream team must conform to an upstream model. This dependency is might be a desired choice, but is often determined by the complexity of the upstream model and downstream team's capacity and capabilities. Of course, any changes to the upstream model can/will have an impact on the downstream team, depending on their usage surface area. |
| Separate Ways | **the `-x-` connector** — no tag (§0.2) | A team could potentially integrate with another model, but might decide that the benefit doesn't match the effort required, so the team decides to create their own one-off solution. Care must be taken with respect to DRY, or Don't Repeat Yourself. Note that DRY means "Don't Repeat Knowledge," not "Don't Repeat Code." Knowledge silos are problematic because repetition of captured knowledge in a business software context might cause deviation in one or more repeating models. When DRY as in knowledge is a certain factor, consider integration instead. |
| Anti-Corruption Layer | `[ACL]`, Downstream only | A downstream team has both the capacity and capabilities to take a highly defensive posture in consuming upstream model. The upstream model is often complex and poorly designed, but the downstream model can still benefit by translating even clean models to their own language. The downstream creates a set of translation components that render the upstream model to a specific design that adheres to their own model design. |
| Open-Host Service | `[OHS]`, Upstream only | A model has a well-designed API that enables one or more other teams to confidently and reliably perform operations. The consumed API is not automatically in an upstream position, which means that the majority of the previous and following relationships apply. That is, any consuming team can find themselves in a variety of circumstances, which will determine how the model behind the API is used. See also Published Language. |
| Published Language | `[PL]`, Upstream only | A set of well-designed schema specifications—possibly considered a single specification—are provided for data exchange between Bounded Contexts. A Published Language is often paired with and Open-Host Service. A specific schema set can be an standard of the following proportions: international, national, industry, inter-business, intra-business, and context/model/team. |
| Big Ball of Mud | `[BBM]` — **not a pattern tag**; third category (§0.2) | Systems are often implemented in monoliths without any intentional design and architecture, and have been long subjected to expedient change. There are generally no efforts or even recognition of the complex problems that will be at play, even quite early in the software life cycle, and thus are left to chance. Technical debt rises continually and is seldom paid. The tangle that ensues is often compared to a large, muddy, amorphous blob, or otherwise, a brown field of software. In time nearly zero changes can be made without regression, which cause system releases to stagnate. |

> **Note on Customer/Supplier:** classic DDD literature describes it as a single pattern applied to the relationship as a whole. ODDS deliberately splits it into two independent, position-aware tags (`[C]` and `[S]`) so each side can be validated on its own. This is an intentional extension, not a reproduction of the literature — and it is why declaring only one of the two is a `warning` (`INCOMPLETE_CUSTOMER_SUPPLIER`) rather than an `error`: "I am the Customer of this integration" is a coherent unilateral statement, merely under-documented. Contrast `[SK]`/`[P]`, which are the *same* tag repeated, where half a declaration is a malformed statement of a single fact — and therefore an `error` (`INCOMPLETE_MUTUAL_TAG`).

---

## 🧠 Context Properties (Metadata)

Beyond the structural declaration (`context Name { ... }`), a Bounded Context — and, at the outer levels, a `domain` or `subdomain` — can carry descriptive metadata. This metadata is **informational**: it documents intent for humans and tooling, but does not participate in any Team Relationship or Context Map Pattern validation described above. The formal syntax for these properties lives in `GRAMMAR.md`; this section documents their intended meaning.

| Property | Available on | Purpose |
|---|---|---|
| `title` | `domain`, `subdomain`, `context` | Human-readable display label, distinct from the technical identifier used to reference the element elsewhere (e.g. in `mapping`). Intended for rendering on the canvas/diagram. |
| `type` | `context` | Free-text classification of the context's nature (e.g. "service", "legacy system", "gateway"). Deliberately left open-ended rather than a closed taxonomy — there is no fixed list of valid values. **Do not** reuse the subdomain vocabulary (`core`/`supporting`/`generic`) here: they are different axes, and `type: "generic"` inside a `subdomain generic` teaches the reader an overloaded vocabulary. |
| `description` | `context` | Free-text explanation of the context's purpose and role. |
| `responsibilities` | `context` | A list of the business or technical responsibilities owned by this context. |
| `maturity` | `context` | Lifecycle stage of the context. One of: `experimental`, `growing`, `mature`, `legacy`. |
| `team` | `context` | The team responsible for the context, as free text. |
| `technology` | `context` | The technology stack used to implement the context, as free text. |

**None of these properties trigger any diagnostic on their own, and none ever feed the trigger of a rule.** This is the boundary stated in §0.3, and it is a promise to the user: fill in `team` and `technology` without fear that the tool will start judging you for them. Two consequences worth spelling out:

- `maturity: legacy` does **not** imply `[BBM]` and does not trigger any rule from §2. They are independent concepts — one documents a lifecycle stage, the other characterises a system in an integration — and conflating them would be a modelling decision the tool must not make silently on the user's behalf.
- Two rules that were proposed for the §2 catalogue are therefore **inexpressible and were dropped**: "two contexts owned by the same `team` in a Customer/Supplier relationship" and "`maturity: experimental` in a `core` subdomain". The promise above is worth more than those two rules.

A context declared inside the `external { }` block accepts these same six properties. `responsibilities` and `team` are semantically odd for a system that is not yours — but they remain permitted, because the alternative is creating the first forbidden property and reopening the very boundary this section exists to protect.

---

## 🧠 Semantic Validations (AST Analysis & Architecture Rules)

The validations below are what makes ODDS an architecture validator rather than a drawing tool. They are split by severity: **errors** (§1), which say the model is incoherent, and **design rules** (§2), which say the model is coherent but the design is questionable.

Each rule states: its `code`, its severity, its **scope** (per relationship, per declaration, or whole file), its **trigger**, and its answer to the authorship principle (§0.4), in an **External?** field. Message text for every code is in `MESSAGES.md`; the `data` keys each one must carry are in `AST_SCHEMA.md` §1.3.

---

### 1. Errors (severity `error`)

These rules guarantee the integrity of the model and the basic coherence of the context map. They do **not** block rendering — see §5.

#### A. Scope, hierarchy and identity

* **Orphan Context** — `ORPHAN_CONTEXT` · phase 1 · External? n/a
  * *Trigger:* a `context` declared outside a `subdomain` and outside the `external { }` block.
  * *Note:* detected by the **parser**, via error recovery, not by the Visitor — see `GRAMMAR.md` §5.1. The grammar itself remains strict (a `context` is only ever syntactically valid inside a `subdomain` or inside `external`). The discarded declaration is still **registered as invalid** in the symbol table, which is what prevents the cascade into `PHANTOM_REFERENCE` (§3.1).

* **Orphan Subdomain** — `ORPHAN_SUBDOMAIN` · phase 1 · External? n/a
  * *Trigger:* a `subdomain` declared outside the scope of a `domain`.
  * *Note:* same parser-level recovery mechanism as Orphan Context above.

* **Removed Construct** — `REMOVED_CONSTRUCT` · phase 1 · External? n/a
  * *Trigger:* the file uses a construct that existed in an earlier ODDS Language Version and no longer does — today, the `[SW]` tag.
  * *Note:* this exists so that reopening an old file or an old shared URL produces *"`[SW]` was removed in v0.2 — use `-x-` on its own"* instead of a generic `SYNTAX_ERROR` that explains nothing. Same parser recovery mechanism as above: the removed construct is discarded and parsing continues. See §6.

* **Phantom Reference in Context Map** — `PHANTOM_REFERENCE` · phase 3 · External? ✅ applies
  * *Trigger:* a `mapping` line references a context that was never declared — in any `subdomain` or in the `external` block.
  * *Note:* referential integrity has no exceptions. A context registered as *declared but invalid* does **not** count as undeclared for this rule (§3.1).

* **Duplicate Context Declaration** — `DUPLICATE_CONTEXT` · phase 2 · External? ✅ applies
  * *Trigger:* the same `context` name declared more than once anywhere in the `domain`.
  * *Scope note:* internal and external contexts **share one namespace**, because `mapping` references contexts by bare identifier with no scope qualification. A context named `Stripe` inside a subdomain and another inside `external { }` is a duplicate, exactly as two internal ones would be.
  * *Span convention:* the **second** occurrence — the one that causes the problem.

* **Duplicate Subdomain Declaration** — `DUPLICATE_SUBDOMAIN` · phase 2 · External? n/a
  * *Trigger:* two `subdomain` blocks with the same name in the file, regardless of their types.
  * *Span convention:* the second occurrence.

* **Invalid Domain Cardinality** — `INVALID_DOMAIN_CARDINALITY` · phase 2 · External? n/a
  * *Trigger:* the file declares zero `domain`s, or more than one. Exactly one is required.
  * *Span convention:* the second `domain` when there are several; the whole file when there are none.

* **Self Relationship** — `SELF_RELATIONSHIP` · phase 3 · External? ✅ applies
  * *Trigger:* both sides of a relationship name the same context (`A --> A`).

* **Duplicate Relationship** — `DUPLICATE_RELATIONSHIP` · phase 3 · External? ✅ applies
  * *Scope:* the identity of a relationship is the **unordered pair** `{left, right}`. Connector and tags are *not* part of the identity.
  * *Trigger:* a second line for a pair already related. This single rule deliberately covers all three shapes, with no taxonomy of duplicate kinds:

    | Shape | Example |
    |---|---|
    | Redundant | `A --> B` + `B <-- A` |
    | Contradictory | `A --> B` + `A -x- B` |
    | Tag split | `A [OHS] --> B` + `A [S] --> B` |

  * *Why one code and not three:* separating them would demand a semantic equivalence relation over connector+tags that nobody gets right at the edges (is `[OHS]` "the same relationship" as `[OHS, PL]`?), and the prize would be a severity difference on a line the user is going to delete either way. It is also not an arbitrary choice of identity: by §0.2 the connector carries *the shape of the dependency between two teams*, and a pair of contexts has exactly one shape at a time, so a second line is never new information. The pair is **unordered** because `A --> B` + `B --> A` is a badly written mutual dependency (it should be `<->`) that an ordered identity would let through.
  * *Span convention:* the second occurrence. **The first occurrence is the one that draws** (§5).
  * *Consequence for aggregate rules:* rules that count occurrences across the file (`EXCESSIVE_SHARED_KERNEL`) count **distinct relationships, not lines** — without this clause, one `A [SK] <-> B` pasted twice would trip the threshold on its own.

* **External-only Relationship** — `EXTERNAL_ONLY_RELATIONSHIP` · phase 3 · External? by definition
  * *Trigger:* both sides of a relationship are contexts declared in the `external { }` block.
  * *Why it is an error:* a context map is a map of **your** integrations. How Stripe talks to a third party's SAP is not your decision, is not actionable, and cannot be validated by any pattern rule — the authorship principle (§0.4) applied to the relationship itself. Allowing it would turn the `.odds` file into a generic systems diagram, which is precisely what ODDS is not.

#### B. Strict typing

* **Invalid Subdomain Type** — `INVALID_SUBDOMAIN_TYPE` · phase 2 · External? n/a
  * *Trigger:* the identifier after the `subdomain` keyword is anything other than `core`, `supporting` or `generic`.
  * *Note:* `GRAMMAR.md` deliberately accepts a free `identifier` in that position, so that this check is genuinely reachable by the Visitor rather than being dead code behind a parser rejection. `core`/`supporting`/`generic` classify the strategic importance of a part of *your own* business — which is exactly why a third-party system does not get one of them, and lives in `external { }` instead.

#### C. Tag position and connector compatibility

Tag validation has **two independent dimensions**. A tag can fail one, the other, or both:

1. **Compatibility with the connector** — may this tag appear on this kind of line at all?
2. **Compatibility with the side** — given a directional line, is the tag on the side that can legitimately carry it?

The matrix below is **normative**. It is derived from the mapping of each Team Relationship to the patterns that are applicable to it: Mutually Dependent → Partnership, Shared Kernel; Upstream/Downstream → Customer/Supplier, Open-Host Service (frequently with Published Language), Conformist, Anti-Corruption Layer; Free → Separate Ways, which by §0.2 *is* the connector.

| Tag | `-->` / `<--` | `<->` | `-x-` |
|---|---|---|---|
| `OHS` | ✅ Upstream side only | ❌ | ❌ |
| `PL` | ✅ Upstream side only | ❌ | ❌ |
| `S` | ✅ Upstream side only | ❌ | ❌ |
| `C` | ✅ Downstream side only | ❌ | ❌ |
| `CF` | ✅ Downstream side only | ❌ | ❌ |
| `ACL` | ✅ Downstream side only | ❌ | ❌ |
| `SK` | ❌ | ✅ required on **both** sides | ❌ |
| `P` | ❌ | ✅ required on **both** sides | ❌ |
| `BBM` | ✅ any side | ✅ any side | ✅ any side |

Each connector has exactly one code for "wrong tag here", so the codes never overlap and an implementation never has to pick between them:

* **Upstream-only Tag Misplaced** — `UPSTREAM_ONLY_TAG_MISPLACED` · phase 4 · External? ✅ applies
  * *Trigger:* `[OHS]`, `[PL]` or `[S]` on the Downstream side of a `-->`/`<--` line.
  * *Invalid example:* `ContextA --> [OHS] ContextB` — the `-->` makes B Downstream, but OHS is an Upstream pattern.

* **Downstream-only Tag Misplaced** — `DOWNSTREAM_ONLY_TAG_MISPLACED` · phase 4 · External? ✅ applies
  * *Trigger:* `[ACL]`, `[CF]` or `[C]` on the Upstream side of a `-->`/`<--` line.

* **Mutual Tag on a Directional Connector** — `MUTUAL_TAG_ON_DIRECTIONAL` · phase 4 · External? ✅ applies
  * *Trigger:* `[SK]` or `[P]` on a `-->` or `<--` line, on either side.
  * *Rationale:* Shared Kernel and Partnership describe a *mutual* dependency. Declaring one over an asymmetric dependency is a category error, not a misplacement.

* **Positional Tag on a Mutual Connector** — `POSITIONAL_TAG_ON_MUTUAL` · phase 4 · External? ✅ applies
  * *Trigger:* any of `[OHS]`, `[PL]`, `[S]`, `[C]`, `[CF]`, `[ACL]` on a `<->` line, on either side.
  * *Rationale:* those six tags are defined by an Upstream/Downstream position, and `<->` has neither.

* **Incomplete Mutual Tag** — `INCOMPLETE_MUTUAL_TAG` · phase 4 · External? ✅ applies
  * *Trigger:* `[SK]` or `[P]` declared on only one side of a `<->` line.
  * *Rationale:* **automatic inference is forbidden.** An earlier draft of this document allowed the parser to "infer the tag for the other side"; a *may* in a specification makes two equally conforming implementations produce different output, and silent inference makes the `.odds` file and the rendered diagram disagree — in an Architecture-as-Code tool the text is the source of truth, not a sketch for the tool to complete. Beyond that, Shared Kernel and Partnership are **bilateral agreements**: writing both sides is the very act of recording that the other team also signed.

* **Mutual Tag with an External Context** — `MUTUAL_TAG_WITH_EXTERNAL` · phase 4 · External? by definition
  * *Trigger:* `[SK]` or `[P]` on a relationship where either side is an external context.
  * *Rationale:* there is no Shared Kernel and no Partnership with a third party — those are bilateral agreements between teams you have. Same family as `EXTERNAL_ONLY_RELATIONSHIP`: a category error, not a judgement about the design.

#### D. Conflict and exclusivity

* **Separation Conflict** — `SEPARATION_CONFLICT` · phase 4 · External? ✅ applies
  * *Trigger:* **any** pattern tag on a `-x-` line. `-x-` means the absence of integration, so there is no boundary for a pattern to be applied at.
  * *Explicit exception:* `[BBM]` is allowed on `-x-` and does **not** trigger this rule. It is not a pattern tag but a characterisation of the system (§0.2), and *"that ERP is a swamp and that is why we decided not to integrate"* is one of the most valuable things a map can record.
  * *Invalid example:* `ContextA [OHS] -x- [ACL] ContextB`.
  * *Note:* this rule used to have a second branch, for `[SW]` combined with a directional connector. It disappeared with the tag (§0.2), collapsing the rule to a single line and removing the need to enumerate which tags count as "integration indicators".

* **Role Conflict** — `ROLE_CONFLICT` · phase 4 · External? ✅ applies
  * *Trigger:* `[C]` and `[S]` on the same side of the same relationship.
  * *Note:* this trigger is structurally guaranteed to co-occur with a position error, since `C` is Downstream-only and `S` is Upstream-only — whichever side they share, one of them is on the wrong one. Both diagnostics are expected; they are in the same phase, so both are reported (§3.2).

* **Protection Conflict** — `PROTECTION_CONFLICT` · phase 4 · External? ✅ applies
  * *Trigger:* `[CF]` and `[ACL]` on the same side of the same relationship. A context cannot both accept the upstream model wholesale and translate it defensively for the same integration.

---

### 2. Design rules (severity `warning` and `info`)

These do not say the model is broken; they say the design is worth a second look. Severity separates *"a reasonably consensual DDD pattern is being violated"* (`warning`) from *"documentation hygiene"* (`info`), so that the count the user glances at stays meaningful. All of them are suppressible (§4), which is what turns *"the tool disagrees with me"* into *"I recorded that I disagree with the tool"* — legitimate architectural documentation.

#### E. Strategic risk (`warning`)

* **Conformist Core** — `CONFORMIST_CORE` · `warning` · phase 5 · External? ✅ applies
  * *Scope:* per relationship; directional lines only (`-->`/`<--`) where a context belonging to a `core` subdomain sits on the Downstream side.
  * *Trigger:* either condition holds — **(a)** the Downstream side (the `core` context) carries `[CF]`, or **(b)** the Upstream side carries `[BBM]`. Evaluated independently; if both hold on one line, emit a **single** diagnostic, with `data.trigger` recording which condition fired (`"conformist"` takes precedence over `"bbm"` when both hold).
  * *Why external matters here:* a third-party ERP is the classic Big Ball of Mud, so this is the rule's target scenario, not an exception to it.

* **Generic Upstream without OHS** — `GENERIC_WITHOUT_OHS` · `warning` · phase 5 · External? ❌ cannot fire
  * *Scope:* per relationship; directional lines only. Does not apply to `<->` or `-x-`, where `[OHS]` is not a valid tag anyway.
  * *Trigger:* the Upstream context belongs to a `generic` subdomain and does not carry `[OHS]` on that side.
  * *External note:* an external context has no subdomain type, so the trigger cannot be satisfied against one — the exemption the authorship principle demands is structural (§0.4), not a clause.

* **Core Upstream of a Generic** — `CORE_UPSTREAM_OF_GENERIC` · `warning` · phase 5 · External? ❌ cannot fire
  * *Scope:* per relationship; directional lines only.
  * *Trigger:* a context from a `core` subdomain is Upstream of a context from a `generic` subdomain.
  * *Rationale:* strategic DDD points the other way — the core consumes the generic; a generic (off-the-shelf, commodity) capability conforming to your core is a sign that either the classification or the dependency is wrong.

* **Core in a Shared Kernel** — `CORE_IN_SHARED_KERNEL` · `warning` · phase 5 · External? ❌ cannot fire
  * *Scope:* per relationship.
  * *Trigger:* a context from a `core` subdomain takes part in a relationship carrying `[SK]`.
  * *Rationale:* a Shared Kernel is physical coupling of a model. Putting your competitive advantage inside one means another team can no longer be changed without changing it.
  * *External note:* `[SK]` with an external context is already an error (`MUTUAL_TAG_WITH_EXTERNAL`), which removes the line from later phases — so this rule never sees such a case.

* **Domain without a Core** — `DOMAIN_WITHOUT_CORE` · `warning` · phase 5 · External? n/a
  * *Scope:* whole file, once.
  * *Trigger:* no `subdomain core` is declared anywhere in the file.
  * *Rationale:* a strategic map with no core domain has not answered the one question strategic design exists to answer — where your competitive advantage is.
  * *Span convention:* the `domain` declaration line.

* **Inconsistent BBM** — `INCONSISTENT_BBM` · `warning` · phase 5 · External? ✅ applies
  * *Scope:* whole file, per context.
  * *Trigger:* the same context carries `[BBM]` on at least one relationship and not on at least one other.
  * *Rationale:* this rule is the mitigation for the cost accepted in §0.3. It closes the hole without touching the tag/property boundary, because it operates over tags only.
  * *Span convention:* the first relationship line where the context appears **without** `[BBM]` — the line the user most likely forgot.

* **Incomplete Customer/Supplier** — `INCOMPLETE_CUSTOMER_SUPPLIER` · `warning` · phase 5 · External? ✅ applies
  * *Scope:* per relationship; directional lines only.
  * *Trigger:* `[C]` on the Downstream side without `[S]` on the Upstream side, or the reverse.
  * *Rationale:* Customer/Supplier is a bilateral agreement, and half a declaration documents half a contract. It is a `warning` and not an `error` — unlike `INCOMPLETE_MUTUAL_TAG` — because `[C]` and `[S]` are two *distinct* tags with independent meaning (see the note under the pattern table), so one of them alone is a coherent unilateral statement, merely under-documented.

#### F. Hygiene (`info`)

* **Excessive Shared Kernel** — `EXCESSIVE_SHARED_KERNEL` · `info` · phase 5 · External? n/a
  * *Scope:* whole file (aggregate) — evaluated once per file, not once per relationship.
  * *Trigger:* the file contains **three or more** distinct relationships carrying `[SK]`. Counts distinct relationships, never lines (§1.A).
  * *Why `info` and threshold 3:* with `CORE_IN_SHARED_KERNEL` and `MUTUAL_TAG_WITH_EXTERNAL` in the catalogue, the genuinely dangerous shared kernels have dedicated rules with their own fixes. What is left for the aggregate rule — "a couple of shared kernels between supporting subdomains" — is not alarming, and by the distinct-fix criterion (§0.4) it barely earns its place at all.
  * *Span convention:* the opening of the `mapping` block, as the anchor.

* **Undocumented Integration Contract** — `UNDOCUMENTED_CONTRACT` · `info` · phase 5 · External? ✅ applies
  * *Scope:* per relationship.
  * *Trigger:* a `-->`, `<--` or `<->` line with no Context Map Pattern tag on either side. Does not trigger on `-x-` lines, where the absence of a tag is the intended signal. `[BBM]` alone does not satisfy the rule either — it is not a pattern tag (§0.2), so a line carrying only `[BBM]` still has an undocumented contract.
  * *External note:* documenting *how you integrate* is your responsibility, and more important with a third party, not less.

* **Unmapped Context** — `UNMAPPED_CONTEXT` · `info` · phase 5 · External? ✅ applies
  * *Scope:* per context declaration.
  * *Trigger:* a context is declared and never referenced in the `mapping` block.
  * *Note:* a genuinely isolated context is legitimate, which is exactly why this is `info` and not a warning — it flags a probable omission, not a mistake.

* **Empty Subdomain** — `EMPTY_SUBDOMAIN` · `info` · phase 5 · External? n/a
  * *Trigger:* a `subdomain` block declaring no `context`.
  * *Note:* usually a draft in progress, hence `info`.

* **Published Language without Open-Host Service** — `PL_WITHOUT_OHS` · `info` · phase 5 · External? ✅ applies
  * *Trigger:* `[PL]` declared on a side that does not also carry `[OHS]`.
  * *Note:* the literature pairs the two frequently, not always — a Published Language can exist without a host service. Hence `info`.

---

### 3. Validation Pipeline: Phases, Root-Error Principle, and Diagnostic Ordering

This section is **normative**. `TEST_SUITE.md` compares the emitted diagnostic array by structural equality, so the *order* of diagnostics is part of the contract, not a presentation detail.

#### 3.1 Root-error principle

An element that has produced an **`error`** is recorded as *declared but invalid* and is removed from every **later** phase — it produces no derived diagnostics. `warning` and `info` never invalidate anything.

The motivating case: a `context` declared outside a `subdomain` is discarded by the parser's panic-mode recovery (`GRAMMAR.md` §5.1) and reported as `ORPHAN_CONTEXT`. Without this principle, every `mapping` line referencing that context would *also* emit `PHANTOM_REFERENCE` — one user mistake, two diagnostics, and the second one false: the context *was* declared, just in the wrong place. Discarded declarations must therefore still be registered in the symbol table, flagged as invalid, so that later phases can recognise them without re-reporting them.

The reading is **broad**: an `error` removes the element from the pipeline entirely, not merely from the rules that consume whatever was invalidated. The narrow reading would force each of the two dozen rules in §2 to declare which invalidation it depends on — the case-by-case regime this principle exists to avoid, wearing an architecture costume.

Consequence, accepted deliberately: **fixing is iterative.** A relationship line that is both a duplicate and strategically risky reports only the duplicate; the strategic warning appears once the duplicate is deleted. Likewise, no `DUPLICATE_CONTEXT` is reported between a discarded orphan and a valid namesake. This is standard compiler behaviour, and with live validation the second pass costs the user nothing.

#### 3.2 Phases

All rules belonging to the **same** phase run and report. Invalidation only applies to the phases that follow.

| # | Phase | Runs in | Diagnostics produced |
|---|---|---|---|
| 0 | Lexical / Syntactic | Parser | `SYNTAX_ERROR` — no AST, so the pipeline stops here |
| 1 | Structural | Parser (panic-mode recovery) | `ORPHAN_CONTEXT`, `ORPHAN_SUBDOMAIN`, `REMOVED_CONSTRUCT` |
| 2 | Declarative | Visitor, Steps 0–1 | `INVALID_DOMAIN_CARDINALITY`, `INVALID_SUBDOMAIN_TYPE`, `DUPLICATE_CONTEXT`, `DUPLICATE_SUBDOMAIN` |
| 3 | Referential | Visitor, Step 2 — identity and existence of the relationship endpoints | `PHANTOM_REFERENCE`, `SELF_RELATIONSHIP`, `DUPLICATE_RELATIONSHIP`, `EXTERNAL_ONLY_RELATIONSHIP` |
| 4 | Relational | Visitor, Step 2 — the tags themselves | `UPSTREAM_ONLY_TAG_MISPLACED`, `DOWNSTREAM_ONLY_TAG_MISPLACED`, `MUTUAL_TAG_ON_DIRECTIONAL`, `POSITIONAL_TAG_ON_MUTUAL`, `INCOMPLETE_MUTUAL_TAG`, `MUTUAL_TAG_WITH_EXTERNAL`, `SEPARATION_CONFLICT`, `ROLE_CONFLICT`, `PROTECTION_CONFLICT` |
| 5 | Strategic | Visitor, Steps 2–3 — design judgement | `CONFORMIST_CORE`, `GENERIC_WITHOUT_OHS`, `CORE_UPSTREAM_OF_GENERIC`, `CORE_IN_SHARED_KERNEL`, `DOMAIN_WITHOUT_CORE`, `INCONSISTENT_BBM`, `INCOMPLETE_CUSTOMER_SUPPLIER`, `EXCESSIVE_SHARED_KERNEL`, `UNDOCUMENTED_CONTRACT`, `UNMAPPED_CONTEXT`, `EMPTY_SUBDOMAIN`, `PL_WITHOUT_OHS` |
| 6 | Suppression | Step 4 — a pass over the array already emitted | `MALFORMED_SUPPRESSION`, `UNUSED_SUPPRESSION` |

**Admission rule:** every new `DiagnosticCode` must be assigned a phase at the moment it is added to `AST_SCHEMA.md` §1. A code without a phase has no defined position in the emitted array and therefore cannot be tested.

**Note on phase 6.** Suppression is a phase and not a filter bolted on afterwards precisely so its own two diagnostics have a defined position in the array. It runs last because `UNUSED_SUPPRESSION` cannot be known before every rule has had its chance to fire. It never invalidates anything: removing a suppressed `warning` cannot produce new diagnostics, because `warning` never invalidated anything to begin with (§3.1).

#### 3.3 Emission order

The diagnostic array is sorted by the following keys, in order, until a difference is found:

1. **Phase**, ascending (§3.2).
2. **`span.start.line`**, ascending.
3. **`span.start.column`**, ascending.
4. **`span.end.column`**, ascending — a narrower span (a single token) precedes a wider one starting at the same column.
5. **`code`**, alphabetically — final tiebreak, so that the order is total and no implementation has to guess.

Keys 2–4 mean the panel reads in source order, matching the editor gutter, which is what every linter the audience already uses does. Key 5 exists solely to make the order *total*: an implementation-defined tiebreak would make two conforming implementations produce different arrays, and `TEST_SUITE.md` would be unable to assert either.

Deliberately rejected: a hand-maintained priority list of codes within a phase. It would have to be updated on every new rule, would drift from the code, and would encode "which problem matters more" — a judgement that belongs to `severity`, not to array position.

---

### 4. Suppressing a diagnostic

A linter with opinions and no escape hatch becomes permanent noise in any real-world model that contains a conscious, defensible decision against a rule. Suppression is what turns *"the tool disagrees with me"* into *"I recorded that I disagree with the tool, and why"* — which is architectural documentation, and exactly the pitch of Architecture as Code.

**Canonical form** — line-scoped only, justification mandatory:

```odds
// odds-disable-next-line CONFORMIST_CORE: corporate ERP, business decision, cost accepted and documented
Checkout [CF] <-- CorporateERP
```

The rules:

* **It lives in the file, never in the UI.** A suppression has to travel through Git, through the shared URL, and through code review. If it lived in the panel, two people would see different diagnostics for the same drawing.
* **It reaches `warning` and `info`. Never `error`.** The escape hatch exists for conscious decisions against a piece of *advice*; silencing a `PHANTOM_REFERENCE` would make the diagram lie about the model itself. Naming an `error` code in a directive is `MALFORMED_SUPPRESSION`, not a suppression.
* **Line granularity is enough, universally.** There is no block form and no file form. Every rule — including the aggregate ones — has exactly one anchor line by the span conventions in §1/§2 and `TEST_SUITE.md` §4, so there is nothing a block directive could reach that a line directive cannot. File-wide suppression is also precisely the mechanism by which linters get defeated wholesale and in silence, and `.odds` files are far too small to need it.
* **It suppresses one code, not the line.** Other rules firing on the same line are still reported.
* **The justification is mandatory.** A suppression with no reason is indistinguishable from giving up, and six months later nobody knows whether it was a decision or fatigue.

Two diagnostics keep the mechanism honest, both `info`, both phase 6:

* **Malformed Suppression** — `MALFORMED_SUPPRESSION`
  * *Trigger:* the directive names a code that does not exist (`data.reason: "unknown-code"`), omits the justification (`"missing-justification"`), or names a code whose severity is `error` (`"not-suppressible"`).
  * *It is never a `SYNTAX_ERROR`.* A broken comment must not bring down the parsing of the file.

* **Unused Suppression** — `UNUSED_SUPPRESSION`
  * *Trigger:* the directive is well-formed but the rule it names did not fire on the target line.
  * *Rationale:* without it, obsolete suppressions accumulate and the justification rots along with the model.

**Structural consequence:** comments are no longer syntactically insignificant. The lexer may not discard a comment that starts with the `odds-disable-next-line` prefix — it has to survive to the validator. See `GRAMMAR.md` §1.

---

### 5. Errors and rendering

**A critical error does not block the diagram.** The rule that used to be stated as "critical errors block compilation" was already false in this very document — `ORPHAN_CONTEXT` explicitly did not block AST generation — and it contradicted the product's promise of instant visualisation while typing, since **every intermediate state of a file being typed is a syntax error**. Under strict blocking the canvas would blink empty on every keystroke.

The rule is therefore **degradation per element**:

* The partial AST always renders whatever is renderable.
* The element with the problem is drawn **visibly marked**: a dashed red edge for an invalid relationship, a dotted ghost node for a reference that does not resolve. This is what `SymbolTableEntry.valid` exists for (§3.1).
* Only a pure `SYNTAX_ERROR` — where no tree exists at all — freezes the last good diagram instead of erasing it. **The frozen diagram must be marked as stale**, otherwise the canvas silently lies about the file it claims to show.
* In a duplicated pair, **the first occurrence is the one that draws** — consistent with the span convention that blames the second.
* **Exporting with errors is allowed, and the export includes the markers.** The exported image is exactly what is on the canvas; there is no "clean" variant. An export without markers would become documentation asserting a model that was never valid.

The containment view draws the `external { }` block **outside** the domain boundary, touching it — cancelling the syntactic contradiction recorded in §0.5 in the one place the user would perceive it.

---

### 6. Language version and compatibility

`GRAMMAR.md`, `AST_SCHEMA.md` and this file each carry their own editorial version, but what a `.odds` file *means* is defined by the three together. That joint meaning has its own number, the **ODDS Language Version**, tracked in `CHANGELOG.md` and incremented only when the observable behaviour of a `.odds` file changes.

It follows SemVer, with the cut at **file validity**:

| Increment | When | Effect on an existing `.odds` |
|---|---|---|
| **MAJOR** | A valid file stops being valid, or changes meaning | It breaks — migration diagnostics fire |
| **MINOR** | Only the diagnostics change; the file stays valid | Same drawing, different panel |
| **PATCH** | Message text or translation only | Nothing changes for the user |

* **The version travels in the shareable URL payload, not in the language.** There is no `odds 0.2` pragma at the top of the file: the `.odds` file is the artefact somebody pastes into a pull request, and a mandatory pragma would charge every user forever for a problem that only exists at the URL boundary — where a version field is free because the URL is machine-generated.
* **Only a MAJOR divergence triggers migration diagnostics.** That keeps MAJOR rare and meaningful, which is what makes `REMOVED_CONSTRUCT` worth anything.
* **The application never migrates the user's text automatically.** Opening an old URL loads the text as it is and lets `REMOVED_CONSTRUCT` do the work. Automatic migration would mean carrying migration code for every past version in the browser bundle forever — permanent weight in a 100% client-side product — and rewriting the user's text is exactly what forbidding `[SK]` inference refused to do (§1.C): in Architecture as Code the text is the source of truth, not a draft the tool corrects. The version exists to make the message **specific**, not to edit the file.
* **Every removed construct gets a dedicated diagnostic**, never a generic `SYNTAX_ERROR` — see `REMOVED_CONSTRUCT` (§1.A). This is what actually solves the user's problem, and it works identically for a file in Git and for a URL.

---

### Summary for AST Implementation

When building your *Visitor* (the function that traverses the tree generated by the Parser), you will need a symbol table (`AST_SCHEMA.md` §5). The steps below map onto the phases of §3.2 — run them in order, and honour the root-error principle between them.

1. **Step 0 — cardinality (phase 2).** Verify the `Program` node contains exactly one `Domain` node. If not, report `INVALID_DOMAIN_CARDINALITY` and stop: there is no single valid domain to traverse.
2. **Step 1 — declarations (phase 2).** Traverse the `subdomain` nodes and then the `external` block, recording every `context` in the symbol table along with its parent subdomain's type (`undefined` for external contexts) and its validity flag. While recording, check name collisions (`DUPLICATE_CONTEXT`, `DUPLICATE_SUBDOMAIN`), validate each subdomain type (`INVALID_SUBDOMAIN_TYPE`), and note empty subdomains (`EMPTY_SUBDOMAIN`, phase 5 — collected here, emitted with its phase).
3. **Step 2 — relationships.** Traverse the `mapping` node twice over, in phase order: first resolve identity and existence of both endpoints (phase 3 — `PHANTOM_REFERENCE`, `SELF_RELATIONSHIP`, `DUPLICATE_RELATIONSHIP`, `EXTERNAL_ONLY_RELATIONSHIP`), dropping invalidated lines; then validate the tags of the surviving lines against the matrix in §1.C (phase 4), and finally apply the per-relationship strategic rules (phase 5).
4. **Step 3 — whole-file rules (phase 5).** With the map fully traversed, evaluate the aggregate rules: `DOMAIN_WITHOUT_CORE`, `UNMAPPED_CONTEXT`, `EXCESSIVE_SHARED_KERNEL` and `INCONSISTENT_BBM`.
5. **Step 4 — suppression (phase 6).** Apply the directives collected in `ProgramNode.suppressions` against the array produced so far, emitting `MALFORMED_SUPPRESSION` and `UNUSED_SUPPRESSION`.

Finally, sort the whole array by the keys in §3.3. The emitted order is part of the contract.
