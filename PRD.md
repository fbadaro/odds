# PRD: Open Domain Driven Specification (ODDS)

## 1. Product overview

### 1.1 Document title and version

- PRD: Open Domain Driven Specification (ODDS)
- Version: in the [Changelog](#changelog) at the end of this file

### 1.2 Product summary

The project is an open-source initiative designed to simplify, standardize, and democratize the modeling of software architectures based on Domain-Driven Design (DDD). It introduces a lightweight, declarative, and human-readable domain-specific language (DSL) called ODDS, which allows users to write domain structures as code ("Architecture as Code").

By rendering these declarations dynamically into graphical representations, the project bridges the gap between technical architecture and visual documentation. This eliminates the obsolescence of static, manually maintained visual diagrams (such as those in Miro or Lucidchart) by keeping them version-controlled and coupled with the codebase.

The primary web application (the playground) serves as an interactive environment where users can write ODDS declarations, receive instant feedback, view graphical diagrams dynamically, and share their designs using shareable links.

## 2. Goals

### 2.1 Business goals

- Drive adoption of Domain-Driven Design principles among software development teams by reducing the barrier to entry for strategic and tactical modeling.
- Establish a standard syntax and visualization system for DDD context mapping.
- Foster a collaborative environment where technical designs can be peer-reviewed in pull requests.

### 2.2 User goals

- Reduce the cognitive load of designing complex architectures by using an easy-to-read DSL.
- Obtain immediate visual and semantic feedback on architectural designs to identify design flaws early.
- Maintain a single source of truth for architecture diagrams that scales alongside the code.
- Easily share diagrams with teammates and stakeholders without needing external file sharing services or complex server setups.

### 2.3 Non-goals

- Creating a cloud-hosted relational database for diagram persistence in the initial version.
- Supporting full code-generation skeletons from the ODDS DSL for backend frameworks in the MVP.
- Implementing live collaborative editing (Google Docs style) in this release.
- Shipping a VS Code (or other IDE) plugin in the initial version — planned as a future distribution channel, out of scope for the MVP (see section 9.3).
- Shipping the interface in English in the MVP. The interface ships in Brazilian Portuguese, and English arrives later as a language selector (`ADR-0024`, section 5.4).

### 2.4 Competitive landscape

[Context Mapper](https://contextmapper.org/) is an existing open-source DSL for context mapping, built on Xtext/Java, that already lets teams describe context maps as text and generate diagrams from them. It is available as a plugin for VS Code and Eclipse, and as an online IDE via Gitpod. Any evaluation of ODDS should account for this prior art rather than treat "text-based context mapping" as a novel idea in itself — the differentiation has to come from the experience, not the base concept.

| Aspect | Context Mapper | ODDS |
|---|---|---|
| Base technology | Xtext/Java, requires a JVM | Client-side (browser), no JVM dependency |
| Primary entry point | IDE plugin (VS Code/Eclipse) or Gitpod online | Standalone web playground; a VS Code plugin is planned as an additional channel, not a replacement (see Non-goals) |
| Sharing | Via code repository | Shareable URL with encoded design state — no repo required |
| Validation feedback | Model-generation rules | Inline visual linting (three severity levels) with click-to-navigate to the offending line |
| Design opinion | Neutral notation | **Opinionated linter**: a catalogue of DDD good practices that judges the strategic design, with per-line suppression carrying a mandatory justification |
| Setup | Requires local environment setup | Zero installation, immediate use in the browser |
| Privacy | Depends on local setup | Guaranteed 100% local execution, even in the browser |

## 3. User personas

### 3.1 Key user types

- Software architects
- Software developers and tech leads
- Product managers and business analysts looking to understand bounded contexts

### 3.2 Basic persona details

- **Alex the architect**: Needs a quick way to document and review the domain boundary changes across multiple teams. Prefers text-based inputs that can be stored in Git and reviewed in pull requests.
- **Devin the developer**: Uses the playground to prototype new features and check if they violate domain boundary patterns. Wants rapid visual feedback and clear diagnostics when design warnings or architectural validation issues occur.

### 3.3 Role-based access

- **Guest user**: The application is client-side only and provides full access to editing, rendering, preset loading, exporting, and sharing without requiring registration.

## 4. Functional requirements

### 4.1. Core strategic modeling scope

The system must support the Strategic Design of DDD by mapping the Problem Space (global domains and categorized subdomains) and the Solution Space (physical boundaries of Bounded Contexts and their dynamic integrations via the Context Map).

The language follows a strict hierarchical taxonomy:
- **Domain**: Delimits the complete enterprise ecosystem or the business area under analysis.
- **Subdomain**: Divisions of the domain based on business importance, categorized as core, supporting, or generic.
- **Context (Bounded Context)**: Conceptual and technical boundary where the domain model and ubiquitous language are strictly applied.
- **External system**: A third-party system the user does not control (a payment provider, another company's ERP, a legacy platform), declared in a dedicated `external { }` block. It is a first-class citizen of the language precisely so that the user is never forced to lie that someone else's system is a context of one of *their* subdomains — which used to be the only way to draw it, and which made the linter fire unactionable warnings about an API the user cannot change. External contexts belong to no subdomain and never receive a `core`/`supporting`/`generic` classification: that vocabulary rates the strategic importance of a part of *your* business.

Two limitations of this taxonomy are deliberate, and are documented as such in `RULES-EN.md` §0.5 rather than left implicit: a Bounded Context belongs to exactly one Subdomain (real DDD relates them n:m), and a file describes exactly one Domain (maps spanning several domains are out of scope).

### 4.2. Declarative block syntax

The parser must recognize block declarations using braces for visual scope inheritance:

```
domain [DomainName] {
  title: "Optional display label"

  subdomain [core | supporting | generic] [SubdomainName] {
    title: "Optional display label"
    description: "Why this subdomain exists"
    owner: "Who answers for it"

    context [ContextName]

    context [NextContextName] {
      type: "Free-text classification"
      description: "Free-text description"
      responsibilities: ["Responsibility 1", "Responsibility 2"]
      maturity: experimental | growing | mature | legacy
      team: "Free-text team name"
      technology: "Free-text stack"
    }
  }

  external {
    context [ThirdPartySystemName] {
      description: "A system you do not control"
    }
  }

  mapping {
    // odds-disable-next-line UNDOCUMENTED_CONTRACT: contract still being negotiated with the vendor
    [ContextName] <-- [OHS, PL] [NextContextName]
  }
}
```

> See `GRAMMAR.md` for the authoritative, versioned EBNF grammar — this snippet is illustrative only and must be kept in sync with it.

Three details in the snippet are load-bearing rather than decorative:
- The `external { }` block is single, anonymous, and sits between the subdomains and the mapping. Naming or repeating it would recreate, by another route, the classification taxonomy that is deliberately withheld from third parties.
- A comment starting with `odds-disable-next-line` is a **suppression directive**, not a comment: it silences one diagnostic code on the following line, and the justification after the colon is mandatory. Suppression lives in the file (not in the UI) so it travels through Git, through the shared URL and through code review — otherwise two people would see different validation panels for the same design. It never reaches a critical error.
- **Properties are documentation; tags are contracts.** The properties of a `context` and the `description` and `owner` of a `subdomain` (`ADR-0008`) are shown to the reader and never feed the trigger of a rule. Only tags, connectors and structure are validated. That is a promise to the user: fill in `team` or `maturity` without the tool starting to judge you for it (`RULES-EN.md`, *Context Properties*). A `subdomain` accepts only those two properties, because a property that could contradict its classification or its contexts would call for a rule that this promise forbids.

### 4.3. Team relationship connectors

The parser and visualizer must support directional connectors representing the three Team Relationships (see `RULES-EN.md` for the full conceptual definitions) between teams:

| Connector | Relationship / Direction | Description |
| :---: | :--- | :--- |
| `-->` | Upstream / Downstream (Left to Right) | The left side is Upstream (U) (supplies data/rules); the right side is Downstream (D) (consumes and depends). The upstream side may succeed independently of the downstream side's fate — the dependency is asymmetric. |
| `<--` | Downstream / Upstream (Left to Right) | The left side is Downstream (D) and depends on the right side which is Upstream (U). Same asymmetric dependency as `-->`, mirrored. |
| `<->` | Mutually Dependent | Strong delivery interdependence. If one team fails or shifts timeline, the other is immediately impacted. This is the only way to express Mutual Dependency in ODDS — there is no separate tag for it. |
| `-x-` | Free / Separate Ways | Complete autonomy of operation. No organizational or technical link, and no alignment of timelines or daily impact between the two contexts. This connector **also carries the Separate Ways pattern**, which has no tag of its own — see the note in section 4.5. |

### 4.4. Diagram views and their expressive power

The playground must offer two views, which answer different questions and are therefore **deliberately not equivalent in what they can express**. Both are modes of a single honeycomb map (`ADR-0009`, `ADR-0011`): each context is a hexagonal piece, each subdomain is a territory of pieces, and the territories of one subdomain type form one landmass. The two views share that geography, so **switching views moves no piece**, and the reader's mental map survives the switch.

| View | Question it answers | Shows |
|---|---|---|
| Relationship flow | *"How does this integrate?"* | The relationships as lines between pieces, with an arrow on the downstream end (both ends on `<->`), a break mark on `-x-` and the pattern tags at each end |
| Nested containment | *"How is this organised?"* | No lines: the domain, its subdomain territories and their context pieces in the foreground, with the `external` block as a landmass of its own, **outside** the domain's territories |

Two consequences are intentional and must not be "fixed" by a later implementation:

- **`[BBM]` appears only in the flow view.** It is an annotation *of a relationship*, and the containment view has no edges. Deriving a node marker from it (marking any context that carries `[BBM]` on *some* relationship) was considered and rejected: the model is not guaranteed to be consistent on this point — there is a dedicated rule, `INCONSISTENT_BBM`, precisely because it may not be — so the derived marker would make the drawing assert more than the text does. Integration risk is, by definition, a question for the flow view.
- **The containment view draws `external` outside the domain's territories**, as a landmass of its own with a dashed outline, even though the syntax nests it inside the domain. The nesting is a syntactic compromise; the view has none of the constraints that forced it, so drawing it outside costs nothing and cancels the contradiction in the one place a user would ever perceive it.

### 4.5. Context map patterns (Integration contracts)

The parser and visualizer must support tags in brackets describing technical contracts and translation patterns applied at boundaries. There are **eight pattern tags**, each valid only on the connectors and sides shown — the full normative matrix is in `RULES-EN.md` §1.C:

| Tag | Pattern Name | Valid on | Description |
| :---: | :--- | :--- | :--- |
| `OHS` | Open Host Service | `-->`/`<--`, Upstream only | Upstream exposes a stable, documented public API for multiple consumers. |
| `PL` | Published Language | `-->`/`<--`, Upstream only | Use of a common/public data model (e.g., JSON Schema, Protobuf) for interchange. |
| `S` | Supplier | `-->`/`<--`, Upstream only | Upstream side of a Customer/Supplier relationship — commits to prioritizing and budgeting the Downstream's requirements. |
| `ACL` | Anti-Corruption Layer | `-->`/`<--`, Downstream only | Downstream translates external concepts to its internal model, isolating itself from semantic corruption. |
| `CF` | Conformist | `-->`/`<--`, Downstream only | Downstream blindly accepts the Upstream model. If Upstream changes, Downstream code changes. |
| `C` | Customer | `-->`/`<--`, Downstream only | Downstream side of a Customer/Supplier relationship — dictates requirements that the Supplier must prioritize. |
| `SK` | Shared Kernel | `<->`, both sides | Physical sharing of artifacts (single database, common code library) between contexts. |
| `P` | Partnership | `<->`, both sides | Extreme mutual cooperation between teams to keep models in harmony. |

**`BBM` is a ninth tag, but not a pattern tag.** It is the only member of a third category of annotation: it does not describe a solution applied at a boundary, it **characterises the system** on one end of the relationship. That is why it is the only tag with no position rule and no conflict rule — it is valid on any connector and any side, including `-x-` ("that ERP is a swamp, and that is *why* we decided not to integrate").

| Tag | Name | Valid on | Description |
| :---: | :--- | :--- | :--- |
| `BBM` | Big Ball of Mud | any connector, any side | Explicit signaling of a highly coupled, confused, and unstructured legacy system (risk zone). |

> **Note — where is Separate Ways?** It is the `-x-` connector, and it has no tag. Connectors and tags belong to different taxonomies (the shape of the dependency vs. the solution applied on top of it), and Separate Ways is the one pattern whose application *is* the absence of integration — which makes it indistinguishable from the "Free" dependency shape. A tag there could only ever be redundant or wrong, so ODDS carries the pattern on the connector. The full argument is in `RULES-EN.md` §0.2. An earlier version of the language did have an `[SW]` tag; files that still use it get a dedicated migration diagnostic, not a generic syntax error (section 5.5).

> **Note — Customer/Supplier:** the classic DDD literature describes it as a single pattern applied to a relationship as a whole. ODDS splits it into two independent, position-aware tags (`C` and `S`) so the parser can validate each side of the relationship separately (see Role Conflict in section 4.6). This is an intentional extension of ODDS beyond the classic pattern set, not a literal reproduction of it.

### 4.6. Architectural validation rules

The system must validate the architecture and identify issues at **three severity levels**. `RULES-EN.md` (with `RULES-PT.md` as its parallel translation) is the authoritative source for every trigger and severity; the summary below is what the product commits to surfacing.

**Errors — the model is incoherent.** They do **not** prevent visualization (see 5.2): the diagram degrades per element instead of disappearing. They are never suppressible.
  - Orphan Context / Orphan Subdomain: declaring a context outside a subdomain (or outside the `external` block), or a subdomain outside a domain.
  - Invalid Domain Cardinality: a file that declares zero domains, or more than one.
  - Phantom Reference: a relationship involving a context not declared anywhere in the file.
  - Duplicate Context / Duplicate Subdomain: the same name declared twice. Internal and external contexts share one namespace.
  - Invalid Subdomain Type: classifiers other than core, supporting or generic.
  - Self Relationship: a context related to itself.
  - Duplicate Relationship: a second line for a pair of contexts that are already related — whether it repeats, contradicts, or splits tags across lines. One pair, one relationship, one edge.
  - External-only Relationship: both sides are third-party systems. A context map documents *your* integrations.
  - Misplaced Tags: an Upstream-only tag (OHS, PL, S) on the Downstream side, or vice-versa.
  - Tag/connector mismatch: a mutual tag (SK, P) on a directional connector, or a position-dependent tag on `<->`.
  - Incomplete Mutual Tag: SK or P declared on only one side of a `<->`. The tool never infers the other side — the text is the source of truth.
  - Mutual Tag with an External context: there is no Shared Kernel or Partnership with a third party.
  - Separation Conflict: any pattern tag on a Free (`-x-`) line. `[BBM]` is explicitly exempt — it characterises a system rather than a contract.
  - Role Conflict: a context declared both Customer (C) and Supplier (S) in the same relationship.
  - Protection Conflict: a context declared CF and applying an ACL for the same integration.
  - Removed Construct: a construct from an earlier language version (see 5.5).

**Warnings — the model is coherent, the design is risky.** Suppressible, with justification.
  - Conformist Core Domain: a core subdomain context conforming as CF, or depending on a BBM. Core domains should be protected via ACL.
  - Generic Upstream without OHS: a generic subdomain context acting as a broad upstream dependency without exposing a well-defined OHS, encouraging hidden coupling.
  - Core Upstream of a Generic: strategic design points the other way — the core consumes the generic, not the reverse.
  - Core in a Shared Kernel: the competitive advantage physically coupled to another team's model.
  - Domain without a Core: the map never says where the competitive advantage is.
  - Inconsistent BBM: the same system marked BBM on some relationships and not others.
  - Incomplete Customer/Supplier: C declared on one side without S on the other.

**Info — documentation hygiene.** Suppressible.
  - Undocumented Integration Contract: a `-->`, `<--` or `<->` line with no pattern tag on either side. Does not apply to `-x-`, where the absence of a tag is the intended signal.
  - Excessive Shared Kernels: three or more shared kernels in one file.
  - Unmapped Context: a context declared and never referenced in the mapping.
  - Empty Subdomain: a subdomain declaring no context.
  - Published Language without Open-Host Service.
  - Malformed / Unused Suppression: a directive that cannot work, or that no longer silences anything.

Two product constraints govern how this catalogue may grow, and exist to keep the panel worth reading — a linter that produces eight diagnostics for a thirty-line file gets ignored wholesale. A new rule is only admissible if **(a)** it does not presuppose that the user controls the system being judged, and **(b)** its fix is distinct from every existing rule's fix. Both are recorded in `RULES-EN.md` §0.4.

### 4.7. Tactical design evolution (evolution phase)

The system will expand in a future iteration to support tactical modeling structures inside Bounded Contexts:
- Supports defining aggregates, entities, and value objects inside contexts.
- Validates tactical design rules (e.g., ensuring entities and value objects reside within aggregates).
- Renders tactical structures inside Bounded Contexts visually.

## 5. User experience

### 5.1 Entry points & first-time user flow

- The user accesses the playground web app via the browser.
- A default pre-populated template is loaded into the editor, rendering the diagram instantly.
- The UI guides the user on how to edit the DSL and see updates in real time.

### 5.2 Core experience

- **Writing declarations**: The user writes the domain model, and the visualization updates automatically.
- **Interactive validation feedback**: The user views architectural issues in the validation panel, with a counter per severity level (error / warning / info) that filters the list. The list itself keeps the normative emission order (`RULES-EN.md` §3.3): by validation phase, then by position in the file. Clicking an issue highlights the relevant line in the editor and selects the element it is about on the map. The panel owns the presentation of severity — icons and colors are chosen here, never embedded in the message text, so that a rule reclassified later does not carry a stale icon with it.
- **Visualization toggles**: The user switches between the relationship flow view and the nested containment view (see 4.4).
- **Navigating the map**: The user zooms and pans; selecting a context lights up its relationships and fades the rest, selecting a territory focuses its subdomain, and selecting a line isolates one relationship. A structure panel lists the domain's tree and relationships, and picking an entry frames it on the map.
- **Inspecting an element**: The selected context, subdomain or relationship opens an inspector with what the text declares about it — its properties, its tags read as patterns, and the diagnostics that concern it.
- **Workspace sharing**: The user copies a shareable URL to easily send their workspace design to others.

**Rendering with errors — degradation, not blocking.** The diagram must never blank out because the model is invalid. Every intermediate state of a file being typed is a syntax error, so strict blocking would make the canvas blink empty on every keystroke, contradicting the instant-visualization promise in 7.3 and the responsiveness constraint in 8.2. The required behaviour:

- The partial model always renders whatever is renderable; the element with the problem is drawn **visibly marked** — a dashed red edge for an invalid relationship, a dotted ghost node for a reference that does not resolve.
- Only a pure syntax error, where no tree exists at all, freezes the last good diagram instead of erasing it. **The frozen diagram must be visibly marked as stale**, otherwise the canvas silently misrepresents the file the user is looking at.
- **Exporting with errors is allowed, and the export includes the markers.** The exported image is exactly what is on the canvas; there is no "clean" variant, because an export without markers becomes documentation asserting a model that was never valid.

### 5.3 Advanced features & edge cases

- **Complex domains**: When relationship graphs become too dense, the user utilizes the containment view to inspect structural clusters and nesting.
- **Offline usage**: The app works fully offline, allowing users to design and view diagrams without an internet connection or external server dependency.

### 5.4 UI/UX highlights

- Clean, modern design system with clear typography, intuitive controls, and a polished visual identity, specified in `DESIGN.md` (`ADR-0013`).
- Smooth transition between light and dark modes.
- **Interface language:** Brazilian Portuguese in the MVP, with English arriving later as a language selector (`ADR-0024`). The message catalogue (`MESSAGES.md`) is already bilingual, and the `.odds` keywords and diagnostic codes are the same in every language, so a shared design reads the same to everyone.

### 5.5 Language versioning and old links

The shareable URL payload carries the **ODDS Language Version** the design was written against, alongside the encoded text. The version does *not* live in the `.odds` file: that file is the artifact a user pastes into a pull request, and a mandatory version pragma on line 1 would charge every user, forever, for a problem that only exists at the URL boundary — where a version field is free, because the URL is machine-generated.

Opening a link written against an older version:

- **The application never rewrites the user's text.** Automatic migration would mean shipping migration code for every past version in the browser bundle forever — permanent weight in a 100% client-side product — and silently editing someone's architecture document contradicts the premise that the text is the source of truth.
- Instead, the text loads as-is, the diagram renders, and any construct that no longer exists produces a **dedicated migration diagnostic** on its exact line, naming the replacement (e.g. *"`[SW]` was removed in ODDS 0.1.0 — use `-x-` on its own"*), rather than a generic syntax error that explains nothing.
- Only a MAJOR version difference — one where a previously valid file stops being valid — triggers these diagnostics. Adding a new lint rule changes what the panel says without breaking the file, and must not be announced as a breaking change.

## 6. Narrative

The project changes how product and engineering teams align on system architecture. When a software architect, Alex, designs a new system, they write the ODDS declarations directly in the playground instead of drawing static shapes. The system immediately validates the architecture design rules. When Alex attempts to connect a critical core subdomain context directly to a legacy system without protection, the diagram still renders — Alex can see the shape of what they just wrote — and the console flags a strategic risk: the core domain is conforming to another system's model, and should be protected via an ACL. Alex corrects the relationship by adding a protection layer, and the warning disappears. On the one integration where conforming really was a deliberate business decision, Alex instead writes a suppression directive above the line, recording *why* — which is the most valuable sentence in the file, and now travels with it into the pull request. Alex then exports the diagram as a vector image to attach to the project documentation and copies the shareable link to include in the pull request description so that other developers can interactively inspect and modify the design.

## 7. Success metrics

### 7.1 User-centric metrics

- Alignment clarity: Increase in the team's shared understanding of domain boundaries and team responsibilities, measured by surveys.
- Reduced ambiguity: Decrease in architectural misalignment discussions during development phases.
- Visualization efficiency: Reduction in time spent manual-drawing and aligning visual nodes in diagram editors.

### 7.2 Business metrics

- Reduction in architectural refactoring sprints caused by boundary violations caught late in development.
- Reduced onboarding time for new engineers who can read the living architecture diagrams.

### 7.3 Performance and privacy metrics

- Instant visualization updates to maintain a smooth, interactive feel while writing.
- Local execution to ensure complete privacy of proprietary architecture layouts.

## 8. Business considerations and constraints

### 8.1 Data storage & privacy

- Intellectual property protection: All architectural designs must remain entirely on the user's device, ensuring no sensitive data is sent to external servers.
- Session persistence: User preferences and the active workspace state must be saved automatically so work is not lost when reloading.

### 8.2 Usability & performance constraints

- Interaction responsiveness: The interface must remain responsive during typing, avoiding lagging or stuttering of the visual diagram.
- High-quality presentation: Visual exports must be high-resolution and suitable for inclusion in professional architecture reports.

### 8.3 Sharing & collaboration limits

- Link sharing: Shareable links must fit within standard communication channel limits (e.g., chat apps) to enable seamless sharing.
- Multi-view options: Large, complex diagrams must offer alternative layouts or views to remain legible and useful for stakeholders. The answer is the two views plus navigation (`ADR-0011`): a fifty-context map seen whole and still is not legible in the flow view, and it is read by zooming, focusing and lighting up one context at a time.

## 9. Milestones & sequencing

### 9.1 Project estimate

- Size: Medium
- Time estimate: 4 weeks
- *Written before implementation began, and kept as it was. The status of each phase is in 9.3.*

### 9.2 Team size & composition

- Team size: 2 engineers (1 Frontend Developer, 1 Language/Rules Engineer)

### 9.3 Suggested phases

- **Phase 1: Core language and validation rules (1 week)**
  - Deliverables: Domain language parser and architectural validation system.
  - **Status: delivered on 2026-09-05.** `@odds/core` passes the 44 golden files, and `@odds/messages` renders every diagnostic in both languages.
- **Phase 2: User interface and visualization (2 weeks)**
  - Deliverables: Visual playground, dual diagram layouts, validation feedback panel, and automatic saving.
  - Milestone: Complete playground with live visualization and validation feedback.
  - **Status: delivered, with two gaps.** The playground (`apps/playground`) runs since 2026-10-21 and does everything the bench validated since 2026-10-23. Two pieces are missing: automatic saving of the design and theme (GH-005), and the dotted ghost node for a reference that does not resolve (5.2): today the relationship is reported in the panel and left out of the drawing.
- **Phase 3: Sharing and export capabilities (1 week)**
  - Deliverables: Shareable link generator, image exports, preset templates, and interface styling.
  - Milestone: Complete playground with sharing features.
  - **Status: partial.** Image export with the markers (vector SVG), two preset templates and the interface styling (`DESIGN.md`) are delivered. The shareable link (GH-003) is not: its payload format still needs an ADR of its own.
- **Phase 4: Tactical design support (future evolution)**
  - Deliverables: Language expansion for internal context elements and nested visualization support.
  - **Status: not started**, by design.

## 10. User stories

### 10.1. Load preset templates

- **ID**: GH-001
- **Description**: As a first-time user, I want to load a pre-existing template in the playground so that I can immediately understand the DSL syntax and see a working visualization.
- **Acceptance criteria**:
  - A templates dropdown is populated with at least two presets (e.g., E-Commerce, Simple Domain).
  - Selecting a preset loads the DSL code into the editor.
  - The diagram renders automatically upon preset selection.

### 10.2. Interactive validation console

- **ID**: GH-002
- **Description**: As a user designing a system, I want to see architectural warnings and critical errors instantly in a list, with the ability to click them to jump to the relevant line, so that I can correct issues efficiently.
- **Acceptance criteria**:
  - The validation console updates automatically as I type.
  - Each diagnostic displays the line number, severity (Error / Warning / Info), and a detailed message.
  - Clicking on a message highlights the specific line in the editor.
  - The diagram keeps rendering while errors exist, with the offending elements marked (see 5.2).
  - A `// odds-disable-next-line <CODE>: <justification>` directive removes a warning or info from the console; it never removes an error.

### 10.3. Shareable URL link

- **ID**: GH-003
- **Description**: As a user, I want to share my current design by sending a URL link to a colleague, so that they can open the playground with my exact design loaded.
- **Acceptance criteria**:
  - Clicking the share button copies a unique URL to the clipboard.
  - The URL contains the encoded design state **and the ODDS Language Version it was written against**.
  - Loading the URL automatically loads and visualizes the shared design.
  - Loading a URL from an older major version renders the design and reports migration diagnostics on the affected lines, without rewriting the text (see 5.5).

### 10.4. Detailed tactical design support

- **ID**: GH-004
- **Description**: As a user wanting more detail, I want the tool to support representing internal context structures like aggregates, entities, and value objects.
- **Acceptance criteria**:
  - The system supports writing aggregate, entity, and value object definitions within contexts.
  - The visual diagram displays these internal elements nested inside their respective contexts.

### 10.5. Auto-saved design and preferences

- **ID**: GH-005
- **Description**: As a returning user, I want the application to load my last design and preferred visual theme (light or dark) automatically, so that I do not lose my work.
- **Acceptance criteria**:
  - The design is saved automatically to the browser.
  - The visual theme preference (light/dark) is saved automatically.
  - Reopening the application restores the saved design and theme.

### 10.6. Secure local data privacy

- **ID**: GH-006
- **Description**: As a designer working on proprietary architecture, I want to ensure my design text and structure are processed strictly on my local machine without transmission to any external servers, to comply with security guidelines.
- **Acceptance criteria**:
  - The application validates and renders the diagram purely within the user's browser.
  - No network requests containing the design content are sent to external servers.

---

## Changelog

Version history is centralized in [`CHANGELOG.md`](./CHANGELOG.md) (section `## PRD.md`). Current version: **1.3.1**. Any change to this file must get a new entry there, not here.
