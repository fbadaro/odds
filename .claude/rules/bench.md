---
paths:
  - "docs/design/**"
---

# Working in docs/design, the bench

- **`pages/playground.html` is the one bench** (since 2026-10-16). UI ideas are tried there, in any HTML. A separate page is only for a side-by-side comparison, and the winner folds back into the bench.
- **Validating a feature** gives its root element `data-feature="<kebab-case-id>"`, an id never reused. From then on the app must port it (`portar-da-bancada` skill) or list it in `PENDING` with the reason.
- **The build owns the generated blocks** (`<!--TOKENS-->`, `<!--V3CSS-->`, `<!--CORE-->`, `<!--V3SRC-->`, `<!--M50-->`): change their sources, then `npm run typecheck` (the build reads `dist/`) and `node docs/design/pages/playground.build.mjs --write`. Without `--write` it only checks, exiting 1 when a block went stale.
- **The other pages are frozen records** of past rounds and ADRs, kept as they are, and no test reads them. The comparison is `playground.html`: the app's parity test and the `bench-*.json` goldens are taken from it. A page that a later one replaced, once validated, leaves the tree for git history (ADR-0023). Colmeia v1–v4 left on 2026-10-24 with their checks and builds; what v4 drew lives on as the `@odds/layout` goldens, and the 50-context marketplace as its fixtures.
- **Pages are fragments**, without `<!doctype>`, `<head>` or `<body>`: the artifact host adds them. Look at a page with the `page-shot` skill, in both themes, before calling a round done. A published page's identity is its artifact URL, listed in `README.md`: republish to that URL.
- **`canvas/` versions only `.dc.html` and `canvas.json`;** git ignores every other `.html` there, so a page that needs `<script>` lives in `pages/`.
- `README.md` and `RETROSPECTIVA.md` are the exploration's journal. The protocol in force is ADR-0021.
