# Paridade com a bancada: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** a aplicação `apps/playground` passa a fazer tudo o que a bancada `docs/design/pages/playground.html` faz, em componentes React, e um harness (`data-feature` + teste de paridade + skill + hook) mantém as duas juntas.

**Architecture:** a bancada é a especificação; cada feature validada nela tem um `data-feature`, e o mesmo id aparece no elemento-raiz do componente que a implementa. O estado de interface vai para o store Zustand. Câmera, seleção no SVG e FLIP são código imperativo dentro da feature do mapa, que continua fora da reconciliação. A lógica pura (câmera, ficha, árvore, legenda, export) fica em `lib/` e é testada à parte.

**Tech Stack:** React 19.3.1 + React Compiler, Zustand 5.0.16, Base UI (`@base-ui/react`, versão exata fixada na Task 6), CSS Modules sobre `tokens.css` gerado do `DESIGN.md`, Vitest 5 com jsdom e Testing Library, Vite 8.3.5.

**Spec:** `docs/superpowers/specs/2026-10-22-paridade-bancada-design.md`

## Global Constraints

- **A bancada é a especificação.** O markup, o CSS e o script de `docs/design/pages/playground.html` (o markup fica logo depois do último `<style>` do cabeçalho; o script é o último `<script>` da página, depois do bloco `<!--/M50-->`) definem a aparência, o comportamento e o texto. Na dúvida, vale a bancada.
- **O texto da interface vem da bancada, em português e palavra por palavra.** A frase de um diagnóstico vem de `render(d, "pt")` do `@odds/messages`, e o trecho entre crases sai em `<code>`, montado em React e nunca por `innerHTML`.
- **A aplicação não inventa feature.** Todo `data-feature="…"` da aplicação existe também na bancada.
- **Base UI só em `src/components/ui/**`.** A regra de lint já existe.
- **Estilo em `.module.css` ao lado do componente e só com tokens.** Nada de valor cru de cor. Medidas em px seguem a bancada quando o `DESIGN.md` não tem token para elas.
- **O mapa fica fora da reconciliação do React** (`ADR-0014`). O SVG entra como markup, e seleção, hover, câmera e FLIP mexem no DOM dele por código imperativo.
- **A câmera não escreve no store a cada quadro.** Só `zoomPct` é publicado, e só quando o número arredondado muda.
- **Não se muda o `@odds/layout`.** A bancada só ganha os atributos `data-feature`, e `node docs/design/pages/playground.build.mjs` continua passando.
- **Nomes de token da aplicação** são os do front matter do `DESIGN.md` (`--c-canvas`, `--c-surface`, `--c-surface-muted`, `--c-hairline`, `--c-ink-mute`…). A tabela que traduz os nomes da bancada vem da Task 2.
- Os ids de `data-feature` são estes 17, exatamente: `map`, `file-menu`, `view-switch`, `share`, `export-svg`, `theme-toggle`, `rail`, `panel-code`, `panel-tree`, `panel-help`, `ficha`, `selection-caption`, `frozen-flag`, `wait-indicator`, `diagnostics-dock`, `zoom-controls`, `toast`.
- Commits terminam com a linha `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Digitar com algo selecionado e apagar ou renomear o alvo.** O contexto, subdomínio ou relação selecionado deixa de existir. A seleção cai (ou a relação perde o `from`), a ficha fecha e nada lança. *(teste na Task 3)*
2. **Trocar de arquivo durante a pausa.** Um layout pendente do arquivo anterior não pode cair por cima do novo quando o timer disparar. *(teste na Task 3)*
3. **Erro de sintaxe com a árvore ou a ficha abertas.** A árvore mostra a última AST, a ficha usa os últimos dados e o rodapé lista o `SYNTAX_ERROR` atual. Clicar nele, que não tem alvo no mapa, só leva ao editor. *(testes nas Tasks 9 e 12)*
4. **Um item que não está no mapa** (contexto descartado, relação inválida sem aresta). Clicar nele na árvore ou no rodapé leva à linha no editor e não lança. *(testes nas Tasks 9 e 12)*
5. **`Esc` em três lugares.** No editor, só sai dele e mantém a seleção. Com o menu de arquivo aberto, só fecha o menu. Numa relação vinda de um contexto, volta ao contexto. *(testes nas Tasks 6 e 8)*

---

### Task 1: O harness da paridade

**Files:**
- Modify: `docs/design/pages/playground.html` (só o markup escrito à mão, fora dos blocos gerados: põe `data-feature` nos 17 elementos-raiz)
- Create: `apps/playground/test/parity.test.ts`
- Create: `.claude/skills/portar-da-bancada/SKILL.md`
- Modify: `.claude/settings.json` (um segundo hook em `PostToolUse`)
- Modify: `CLAUDE.md` (uma frase na seção de layout de código, junto da linha de `apps/playground`)
- Create: `docs/adr/0020-…md` pela skill `adr` (o allocator escolhe o nome)

**Interfaces:**
- Produces: `PENDING` em `parity.test.ts`, com a forma `const PENDING: Record<string, string> = { id: "razão" }`. Cada task seguinte remove os ids que implementa.

- [ ] **Step 1: Marcar a bancada.** Ponha um `data-feature` em cada elemento abaixo:

| id | elemento |
|---|---|
| `map` | `#map` |
| `file-menu` | `.isl.i-file` |
| `view-switch` | `#segView` |
| `share` | `#btnShare` |
| `export-svg` | `#btnExport` |
| `theme-toggle` | `#btnTheme` |
| `rail` | `nav.rail` |
| `panel-code` | `#pCode` |
| `panel-tree` | `#pTree` |
| `panel-help` | `#pHelp` |
| `ficha` | `#ficha` |
| `selection-caption` | `#selCap` |
| `frozen-flag` | `#flag` |
| `wait-indicator` | `#wait` |
| `diagnostics-dock` | `#dock` |
| `zoom-controls` | `.isl.i-zoom` |
| `toast` | `#toast` |

Rode `node docs/design/pages/playground.build.mjs`. A saída esperada é o código 0, sem bloco envelhecido.

- [ ] **Step 2: Escrever `parity.test.ts`.** Ele lê a bancada (`fs`, caminho a partir de `import.meta.url`) e extrai B com `/data-feature="([a-z0-9-]+)"/g`. Varre `apps/playground/src/**/*.tsx` (`fs.readdirSync(…, { recursive: true })`) e extrai A com a mesma regex. Os testes:
  - `"the bench still marks the 17 features of 2026-10-22"`: `expect([...B]).toEqual(expect.arrayContaining(SEVENTEEN))`, com `SEVENTEEN` sendo os 17 ids das Global Constraints. Isso trava um typo na marcação sem impedir que o autor valide features novas depois.
  - `"every validated feature has a component, or is PENDING with a reason"`: para cada id de B fora de `PENDING`, `A.has(id)`.
  - `"PENDING lists only bench features the app still lacks"`: para cada chave de `PENDING`, `B.has(k)` e `!A.has(k)`.
  - `"the app implements nothing the bench has not validated"`: para cada id de A, `B.has(id)`.
  - O `PENDING` inicial tem os 17 ids, todos com a razão `"paridade 2026-10-22: ainda não portado"`.

- [ ] **Step 3: Rodar** `npx vitest run apps/playground/test/parity.test.ts`. Esperado: PASS (A está vazio e os 17 estão em `PENDING`).

- [ ] **Step 4: A skill `portar-da-bancada`.** Escreva o frontmatter com `name: portar-da-bancada` e uma `description` em português. Ela dispara ao portar ou implementar na aplicação uma feature da bancada, ao falar de paridade ou do Playground ODDS, quando o `parity.test.ts` falhar e quando uma feature nova ganhar `data-feature`. O corpo é o roteiro da spec §2.3, com os seis passos, as proibições, a tabela de tokens (que aponta para o comentário que a Task 2 deixa no `global.css`) e o comando do teste. Siga o tom e a forma das skills irmãs (`.claude/skills/page-shot/SKILL.md`): curto, direto e com tabela quando ajuda.

- [ ] **Step 5: O hook.** Acrescente em `.claude/settings.json`, no mesmo `PostToolUse` com matcher `Write|Edit`, um segundo comando no molde do que já existe. Quando o `file_path` terminar em `docs/design/pages/playground.html`, ele emite `{systemMessage: "playground.html é a bancada (ADR-0017/0020). Se esta edição valida uma feature, marque o elemento-raiz com data-feature=\"<id>\" e porte para apps/playground pela skill portar-da-bancada — o apps/playground/test/parity.test.ts vai exigir o componente."}`. Teste o comando à mão com `echo '{"tool_input":{"file_path":"/x/docs/design/pages/playground.html"}}' | <comando>`: a saída deve ser o JSON. Teste também com outro caminho: a saída deve ser vazia.

- [ ] **Step 6: O `CLAUDE.md`.** Logo abaixo da tabela de *Code layout*, acrescente um parágrafo curto. Ele diz que feature validada na bancada leva `data-feature`, que `apps/playground/test/parity.test.ts` exige o componente nas duas direções e que a skill `portar-da-bancada` é o roteiro (ADR-0020).

- [ ] **Step 7: O ADR-0020.** Invoque a skill `adr`. O título fica perto de "A paridade entre bancada e aplicação é um contrato: data-feature na bancada, teste de paridade na aplicação". As alternativas a registrar são três: só a instrução no `CLAUDE.md` (depende de memória); um manifesto em Markdown (deriva sem teste); e o teste sobre o DOM renderizado (ficha, toast e menu só existem em certos estados). Na Reversão, o sinal é o autor querer validar sem marcar, ou a marca virar ruído. Registre também que este trabalho reverte o não-objetivo "reproduzir a bancada inteira" do design de 2026-10-21. Rode `python3 .claude/skills/health-check/scripts/health_check.py`: esperado 16/16, com o C16 verde.

- [ ] **Step 8: Commit**

```bash
git add docs/design/pages/playground.html apps/playground/test/parity.test.ts .claude/skills/portar-da-bancada .claude/settings.json CLAUDE.md docs/adr
git commit -m "feat(harness): bench features carry data-feature, and a parity test holds the app to them"
```

---

### Task 2: Tokens que faltam, a ilha e a casca em tela inteira

**Files:**
- Modify: `DESIGN.md` (front matter `colors`)
- Modify: `apps/playground/src/styles/tokens.css` (regenerado, nunca à mão)
- Create: `apps/playground/src/styles/map-bridge.css` (o bloco `--odds-map-*` que hoje está em `global.css`, mais `--odds-map-edge`)
- Modify: `apps/playground/src/styles/global.css` (importa `map-bridge.css`; ganha a tabela bancada → aplicação como comentário; base do `body` como a da bancada)
- Create: `apps/playground/src/components/island/Island.tsx`, `Island.module.css`
- Modify: `apps/playground/src/App.tsx`, `App.module.css`
- Test: `apps/playground/test/Island.test.tsx`; ajustar `test/App.test.tsx` se a estrutura mudar

**Interfaces:**
- Produces: tokens `--c-edge`, `--c-edge-lit`, `--c-edge-far`, `--c-core-ink`, `--c-sup-ink`, `--c-gen-ink` (triplets RGB, com claro e escuro).
- Produces: `Island(props: { as?: "div" | "section" | "nav" | "aside"; className?: string; children: ReactNode } & HTMLAttributes<HTMLElement>)`. É a casca `.isl` da bancada (fundo, borda, raio, sombra da ilha), e os outros atributos (`data-feature`, `aria-*`, `hidden`, `role`) passam direto para o elemento.
- Produces: `App` em tela inteira. O mapa (`<Honeycomb/>`) ocupa a viewport atrás das ilhas. Até as Tasks 8 e 12, o `<Editor/>` fica numa ilha à esquerda, na posição do painel da bancada, e os `<SeverityCounters/>` numa ilha embaixo, na posição do dock.

- [ ] **Step 1: Os tokens.** No front matter `colors` do `DESIGN.md`, acrescente estes valores, todos tirados da bancada (`bancada-tokens.css` e `#navcss`):

```yaml
  edge: "#807D92"
  edge-lit: "#343242"
  edge-far: "#CCCAD8"
  core-ink: "#B07800"
  sup-ink: "#3D6FE8"
  gen-ink: "#545266"
  edge-dark: "#76738C"
  edge-lit-dark: "#DEDCEA"
  edge-far-dark: "#403E52"
  core-ink-dark: "#FFC85A"
  sup-ink-dark: "#7DA3FF"
  gen-ink-dark: "#C4C1D6"
```

Na prosa do `DESIGN.md`, onde as cores são descritas, acrescente uma linha para cada grupo: linha do mapa em repouso, acesa e de longe; e a tinta por tipo de subdomínio, usada para borda e realce. Rode `npm run generate:tokens`. Rode `npx vitest run apps/playground/test/tokens.test.ts`: esperado PASS.

- [ ] **Step 2: A ponte do mapa.** Mova o bloco `:root { --odds-map-*: … }` de `global.css` para `map-bridge.css`, acrescente `--odds-map-edge: var(--c-edge);` e importe o arquivo em `global.css`. A Task 7 vai embutir esse arquivo no SVG exportado. Em `global.css`, escreva a tabela de tradução como comentário, uma linha por nome da bancada: `--c-bg→--c-canvas`, `--c-panel→--c-surface`, `--c-panel2→--c-surface-muted`, `--c-border→--c-hairline`, `--c-dim→--c-ink-mute`, e os que têm o mesmo nome. Inclua também `--tile-*` e `--mix-*`, que a aplicação lê pelas `--odds-map-tile-*` e `--odds-map-mix-*` do `map.css`.

- [ ] **Step 3: Teste da ilha** em `test/Island.test.tsx`:
  - `"renders the requested element with the island class and passes attributes through"`: `render(<Island as="nav" data-feature="rail" aria-label="Painéis">x</Island>)` gera um `nav[data-feature="rail"][aria-label="Painéis"]` com o texto `x`.
  - `"defaults to a div"`.

- [ ] **Step 4: Implementar a `Island`** com o CSS da `.isl` da bancada traduzido para tokens.

- [ ] **Step 5: A casca.** O `App` passa a ter um contêiner `position: fixed; inset: 0`, com o `<Honeycomb/>` preenchendo tudo e as ilhas posicionadas como na bancada. Use o CSS das classes `.pg`, `.pg-map` e `.i-*` como referência, sempre ilhas soltas, nada grudado na borda. O `body` recebe `overflow: hidden`.

- [ ] **Step 6: Rodar** `npm test` e `npm run typecheck`. Esperado: tudo verde, com o `firstIncrement` e o `App.test` passando, porque editor e contadores continuam na tela.

- [ ] **Step 7: Commit** com `feat(app): the shell goes full screen with floating islands; DESIGN.md gains the map's line and type inks`.

---

### Task 3: O estado da interface no store

**Files:**
- Create: `apps/playground/src/lib/models.ts`, `apps/playground/src/lib/selection.ts`
- Modify: `apps/playground/src/lib/analyze.ts` (devolve também `ast`)
- Modify: `apps/playground/src/stores/playground.ts`. Se o arquivo passar de ~250 linhas, divida em `src/stores/slices/{document,selection,chrome}.ts`, compostos por `createPlaygroundStore`.
- Test: `apps/playground/test/store.test.ts` (ampliar), `apps/playground/test/selection.test.ts`

**Interfaces:**
- Consumes: `navOf`, `Nav`, `Geometry`, `TargetedDiagnostic`, `ViewOptions` do `@odds/layout`; `marketplace`, `declared`, `sourceOf` do `@odds/layout/fixtures`; `ProgramNode` e `Position` do `@odds/core`.
- Produces (`src/lib/models.ts`):

```ts
export type ModelKey = "m50" | "m17";
export interface SampleModel { key: ModelKey; file: string; text: string; hint: string } // hint: "50 contextos" | "17 contextos"
export const MODELS: Record<ModelKey, SampleModel>;
// m50 = marketplace(); m17 = { file: "vendas.odds", text: sourceOf(declared("one", "clean", 0, 0), "rich").text + "\n" }
```

- Produces (`src/lib/selection.ts`):

```ts
export type Point = [number, number];
export type Selection = { ctx: string } | { sub: string } | { rel: string; from: string | null } | null;
export function aliveSelection(sel: Selection, nav: Nav): Selection;          // selAlive da bancada
export function framePoints(sel: Selection, nav: Nav): Point[] | null;        // ctx: ele + near; sub: cells; rel sem from: as duas peças; rel com from: null
export function relationClick(sel: Selection, rk: string, nav: Nav): Selection; // relClick da bancada
export function escapeSelection(sel: Selection): Selection;                   // escape da bancada
export const pairKey: (a: string, b: string) => string;
```

- Produces (no store; `Analysis` ganha `ast: ProgramNode | null`):

```ts
export type PanelName = "code" | "tree" | "help";
export type Box = [number, number, number, number];
export interface Drawing { geo: Geometry; svg: string; topo: string; full: string; nav: Nav; fit: Box; prevTiles: Geometry["tiles"] | null }
// fit: o viewBox que o renderSvg escreveu em geo na vista de fluxo (a bancada: nav.fit só é renovado na vista de fluxo ou se ainda não houver)
// prevTiles: preenchido só quando o desenho veio do fim da pausa com topologia nova (o FLIP da bancada); null nos outros casos
export interface Reveal { start: Position; end: Position; seq: number }
export interface CameraCommand { kind: "in" | "out" | "fit"; seq: number }
// novos campos de PlaygroundState:
modelKey: ModelKey; ast: ProgramNode | null /* a última que existiu */; markers: TargetedDiagnostic[] /* os do último texto com árvore */;
selection: Selection; frameSeq: number; hover: string | null; openPanel: PanelName | null; reveal: Reveal | null;
filters: Record<Severity, boolean>; listOpen: boolean; allOpen: boolean; theme: "light" | "dark";
toast: { message: string; seq: number } | null; zoomPct: number; cameraCommand: CameraCommand | null; epoch: number;
// novas ações:
loadModel(k: ModelKey): void; resetText(): void; setView(v: "flow" | "contain"): void;
select(sel: Selection, frame?: boolean): void; clickRelation(rk: string): void; escape(): void; setHover(sub: string | null): void;
togglePanel(name: PanelName): void; closePanel(): void; revealInEditor(start: Position, end: Position): void; revealLine(line: number): void;
toggleFilter(s: Severity): void; setListOpen(open: boolean): void; toggleAll(): void;
toggleTheme(): void; showToast(message: string): void; dismissToast(): void; setZoomPct(pct: number): void; commandCamera(kind: CameraCommand["kind"]): void;
```

Semântica, sempre a da bancada: `select(x, true)` incrementa `frameSeq`; o controlador de câmera da Task 5 enquadra a seleção quando ele muda. `loadModel` troca o texto e o arquivo, limpa o pendente (timer incluso), `lastType`, seleção e hover, e incrementa `epoch`; com isso a câmera volta ao automático. `togglePanel` com o mesmo nome fecha. `revealInEditor` abre o painel `code` e incrementa `seq`. `revealLine(n)` revela a linha `n` inteira. `toggleFilter` abre a lista se ela estiver fechada. `setView` redesenha o SVG da geometria atual com a vista nova. Todo desenho novo aplica `aliveSelection`.

- [ ] **Step 1: Testes de `selection.ts`.** Monte um `Nav` com `navOf(layout(modelOf(parseAndValidate(MODELS.m17.text).ast!, "vendas.odds", new Map())))`. Os testes:
  - `"aliveSelection drops a context that left the map"` → `aliveSelection({ ctx: "Nope" }, nav) === null`
  - `"aliveSelection keeps a relation but forgets a vanished origin"` → `{ rel: rk, from: "Nope" }` vira `{ rel: rk, from: null }`
  - `"framePoints of a context is the context plus its neighbours"` → comprimento `1 + nav.near[id].length`
  - `"framePoints of a relation seen from a context is null"`
  - `"relationClick toggles: same relation from a context goes back to the context"` → `relationClick({ rel: rk, from: a }, rk, nav)` igual a `{ ctx: a }`
  - `"relationClick from a context that touches it keeps the origin"` → `relationClick({ ctx: a }, rk, nav)` igual a `{ rel: rk, from: a }`, onde `a` é uma das pontas de `rk`
  - `"escapeSelection steps back from relation to origin, then to nothing"`

- [ ] **Step 2: Testes do store**, em `store.test.ts`, com `createPlaygroundStore()` e timers falsos:
  - `"loadModel swaps text and file and drops the pending pause"`: provoque uma topologia nova (acrescente um contexto) para `waiting` virar `true`; chame `loadModel("m17")`; avance 1000 ms. O texto é `MODELS.m17.text`, `waiting` é `false` e o `drawing.full` é o do m17, não o do texto pendente. Esse é o item 2 do Review Focus.
  - `"a selection whose context is deleted is dropped on the next draw"`: com `select({ ctx: "Catalog" })`, apague o bloco `context Catalog { … }` e as relações dele do texto, e chame `flush()`. A seleção vira `null`. Item 1 do Review Focus.
  - `"select with frame bumps frameSeq; without, it does not"`.
  - `"togglePanel opens one at a time and the same name closes"`.
  - `"revealInEditor opens the code panel and bumps seq"`.
  - `"toggleFilter reopens a closed list"`.
  - `"syntax error keeps the last ast and markers"`: depois de `setText(texto + "{")`, `ast` e `markers` são os de antes, e `analysis.astGenerated` é `false`.
  - `"setView repaints the current geometry in the other view"`: `drawing.svg` muda e `drawing.geo` é o mesmo objeto.

- [ ] **Step 3: Rodar** os dois arquivos. Esperado: FAIL, porque nada disso existe ainda.

- [ ] **Step 4: Implementar** `models.ts`, `selection.ts`, o `ast` em `analyze` e os campos e ações do store, portando a semântica da bancada (`select`, `selectSub`, `selectRel`, `relClick`, `escape`, `selAlive`, `setPanel`, `jumpTo`, `diagPanel` com `filt`, `allOpen` e `listOpen`, `loadModel`, `toast`).

- [ ] **Step 5: Rodar** `npm test` e `npm run typecheck`. Esperado: verde.

- [ ] **Step 6: Commit** com `feat(app): the store holds selection, panels, file, view, filters, theme and toast as the bench does`.

---

### Task 4: A matemática da câmera e a pintura da seleção

**Files:**
- Create: `apps/playground/src/features/honeycomb/lib/camera.ts`, `apps/playground/src/features/honeycomb/lib/paintSelection.ts`
- Test: `apps/playground/test/camera.test.ts`, `apps/playground/test/paintSelection.test.ts`

**Interfaces:**
- Consumes: `Box`, `Selection`, `Point` (Task 3); `Nav`.
- Produces (`camera.ts`), funções puras com as fórmulas da bancada:

```ts
export const LIM = { pad: 78, maxFrame: 3, maxZoom: 5, tagPx: 1.15 } as const;
export interface Safe { l: number; t: number; w: number; h: number }
export interface Viewport { w: number; h: number; safe: Safe }
export interface RectLike { left: number; right: number }
export function safeArea(w: number, h: number, rail: RectLike | null, panel: RectLike | null, ficha: RectLike | null): Safe; // safe() da bancada
export function frameOf(pts: Point[], fit: Box, aspect: number): Box;
export function camFor(frame: Box, vp: Viewport): Box;
export function fitFrame(fit: Box, vp: Viewport): Box;
export function fitCam(fit: Box, vp: Viewport): Box;
export function clampCam(c: Box, fit: Box, vp: Viewport): Box;
export function zoomAt(c: Box, factor: number, px: number, py: number, fit: Box, vp: Viewport): Box; // sem clamp final; o chamador passa por clampCam
export function pan(c: Box, dxPx: number, dyPx: number, vp: Viewport): Box;
export function zoomPercent(c: Box, fit: Box, vp: Viewport): number; // Math.round(fitW / c[2] * 100)
export function isFar(c: Box, vp: Viewport): boolean;                 // vp.w / c[2] < LIM.tagPx
export const ease: (t: number) => number;
```

- Produces (`paintSelection.ts`): `export function paintSelection(svg: SVGSVGElement, nav: Nav, sel: Selection, hover: string | null): void`. Ela aplica as classes `on`, `fade`, `subhot`, `hot`, `lit`, `focus`, `mute` e `sel-on` exatamente como o `paintSel` da bancada; a parte da legenda e da árvore fica de fora.

- [ ] **Step 1: Testes da câmera:**
  - `"safeArea on a narrow screen ignores the islands"` → `safeArea(700, 800, …)` igual a `{ l: 32, t: 116, w: 636, h: 560 }`
  - `"safeArea leaves room for the open panel and the ficha"` → `safeArea(1400, 900, {left:16,right:72}, {left:88,right:420}, {left:1040,right:1384})` igual a `{ l: 444, t: 76, w: 572, h: 752 }`
  - `"safeArea without a panel starts after the rail"` → `l === rail.right + 24`
  - `"clampCam keeps width between fitW/5 and fitW*1.4"`
  - `"frameOf a single point is a third of the fit"` → largura `= Math.max(fit[2], fit[3]*aspect) / 3`
  - `"fitCam puts the whole fit inside the safe area"`: `camFor(fitFrame(…))` mapeia `fit[0]` para um x de tela ≥ `safe.l`
  - `"zoomAt keeps the point under the cursor fixed"`
  - `"zoomPercent of fitCam is 100"`

- [ ] **Step 2: Testes da pintura** (jsdom). O `svg` é `renderSvg(geo, [], view)` do m17 posto num `div`:
  - `"a selected context is on, its neighbours are not faded, the rest are"`
  - `"a relation in focus lights itself and mutes its siblings from the origin"`
  - `"a selected subdomain marks its territory hot and on"`
  - `"hover lights a territory without selecting"`
  - `"null selection clears every class and sel-on"`

- [ ] **Step 3: Rodar.** Esperado: FAIL. **Step 4: Implementar.** **Step 5: Rodar.** Esperado: PASS, com `npm run typecheck` verde.

- [ ] **Step 6: Commit** com `feat(map): camera math and selection painting, ported from the bench as pure functions`.

---

### Task 5: O mapa interativo e o zoom

**Files:**
- Create: `apps/playground/src/features/honeycomb/lib/flip.ts`, `apps/playground/src/features/honeycomb/lib/cameraController.ts`
- Create: `apps/playground/src/features/honeycomb/honeycomb.css` (CSS global, não módulo: as regras de interação do `#navcss` e o `.lv-anim`/`.born`/`.frozen` da bancada, com todos os seletores sob a classe global `.odds-map` e as cores em tokens)
- Modify: `apps/playground/src/features/honeycomb/components/Honeycomb.tsx`, `Honeycomb.module.css`
- Create: `apps/playground/src/features/honeycomb/components/ZoomControls.tsx`, `ZoomControls.module.css`
- Modify: `apps/playground/test/parity.test.ts` (tira `map` e `zoom-controls`)
- Test: `apps/playground/test/Honeycomb.test.tsx` (ampliar), `apps/playground/test/ZoomControls.test.tsx`

**Interfaces:**
- Consumes: Tasks 3 e 4.
- Produces: `createCameraController(mapEl: HTMLElement, opts: { reducedMotion: boolean; onZoomPct(pct: number): void }): { setDrawing(svg: SVGSVGElement, fit: Box, animate: boolean): void; frame(pts: Point[]): void; fit(): void; zoomMid(f: number): void; zoomAtPx(f: number, px: number, py: number): void; pan(dx: number, dy: number): void; safeChanged(): void; reset(): void; destroy(): void }`. Ele guarda `cam`, `camAuto` e a animação, aplica o `viewBox`, `--k` e `svg.far`, e mede a área livre consultando `[data-feature="rail"]`, `[data-feature^="panel-"]` e `[data-feature="ficha"]`. O `ResizeObserver` segue a bancada.
- Produces: `flip(svg: SVGSVGElement, prev: Geometry["tiles"], next: Geometry["tiles"]): void`.
- Produces: o elemento-raiz do Honeycomb tem `data-feature="map"`, `className` com `odds-map` e `tabIndex={0}`, com o `aria-label` da bancada.

Comportamento a portar do script da bancada: `paint`, `relayout` (o FLIP só quando `drawing.prevTiles` existe; com câmera automática, anima do enquadramento anterior para o novo em 460 ms) e o bloco *mapa: arrasto, roda, teclado* inteiro. Isso inclui o arrasto a partir de 4 px com `setPointerCapture` (protegido, porque o jsdom não tem); o clique em peça, linha, território ou vazio; o hover de território; a roda (mouse dá zoom, trackpad dá pan, `ctrlKey` é pinça); e o teclado (`Enter`/espaço numa peça, `+ = - _ 0` e as setas, com passo de 80). O controlador reage a: `frameSeq` (enquadra `framePoints`, 420 ms), `cameraCommand`, `epoch` (`reset`), `openPanel` e a presença da ficha (`safeChanged`, 300 ms). Seleção e hover chamam `paintSelection` depois de cada montagem do SVG e a cada mudança. O mapa ganha a classe `frozen` quando `stale`. Com movimento reduzido, nada anima.

O `ZoomControls` (`data-feature="zoom-controls"`, uma `Island`) tem os botões Afastar, a porcentagem `zoomPct`, Aproximar e Mapa inteiro, com os ícones, rótulos e títulos da bancada, e chama `commandCamera`.

- [ ] **Step 1: Testes:**
  - `Honeycomb.test.tsx`: `"clicking a tile selects its context"` (`pointerDown` + `pointerUp` num `g.node`); `"clicking empty map clears the selection"`; `"a drag of more than 4px does not select"`; `"Escape on the map clears the selection"`; `"the map root carries data-feature=map"`; `"stale adds the frozen class"`.
  - `ZoomControls.test.tsx`: `"buttons command the camera"` (`cameraCommand.kind` vira `in`/`out`/`fit`); `"shows zoomPct"`.
  - Para o `flip`: `"flip offsets moved tiles and marks new ones born"`, no `Honeycomb.test.tsx` ou num `flip.test.ts`.

- [ ] **Step 2: Rodar.** Esperado: FAIL. **Step 3: Implementar.** **Step 4:** tire `map` e `zoom-controls` do `PENDING`, rode `npm test` e `npm run typecheck`, e espere verde.

- [ ] **Step 5: Conferir no navegador** (`npm run dev`). Arrastar, roda e `0` funcionam, clique em peça acende os vizinhos, e mudar a topologia anima o FLIP. Compare com a bancada aberta por `file://`.

- [ ] **Step 6: Commit** com `feat(map): pan, zoom, selection and FLIP on the full-screen map, with the zoom island`.

---

### Task 6: Arquivo e vista (as primeiras peças do Base UI)

**Files:**
- Modify: `apps/playground/package.json`, `package-lock.json` (adiciona `@base-ui/react`, versão exata, a estável mais recente de `npm view @base-ui/react version`)
- Create: `apps/playground/src/components/ui/Menu.tsx`, `Menu.module.css`; `apps/playground/src/components/ui/ToggleGroup.tsx`, `ToggleGroup.module.css`
- Create: `apps/playground/src/features/topbar/components/FileMenu.tsx`, `ViewSwitch.tsx` (cada um com o seu `.module.css`)
- Modify: `apps/playground/src/App.tsx`, `test/parity.test.ts` (tira `file-menu` e `view-switch`)
- Test: `apps/playground/test/FileMenu.test.tsx`, `apps/playground/test/ViewSwitch.test.tsx`

**Interfaces:**
- Produces: invólucros nossos com API mínima, sem vazar o Base UI. O `Menu` recebe `trigger` e itens `radio` e `action`; o `ToggleGroup` recebe `value`, `onValueChange` e `items: { value; label }[]`. As formas exatas ficam com o implementador, desde que nenhum componente de feature importe `@base-ui/react`.
- `FileMenu`: a ilha `data-feature="file-menu"` com a palavra `odds`, o botão com `MODELS[modelKey].file` e o chevron. O menu tem marketplace.odds `<small>50 contextos</small>`, vendas.odds `<small>17 contextos</small>`, um separador e "restaurar o texto inicial" (`resetText`).
- `ViewSwitch`: `data-feature="view-switch"`, `role="group"`, `aria-label="Vista"`, com os botões Fluxo e Contenção em `aria-pressed`, chamando `setView`.

- [ ] **Step 1: Testes:**
  - `FileMenu`: `"opens the menu and switches to vendas.odds"` (o texto do store vira `MODELS.m17.text` e o botão mostra `vendas.odds`); `"restore puts the initial text back"`; `"Escape with the menu open closes the menu and keeps the selection"`, que é o item 5 do Review Focus (com `select({ctx:"Catalog"})` antes).
  - `ViewSwitch`: `"Contenção sets view to contain and marks it pressed"`.

- [ ] **Step 2: Rodar.** Esperado: FAIL. **Step 3:** instale o pacote e implemente. **Step 4:** tire os ids do `PENDING`; rode `npm test`, `npm run lint` e `npm run typecheck`; espere verde.

- [ ] **Step 5: Commit** com `feat(app): file menu and flow/containment switch, on Base UI behind our ui wrappers`.

---

### Task 7: Compartilhar, exportar, tema e toast

**Files:**
- Create: `apps/playground/src/components/ui/Toast.tsx`, `Toast.module.css` (invólucro Base UI que mostra `toast` do store por 4200 ms, `role="status"`, com `data-feature="toast"` na raiz visível)
- Create: `apps/playground/src/features/topbar/components/Actions.tsx` (a ilha `.i-act`), `ShareButton.tsx`, `ExportButton.tsx`, `ThemeToggle.tsx` (com seus `.module.css`)
- Create: `apps/playground/src/features/topbar/lib/exportSvg.ts`
- Modify: `apps/playground/src/App.tsx`, `test/parity.test.ts` (tira `share`, `export-svg`, `theme-toggle`, `toast`)
- Test: `apps/playground/test/exportSvg.test.ts`, `apps/playground/test/Actions.test.tsx`

**Interfaces:**
- Produces: `buildExportSvg(svg: SVGSVGElement, viewBox: Box, view: "flow" | "contain", theme: "light" | "dark", css: string): string`. A função clona o SVG, aplica o `viewBox` da geometria, a classe `v-flow`/`v-contain` e remove `on fade lit focus mute hot subhot`. O resultado é um `<svg xmlns class="odds-map" data-theme width height viewBox>` com `<style>` (o `css`) e o conteúdo. O `css` vem de `tokens.css?raw`, `@odds/layout/map.css?raw`, `map-bridge.css?raw` e `honeycomb.css?raw`, concatenados no `ExportButton`; se o alias `?raw` do `map.css` precisar de entrada própria no `vite.config.ts` e no `vitest.config.ts`, acrescente.
- `ShareButton`: botão primário com o ícone e o rótulo "Compartilhar" da bancada. Mostra o toast com o texto exato da bancada: `Compartilhar ainda é só o lugar do botão: o formato do link, com o texto e a versão da linguagem na URL, é decisão em aberto.`
- `ExportButton`: o nome do arquivo é `<file sem .odds>.svg`, baixado por `<a download>` com `URL.createObjectURL`. O toast diz `Exportado: ${name}, com ${n} marcador(es).`, com n = `markers.length` e a mesma concordância da bancada.
- `ThemeToggle`: chama `toggleTheme`. Um efeito no `App`, ou no próprio componente, escreve `document.documentElement.dataset.theme`. O tema começa em `light`.

- [ ] **Step 1: Testes:**
  - `exportSvg`: `"strips selection classes and sets the full viewBox"`; `"embeds the css and the theme"`; `"names the view class"`.
  - `Actions`: `"share shows the open-decision toast"` (o texto exato); `"theme toggles data-theme on <html>"`; `"export creates a download named after the file and toasts the marker count"` (com `URL.createObjectURL` mockado, o clique de `a` espionado, e o texto `Exportado: marketplace.svg, com 0 marcadores.`); `"the toast hides after 4200 ms"`.

- [ ] **Step 2: Rodar.** Esperado: FAIL. **Step 3: Implementar.** **Step 4:** tire os ids do `PENDING`; rode `npm test`, `npm run lint` e `npm run typecheck`; espere verde. Abra o SVG exportado no navegador: ele precisa ter o mesmo aspecto do mapa, nos dois temas.

- [ ] **Step 5: Commit** com `feat(app): share, SVG export with markers, theme switch and toast`.

---

### Task 8: O trilho e o painel de código

**Files:**
- Create: `apps/playground/src/features/panels/components/Rail.tsx`, `PanelIsland.tsx` (cabeçalho com título, sub, espaço e fechar; corpo; rodapé opcional), com seus `.module.css`
- Modify: `apps/playground/src/features/editor/components/Editor.tsx`, `Editor.module.css` (gutter, caret, Tab, Esc e `reveal`)
- Create: `apps/playground/src/features/editor/lib/gutter.ts`
- Create: `apps/playground/src/features/editor/components/CodePanel.tsx`
- Modify: `App.tsx` (tira a ilha provisória do editor da Task 2), `test/parity.test.ts` (tira `rail` e `panel-code`), `test/firstIncrement.test.tsx` e `test/App.test.tsx` (abrem o painel de código antes de digitar, porque ele agora começa fechado como na bancada)
- Test: `apps/playground/test/gutter.test.ts`, `apps/playground/test/CodePanel.test.tsx`, `apps/playground/test/Rail.test.tsx`

**Interfaces:**
- Produces: `worstByLine(diags: { severity: Severity; span: Span }[]): Record<number, Severity>`. Cobre da linha inicial até `min(end, start + 40)`, e a pior severidade vence.
- Produces: `caretLabel(file: string, text: string, offset: number): string`, no formato `${file} · L${l}:${c}`.
- Produces: `offsetOf(text: string, pos: Position): number`.
- `Rail`: `Island as="nav"`, `data-feature="rail"`, `aria-label="Painéis"`, com três quadrados (Código, Estrutura, Como ler) com os ícones da bancada e `aria-pressed = openPanel === name`.
- `CodePanel`: `PanelIsland` com `data-feature="panel-code"`, título "Código", o caret no sub e o fechar `aria-label="Fechar"`. Só existe no DOM quando `openPanel === "code"`. O textarea mantém `aria-label="Texto .odds"`. `Tab` insere dois espaços e passa por `setText`; `Esc` faz `blur` e foca o mapa (`[data-feature="map"]`), sem mexer na seleção. Quando `reveal.seq` muda, o editor foca, seleciona o trecho e rola (`scrollTop = max(0, (line - 6) * 20)`).
- `PanelIsland` também é usado pelas Tasks 9 e 10. Assinatura: `PanelIsland(props: { feature: "panel-code" | "panel-tree" | "panel-help"; title: string; sub?: ReactNode; foot?: ReactNode; bodyClassName?: string; children: ReactNode })`.

- [ ] **Step 1: Testes:**
  - `gutter`: `"the worst severity wins on a shared line"`; `"a span marks every line it covers, at most 41"`.
  - `Rail`: `"one panel at a time, and the same square closes"`.
  - `CodePanel`: `"Tab inserts two spaces"`; `"Escape leaves the editor and keeps the selection"` (item 5 do Review Focus); `"caret shows file and line:column"`; `"revealInEditor selects the span"` (`selectionStart` e `selectionEnd` iguais aos `offsetOf`); `"gutter shows a severity icon on a line with a diagnostic"`.

- [ ] **Step 2: Rodar.** Esperado: FAIL. **Step 3: Implementar.** **Step 4:** tire os ids do `PENDING`, ajuste os testes antigos e rode `npm test`, `npm run lint` e `npm run typecheck`; espere verde.

- [ ] **Step 5: Commit** com `feat(app): the panel rail and the code panel, with gutter, caret and reveal`.

---

### Task 9: O painel de estrutura

**Files:**
- Create: `apps/playground/src/features/structure/lib/sevMarks.ts`, `apps/playground/src/features/structure/components/StructurePanel.tsx`, `StructureTree.tsx` (com seus `.module.css`)
- Modify: `App.tsx`, `test/parity.test.ts` (tira `panel-tree`)
- Test: `apps/playground/test/sevMarks.test.ts`, `apps/playground/test/StructurePanel.test.tsx`

**Interfaces:**
- Produces: `sevMarks(markers: TargetedDiagnostic[]): { ctx: Record<string, Severity>; sub: Record<string, Severity>; rel: Record<string, Severity> }`. É o `sevMarks` da bancada: o alvo com `rk` conta para a relação, com `ctx` para o contexto e com `sub` para o subdomínio, e a pior severidade vence.
- `StructurePanel`: `PanelIsland` com `feature="panel-tree"`, título "Estrutura" e o rodapé `clicar enquadra no mapa · o mesmo quadrado fecha o painel`. A árvore sai do `ast` do store, não do mapa. Sem AST, mostra `O texto ainda não tem estrutura.`. O estado recolhido (`d:`, `s:`, `e:` + chave) mora no componente, num `useState<Set<string>>`, e sobrevive à digitação. As seções são Domínio, os subdomínios com badge de tipo e owner, os contextos, `external` e `Relações <small>N</small>`, ou `Nenhuma relação no mapping.`. O item da seleção atual leva `on`. Clicar num contexto o seleciona com enquadramento se estiver no mapa; se não estiver, leva à linha dele. Num subdomínio, seleciona e enquadra. Numa relação, seleciona e enquadra; sem aresta, leva à linha. Passar sobre um subdomínio chama `setHover`; sair da árvore, `setHover(null)`.

- [ ] **Step 1: Testes:**
  - `sevMarks`: `"worst severity per target kind"`.
  - `StructurePanel`: `"lists the subdomains and relations of the text"` (no m17, conta as linhas de relação = `ast.domains[0].mapping.relationships.length`); `"collapsing a subdomain survives typing"`; `"clicking a context selects it with framing"` (`frameSeq` incrementa); `"a relation not on the map jumps to its line"` (acrescente ao mapping do m17 uma linha `Ghost --> <um contexto existente>`, com `Ghost` não declarado: ela entra na AST e não tem `relOf`; clicar nela deixa `reveal.start.line` igual à linha dela e não muda a seleção); `"after a syntax error the tree still shows the last structure"` (item 3 do Review Focus).

- [ ] **Step 2: Rodar.** Esperado: FAIL. **Step 3: Implementar.** **Step 4:** tire o id do `PENDING` e rode tudo.

- [ ] **Step 5: Commit** com `feat(app): the structure panel, read from the AST, with severity marks and framing`.

---

### Task 10: O painel Como ler

**Files:**
- Create: `apps/playground/src/features/help/lib/legend.ts`, `apps/playground/src/features/help/components/HelpPanel.tsx`, `Legend.tsx` (com seus `.module.css`)
- Modify: `App.tsx`, `test/parity.test.ts` (tira `panel-help`)
- Test: `apps/playground/test/legend.test.ts`, `apps/playground/test/HelpPanel.test.tsx`

**Interfaces:**
- Produces: `legendOf(nav: Nav): { types: { type: "core" | "supporting" | "generic"; count: number }[]; external: number }`. Só entram os tipos com contagem maior que zero, na ordem core, supporting, generic.
- `HelpPanel`: `PanelIsland` com `feature="panel-help"` e título "Como ler". A legenda segue o `renderLegend` da bancada: a amostra hexagonal por tipo (`<b>core</b> · 3 subdomínios`, no singular para 1); `external` com o texto `fora da água territorial`; e as quatro linhas com os SVGs pequenos e o texto da bancada (seta, acesa, inválida, tag encostada). Os atalhos são os sete pares de `.keys` da bancada, com `<kbd>`.

- [ ] **Step 1: Testes:**
  - `legend`: `"counts subdomains per type and external contexts"` (m50: confira contra `nav.subs` e `nav.ctxSub`).
  - `HelpPanel`: `"shows the legend for the current map and the seven shortcuts"`; `"singular for one subdomain"`.

- [ ] **Step 2: Rodar.** Esperado: FAIL. **Step 3: Implementar.** **Step 4:** tire o id do `PENDING` e rode tudo.

- [ ] **Step 5: Commit** com `feat(app): the how-to-read panel, with a legend drawn from the current map`.

---

### Task 11: A ficha e a legenda da seleção

**Files:**
- Create: `apps/playground/src/features/inspector/lib/ficha.ts`, `apps/playground/src/features/inspector/lib/glossary.ts`, `apps/playground/src/features/inspector/lib/caption.ts`
- Create: `apps/playground/src/features/inspector/components/Ficha.tsx`, `ContextCard.tsx`, `SubdomainCard.tsx`, `RelationCard.tsx`, `Verdict.tsx` (uma linha de diagnóstico com ícone, prosa, código e `L:C` clicável), `DocProps.tsx`, `SelectionCaption.tsx` (com seus `.module.css`)
- Create: `apps/playground/src/components/prose/Prose.tsx` (frase de `@odds/messages` com os trechos entre crases em `<code>`; a Task 12 também usa)
- Modify: `App.tsx`, `test/parity.test.ts` (tira `ficha` e `selection-caption`)
- Test: `apps/playground/test/ficha.test.ts`, `apps/playground/test/caption.test.ts`, `apps/playground/test/Ficha.test.tsx`

**Interfaces:**
- Produces (`ficha.ts`), o `fichaOf` da bancada, tipado:

```ts
export interface RelInfo { rk: string; l: string; lt: string[]; c: "-->" | "<--" | "<->" | "-x-"; rt: string[]; r: string; line: number }
export interface DocInfo { title?: string; description?: string; responsibilities?: string[]; type?: string; maturity?: string; team?: string; technology?: string; line: number }
export interface Ficha { rels: Record<string, RelInfo>; ctx: Record<string, DocInfo>; sub: Record<string, { title?: string; description?: string; owner?: string; line: number }>; dom: string }
export function fichaOf(ast: ProgramNode): Ficha;
export function relLabel(rk: string, f: Ficha | null): string;   // "A → B", "A ⇄ B", "A ✕ B", ou rk com " · "
export function roleText(r: RelInfo, id: string): string;        // "upstream de X" | "downstream de X" | "mutuamente dependentes" | "caminhos separados: decisão, não falha"
```

- Produces (`glossary.ts`): `TAGS` e `FORMS`, com o texto da bancada palavra por palavra.
- Produces (`caption.ts`): `captionOf(nav: Nav, sel: Selection, f: Ficha | null): { name: string; rest: string } | null`, com os três textos de `paintSel` da bancada.
- `Ficha`: `Island as="aside"`, `data-feature="ficha"` e `aria-label="Ficha"`. Só existe com seleção. O cabeçalho mostra Contexto, Subdomínio ou Relação, mais o fechar (`aria-label="Fechar a ficha"`, que chama `select(null)`). O conteúdo segue o `renderPanel` e o `relPanel` da bancada, seção por seção (spec §3, linha `ficha`). Os links levam a `select(id, true)`, `select({sub}, true)`, `clickRelation(rk)` e `revealLine(line)`. A ficha lê `fichaOf(ast)` (memo no componente ou seletor) e `markers`.
- `SelectionCaption`: `Island` com `data-feature="selection-caption"` e `aria-live="polite"`, contendo `<b>{name}</b>{rest}`. Só existe com seleção.

- [ ] **Step 1: Testes:**
  - `ficha`: `"fichaOf collects contexts, subdomains and the first line of each relation pair"`; `"relLabel orders by direction"` (`-->` dá `l → r` e `<--` dá `r → l`); `"roleText"` nos quatro conectores.
  - `caption`: `"context caption counts neighbours"` (`Catalog` no m50: `· N vizinhos · clique numa linha para ver só ela · Esc limpa`); `"relation from a context says how to go back"`.
  - `Ficha` (render): `"a context shows its contract and properties"` (no m50, `Catalog` tem a seção Contrato com as relações do mapping e a cerca `Propriedade é documentação`); `"a relation shows both sides with the tag glossary"` (`Inventory|Shipping`, `[SK]`, o texto `Shared Kernel`); `"a subdomain shows the derived tally"`; `"the line link reveals in the editor"`; `"closing the ficha clears the selection"`; `"a verdict renders the message with code in mono"` (crie um diagnóstico num contexto e espere um `<code>` dentro da frase).

- [ ] **Step 2: Rodar.** Esperado: FAIL. **Step 3: Implementar.** **Step 4:** tire os ids do `PENDING` e rode tudo. No navegador, abrir e fechar a ficha reenquadra o mapa automático (`safeChanged`).

- [ ] **Step 5: Commit** com `feat(app): the ficha for context, subdomain and relation, and the selection caption`.

---

### Task 12: O rodapé de diagnósticos, o congelado e a espera

**Files:**
- Create: `apps/playground/src/features/diagnostics/components/DiagnosticsDock.tsx`, `DiagnosticRow.tsx` (com seus `.module.css`)
- Create: `apps/playground/src/features/honeycomb/components/FrozenFlag.tsx`, `WaitIndicator.tsx` (com seus `.module.css`)
- Modify: `apps/playground/src/features/honeycomb/components/Honeycomb.tsx` (o banner atual dá lugar ao `FrozenFlag`), `App.tsx` (tira a ilha provisória dos contadores da Task 2)
- Delete: `apps/playground/src/features/diagnostics/components/SeverityCounters.tsx` e `.module.css`, que os contadores do dock substituem; o `SeverityIcon` fica
- Modify: `test/parity.test.ts` (tira `diagnostics-dock`, `frozen-flag` e `wait-indicator`; o `PENDING` fica vazio), `test/firstIncrement.test.tsx` e `test/App.test.tsx` (os contadores agora são os botões do dock)
- Test: `apps/playground/test/DiagnosticsDock.test.tsx`, `apps/playground/test/FrozenFlag.test.tsx`

**Interfaces:**
- `DiagnosticsDock`: `div data-feature="diagnostics-dock"` com uma `Island as="section" aria-label="Diagnósticos"`. É o `diagPanel` da bancada. Os contadores são botões `aria-pressed = filters[s]`, com `title` `esconder/mostrar erros|avisos|infos`, ícone e número. A soma é `N diagnóstico(s)` ou `nenhum diagnóstico · o modelo é coerente`. O botão de recolher alterna `aria-label` entre `Recolher a lista` e `Abrir a lista`, com `aria-expanded`. A lista mostra até três linhas, ou todas com `allOpen`, e o botão `ver os N diagnósticos` / `mostrar só os três primeiros`. Com os filtros escondendo tudo, mostra `Os filtros escondem todos os diagnósticos.`. Cada linha leva ícone, código, `<Prose>` e `L:C`. Clicar numa linha procura em `markers` o diagnóstico do mesmo trecho e código e seleciona o alvo com enquadramento (rk com aresta, ou ctx com peça, ou sub com território); depois chama `revealInEditor(span.start, span.end)`. Um alvo sem lugar no mapa só revela. O dock se centra entre o painel aberto (ou o trilho) e a ilha de zoom, como no `layoutDock` da bancada, por `--dl`/`--dr`; abaixo de 760 px, sem centragem.
- `FrozenFlag`: `Island role="status"` com `data-feature="frozen-flag"`, ícone de erro e `<b>Diagrama congelado.</b>` mais a mensagem. Com erro de sintaxe: `Erro de sintaxe em L${l}:${c}; o mapa mostra o último texto válido.`. Com falha de layout: `O layout falhou: ${layoutError}`. Some quando não há nem uma coisa nem outra.
- `WaitIndicator`: `Island` com `data-feature="wait-indicator"`, o ponto e `topologia mudou · o mapa redesenha na pausa`, visível com `waiting`, na transição da bancada (classe `on`).

- [ ] **Step 1: Testes:**
  - `DiagnosticsDock`: `"counters filter and reopen a collapsed list"`; `"shows three rows and expands to all"` (crie 4 diagnósticos ou mais); `"clicking a context diagnostic selects it, frames it and reveals the span"`; `"a syntax error row only reveals in the editor"` (item 3 do Review Focus: a seleção não muda, e `reveal` aponta o trecho); `"a diagnostic whose target is not on the map only reveals"` (item 4: o `PHANTOM_REFERENCE` de uma linha `Ghost --> <contexto existente>` no mapping); `"empty model says the model is coherent"`.
  - `FrozenFlag`: `"syntax error text names line and column"`; `"layout failure text"`; `"hidden when the map is fresh"`.
  - O `WaitIndicator` é testado no `firstIncrement` ou no próprio arquivo: `"visible during the pause, gone after it"`.

- [ ] **Step 2: Rodar.** Esperado: FAIL. **Step 3: Implementar.** **Step 4:** o `PENDING` fica vazio. Rode `npm test`, `npm run lint`, `npm run typecheck` e `npm run build:app`, e espere verde.

- [ ] **Step 5: Commit** com `feat(app): the diagnostics dock, the frozen flag and the pause indicator — the app reaches the bench`.

---

### Task 13: Conferência lado a lado e registros

**Files:**
- Modify: o que a conferência apontar (só correções de paridade)
- Modify: `CHANGELOG.md`, `docs/adr/0018-…md` (nota sobre os tokens novos, se o ADR pedir), `HEALTH.md` (pelo §6 dele, se o `DESIGN.md` conta como mudança normativa para o placar), `CLAUDE.md` (a linha de `apps/playground` deixa de dizer "primeiro incremento", se disser)

- [ ] **Step 1: Conferir no navegador.** Abra a aplicação (`npm run dev`) e a bancada (servidor estático em `docs/design/pages`) lado a lado, em 1400×900 e 700×900, nos dois temas. Passe por cada linha do inventário da spec §3 e pelos cinco itens do Review Focus. Anote cada diferença e corrija só o que é paridade. Use a skill `page-shot` para capturar a bancada.

- [ ] **Step 2: Registros.** No `CHANGELOG.md`, uma entrada na seção da aplicação: a paridade com a bancada, o harness, os tokens novos do `DESIGN.md` e o ADR-0020. Rode `python3 .claude/skills/health-check/scripts/health_check.py`: esperado 16/16. Se o placar pedir, atualize o `HEALTH.md` pela skill `health-check`.

- [ ] **Step 3: Verificação final.** Rode `npm test`, `npm run typecheck`, `npm run lint`, `npm run build:app` e `node docs/design/pages/playground.build.mjs`. Esperado: tudo verde, e o `PENDING` do teste de paridade vazio.

- [ ] **Step 4: Commit** com `docs: the app reaches the bench — changelog, health and records`.
