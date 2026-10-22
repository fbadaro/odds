# A aplicação `apps/playground` e a sua fundação — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** extrair a colmeia para `@odds/layout`, gerar os tokens do `DESIGN.md` e fazer nascer `apps/playground` em React com um primeiro incremento (editor → colmeia + contadores) em paridade com a bancada.

**Architecture:** o layout e a montagem do SVG saem do script ES5 da `colmeia-v4.html` (e das peças que o `playground.html` põe por cima) para um pacote TypeScript sem DOM. A extração é protegida por **testes de caracterização**: a saída do código antigo é capturada uma vez e o código novo tem de reproduzi-la **byte a byte**. A bancada passa a embutir o pacote. A aplicação é Vite + React, e a colmeia entra nela como string SVG num contêiner que o React não reconcilia.

**Tech Stack:** TypeScript 5, Vitest 5, Vite 8, React 19 + React Compiler, Zustand, Testing Library, ESLint (flat config, `typescript-eslint`, `eslint-plugin-react-hooks`), `yaml` (só no gerador de tokens).

**Spec:** `docs/superpowers/specs/2026-10-21-aplicacao-playground-design.md`. Leia-a inteira antes da Task 1. Decisões de fundo: `docs/adr/0009`, `0013`, `0014`, `0015`.

## Global Constraints

- 100% no navegador: sem servidor, sem armazenamento remoto (`PRD.md`).
- Nada da linguagem muda: `packages/core` não é editado; a `ODDS Language Version` e os 44 golden files ficam como estão.
- `@odds/core` não ganha dependência de `@odds/messages` (`ADR-0004`).
- Nenhum pacote de `packages/` importa React nem toca DOM. **`@odds/layout` importa `@odds/core` só com `import type`**, porque o embutidor da bancada (`colmeia-embed.mjs`) só resolve imports relativos e `chevrotain`.
- As features da aplicação importam de `src/components/ui/`, nunca de `@base-ui/react` (`ADR-0014`).
- Todo `.module.css` usa só tokens, nunca valor cru de cor, raio, espaço ou sombra.
- `apps/playground/src/styles/tokens.css` é **gerado**, nunca editado à mão.
- Pausa antes do relayout: **300 ms** (`ADR-0009`).
- Ao abrir, opções de vista iguais às da bancada: `view: "flow"`, `tags: "on"`, `labels: "ctx"`, sem seleção.
- Toda tarefa fecha com `npm test` e `npm run typecheck` verdes. Mensagens de commit em inglês, terminando com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

**Correção da spec, por paridade.** A spec (§7) diz que *"a colmeia e os contadores refletem o texto depois da pausa"*, mas o critério de pronto dela é **paridade com a bancada**, e a bancada (`playground.html`, `onText`/`schedule`) faz assim: a cada tecla roda `parseAndValidate` e atualiza **diagnósticos e contadores na hora**. Sem árvore, congela o mapa marcado como obsoleto. Com árvore, se nada de topologia nem de forma mudou, só repinta. Se só tag ou conector mudou (mesma topologia), refaz o layout **na hora**. Só uma mudança de topologia espera a pausa de 300 ms, com os marcadores repintados sobre a geometria antiga enquanto isso. O primeiro desenho é imediato. **Este plano segue a bancada.**

## Review Focus

1. **Texto que nunca teve árvore** (o arquivo começa com erro de sintaxe, ou está vazio): a aplicação mostra o estado vazio e os contadores, sem lançar exceção e sem diagrama congelado de nada. Teste na Task 11.
2. **Modelo sem domínio, ou domínio sem subdomínio e sem `external`**: `modelOf` devolve `domains: []`, e `layout` e `renderSvg` devolvem um SVG vazio válido em vez de lançar exceção. Teste na Task 5.
3. **Tipo de subdomínio inválido durante a digitação** (`subdomain cor X`): o desenho mantém o último tipo válido daquele subdomínio, e o padrão é `generic` quando nunca houve um. Teste na Task 5.
4. **Tema escuro**: o gerador emite o bloco escuro, e as variáveis do mapa resolvem no escuro, tanto na bancada quanto na aplicação. Teste na Task 9 e verificação visual na Task 8.
5. **Digitação rápida atravessando a pausa**: só o último texto é desenhado, e um timer pendente é cancelado quando a mudança deixa de ser de topologia. Teste na Task 11.

---

## Mapa de arquivos

```
packages/layout/                      NOVO
  package.json                        @odds/layout; exports ".", "./fixtures", "./map.css"
  tsconfig.json
  map.css                             CSS de tudo que renderSvg produz, com --odds-map-*
  scripts/capture-legacy.mjs          captura, uma vez, a saída da v4 e da bancada
  src/
    index.ts                          API pública
    types.ts                          LayoutModel, Geometry, Target, ViewOptions…
    hex.ts  geometry.ts               utilitários da v4 (px, hexPath, spiral, segX…)
    canon.ts                          prep, canon
    masses.ts  territories.ts         massesOf, layoutMasses, packMass, fill/erode…
    layout.ts                         layoutAt, layout
    route.ts                          Heap, routeAll, chipW
    labels.ts                         placeLabels
    metrics.ts                        measure, tilesMoved, tierOf
    render.ts                         build + decorate → renderSvg
    ast.ts                            modelOf, topologyKeys, anchorsOf, targetOf
    nav.ts                            navOf
    fixtures/                         MODELS, BREAKS, EXTRA, declared, sourceOf, marketplace
  test/
    golden/                           saídas capturadas (JSON), versionadas
    characterization.test.ts          layout/renderSvg × golden
    adapters.test.ts                  modelOf, topologyKeys, anchorsOf, targetOf, navOf
    properties.test.ts                famílias 3–6 da colmeia-v4.check.mjs
apps/playground/                      NOVO
  index.html  vite.config.ts  tsconfig.json  package.json  eslint.config.js
  scripts/generate-tokens.mjs         DESIGN.md → src/styles/tokens.css
  src/
    main.tsx  App.tsx  App.module.css
    styles/tokens.css (gerado)  styles/global.css
    lib/analyze.ts                    texto → análise e desenho, sem React
    stores/playground.ts              Zustand
    features/editor/components/Editor.tsx (+ .module.css)
    features/editor/hooks/useLiveText.ts
    features/honeycomb/components/Honeycomb.tsx (+ .module.css)
    features/diagnostics/components/SeverityCounters.tsx (+ .module.css)
  test/                               *.test.ts(x) da aplicação
docs/design/pages/colmeia-embed.mjs   passa a embutir @odds/layout
docs/design/pages/playground.html     perde toModel/keysOf/anchorsOf/targetOf/navOf/decorate
docs/design/pages/colmeia-ao-vivo.html  idem, onde tiver cópias
docs/design/pages/colmeia-v4.html     congela (aviso no topo)
DESIGN.md                             grupo `elevation` no front matter
package.json  tsconfig.json  vitest.config.ts   workspaces, referências, include, aliases
```

**Regra do porte (Tasks 3 a 5):** porte **literal**. Mesma ordem de operações aritméticas, mesmos desempates, mesmas constantes, mesma ordem de iteração. `var` vira `const`/`let` e entram tipos, mas não se "melhora" nada. O golden falha por um décimo de pixel, e é para isso que ele existe. Se `noUncheckedIndexedAccess` tornar o porte ilegível, o `tsconfig.json` do `@odds/layout`, e só ele, pode desligá-lo, com um comentário dizendo por quê.

---

### Task 1: Vitest 5 e o workspace preparado para `apps/*`

**Files:**
- Modify: `package.json` (`devDependencies.vitest` → `^5.0.5`; `workspaces` → `["packages/*", "apps/*"]`)
- Modify: `vitest.config.ts` (`include` passa a cobrir `packages/*/test/**/*.test.ts` e `apps/*/test/**/*.test.{ts,tsx}`)
- Modify: `package-lock.json` (via `npm install`)

- [ ] **Step 1:** rodar `npm test` e anotar o total de testes que passam (linha de base).
- [ ] **Step 2:** atualizar o Vitest e o `workspaces`, e depois `npm install`.
- [ ] **Step 3:** rodar `npm test`. Esperado: **o mesmo total do Step 1**, todos verdes, incluindo `packages/core/test/conformance.test.ts` (44 casos). Se uma API do Vitest mudou, ajuste o teste, nunca o `expected.json` de um golden file.
- [ ] **Step 4:** `npm run typecheck` e `npm run health`, ambos verdes.
- [ ] **Step 5:** commit `chore(test): move to Vitest 5 and open the workspace to apps/*`.

### Task 2: esqueleto do `@odds/layout` e a captura do legado

**Files:**
- Create: `packages/layout/package.json`, `packages/layout/tsconfig.json`, `packages/layout/src/index.ts` (vazio por ora)
- Create: `packages/layout/scripts/capture-legacy.mjs`
- Create: `packages/layout/test/golden/*.json`
- Modify: `tsconfig.json` (referência `packages/layout`), `vitest.config.ts` (alias `@odds/layout` e `@odds/layout/fixtures` para `src/`)

**Interfaces:**
- Produces: os arquivos de `test/golden/`, que são o oráculo das Tasks 3 a 5. Cada um tem o formato `{ name: string; model: LayoutModel; geo: unknown; svg: Record<string, string>; diags: unknown[] }`, em que as chaves de `svg` são combinações de opções de vista (ver Step 2).

- [ ] **Step 1:** `package.json` no molde de `packages/core/package.json`: nome `@odds/layout`, `dependencies: { "@odds/core": "*" }`, `exports` com `"."`, `"./fixtures"` e `"./map.css"`. O `tsconfig.json` estende `../../tsconfig.base.json` e referencia `../core`.
- [ ] **Step 2:** escrever `capture-legacy.mjs`. Ele carrega a v4 sem DOM, como o `colmeia-v4.check.mjs` faz em `loadPage` (`globalThis.__V3_HEADLESS = true; new Function(script)()`). Para cada entrada abaixo, grava um golden:
  - `one` e `many` × `clean` e `broken`, os modelos da v4 via `v3.declared(model, file, 0, 0)`;
  - cada edição de `v3.EXTRA` aplicada sobre `one` e sobre `many`;
  - o marketplace de 50 contextos, montado como `colmeia-embed.mjs` o monta (`documented(BARE, v4.MODELS)`);
  - pelo menos **um modelo vazio**: `{ file: "empty.odds", domains: [], mapping: [] }`.

  Para cada entrada, o arquivo guarda:
  - `geo`: `v3.layout(v3.canon(m))` serializado por `JSON.parse(JSON.stringify(...))`. Se houver valor não-JSON, guardar só `{ tiles, rels: [{rk, path}], viewBox }`.
  - `diags`: `v3.diagsFor(...)` (os diagnósticos já com `target`).
  - `svg`: `v3.build(geo, diags, null)` sob quatro combinações de `v3.state`: `flow·on·ctx`, `flow·off·ctx`, `contain·on·ctx` e `flow·on·ctx` com `selDiag: 0`. As chaves são `"flow|on|ctx"`, `"flow|off|ctx"`, `"contain|on|ctx"` e `"flow|on|ctx|selDiag0"`.

  O modelo vazio pode lançar exceção na v4: o script registra `throws: true` em vez de abortar.
- [ ] **Step 3:** rodar `node packages/layout/scripts/capture-legacy.mjs` (exige `npm run typecheck` antes). Esperado: um JSON por entrada em `test/golden/`, e a lista impressa.
- [ ] **Step 4:** acrescentar ao mesmo script a captura do **adaptador da bancada**: `toModel`, `keysOf`, `anchorsOf`, `targetOf`, `navOf` e `decorate`, copiados **textualmente** de `docs/design/pages/playground.html` para `packages/layout/test/legacy-bench.mjs` (oráculo de teste, com um comentário de origem e data). Para o texto do marketplace e para o texto de `one` (`v3.sourceOf(..., "rich")`), gravar em `test/golden/bench-*.json`:
  - `{ text, model, keys, targets, nav (sem funções), svg }`, com `svg = decorate(build(...), nav)` nas mesmas quatro combinações;
  - os `targets` calculados sobre os diagnósticos de `parseAndValidate`.
- [ ] **Step 5:** commit `test(layout): capture the legacy honeycomb output as characterization fixtures`.

### Task 3: porte da geometria

**Files:**
- Create: `packages/layout/src/{types,hex,geometry,canon,masses,territories,layout,route,labels,metrics}.ts`
- Create: `packages/layout/src/fixtures/{models,declared,source,marketplace,index}.ts`
- Test: `packages/layout/test/characterization.test.ts`

**Interfaces:**
- Produces (`src/index.ts`):
  - `layout(model: LayoutModel): Geometry` — equivale a `v3.layout(v3.canon(v3.declared("__live", "clean", 0, 0)))` com `MODELS.__live = model`;
  - `placeLabels(geo: Geometry, opts: LabelOptions): LabelResult`;
  - `measure(geo: Geometry)`, `tilesMoved(a: Geometry, b: Geometry): number`, `tierOf(n: number): number`;
  - os tipos `LayoutModel`, `LayoutDomain`, `LayoutSubdomain`, `LayoutContext`, `LayoutRelation` (`{ l, lt, c, rt, r }`), `Connector` e `Geometry` (pelo menos `tiles: Record<string, [number, number]>`, `rels: RoutedRelation[]` com `{ rk, rel, path }`, `islands`, `viewBox: [number, number, number, number]`).
- Produces (`src/fixtures/index.ts`, exportado como `@odds/layout/fixtures`): `MODELS`, `BREAKS`, `EXTRA`, `declared(model, file, shuffle, extra)`, `canon(m)`, `sourceOf(m, sub): { text, anchors, … }` e `marketplace(): { file: string; text: string }`. Este último é o porte de `colmeia-50.model.mjs` + `colmeia-navegacao.docs.mjs`, montado como no `colmeia-embed.mjs`.

- [ ] **Step 1:** escrever `characterization.test.ts`. Para cada golden de modelo (não `bench-*`): `expect(JSON.parse(JSON.stringify(layout(g.model)))).toEqual(g.geo)`, ou só os campos capturados, se o golden guardou o recorte. Para o vazio com `throws: true`: `expect(() => layout(g.model)).toThrow()` fica **proibido**. O Step 3 trata isso.
- [ ] **Step 2:** rodar `npx vitest run packages/layout/test/characterization.test.ts`. Esperado: FAIL, porque `layout` não existe.
- [ ] **Step 3:** portar, pela regra do porte, os blocos *utilitários*, *geografia*, *layout*, *arestas*, *métricas* e *rótulos* do script da v4 (linhas ~1–1435 do `<script>`), além de `MODELS`, `BREAKS`, `EXTRA`, `prep`, `declared`, `canon`, `Src` e `sourceOf` para `fixtures/`. Única divergência permitida: um modelo sem domínio desenhável devolve uma `Geometry` vazia (`tiles: {}`, `rels: []`, `islands: []`, `viewBox: [0, 0, 1, 1]`) em vez de lançar exceção. O golden vazio passa a afirmar isso.
- [ ] **Step 4:** rodar o mesmo teste. Esperado: PASS em todos os goldens de modelo.
- [ ] **Step 5:** commit `feat(layout): port the honeycomb geometry from colmeia-v4 to @odds/layout`.

### Task 4: porte do desenho (`renderSvg`)

**Files:**
- Create: `packages/layout/src/render.ts`
- Test: `packages/layout/test/characterization.test.ts` (estender)

**Interfaces:**
- Consumes: `Geometry` (Task 3).
- Produces:
  ```ts
  interface ViewOptions {
    view: "flow" | "contain";
    tags: "on" | "off";
    labels: string;                  // os valores que a v4 aceita em state.labels
    sel: string | null;              // contexto selecionado
    selSub: string | null;           // "Dominio/Subdominio"
    selDiag: number | null;          // índice em `diags`
  }
  type Target =
    | { kind: "dom"; dom: string } | { kind: "sub"; sub: string } | { kind: "tile"; ctx: string }
    | { kind: "edge"; rk: string } | { kind: "port"; rk: string; ctx: string } | { kind: "file" };
  type TargetedDiagnostic = Pick<Diagnostic, "code" | "severity" | "data" | "span"> & { target: Target };
  function buildSvg(geo: Geometry, diags: TargetedDiagnostic[], opts: ViewOptions): string;  // = v3.build, sem o `src`
  ```
  `buildSvg` não é exportado em `index.ts`: é o degrau para a Task 5.

- [ ] **Step 1:** estender o teste. Para cada golden de modelo e cada chave de `svg`: `expect(buildSvg(layout(g.model), g.diags, optsOf(key))).toBe(g.svg[key])`, em que `optsOf` traduz `"flow|on|ctx|selDiag0"` para `ViewOptions`.
- [ ] **Step 2:** rodar. Esperado: FAIL.
- [ ] **Step 3:** portar o bloco *render* da v4 (`pathOf`, `along`, `badgeSpot`, `arrowAt`, `breakMark`, `portSvg`, `sevIcon`, `worst`, `build`), trocando toda leitura de `state.*` por `opts.*`. O parâmetro `src` da v4 sai. Onde ela o usava com `src != null`, o caminho `null` é o único que fica.
- [ ] **Step 4:** rodar. Esperado: PASS, byte a byte.
- [ ] **Step 5:** commit `feat(layout): port the honeycomb SVG renderer, state passed as options`.

### Task 5: os adaptadores da bancada viram API do pacote

**Files:**
- Create: `packages/layout/src/{ast,nav}.ts`
- Modify: `packages/layout/src/render.ts` (acrescentar `renderSvg`), `packages/layout/src/index.ts`
- Test: `packages/layout/test/adapters.test.ts`

**Interfaces:**
- Consumes: `layout`, `buildSvg`, `placeLabels`, `Target`, `TargetedDiagnostic`, `ViewOptions`.
- Produces (`src/index.ts`):
  - `modelOf(ast: ProgramNode, file: string, lastType: Map<string, SubdomainType>): LayoutModel` — o `toModel` da bancada. `lastType` é a memória do último tipo válido por `"Dominio/Subdominio"`; a função a **atualiza**, e o chamador a guarda entre chamadas;
  - `topologyKeys(model: LayoutModel): { topo: string; full: string }` — o `keysOf`;
  - `anchorsOf(ast: ProgramNode): Anchor[]` e `targetOf(diag: Pick<Diagnostic, "span">, anchors: Anchor[]): Target`;
  - `navOf(geo: Geometry): Nav` — sem o `farSvg`, que passa a ser feito dentro de `renderSvg`; `Nav` mantém `tiles`, `rels`, `relOf`, `near`, `subs`, `ctxSub`, `flow` e `typeOfCtx`;
  - `renderSvg(geo: Geometry, diags: TargetedDiagnostic[], opts: ViewOptions): string` — igual a `decorate(build(geo, diags, null), navOf(geo))` da bancada, montado direto, sem regex sobre o próprio SVG;
  - os demais: `layout`, `placeLabels`, `measure`, `tilesMoved`, `tierOf` e os tipos.

- [ ] **Step 1:** escrever `adapters.test.ts`. Para cada `bench-*.json`:
  - `modelOf(parseAndValidate(g.text).ast!, g.model.file, new Map())` igual a `g.model`;
  - `topologyKeys(model)` igual a `g.keys`;
  - os `targets` iguais a `g.targets`;
  - `renderSvg(layout(model), diags, opts)` **idêntico** a `g.svg[key]` nas quatro chaves.

  E os casos do Review Focus:
  - `modelOf` de um texto sem domínio devolve `domains: []`, e `renderSvg(layout(...), [], opts)` devolve uma string que começa com `<svg` sem lançar exceção (foco 2);
  - com `lastType` vindo de `subdomain core X`, o texto com `subdomain cor X` desenha `X` como `core`; sem memória prévia, como `generic` (foco 3);
  - contexto repetido e relação para contexto não declarado não entram em `mapping`.
- [ ] **Step 2:** rodar. Esperado: FAIL.
- [ ] **Step 3:** implementar. `modelOf`, `topologyKeys`, `anchorsOf`, `targetOf` e `navOf` são o porte literal de `test/legacy-bench.mjs`. Em `renderSvg`, o que o `decorate` fazia por regex entra na montagem:
  - o grupo de rótulos de longe antes de `</svg>`;
  - `class="rel invalid"`, `data-flow` e o `path.rhit` na vista de fluxo;
  - `data-type` em peça, subdomínio e nome de contexto.

  O teste de identidade é o juiz. Se uma ordem de atributos diferente quebrar a identidade, reproduza a ordem do legado.
- [ ] **Step 4:** rodar. Esperado: PASS.
- [ ] **Step 5:** commit `feat(layout): AST adapter, diagnostic targets and navigation data as package API`.

### Task 6: as propriedades da colmeia como testes do pacote

**Files:**
- Test: `packages/layout/test/properties.test.ts`

**Interfaces:**
- Consumes: `layout`, `tilesMoved`, `tierOf`, `measure`, `placeLabels` e `@odds/layout/fixtures`.

- [ ] **Step 1:** portar as famílias **3 a 6** do `colmeia-v4.check.mjs` como testes Vitest, com os mesmos limites e contagens do script:
  - 3: invariância em 24 embaralhamentos;
  - 4: a régua da v2, cruzamentos e arestas sobre peça alheia ao menos pela metade, contra `baseline` (`one`: 13/7, `many`: 7/7);
  - 5: composição, rótulo × rótulo, rótulo × peça, chip × chip, chip × peça alheia;
  - 6: localidade, sobre as mesmas edições, com as exceções de degrau e de prateleira contadas à parte.

  As famílias 1 e 2 testam âncoras da própria página v4 e **ficam com ela**, que congela.
- [ ] **Step 2:** rodar `node docs/design/pages/colmeia-v4.check.mjs` e `npx vitest run packages/layout/test/properties.test.ts`. Esperado: os dois conformes, com as mesmas contagens.
- [ ] **Step 3:** commit `test(layout): honeycomb invariance, ruler, composition and locality as package tests`.

### Task 7: `map.css`

**Files:**
- Create: `packages/layout/map.css`

**Interfaces:**
- Produces:
  - as variáveis `--odds-map-*` (triplets RGB), com valores padrão claros no `:root` e escuros em `[data-theme="dark"]`, e com o mesmo trio `:root:not([data-theme="light"])` sob `prefers-color-scheme: dark` que a v4 usa;
  - os nomes: `--odds-map-bg`, `-panel`, `-panel2`, `-border`, `-ink`, `-dim`, `-accent`, `-azure`, `-pulse`, `-solar`, `-error`, `-warning`, `-info`, `-shadow-strength`, `-tile-core`, `-tile-sup`, `-tile-gen`, `-tile-edge`, `-mix-core`, `-mix-sup`, `-mix-gen`.

- [ ] **Step 1:** mover, da `<style>` da v4, **toda regra que estiliza um elemento produzido por `renderSvg`** (seletores de `svg`, `.node`, `.rel`, `.sub`, `.sublab`, `.cnm`, `.port`, chips, selos, rótulos, `.far-lab`…), trocando `var(--c-x)` por `var(--odds-map-x)`. Os valores padrão das `--odds-map-*` são os valores da v4. Regra de casca de página (`body`, `.wrap`, `.seg`, botões) **não** entra.
- [ ] **Step 2:** conferir: `grep -c 'var(--c-' packages/layout/map.css` dá 0.
- [ ] **Step 3:** commit `feat(layout): the honeycomb stylesheet as a package file with its own variables`.

### Task 8: a bancada passa a embutir o pacote

**Files:**
- Modify: `docs/design/pages/colmeia-embed.mjs`, `docs/design/pages/playground.html`, `docs/design/pages/colmeia-ao-vivo.html`, `docs/design/pages/colmeia-v4.html` (só o aviso)
- Modify: `docs/design/README.md` (uma linha na tabela de páginas)

**Interfaces:**
- Consumes: o `dist` de `@odds/layout` (`npm run typecheck` o constrói), `map.css` e `@odds/layout/fixtures`.

- [ ] **Step 1:** capturar a linha de base visual **antes de mexer**. Use a skill `page-shot` em `playground.html` e `colmeia-ao-vivo.html`, nos temas claro e escuro, com o marketplace aberto e com um contexto selecionado. Guarde os PNGs no scratchpad.
- [ ] **Step 2:** no `colmeia-embed.mjs`:
  - acrescentar os módulos de `packages/layout/dist` ao registro `modules`, como os do core, sob `odds-layout/…`;
  - `V3CSS` passa a ser o `map.css` mais um bloco de apelidos que liga cada `--odds-map-x` ao `--c-x` da bancada;
  - `V3SRC` passa a ser uma ponte curta que monta `globalThis.__v3` a partir do pacote, com os nomes que as páginas ainda chamam (`MODELS`, `declared`, `canon`, `sourceOf`, `layout`, `placeLabels`, `state`…). O `build(geo, diags, src)` da ponte chama `renderSvg(geo, diags, state)`;
  - o marketplace sai de `marketplace()` em `@odds/layout/fixtures`.

  Se a casca da `colmeia-ao-vivo` dependia de regras de casca da v4 (`.seg`, `.wrap`…), elas passam para o `<style>` da própria página.
- [ ] **Step 3:** no `playground.html`, apagar `toModel`, `keysOf`, `anchorsOf`, `targetOf`, `navOf`, `decorate` e o `farSvg` e usar os do pacote. `paint` passa a chamar `renderSvg(geo, lastDiags, v3.state)` direto. Fazer o mesmo na `colmeia-ao-vivo.html`, onde ela tiver cópias.
- [ ] **Step 4:** regravar as páginas: `node docs/design/pages/playground.build.mjs --write` e `node docs/design/pages/colmeia-ao-vivo.build.mjs --write`. Depois, sem `--write`, os dois saem com 0.
- [ ] **Step 5:** pôr um aviso no topo da `colmeia-v4.html`: *"Registro congelado do `ADR-0010` (2026-10-21). O layout vivo é o pacote `@odds/layout`."* Rodar `node docs/design/pages/colmeia-v4.check.mjs`, que continua conforme.
- [ ] **Step 6:** repetir o `page-shot` do Step 1 e comparar. Esperado: **igual** nos dois temas e nos dois estados. Qualquer diferença visível é defeito de porte ou de CSS, e é consertada antes do commit.
- [ ] **Step 7:** abrir o `playground.html` no navegador, digitar no marketplace (acrescentar um contexto, mudar uma tag, quebrar a sintaxe) e conferir o mesmo comportamento de antes: pausa, congelamento marcado e FLIP.
- [ ] **Step 8:** commit `design: the bench embeds @odds/layout instead of the colmeia-v4 script`.

### Task 9: sombras e gradiente no `DESIGN.md`, e o gerador de tokens

**Files:**
- Modify: `DESIGN.md` (front matter: grupo `elevation`; prosa de *Elevation & Depth* e de `button-primary-gradient` passa a citar os tokens)
- Create: `apps/playground/package.json` (mínimo nesta tarefa: nome `@odds/playground`, o do `ADR-0004`, `private`, `devDependencies.yaml`), `apps/playground/scripts/generate-tokens.mjs`, `apps/playground/src/styles/tokens.css` (gerado)
- Modify: `package.json` da raiz (script `generate:tokens`)
- Test: `apps/playground/test/tokens.test.ts`

**Interfaces:**
- Produces:
  - `generateTokens(designMd: string): string`, exportado pelo script, que também roda como CLI e grava o arquivo;
  - o `tokens.css` com `:root{…}` e `[data-theme="dark"]{…}`;
  - os nomes `--c-<cor>` (`--c-canvas`, `--c-surface`, `--c-surface-muted`, `--c-hairline`, `--c-ink`, `--c-ink-mute`, `--c-accent`…), `--radius-<nome>`, `--space-<nome>`, `--font-<token>-family|size|weight|line-height|letter-spacing`, `--sh-<nome>`, `--grad-primary` e `--shadow-strength`.

- [ ] **Step 1:** acrescentar ao front matter, depois de `spacing`:
  ```yaml
  elevation:
    shadow-strength: "0.14"
    shadow-strength-dark: "0.5"
    sm: "0 1px 2px rgb(27 27 25 / calc({elevation.shadow-strength} * .4))"
    card: "0 18px 44px -22px rgb({colors.accent} / calc({elevation.shadow-strength} * 2))"
    cta: "0 10px 30px -8px rgb({colors.accent} / calc({elevation.shadow-strength} * 4))"
    island: "0 2px 10px rgb(27 27 25 / calc({elevation.shadow-strength} * .5))"
    lift: "0 22px 48px -20px rgb({colors.accent} / calc({elevation.shadow-strength} * 5))"
    gradient-primary: "linear-gradient(180deg, rgb({colors.accent-lift}), rgb({colors.accent}))"
  ```
  Os valores são os da seção *Elevation & Depth* e de `button-primary-gradient` do próprio `DESIGN.md`. A prosa passa a referenciá-los por nome em vez de repetir o CSS.
- [ ] **Step 2:** escrever `tokens.test.ts`:
  - `generateTokens(fs.readFileSync("DESIGN.md"))` contém `--c-accent: 108 64 217;` no `:root` e `--c-accent: 173 141 255;` dentro de `[data-theme="dark"]` (foco 4);
  - contém `--shadow-strength: 0.14;` no claro e `0.5` no escuro;
  - contém `--sh-cta: 0 10px 30px -8px rgb(var(--c-accent) / calc(var(--shadow-strength) * 4));`;
  - contém `--radius-button: 12px;`;
  - não contém `{` de referência não resolvida;
  - **é igual, byte a byte, ao `apps/playground/src/styles/tokens.css` versionado** (o teste de deriva, no modelo do `messages.json`).
- [ ] **Step 3:** rodar. Esperado: FAIL.
- [ ] **Step 4:** implementar `generateTokens`. Ler o front matter com `yaml`. Hex vira triplet RGB. A chave `x-dark` vai para o bloco escuro como `--c-x`. `{grupo.token}` vira `var(--…)`. O grupo `components` é ignorado. O cabeçalho do arquivo gerado diz *"gerado de DESIGN.md por apps/playground/scripts/generate-tokens.mjs — não edite"*. Rodar `npm run generate:tokens`.
- [ ] **Step 5:** rodar. Esperado: PASS.
- [ ] **Step 6:** commit `feat(tokens): shadows and gradient join the DESIGN.md front matter; tokens.css is generated from it`.

### Task 10: o esqueleto de `apps/playground`

**Files:**
- Create: `apps/playground/{index.html,vite.config.ts,tsconfig.json,eslint.config.js}`, `apps/playground/src/{main.tsx,App.tsx,App.module.css}`, `apps/playground/src/styles/global.css`
- Modify: `apps/playground/package.json` (dependências e scripts), `package.json` da raiz (scripts `dev`, `build:app`, `lint`), `tsconfig.json` (referência)
- Test: `apps/playground/test/App.test.tsx`

**Interfaces:**
- Consumes: `tokens.css` (Task 9), `map.css` (Task 7).
- Produces:
  - `npm run dev`, que sobe o Vite;
  - `npm run build:app`, que gera `apps/playground/dist/` estático;
  - `npm run lint`, que roda o ESLint em `apps/playground`;
  - um plugin local no `vite.config.ts` que observa `DESIGN.md` e roda `generateTokens` ao salvá-lo.

- [ ] **Step 1:** escrever `App.test.tsx` (Testing Library, ambiente `jsdom` só para `apps/`): `render(<App />)` mostra um elemento com `role="main"`.
- [ ] **Step 2:** rodar. Esperado: FAIL.
- [ ] **Step 3:** criar o esqueleto:
  - dependências: `react`, `react-dom`, `zustand`, `@odds/core`, `@odds/messages`, `@odds/layout`;
  - devDependencies: `vite@^8`, `@vitejs/plugin-react`, o React Compiler (siga a instalação atual da documentação do React para Vite), `@testing-library/react`, `jsdom`, `eslint`, `typescript-eslint`, `eslint-plugin-react-hooks`;
  - `global.css` importa `tokens.css` e `@odds/layout/map.css`, liga as `--odds-map-*` aos tokens da aplicação (`--odds-map-bg: var(--c-canvas)`, `-panel: var(--c-surface)`, `-panel2: var(--c-surface-muted)`, `-border: var(--c-hairline)`, `-dim: var(--c-ink-mute)`, e os homônimos direto) e define o `body` com `--c-canvas` e a família Inter;
  - `eslint.config.js`: `typescript-eslint` recomendado, `react-hooks` recomendado, e `no-restricted-imports` proibindo `@base-ui/react` fora de `src/components/ui/**`.
- [ ] **Step 4:** rodar o teste, `npm run lint` (sem erro), `npm run build:app` (gera o `dist`) e `npm run typecheck`. Esperado: todos verdes.
- [ ] **Step 5:** abrir `npm run dev`, editar uma cor no `DESIGN.md`, salvar e ver a página aberta mudar sem recarregar à mão. Desfazer a edição.
- [ ] **Step 6:** commit `feat(app): apps/playground skeleton — Vite, React with the compiler, generated tokens, lint`.

### Task 11: o ciclo do texto, sem React

**Files:**
- Create: `apps/playground/src/lib/analyze.ts`, `apps/playground/src/stores/playground.ts`
- Test: `apps/playground/test/analyze.test.ts`, `apps/playground/test/store.test.ts`

**Interfaces:**
- Consumes: `parseAndValidate` (`@odds/core`); `modelOf`, `topologyKeys`, `anchorsOf`, `targetOf`, `layout` e `renderSvg` (`@odds/layout`); `marketplace` (`@odds/layout/fixtures`).
- Produces:
  ```ts
  // lib/analyze.ts
  type Counts = Record<Severity, number>;
  interface Analysis { astGenerated: boolean; diagnostics: TargetedDiagnostic[]; counts: Counts;
                       model: LayoutModel | null; keys: { topo: string; full: string } | null }
  function analyze(text: string, file: string, lastType: Map<string, SubdomainType>): Analysis;
  // stores/playground.ts
  interface Drawing { geo: Geometry; svg: string; topo: string; full: string }
  interface PlaygroundState {
    text: string; analysis: Analysis; drawing: Drawing | null; stale: boolean; waiting: boolean;
    view: ViewOptions;
    setText(text: string): void;          // o onText da bancada
    flush(): void;                        // o fim da pausa
  }
  const usePlayground: UseBoundStore<StoreApi<PlaygroundState>>;
  const PAUSE_MS = 300;
  ```
  Para as diagnósticas sem árvore, o `target` é `{ kind: "file" }`.

- [ ] **Step 1:** escrever os testes (`vi.useFakeTimers()`), na ordem da bancada:
  - o texto inicial é `marketplace().text`, `drawing` existe logo depois da criação (o primeiro desenho é imediato) e `counts` é `{ error: 0, warning: 0, info: 0 }`;
  - `setText` com uma tag trocada: `drawing.svg` muda **na hora**, sem avançar o relógio;
  - `setText` acrescentando um contexto: `waiting` fica `true`, `drawing.topo` não muda antes de 300 ms e muda ao avançar 300 ms;
  - duas mudanças de topologia a 100 ms uma da outra: só a segunda é desenhada, porque o timer reinicia (foco 5);
  - mudança de topologia seguida de uma volta à topologia desenhada: o timer pendente é cancelado e `waiting` fica `false` (foco 5);
  - texto com erro de sintaxe: `stale` é `true`, `drawing` é **o mesmo objeto** de antes, e `counts.error` é `1`;
  - corrigir o erro: `stale` volta a `false`;
  - store criado com texto `"domain {"`, que nunca teve árvore: `drawing` é `null`, `stale` é `false`, e nada lança exceção (foco 1).
- [ ] **Step 2:** rodar. Esperado: FAIL.
- [ ] **Step 3:** implementar. `analyze` é puro. A lógica de `setText` é a de `onText` e `schedule` da bancada (`playground.html`): forma igual repinta, topologia igual refaz o layout na hora, e topologia nova espera a pausa, repintando os marcadores sobre a geometria antiga enquanto isso. `lastType` vive no store, não em módulo global.
- [ ] **Step 4:** rodar. Esperado: PASS.
- [ ] **Step 5:** commit `feat(app): the text cycle — analysis, pause and frozen diagram, as in the bench`.

### Task 12: a colmeia na tela, fora da reconciliação

**Files:**
- Create: `apps/playground/src/features/honeycomb/components/Honeycomb.tsx` + `Honeycomb.module.css`
- Test: `apps/playground/test/Honeycomb.test.tsx`

**Interfaces:**
- Consumes: `usePlayground` (`drawing`, `stale`).
- Produces: `<Honeycomb />`, sem props.

- [ ] **Step 1:** escrever os testes:
  - com `drawing`, o contêiner (`data-testid="honeycomb"`) contém um `<svg>`;
  - um re-render do componente **sem** mudança de `drawing.svg` mantém **o mesmo nó** `<svg>` (`toBe` na referência);
  - com `stale: true`, o contêiner tem o atributo `data-stale="true"`;
  - com `drawing: null`, mostra o texto vazio *"O mapa aparece quando o texto tiver uma árvore."*, sem `<svg>`.
- [ ] **Step 2:** rodar. Esperado: FAIL.
- [ ] **Step 3:** implementar. Um `<div ref>` cujo `innerHTML` é escrito num `useLayoutEffect` só quando `drawing.svg` muda. O React não renderiza filhos dentro dele. O SVG recebe `preserveAspectRatio="xMidYMid meet"` como na bancada. O estado obsoleto é marcado por `data-stale` e estilizado no `.module.css` só com tokens: opacidade reduzida e uma faixa *"Erro de sintaxe — o mapa mostra o último texto válido"* com o ícone de erro (o `DESIGN.md` manda nunca usar só cor).
- [ ] **Step 4:** rodar. Esperado: PASS.
- [ ] **Step 5:** commit `feat(app): the honeycomb mounted outside React reconciliation, with the stale mark`.

### Task 13: editor e contadores, e a tela do primeiro incremento

**Files:**
- Create: `apps/playground/src/features/editor/components/Editor.tsx` + `.module.css`, `apps/playground/src/features/diagnostics/components/SeverityCounters.tsx` + `.module.css`
- Modify: `apps/playground/src/App.tsx`, `App.module.css`
- Test: `apps/playground/test/firstIncrement.test.tsx`

**Interfaces:**
- Consumes: `usePlayground` (`text`, `setText`, `analysis.counts`), `<Honeycomb />`.
- Produces: `<Editor />` e `<SeverityCounters />`, sem props.

- [ ] **Step 1:** escrever o teste de ponta a ponta em jsdom, com fake timers:
  - `render(<App />)`;
  - o `<textarea>` (rótulo acessível *"Texto .odds"*) contém o marketplace, e os três contadores leem `0`;
  - digitar uma tag inválida (`[XYZ]` numa relação) leva o contador de erro a `1` **sem avançar o relógio**;
  - apagar a última `}` deixa o mapa com `data-stale="true"`;
  - cada contador tem o seu ícone (`data-icon="error|warning|info"`) e um rótulo acessível com a severidade e o número.
- [ ] **Step 2:** rodar. Esperado: FAIL.
- [ ] **Step 3:** implementar:
  - `<textarea>` em `JetBrains Mono` com `font-variant-ligatures: none` (`DESIGN.md`, *Typography*) e `spellCheck={false}`;
  - contadores como `severity-counter` do `DESIGN.md`: preenchimento a 8% da cor funcional, ícone círculo-X / triângulo / círculo-i e número em `mono-xs`. Nesta fase não são filtros (spec §7);
  - layout da tela: editor à esquerda e colmeia ocupando o resto, com os contadores no rodapé. Chrome fino, sem ilhas: as ilhas são ideia validada da bancada, e entram num trabalho próprio.
- [ ] **Step 4:** rodar o teste, `npm run lint` e `npm run build:app`. Esperado: verdes.
- [ ] **Step 5:** `npm run dev` e digitar no marketplace de 50 contextos: o editor não trava, os contadores seguem a tecla, e a colmeia se refaz depois da pausa quando a topologia muda. Conferir também o tema escuro (`data-theme="dark"` no `<html>`).
- [ ] **Step 6:** commit `feat(app): first increment — editor, live honeycomb and severity counters`.

### Task 14: registro — ADRs, CHANGELOG, HEALTH, CLAUDE.md

**Files:**
- Create: quatro ADRs via `python3 .claude/skills/adr/scripts/new_adr.py`
- Modify: `CHANGELOG.md`, `HEALTH.md`, `CLAUDE.md`, `docs/design/README.md`

- [ ] **Step 1:** escrever, pela skill `adr`, as quatro ADRs da spec §9:
  1. A aplicação mora em `apps/playground` e as bibliotecas em `packages/`. Refina o `ADR-0004`, que previa um `@odds/playground` em `packages/`, sem substituí-lo, porque a fronteira dele continua de pé.
  2. A bancada experimenta e a aplicação implementa só ideia validada. É protocolo de trabalho, e liga com o `ADR-0007`.
  3. Os tokens são gerados do `DESIGN.md`, com o grupo `elevation`. É a saída da *Reversão* do `ADR-0013`. A ADR-0013 ganha uma nota de topo apontando para a nova.
  4. As práticas da aplicação: Zustand, React Compiler e ESLint. A conversa recusou Redux, por pesado demais para uma tela só, e `useMemo`/`useCallback` à mão, por ser código nosso que o compilador escreve. As demais alternativas que a ADR registrar precisam ser reais, não decorativas.
- [ ] **Step 2:** atualizar o `CLAUDE.md`:
  - a tabela *Code layout* ganha `@odds/layout` e `apps/playground`;
  - a seção de comandos ganha `npm run dev`, `npm run build:app`, `npm run lint` e `npm run generate:tokens`;
  - uma linha diz que o `tokens.css` é gerado, como o `messages.json`.
- [ ] **Step 3:** rodar a skill `health-check`:
  - **R6.4 de 19 → 20**: a ADR 1 fecha onde a aplicação mora;
  - **R6.6 de 8 → 10**: o linter existe, e a ausência que o `ADR-0005` registrou fecha;
  - **R6.3 não se move**.

  Acrescentar a linha no fim da §7 e as entradas do `CHANGELOG.md` (as quatro ADRs e a versão do `HEALTH.md`).
- [ ] **Step 4:** `npm test`, `npm run typecheck`, `npm run lint` e `npm run health`. Esperado: todos verdes, 16/16.
- [ ] **Step 5:** commit `docs(adr): record the app layout, the bench cycle, generated tokens and app practices`.
