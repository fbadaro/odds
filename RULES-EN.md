## 🧠 Team Relationships

These three relationships describe the *shape* of the dependency between two teams or bounded contexts, and map directly to the ODDS connectors (`-->`, `<--`, `<->`, `-x-`).

| Relationship | Description |
|---|---|
| Mutually Dependent | Two teams or bounded contexts are mutually dependent when their software artifacts need to be delivered together to succeed. Failure or a timeline shift in one immediately impacts the other. A lot of coordination and communication is required (see Partnership pattern). Expressed with the `<->` connector. |
| Upstream / Downstream | The upstream team's decisions affect the downstream team, but not the other way around — the upstream team may succeed independently of the downstream team's fate. The downstream team's needs can be addressed in a variety of ways, with a wide range of consequences (see Conformist, Customer-Supplier, and Anti-Corruption Layer patterns). Expressed with `-->` (left side is Upstream) or `<--` (right side is Upstream). |
| Free | No organizational or technical link of any kind exists between the two contexts; changes in one do not influence the success or failure of the other. Expressed with the `-x-` connector. |

---

## 🧠 Context Map Patterns

These nine patterns describe the technical and social *solution* applied on top of a Team Relationship — the specific contract or protection strategy chosen at the boundary.

| Pattern | Description |
|---|---|
| Partnership | Two teams have a mutual dependency on each other's context to the extent that if either fails, both will fail. The contexts are peers, meaning that there is no ceremony required between expressing needs and receiving due functionality. The winners are those who best coordinate and cooperate. Partnerships can be slower and more difficult due to the complexity of integrated models and schedules. |
| Shared Kernel | Two or more teams share a small, common model, that is blended with their own specialized model. This requires agreement, and is often best used for system-wide standards, such as monetary or others. Note that this is not just a data schema (see Published Language), but a model with both data and behavior (object types). Caution is warranted against overuse or imagining that a reusable library fits the bill. The artifact is a shared, small, model. |
| Customer-Supplier | A team has a dependency on another team's Bounded Context, but the teams are not peers. Rather, the dependent is downstream from the upstream dependency. This makes the downstream team subject to the availability of schema and functionality that meets their specific needs. Addressing special needs is left to the discretion of the upstream team, which may impact the downstream team's timeline and capabilities. |
| Conformist | A downstream team must conform to an upstream model. This dependency is might be a desired choice, but is often determined by the complexity of the upstream model and downstream team's capacity and capabilities. Of course, any changes to the upstream model can/will have an impact on the downstream team, depending on their usage surface area. |
| Separate Ways | A team could potentially integrate with another model, but might decide that the benefit doesn't match the effort required, so the team decides to create their own one-off solution. Care must be taken with respect to DRY, or Don't Repeat Yourself. Note that DRY means "Don't Repeat Knowledge," not "Don't Repeat Code." Knowledge silos are problematic because repetition of captured knowledge in a business software context might cause deviation in one or more repeating models. When DRY as in knowledge is a certain factor, consider integration instead. |
| Anti-Corruption Layer | A downstream team has both the capacity and capabilities to take a highly defensive posture in consuming upstream model. The upstream model is often complex and poorly designed, but the downstream model can still benefit by translating even clean models to their own language. The downstream creates a set of translation components that render the upstream model to a specific design that adheres to their own model design. |
| Open-Host Service | A model has a well-designed API that enables one or more other teams to confidently and reliably perform operations. The consumed API is not automatically in an upstream position, which means that the majority of the previous and following relationships apply. That is, any consuming team can find themselves in a variety of circumstances, which will determine how the model behind the API is used. See also Published Language. |
| Published Language | A set of well-designed schema specifications—possibly considered a single specification—are provided for data exchange between Bounded Contexts. A Published Language is often paired with and Open-Host Service. A specific schema set can be an standard of the following proportions: international, national, industry, inter-business, intra-business, and context/model/team. |
| Big Ball of Mud | Systems are often implemented in monoliths without any intentional design and architecture, and have been long subjected to expedient change. There are generally no efforts or even recognition of the complex problems that will be at play, even quite early in the software life cycle, and thus are left to chance. Technical debt rises continually and is seldom paid. The tangle that ensues is often compared to a large, muddy, amorphous blob, or otherwise, a brown field of software. In time nearly zero changes can be made without regression, which cause system releases to stagnate. |

---

## 🧠 Context Properties (Metadata)

Beyond the structural declaration (`context Name { ... }`), a Bounded Context — and, at the outer levels, a `domain` or `subdomain` — can carry descriptive metadata. This metadata is **informational**: it documents intent for humans and tooling, but does not participate in any Team Relationship or Context Map Pattern validation described above. The formal syntax for these properties lives in `GRAMMAR.md`; this section documents their intended meaning.

| Property | Available on | Purpose |
|---|---|---|
| `title` | `domain`, `subdomain`, `context` | Human-readable display label, distinct from the technical identifier used to reference the element elsewhere (e.g. in `mapping`). Intended for rendering on the canvas/diagram. |
| `type` | `context` | Free-text classification of the context's nature (e.g. "service", "legacy system", "gateway"). Deliberately left open-ended rather than a closed taxonomy — there is no fixed list of valid values. |
| `description` | `context` | Free-text explanation of the context's purpose and role. |
| `responsibilities` | `context` | A list of the business or technical responsibilities owned by this context. |
| `maturity` | `context` | Lifecycle stage of the context. One of: `experimental`, `growing`, `mature`, `legacy`. |
| `team` | `context` | The team responsible for the context, as free text. |
| `technology` | `context` | The technology stack used to implement the context, as free text. |

None of these properties currently trigger a Critical Error or Lint Warning on their own. `maturity: legacy` in particular does **not** automatically imply a `[BBM]` (Big Ball of Mud) pattern or trigger any warning from section 2 below — the two are independent concepts (one documents lifecycle stage, the other documents an integration pattern), and conflating them would be a modeling decision the tool should not make silently on the user's behalf.

---

## 🧠 Semantic Validations (AST Analysis & Architecture Rules)

To ensure that the **Open Domain Driven Specification (ODDS)** is not just a drawing tool, but a true "architecture validator" that teaches and enforces DDD best practices, the parser must perform a deep semantic analysis of the Abstract Syntax Tree (AST).

We can divide the semantic validations into two main categories: **Critical Errors** (which block rendering) and **Lint Warnings** (which render but alert about dangerous architectural decisions).

Below are all the detailed validations that your engine will need to verify:

---

### 1. Critical Errors (Block Compilation)

These rules ensure code integrity and basic context map consistency.

#### A. Scope and Hierarchy Validations (Lexical Scoping)

* **Orphan Context:** A `context` cannot exist detached outside a `subdomain`.
  * *Error:* `"A Bounded Context must belong to a Subdomain."`

* **Orphan Subdomain:** A `subdomain` cannot exist outside the scope of a `domain`.
  * *Error:* `"Invalid subdomain declaration outside the main 'domain' scope."`

* **Phantom Reference in Context Map:** The parser must read all context declarations first. When it reaches the relationships section, it must verify that the referenced contexts actually exist.
  * *Error:* `"The context 'Payment' referenced in the Context Map was not declared in any subdomain."`

* **Duplicate Context Declaration:** A `context` name must be unique across the entire `domain`. The same name cannot be declared in two different `subdomain` blocks (or twice in the same one).
  * *Error:* `"The context 'PaymentGateway' is declared more than once. Context names must be unique within the domain."`

* **Invalid Domain Cardinality:** An ODDS file must declare **exactly one** `domain`. A file with zero `domain` declarations, or with more than one, is invalid.
  * *Error:* `"An ODDS file must contain exactly one 'domain' declaration."`

#### B. Strict Typing Validations

* **Invalid Subdomain Modifiers:** The language requires the user to classify the problem space.
  * *Rule:* The identifier after the `subdomain` keyword must strictly be `core`, `supporting`, or `generic`.
  * *Error:* `"Unknown subdomain type. Use only 'core', 'supporting', or 'generic'."`

#### C. Tag Position Validations (Upstream vs Downstream)

This is the most intelligent part of the parser, based on the direction of the arrows (`-->` and `<--`).

* **Upstream-only Tags (Supplier):** The tags `[OHS]` (Open Host Service), `[PL]` (Published Language), and `[S]` (Supplier) **can only** appear on the side providing the information (Upstream).
  * *Invalid Example:* `ContextA --> [OHS] ContextB` (The `-->` indicates B is Downstream, but OHS is an Upstream pattern).
  * *Error:* `"Invalid Pattern: An Open Host Service (OHS) can only be exposed by the Upstream side of the integration."`

* **Downstream-only Tags (Consumer):** The tags `[ACL]` (Anti-Corruption Layer), `[CF]` (Conformist), and `[C]` (Customer) **can only** appear on the side consuming the information (Downstream).
  * *Error:* `"Invalid Pattern: An Anti-Corruption Layer (ACL) can only be applied on the Downstream side to protect its own model."`

* **Mutual/Symmetric Tags:** The tags `[SK]` (Shared Kernel) and `[P]` (Partnership) require bidirectionality.
  * *Rule:* It is recommended to use the `<->` connector. If declared, they should preferably appear on both sides, or the parser can automatically infer them for the other side.
  * *Note:* Mutual Dependency itself is expressed only through the `<->` connector — there is no separate `[MD]` tag in ODDS.

#### D. Conflict and Exclusivity Validations

* **Separation Conflict:** If the `-x-` connector (Free) or the `[SW]` tag (Separate Ways) is used, there must not be any technical integration indicators on the same line.
  * *Invalid Example:* `ContextA [OHS] -x- [ACL] ContextB`
  * *Error:* `"Semantic Conflict: The Separate Ways relationship (-x-) indicates absence of integration. Remove [OHS] and [ACL] tags."`

* **Role Conflicts:** A context cannot be `[C]` (Customer) and `[S]` (Supplier) simultaneously in the same relationship.

* **Protection Conflict:** It makes no sense for a context to be `[CF]` (Conformist - accepts everything) and have an `[ACL]` (Anti-Corruption Layer - protects and translates) for the same integration.
  * *Error:* `"Pattern Conflict: A context cannot be a Conformist and have an Anti-Corruption Layer simultaneously."`

---

### 2. Architectural "Lint" Warnings (Visual Warnings)

These validations do not break the diagram, but they can place a warning icon (⚠️) on the generated diagram, helping the team notice "code smells" in the enterprise architecture.

#### E. Business Alignment Warnings (Problem Space)

* **Core Domain Conforming or Inheriting Mud:** The `core` is the company's main competitive advantage. If it is held hostage by external systems, the business is at risk.
  * *Trigger:* A context inside a `core subdomain` receiving an arrow with `[CF]` (Conformist) or connecting to a system with `[BBM]` (Big Ball of Mud).
  * *Warning:* `"⚠️ Strategic Risk: A Core Domain context is conforming to the model of another system. Consider using an [ACL] to protect your competitive advantage."`

* **Core Domain Focused on Infrastructure/Shelf Solutions:**
  * *Trigger:* If many `generic` patterns start dictating rules (being widely Upstream without ACL on consumers).
  * *Warning:* `"⚠️ Generic solutions should ideally provide well-defined services [OHS]. Beware of excessive coupling."`

* **Excessive Shared Kernel:**
  * *Trigger:* Multiple contexts using `[SK]` in the architecture.
  * *Warning:* `"⚠️ The excessive use of Shared Kernels drastically increases coupling between teams. Use with caution."`

* **Undocumented Integration Contract:**
  * *Trigger:* A relationship arrow (`-->`, `<--`, or `<->`) between two contexts with no Context Map Pattern tag (e.g. `[OHS]`, `[ACL]`, `[CF]`, `[PL]`, `[SK]`, `[C]`, `[S]`, `[P]`) declared on either side. Does not trigger on `-x-` (Free) lines, where the absence of a tag is the intended signal.
  * *Warning:* `"⚠️ Undocumented Contract: This integration has no explicit Context Map pattern. An undeclared relationship hides the real coupling between teams. Add a tag (e.g. [OHS], [ACL], [CF]) to make the integration contract explicit."`

---

### Summary for AST Implementation

When building your *Visitor* (the function that traverses the tree generated by the Parser), you will need a symbol table or context dictionary data structure.

1. **Step 0:** Verify the `Program` node contains exactly one `Domain` node (Invalid Domain Cardinality). If not, report the error and stop — there is no valid domain to traverse further.
2. **Step 1:** Traverse the `subdomain` nodes, recording in memory the name of each `context` and the type of its parent subdomain (`core`, `supporting`, `generic`). While recording, check for name collisions (Duplicate Context Declaration) — a name already present in the symbol table is an error.
3. **Step 2:** Traverse the relationship nodes (Context Map), cross-referencing them with the data stored in Step 1 to verify existence, apply position rules (`-->` / `<--`), and validate conflicts in tag arrays.
