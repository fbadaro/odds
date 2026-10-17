#!/usr/bin/env node
/**
 * Checagem mecânica da colmeia-v3.html, e o gerador dos diagnósticos que ela embute.
 *
 *   node docs/design/pages/colmeia-v3.check.mjs           confere; sai com 1 se algo falhar
 *   node docs/design/pages/colmeia-v3.check.mjs --write   regrava PHASE e DIAG dentro da página
 *
 * A página roda aqui sem DOM (globalThis.__V3_HEADLESS): o mesmo gerador de fonte e o
 * mesmo layout que desenham o mapa. Cinco famílias de checagem:
 *
 *   1. Veredito real: a fonte gerada pela página passa pelo @odds/core; cada diagnóstico
 *      tem de cair numa âncora da página com o MESMO span, senão o marcador mentiria.
 *   2. Embaralhar: para N ordens aleatórias, o validador roda de novo sobre a fonte
 *      embaralhada e tem de dar o mesmo conjunto (code + âncora), com os spans que a
 *      página calcula.
 *   3. Invariância: as N ordens dão exatamente as mesmas posições de peça.
 *   4. A régua da v2: cruzamentos e arestas sobre peça alheia caem pelo menos à metade.
 *   5. Composição: rótulo × rótulo, rótulo × peça, chip × chip, chip × peça alheia.
 *
 * Exige o core compilado (`npm run typecheck` faz o build de packages/core e messages).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");
const pagePath = path.join(here, "colmeia-v3.html");
const WRITE = process.argv.includes("--write");
const N_SHUFFLE = 24;

const core = await import(pathToFileURL(path.join(root, "packages/core/dist/index.js")).href);
const messages = await import(pathToFileURL(path.join(root, "packages/messages/dist/index.js")).href);

function loadPage(html) {
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  const code = scripts[scripts.length - 1][1];
  globalThis.__V3_HEADLESS = true;
  new Function(code)();
  return globalThis.__v3;
}

let html = fs.readFileSync(pagePath, "utf8");
let v3 = loadPage(html);
const failures = [];
const fail = (m) => failures.push(m);
const spanEq = (a, b) =>
  a.start.line === b.start.line && a.start.column === b.start.column &&
  a.end.line === b.end.line && a.end.column === b.end.column;
const fmt = (s) => `L${s.start.line}:${s.start.column}-${s.end.line}:${s.end.column}`;

/* Todas as âncoras da página com span idêntico ao do diagnóstico. */
function hitsFor(d, anchors) {
  return Object.keys(anchors).filter((k) => spanEq(anchors[k], d.span)).sort();
}

const KEYS = [
  ["one", "clean"],
  ["one", "broken"],
  ["many", "clean"],
];

/* ---- 1. veredito real ---- */
/* Quando duas âncoras têm o mesmo span (`domhead:Logistics` e `domnth:2`), a
   identidade do diagnóstico é a que continua certa em TODA ordem do arquivo. O
   validador roda sobre cada embaralhamento e as candidatas que falham caem. */
const DIAG = {};
const results = {};
for (const [model, file] of KEYS) {
  const key = `${model}:${file}`;
  const src = v3.sourceOf(v3.declared(model, file, 0, 0), "today");
  const res = core.parseAndValidate(src.text);
  const cands = res.diagnostics.map((d) => hitsFor(d, src.anchors));
  const runs = [];
  for (let s = 1; s <= N_SHUFFLE; s++) {
    const dm = v3.declared(model, file, s, 0);
    const ssrc = v3.sourceOf(dm, "today");
    runs.push({ s, dm, src: ssrc, res: core.parseAndValidate(ssrc.text) });
  }
  res.diagnostics.forEach((d, i) => {
    cands[i] = cands[i].filter((k) => runs.every((r) =>
      r.src.anchors[k] && r.res.diagnostics.some((x) => x.code === d.code && spanEq(x.span, r.src.anchors[k]))));
  });
  results[key] = { runs };
  const items = [];
  res.diagnostics.forEach((d, i) => {
    const anchor = cands[i][0];
    if (!anchor) { fail(`${key}: ${d.code} em ${fmt(d.span)} não tem âncora estável na página`); return; }
    items.push({ code: d.code, severity: d.severity, data: d.data, anchor, msg: messages.renderMessage(d.code, d.data, "pt") });
  });
  DIAG[key] = { hash: v3.fnv(src.text), items };
  console.log(`[veredito] ${key}: ${items.length} diagnóstico(s)` +
    (items.length ? " — " + items.map((i) => `${i.code}@${i.anchor}`).join(", ") : ""));
}
const PHASE = Object.fromEntries(Object.entries(core.CATALOGUE).map(([k, v]) => [k, v.phase]));

if (WRITE) {
  html = html
    .replace(/\/\*DIAG\*\/[\s\S]*?\/\*END\*\//, "/*DIAG*/" + JSON.stringify(DIAG) + "/*END*/")
    .replace(/\/\*PHASE\*\/[\s\S]*?\/\*END\*\//, "/*PHASE*/" + JSON.stringify(PHASE) + "/*END*/");
  fs.writeFileSync(pagePath, html);
  v3 = loadPage(html);
  console.log("[write] PHASE e DIAG regravados na página");
} else if (JSON.stringify(v3.DIAG) !== JSON.stringify(DIAG)) {
  fail("DIAG embutido difere do que o validador produz agora — rode com --write");
}

/* ---- 2 e 3. embaralhar: mesmo veredito, mesmos spans, mesmas posições ---- */
for (const [model, file] of KEYS) {
  const key = `${model}:${file}`;
  const ref = v3.layout(v3.canon(v3.declared(model, file, 0, 0))).tiles;
  let moved = 0, verdictDrift = 0, spanDrift = 0;
  for (const { s, dm, src, res } of results[key].runs) {
    const tiles = v3.layout(v3.canon(dm)).tiles;
    moved += v3.tilesMoved(ref, tiles).length;
    /* a página, com os diagnósticos embutidos, tem de reproduzir exatamente o
       que o validador emite sobre ESTA ordem: mesmos codes, mesmos spans */
    const page = v3.diagsFor(model, file, src).items;
    const got = res.diagnostics.map((d) => `${d.code}@${fmt(d.span)}`).sort().join();
    const mine = page.map((d) => `${d.code}@${fmt(d.span)}`).sort().join();
    if (got !== mine) {
      verdictDrift++;
      if (verdictDrift === 1) fail(`${key} #${s}: a página diverge do validador nesta ordem\n    validador ${got}\n    página    ${mine}`);
    }
    for (const d of res.diagnostics) if (!page.some((p) => p.code === d.code && spanEq(p.span, d.span))) spanDrift++;
  }
  if (moved) fail(`${key}: ${moved} posição(ões) de peça mudaram em ${N_SHUFFLE} embaralhamentos`);
  if (spanDrift) fail(`${key}: ${spanDrift} span(s) da página divergem do validador depois de embaralhar`);
  console.log(`[ordem] ${key}: ${N_SHUFFLE} embaralhamentos — peças movidas ${moved}, veredito diferente ${verdictDrift}, spans divergentes ${spanDrift}`);
}

/* ---- 4. a régua da v2 ---- */
const V2 = { one: { crossings: 13, overTile: 7 }, many: { crossings: 7, overTile: 7 } };
for (const model of ["one", "many"]) {
  const geo = v3.layout(v3.canon(v3.declared(model, "clean", 0, 0)));
  const m = v3.measure(geo);
  const base = V2[model];
  console.log(`[régua] ${model}: cruzamentos ${m.crossings} (v2 ${base.crossings}) · sobre peça alheia ${m.overTile} (v2 ${base.overTile})` +
    ` · portas disputadas ${m.congested} · aresta mais longa ${m.maxLen.toFixed(1)} células · maior desvio ${m.detour.toFixed(2)}× (${m.detourOf})`);
  if (m.detour > 2) fail(`${model}: ${m.detourOf} anda ${m.detour.toFixed(2)}× a distância reta (limite 2×)`);
  if (m.crossings * 2 > base.crossings) fail(`${model}: cruzamentos ${m.crossings} não caíram à metade de ${base.crossings}`);
  if (m.overTile * 2 > base.overTile) fail(`${model}: arestas sobre peça alheia ${m.overTile} não caíram à metade de ${base.overTile} — ${m.overList.join("; ")}`);
  if (m.congested) fail(`${model}: ${m.congested} porta(s) disputada(s)`);

  /* estabilidade: o que o conceito A tem de mostrar para não ser derrubado */
  v3.EXTRA[model].forEach((rel, i) => {
    const now = v3.layout(v3.canon(v3.declared(model, "clean", 0, i + 1))).tiles;
    const mv = v3.tilesMoved(geo.tiles, now);
    console.log(`[estabilidade] ${model}: + ${rel.l} ${rel.c} ${rel.r} → ${mv.length}/${Object.keys(now).length} peças mudaram` + (mv.length ? ` (${mv.join(", ")})` : ""));
  });

  /* ---- 5. composição (no arquivo com erros também: ele muda quais portas têm chip) ---- */
  for (const file of v3.BREAKS[model] ? ["clean", "broken"] : ["clean"]) {
  const geo = v3.layout(v3.canon(v3.declared(model, file, 0, 0)));
  const lab = v3.placeLabels(geo, { edges: true, tags: true, ctxLabels: true, subLabels: true, subSize: 13 });
  const hit = (a, b) => a[0] < b[0] + b[2] && b[0] < a[0] + a[2] && a[1] < b[1] + b[3] && b[1] < a[1] + a[3];
  const ids = Object.keys(geo.tiles).sort();
  const tileBox = (id, g = geo) => { const p = g.tiles[id]; return [p[0] - 28, p[1] - 24.2, 56, 48.4]; };
  const labs = Object.entries(lab.labels);
  const chips = [];
  geo.rels.forEach((E) => [E.L, E.Rr].forEach((en) => { if (en.chip) chips.push({ id: en.id, rk: E.rk, box: en.chip.box }); }));
  const problems = [];
  for (let i = 0; i < labs.length; i++) for (let j = i + 1; j < labs.length; j++)
    if (hit(labs[i][1].box, labs[j][1].box)) problems.push(`rótulo ${labs[i][0]} × rótulo ${labs[j][0]}`);
  for (const [id, L] of labs) for (const o of ids) if (o !== id && hit(L.box, tileBox(o))) problems.push(`rótulo ${id} × peça ${o}`);
  for (let i = 0; i < chips.length; i++) for (let j = i + 1; j < chips.length; j++)
    if (hit(chips[i].box, chips[j].box)) problems.push(`chip ${chips[i].rk}:${chips[i].id} × chip ${chips[j].rk}:${chips[j].id}`);
  for (const c of chips) for (const o of ids) if (o !== c.id && hit(c.box, tileBox(o))) problems.push(`chip ${c.rk}:${c.id} × peça ${o}`);
  /* chip × toco de saída de outra porta (achado de captura: a seta vizinha tampava o F de [CF]) */
  const segHitsBox = (a, b, box) => {
    const [x0, y0, x1, y1] = [box[0], box[1], box[0] + box[2], box[1] + box[3]];
    const inside = (p) => p[0] >= x0 && p[0] <= x1 && p[1] >= y0 && p[1] <= y1;
    if (inside(a) || inside(b)) return true;
    for (let t = 0; t <= 1; t += 0.05) if (inside([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t])) return true;
    return false;
  };
  geo.rels.forEach((E) => [E.L, E.Rr].forEach((en) => {
    for (const c of chips) if (!(c.rk === E.rk && c.id === en.id) && segHitsBox(en.P, en.Q, c.box)) problems.push(`chip ${c.rk}:${c.id} × toco ${E.rk}:${en.id}`);
  }));
  for (const [id, L] of labs) for (const c of chips) if (hit(L.box, c.box)) problems.push(`rótulo ${id} × chip ${c.rk}:${c.id}`);
  /* título de subdomínio: a fonte cresceu de 10 para 13px, e com ela o risco de cobrir peça ou chip */
  for (const sp of lab.subSpots) {
    for (const o of ids) if (hit(sp.box, tileBox(o))) problems.push(`título ${sp.id} × peça ${o}`);
    for (const c of chips) if (hit(sp.box, c.box)) problems.push(`título ${sp.id} × chip ${c.rk}:${c.id}`);
  }
  /* linha × chip de outra relação (achado de captura: Routes → Shipping cortava o ACL BBM de Warehouse) */
  geo.rels.forEach((E) => {
    for (let i = 0; i < E.path.length - 1; i++)
      for (const c of chips) if (c.rk !== E.rk && segHitsBox(E.path[i], E.path[i + 1], c.box)) problems.push(`linha ${E.rk} × chip ${c.rk}:${c.id}`);
  });
  /* na grade, duas arestas no mesmo trecho viram uma linha só */
  const segOf = (E) => { const o = []; for (let i = 0; i < E.cells.length - 1; i++) { const a = E.cells[i], b = E.cells[i + 1]; o.push(a < b ? a + ">" + b : b + ">" + a); } return o; };
  const seen = {};
  geo.rels.forEach((E) => segOf(E).forEach((k) => { (seen[k] = seen[k] || []).push(E.rk); }));
  for (const [k, list] of Object.entries(seen)) if (list.length > 1) problems.push(`trecho ${k} dividido por ${list.join(" e ")}`);
  const d2 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  for (const [id, L] of labs) {
    const bc = [L.box[0] + L.box[2] / 2, L.box[1] + L.box[3] / 2], own = d2(bc, geo.tiles[id]);
    const closer = ids.filter((o) => o !== id && d2(bc, geo.tiles[o]) < own);
    if (closer.length) problems.push(`rótulo ${id} mais perto de ${closer.join(", ")} do que da própria peça`);
  }
  /* selo de veredito sobre a aresta (achado de captura: ele tampava um chip) */
  for (const file of v3.BREAKS[model] ? ["broken"] : ["clean"]) {
    const dm = v3.declared(model, file, 0, 0), g2 = v3.layout(v3.canon(dm));
    const src = v3.sourceOf(dm, "today");
    Object.assign(v3.state, { model, file, view: "flow", tags: "on", labels: "ctx", sel: null, selSub: null, selDiag: null });
    v3.build(g2, v3.diagsFor(model, file, src).items, src);
    const obst = [];
    Object.keys(g2.tiles).forEach((id) => obst.push([`peça ${id}`, tileBox.call(null, id, g2)]));
    g2.rels.forEach((E) => [E.L, E.Rr].forEach((en) => { if (en.chip) obst.push([`chip ${E.rk}:${en.id}`, en.chip.box]); }));
    for (const b of g2.badges) {
      const box = [b.p[0] - 8.5, b.p[1] - 8.5, 17, 17];
      for (const [nm, o] of obst) if (hit(box, o)) problems.push(`selo ${b.rk} × ${nm}`);
    }
    console.log(`[selos] ${model}:${file}: ${g2.badges.length} selo(s) de aresta`);
  }
  console.log(`[composição] ${model}:${file}: ${problems.length ? problems.join("; ") : "sem colisões"}`);
  if (problems.length) fail(`${model}:${file}: ${problems.length} colisão(ões) de composição`);
  }
}

if (failures.length) {
  console.log("\nFALHOU:");
  failures.forEach((f) => console.log("  - " + f));
  process.exit(1);
}
console.log("\nok");
