#!/usr/bin/env node
/**
 * Captura a saida da colmeia legada (docs/design/pages/colmeia-v4.html) e do adaptador da
 * bancada (docs/design/pages/playground.html) como fixtures de caracterizacao. Os goldens
 * em test/golden/ sao o oraculo contra o qual o @odds/layout e portado byte a byte.
 *
 *   npm run typecheck && node packages/layout/scripts/capture-legacy.mjs
 *
 * Definicoes (decididas na Task 2):
 *  - `model`: o objeto M da entrada (para os casos da v4: v3.declared(model, file, 0, extra)).
 *  - `geo`: v3.layout(v3.canon(v3.declared("__live","clean",0,0))) com v3.MODELS.__live = clone(M),
 *    isto e, o pipeline que a bancada usa. A mesma geo alimenta build().
 *  - `diags`: v3.diagsFor(...) nos casos da v4; [] no marketplace e no vazio.
 *  - `svg`: v3.build(geo, diags, null) sob quatro combinacoes de v3.state.
 * Entradas que lancam excecao gravam `throws: true` e a mensagem em vez de abortar.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { MODEL as BARE } from "../../../docs/design/pages/colmeia-50.model.mjs";
import { documented } from "../../../docs/design/pages/colmeia-navegacao.docs.mjs";
import * as bench from "../test/legacy-bench.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");
const pagePath = path.join(root, "docs/design/pages/colmeia-v4.html");
const outDir = path.join(here, "../test/golden");

const core = await import(pathToFileURL(path.join(root, "packages/core/dist/index.js")).href);

function loadPage(html) {
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  const code = scripts[scripts.length - 1][1];
  globalThis.__V3_HEADLESS = true;
  new Function(code)();
  delete globalThis.__V3_HEADLESS;
  return globalThis.__v3;
}
const v3 = loadPage(fs.readFileSync(pagePath, "utf8"));
const clone = (x) => JSON.parse(JSON.stringify(x));
/* A geo legada tem referencias circulares (group.mass), entao so se grava o que o contrato
   fixa: {tiles, rels:[{rk, path}], viewBox}. O viewBox NAO sai de layout(): quem o escreve em
   geo e build(). Por isso se le o de "flow|on|ctx" depois dessa build, e os das outras
   combinacoes vao em `viewBoxes` (o da vista "contain" difere). */
function geoJson(geo, viewBox) {
  return { tiles: clone(geo.tiles), rels: geo.rels.map((E) => ({ rk: E.rk, path: clone(E.path) })), viewBox: clone(viewBox) };
}

const COMBOS = {
  "flow|on|ctx": { view: "flow", tags: "on", labels: "ctx", selDiag: null },
  "flow|off|ctx": { view: "flow", tags: "off", labels: "ctx", selDiag: null },
  "contain|on|ctx": { view: "contain", tags: "on", labels: "ctx", selDiag: null },
  "flow|on|ctx|selDiag0": { view: "flow", tags: "on", labels: "ctx", selDiag: 0 },
};
const DEFAULT_STATE = { view: "flow", tags: "on", labels: "ctx", sel: null, selSub: null, selDiag: null };
/** Estado explicito antes de cada build; restaurado depois, para nada vazar. */
function withState(combo, fn) {
  Object.assign(v3.state, DEFAULT_STATE, combo);
  try { return fn(); } finally { Object.assign(v3.state, DEFAULT_STATE); }
}

/** A geo da bancada: o modelo entra por MODELS.__live e passa por declared/canon/layout. */
function geoOf(M) {
  v3.MODELS.__live = clone(M);
  try { return v3.layout(v3.canon(v3.declared("__live", "clean", 0, 0))); }
  finally { delete v3.MODELS.__live; }
}

function svgs(geo, diags, decorate) {
  const svg = {}, svgThrows = {}, viewBoxes = {};
  for (const [key, combo] of Object.entries(COMBOS)) {
    try {
      svg[key] = withState(combo, () => decorate(v3.build(geo, clone(diags), null)));
      viewBoxes[key] = clone(geo.viewBox);
    } catch (e) { svgThrows[key] = String(e && e.message || e); }
  }
  return { svg, viewBoxes, ...(Object.keys(svgThrows).length ? { svgThrows } : {}) };
}

const written = [];
function write(name, obj) {
  const file = path.join(outDir, name + ".json");
  fs.writeFileSync(file, JSON.stringify(obj) + "\n");
  written.push([name, fs.statSync(file).size]);
}

function capture(name, M, diags) {
  const entry = { name, model: clone(M) };
  try {
    const geo = geoOf(M);
    entry.diags = clone(diags);
    const r = svgs(geo, diags, (s) => s);
    entry.geo = geoJson(geo, r.viewBoxes["flow|on|ctx"]);
    Object.assign(entry, r);
  } catch (e) {
    entry.throws = true; entry.error = String(e && e.message || e);
    entry.geo = null; entry.diags = clone(diags); entry.svg = {};
  }
  write(name, entry);
}

/* ---- 1. os modelos da v4 ---- */
function v4Case(name, model, file, extra) {
  const M = v3.declared(model, file, 0, extra);
  const src = v3.sourceOf(M, "today");
  capture(name, M, v3.diagsFor(model, file, src).items);
}
for (const model of ["one", "many"]) {
  for (const file of ["clean", "broken"]) v4Case(`${model}-${file}`, model, file, 0);
  v3.EXTRA[model].forEach((_, i) => v4Case(`${model}-clean-extra${i + 1}`, model, "clean", i + 1));
}

/* ---- 2. o marketplace de 50 contextos e o modelo vazio ---- */
const { model: M50, undocumented } = documented(BARE, v3.MODELS);
if (undocumented.length) throw new Error(`contextos sem documentacao: ${undocumented.join(", ")}`);
capture("marketplace50", M50, []);
capture("empty", { file: "empty.odds", domains: [], mapping: [] }, []);

/* ---- 3. o adaptador da bancada ---- */
function benchCase(name, text, file) {
  const res = core.parseAndValidate(text);
  const anchors = bench.anchorsOf(res.ast);
  const diags = res.diagnostics.map((d) => ({ code: d.code, severity: d.severity, data: d.data, span: d.span, target: bench.targetOf(d, anchors) }));
  const model = bench.toModel(res.ast, new Map(), file);
  const keys = bench.keysOf(model);
  const geo = geoOf(model);
  const nav = bench.navOf(geo, v3);
  const targets = diags.map((d) => d.target);
  const r = svgs(geo, diags, (s) => bench.decorate(s, nav, diags, v3));
  write(`bench-${name}`, {
    name: `bench-${name}`, text, model, geo: geoJson(geo, r.viewBoxes["flow|on|ctx"]), keys, targets, nav: clone(nav), ...r,
  });
}
const m50Text = v3.sourceOf(v3.canon(M50), "rich").text + "\n";
benchCase("marketplace50", m50Text, M50.file);
benchCase("one", v3.sourceOf(v3.declared("one", "clean", 0, 0), "rich").text + "\n", "vendas.odds");

for (const [n, s] of written) console.log(`${n}.json  ${(s / 1024).toFixed(1)} KB`);
