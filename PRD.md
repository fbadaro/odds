# PRD: Open Domain Driven Specification (ODDS)

## 1. Product overview

### 1.1 Document title and version

- PRD: Open Domain Driven Specification (ODDS)
- Version: 1.1.0

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

### 2.4 Competitive landscape

[Context Mapper](https://contextmapper.org/) is an existing open-source DSL for context mapping, built on Xtext/Java, that already lets teams describe context maps as text and generate diagrams from them. It is available as a plugin for VS Code and Eclipse, and as an online IDE via Gitpod. Any evaluation of ODDS should account for this prior art rather than treat "text-based context mapping" as a novel idea in itself — the differentiation has to come from the experience, not the base concept.

| Aspect | Context Mapper | ODDS |
|---|---|---|
| Base technology | Xtext/Java, requires a JVM | Client-side (browser), no JVM dependency |
| Primary entry point | IDE plugin (VS Code/Eclipse) or Gitpod online | Standalone web playground; a VS Code plugin is planned as an additional channel, not a replacement (see Non-goals) |
| Sharing | Via code repository | Shareable URL with encoded design state — no repo required |
| Validation feedback | Model-generation rules | Inline visual linting (errors/warnings) with click-to-navigate to the offending line |
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

### 4.2. Declarative block syntax

The parser must recognize block declarations using braces for visual scope inheritance:

```
domain [DomainName] {
  subdomain [core | supporting | generic] [SubdomainName] {
    context [ContextName]
    context [NextContextName] [OptionalAttribute]
  }
}
```

### 4.3. Team relationship connectors

The parser and visualizer must support directional connectors representing the three Team Relationships (see RULES.md for the full conceptual definitions) between teams:

| Connector | Relationship / Direction | Description |
| :---: | :--- | :--- |
| `-->` | Upstream / Downstream (Left to Right) | The left side is Upstream (U) (supplies data/rules); the right side is Downstream (D) (consumes and depends). The upstream side may succeed independently of the downstream side's fate — the dependency is asymmetric. |
| `<--` | Downstream / Upstream (Left to Right) | The left side is Downstream (D) and depends on the right side which is Upstream (U). Same asymmetric dependency as `-->`, mirrored. |
| `<->` | Mutually Dependent | Strong delivery interdependence. If one team fails or shifts timeline, the other is immediately impacted. This is the only way to express Mutual Dependency in ODDS — there is no separate tag for it. |
| `-x-` | Free | Complete autonomy of operation. No organizational or technical link, and no alignment of timelines or daily impact between the two contexts. |

### 4.5. Context map patterns (Integration contracts)

The parser and visualizer must support tags in brackets describing technical contracts and translation patterns applied at boundaries:

| Tag | Pattern Name | Description |
| :---: | :--- | :--- |
| `OHS` | Open Host Service | Upstream exposes a stable, documented public API for multiple consumers. |
| `PL` | Published Language | Use of a common/public data model (e.g., JSON Schema, Protobuf) for interchange. |
| `ACL` | Anti-Corruption Layer | Downstream translates external concepts to its internal model, isolating itself from semantic corruption. |
| `CF` | Conformist | Downstream blindly accepts the Upstream model. If Upstream changes, Downstream code changes. |
| `SK` | Shared Kernel | Physical sharing of artifacts (single database, common code library) between contexts. |
| `C` | Customer | Downstream side of a Customer/Supplier relationship — dictates requirements that the Supplier must prioritize. |
| `S` | Supplier | Upstream side of a Customer/Supplier relationship — commits to prioritizing and budgeting the Downstream's requirements. |
| `P` | Partnership | Extreme mutual cooperation between teams to keep models in harmony. |
| `SW` | Separate Ways | Intentional decision not to integrate due to high alignment cost compared to technical benefit. |
| `BBM` | Big Ball of Mud | Explicit signaling of a highly coupled, confused, and unstructured legacy system (risk zone). |

> **Note:** the classic DDD literature describes Customer/Supplier as a single pattern applied to a relationship as a whole. ODDS splits it into two independent, position-aware tags (`C` and `S`) so the parser can validate each side of the relationship separately (see Role Conflict in section 4.6). This is an intentional extension of ODDS beyond the classic pattern set, not a literal reproduction of it.

### 4.6. Architectural validation rules

The system must validate the architecture and identify structural issues, separating them into critical errors and design warnings:

- **Critical errors (prevent visualization)**:
  - Orphan Context: Declaring a context outside a subdomain block.
  - Orphan Subdomain: Declaring a subdomain outside a domain block.
  - Phantom Reference: Connection involving Bounded Contexts not declared in the hierarchy.
  - Invalid Subdomain Type: Using classifiers other than core, supporting, or generic.
  - Misplaced Tags: Using Upstream-only tags (OHS, PL, S) on the Downstream side of the relationship (or vice-versa).
  - Separation Conflict: Using coupling tags (ACL, OHS, PL, CF) on separate ways (`-x-`) lines.
  - Role Conflict: Defining a context as both Customer (C) and Supplier (S) in the same relationship.
  - Mutually Exclusive Protection Patterns: Defining a context as CF and applying an ACL simultaneously.
- **Design warnings (highlight potential architectural flaws)**:
  - Conformist Core Domain: A core subdomain context receiving data as CF or depending directly on a BBM. Core domains must be protected via ACL.
  - Generic Solutions Without OHS: Generic subdomain patterns acting as a broad upstream dependency without exposing a well-defined OHS, encouraging hidden coupling.
  - Excessive Shared Kernels: Multiple contexts linked by SK, indicating high physical coupling.
  - Undocumented Integration Contract: Relationship arrows (`-->`, `<--`, `<->`) with no contract tags (e.g., ACL, OHS, CF) to encourage explicit documentation. Does not apply to Free (`-x-`) relationships, where the absence of a tag is expected.

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
- **Interactive validation feedback**: The user views architectural issues in the validation panel. Clicking an issue highlights the relevant line in the editor.
- **Visualization toggles**: The user switches between the relationship flow view and the nested containment view.
- **Workspace sharing**: The user copies a shareable URL to easily send their workspace design to others.

### 5.3 Advanced features & edge cases

- **Complex domains**: When relationship graphs become too dense, the user utilizes the containment view to inspect structural clusters and nesting.
- **Offline usage**: The app works fully offline, allowing users to design and view diagrams without an internet connection or external server dependency.

### 5.4 UI/UX highlights

- Clean, modern design system with clear typography, intuitive controls, and a polished visual identity.
- Smooth transition between light and dark modes.

## 6. Narrative

The project changes how product and engineering teams align on system architecture. When a software architect, Alex, designs a new system, they write the ODDS declarations directly in the playground instead of drawing static shapes. The system immediately validates the architecture design rules. When Alex attempts to connect a critical core subdomain context directly to a legacy system without protection, the warning console highlights a design issue: "Core Domain Conformist: core domain should be protected via ACL". Alex corrects the relationship by adding a protection layer, and the warning disappears. Alex then exports the diagram as a vector image to attach to the project documentation and copies the shareable link to include in the pull request description so that other developers can interactively inspect and modify the design.

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
- Multi-view options: Large, complex diagrams must offer alternative layouts or views to remain legible and useful for stakeholders.

## 9. Milestones & sequencing

### 9.1 Project estimate

- Size: Medium
- Time estimate: 4 weeks

### 9.2 Team size & composition

- Team size: 2 engineers (1 Frontend Developer, 1 Language/Rules Engineer)

### 9.3 Suggested phases

- **Phase 1: Core language and validation rules (1 week)**
  - Deliverables: Domain language parser and architectural validation system.
- **Phase 2: User interface and visualization (2 weeks)**
  - Deliverables: Visual playground, dual diagram layouts, validation feedback panel, and automatic saving.
  - Milestone: Complete playground with live visualization and validation feedback.
- **Phase 3: Sharing and export capabilities (1 week)**
  - Deliverables: Shareable link generator, image exports, preset templates, and interface styling.
  - Milestone: Complete playground with sharing features.
- **Phase 4: Tactical design support (future evolution)**
  - Deliverables: Language expansion for internal context elements and nested visualization support.

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
  - Each warning/error displays the line number, severity (Error/Warning), and a detailed message.
  - Clicking on a message highlights the specific line in the editor.

### 10.3. Shareable URL link

- **ID**: GH-003
- **Description**: As a user, I want to share my current design by sending a URL link to a colleague, so that they can open the playground with my exact design loaded.
- **Acceptance criteria**:
  - Clicking the share button copies a unique URL to the clipboard.
  - The URL contains the encoded design state.
  - Loading the URL automatically loads and visualizes the shared design.

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