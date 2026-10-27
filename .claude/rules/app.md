---
paths:
  - "apps/playground/**"
  - "DESIGN.md"
---

# Working in apps/playground

- **UI ideas are built directly in the app** (ADR-0025), on Base UI components where one exists. `data-feature="<id>"` on a component's root is a live selector: the camera, the diagnostics dock and the tests find islands and panels by it, so keep the literal when refactoring.
- **`@base-ui/react` is imported only inside `src/components/ui/`** (ADR-0014), enforced by `npm run lint`. Where a Base UI component exists but does not serve, the exception is written in the component with its reason, as `src/components/ui/Toast.tsx` does.
- **The honeycomb stays outside React reconciliation** (ADR-0014): the SVG from `@odds/layout` goes in as markup, and selection, hover, camera and FLIP change the DOM imperatively.
- **The React Compiler does the memoization** (ADR-0019) and relies on the hooks lint rules: fix a hooks finding in the code.
- **`src/styles/tokens.css` is generated** from the `DESIGN.md` front matter (ADR-0018): edit `DESIGN.md`, then `npm run generate:tokens`; `npm run dev` regenerates on save, and a test fails on drift. Variable names follow the front matter (`--c-canvas`, `--c-surface`).
- **Styles** live in a `.module.css` beside the component, from tokens only, with state read from Base UI's data attributes (`[data-pressed]`, `[data-open]`).
