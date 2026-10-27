---
paths:
  - "apps/playground/**"
  - "DESIGN.md"
---

# Working in apps/playground

- **The app builds what the bench validated, on Base UI** (ADR-0020, ADR-0021). Behaviour crosses over — states, triggers, keyboard and focus, timings, interface text — and the bench's markup and CSS stay behind. A validated feature carries `data-feature="<id>"` in `docs/design/pages/playground.html`, and `test/parity.test.ts` requires a component with the same literal, in both directions. Port with the `portar-da-bancada` skill.
- **`@base-ui/react` is imported only inside `src/components/ui/`** (ADR-0014), enforced by `npm run lint`. Where a Base UI component exists but does not serve, the exception is written in the component with its reason, as `src/components/ui/Toast.tsx` does.
- **The honeycomb stays outside React reconciliation** (ADR-0014): the SVG from `@odds/layout` goes in as markup, and selection, hover, camera and FLIP change the DOM imperatively.
- **The React Compiler does the memoization** (ADR-0019) and relies on the hooks lint rules: fix a hooks finding in the code.
- **`src/styles/tokens.css` is generated** from the `DESIGN.md` front matter (ADR-0018): edit `DESIGN.md`, then `npm run generate:tokens`; `npm run dev` regenerates on save, and a test fails on drift. Variable names follow the front matter (`--c-canvas`, `--c-surface`), and the comment table in `src/styles/global.css` translates the bench's `--c-bg`/`--c-panel`.
- **Styles** live in a `.module.css` beside the component, from tokens only, with state read from Base UI's data attributes (`[data-pressed]`, `[data-open]`).
