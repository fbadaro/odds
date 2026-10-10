#!/usr/bin/env node
/**
 * O instrumento da rodada de navegação, que é condição do ADR-0011: o marketplace de
 * 50 contextos do colmeia-50, agora com zoom e pan, clique que acende e enquadra, e
 * tags que só aparecem quando há zoom para lê-las. A pergunta é o sinal de reversão
 * daquele ADR: com essas ferramentas, um arquiteto responde "como isto se integra?"
 * num mapa deste tamanho? Quem responde é uma pessoa, pelo protocolo da página; este
 * script só garante que o instrumento não mente.
 *
 *   node docs/design/pages/colmeia-navegacao.build.mjs           confere e imprime
 *   node docs/design/pages/colmeia-navegacao.build.mjs --write   confere e regrava colmeia-navegacao.html
 *
 * O layout roda UMA vez, aqui. As duas vistas saem do mesmo `geo` como SVG pronto, e a
 * página não carrega core nem layout: navegar é mexer no viewBox (a câmera) e em
 * classes (a seleção). Nenhuma coordenada de peça é tocada depois do build, e a
 * checagem 3 abaixo confere isso no script da página em vez de prometer.
 *
 * Exige o core compilado (`npm run typecheck`).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { MODEL } from "./colmeia-50.model.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");
const v4Path = path.join(here, "colmeia-v4.html");
const outPath = path.join(here, "colmeia-navegacao.html");
const WRITE = process.argv.includes("--write");

const core = await import(pathToFileURL(path.join(root, "packages/core/dist/index.js")).href);
const v4html = fs.readFileSync(v4Path, "utf8");
const scripts = [...v4html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
globalThis.__V3_HEADLESS = true;
new Function(scripts[scripts.length - 1][1])();
const v = globalThis.__v3;

/* ---------------- modelo, veredito e layout ---------------- */
const cm = v.canon(MODEL);
const src = v.sourceOf(cm, "rich");
const verdict = core.parseAndValidate(src.text);
if (verdict.diagnostics.length) throw new Error(`o marketplace deveria estar limpo: ${verdict.diagnostics.map((d) => d.code).join(", ")}`);
const t0 = performance.now();
const geo = v.layout(cm);
const layoutMs = performance.now() - t0;

/* O arquivo com erros: três erros plantados SÓ nas tags, para o grafo, e portanto o
   layout, ficarem idênticos ao do arquivo limpo (a checagem 2b confere). Cada um é
   `error` da fase 4, e é isso que faz da relação uma relação inválida. */
const PLANTED = [
  { l: "Search", r: "Catalog", set: { lt: ["OHS"] }, code: "UPSTREAM_ONLY_TAG_MISPLACED" },
  { l: "Shipping", r: "Inventory", set: { rt: [] }, code: "INCOMPLETE_MUTUAL_TAG" },
  { l: "Warehouse", r: "ERPLegado", set: { lt: ["BBM", "ACL"] }, code: "SEPARATION_CONFLICT" },
];
const BROKEN = JSON.parse(JSON.stringify(MODEL));
BROKEN.file = "marketplace-com-erros.odds";
for (const b of PLANTED) {
  const rel = BROKEN.mapping.find((x) => x.l === b.l && x.r === b.r);
  if (!rel) throw new Error(`relação plantada inexistente: ${b.l} ${b.r}`);
  Object.assign(rel, b.set);
}
const cmB = v.canon(BROKEN);
const srcB = v.sourceOf(cmB, "rich");
const verdictB = core.parseAndValidate(srcB.text);
const geoB = v.layout(cmB);
/* Do diagnóstico do core ao alvo no mapa: a âncora da v4 de mesmo span (é como o
   colmeia-v4.check.mjs liga os dois), e dela o alvo, com a chave da relação. */
const sameSpan = (a, b) => a.start.line === b.start.line && a.start.column === b.start.column && a.end.line === b.end.line && a.end.column === b.end.column;
const diagsB = verdictB.diagnostics.map((d) => {
  const anchor = Object.keys(srcB.anchors).filter((k) => sameSpan(srcB.anchors[k], d.span)).sort()[0];
  if (!anchor) throw new Error(`${d.code} sem âncora de mesmo span`);
  return { code: d.code, severity: d.severity, data: d.data, msg: "", anchor, span: d.span, target: v.targetOf(anchor, srcB), phase: v.PHASE[d.code] };
});
/* Relação inválida é a que tem diagnóstico `error`; warning e info não invalidam. */
const invalidOf = (diags) => new Set(diags.filter((d) => d.severity === "error" && d.target.rk).map((d) => d.target.rk));

/* Cada aresta ganha `data-flow`: o sentido do upstream para o downstream, relativo ao
   traçado do caminho, que é o sentido em que o tracejado da relação acesa corre. */
const near2 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const flowsOf = (g) => Object.fromEntries(g.rels.map((E) => {
  const r = E.rel, startsAtL = near2(E.path[0], g.tiles[r.l]) < near2(E.path[0], g.tiles[r.r]);
  const up = r.c === "<--" ? r.r : r.c === "-->" ? r.l : null;
  const dir = r.c === "-x-" ? "none" : r.c === "<->" ? "both" : (up === r.l) === startsAtL ? "fwd" : "rev";
  return [E.rk, { dir, up, start: startsAtL ? r.l : r.r }];
}));
const flowOf = flowsOf(geo);

const svgOf = (g, diags, source, view, file) => {
  Object.assign(v.state, { model: "one", view, file: "clean", tags: "on", labels: "ctx", sel: null, selSub: null, selDiag: null });
  let svg = v.build(g, diags, source);
  const box = g.viewBox.slice();
  /* Quatro SVGs no mesmo documento: ids de filtro repetidos fariam a vista escondida
     (display:none) emprestar filtro à visível, e no Chrome filtro dentro de SVG com
     display:none não pinta. Cada um fica com os seus. */
  const sfx = view[0] + file[0];
  svg = svg.replace(/id="(t?sh)"/g, `id="$1-${sfx}"`).replace(/url\(#(t?sh)\)/g, `url(#$1-${sfx})`);
  svg = svg.replace("<svg ", `<svg data-view="${view}" data-file="${file}" `);
  if (view === "flow") {
    const fl = flowsOf(g), bad = invalidOf(diags);
    svg = svg.replace(/<g class="rel" data-rk="([^"]+)">/g, (m, rk) =>
      `<g class="rel${bad.has(rk) ? " invalid" : ""}" data-rk="${rk}" data-flow="${fl[rk].dir}">`);
  }
  return { svg, box };
};
const SV = {
  flow: { clean: svgOf(geo, [], src, "flow", "clean"), broken: svgOf(geoB, diagsB, srcB, "flow", "broken") },
  contain: { clean: svgOf(geo, [], src, "contain", "clean"), broken: svgOf(geoB, diagsB, srcB, "contain", "broken") },
};
const flow = SV.flow.clean, contain = SV.contain.clean;

/* O enquadramento "mapa inteiro" é o do fluxo nas DUAS vistas: ele contém o da
   contenção (arestas e chips só alargam), e câmera igual é o que deixa a troca de
   vista sem mover nada na tela. */
const FIT = flow.box;
const HR = 28;

/* ---------------- o grafo, para a seleção e para as respostas ---------------- */
const ids = Object.keys(geo.tiles).sort();
const tiles = Object.fromEntries(ids.map((id) => [id, geo.tiles[id].map((x) => +x.toFixed(1))]));
const rels = geo.rels.map((E) => ({ rk: E.rk, l: E.rel.l, r: E.rel.r, c: E.rel.c, lt: E.rel.lt || [], rt: E.rel.rt || [] }));
const near = Object.fromEntries(ids.map((id) => [id, []]));
rels.forEach((r) => { near[r.l].push(r.r); near[r.r].push(r.l); });
Object.values(near).forEach((list) => list.sort());

const subOf = {}, subTitle = {};
cm.domains[0].subdomains.forEach((sd) => { subTitle[sd.id] = sd.title || sd.id; sd.ids.forEach((id) => (subOf[id] = sd.id)); });
cm.domains[0].externalIds.forEach((id) => (subOf[id] = "external"));
subTitle.external = "external";
/* Os territórios, para o foco em subdomínio: a chave é a mesma `data-sub` que a v4
   escreve no `g.sub` e em cada peça; as células são os centros do chão desenhado. */
const SUBS = {};
geo.islands.forEach((isl) => isl.masses.forEach((mass) => mass.groups.forEach((g) => {
  if (!g.cells.length) return;
  SUBS[isl.dom.id + "/" + g.sd.id] = {
    title: subTitle[g.sd.id] || g.sd.id, type: g.sd.type, ids: g.sd.ids.slice().sort(),
    cells: g.cells.map((c) => mass.pos[c[0] + "," + c[1]].map((x) => +x.toFixed(1))),
  };
})));
const subKeys = Object.keys(SUBS).sort();
/* A cor do mapa vem do tipo do subdomínio (pedido do autor, 2026-10-09): o build
   escreve `data-type` em peça, nome, território e rótulo, e o CSS escolhe o tom. */
const typeOfSub = Object.fromEntries(subKeys.map((k) => [k, SUBS[k].type]));
const typeOfCtx = {};
subKeys.forEach((k) => SUBS[k].ids.forEach((id) => (typeOfCtx[id] = SUBS[k].type)));
const typed = (svg) => svg
  .replace(/data-ctx="([^"]+)" data-sub="([^"]+)"/g, (m, c, k) => `${m} data-type="${typeOfSub[k]}"`)
  .replace(/(<g class="sub(?:lab)?[^"]*" data-sub="([^"]+)")/g, (m, head, k) => `${head} data-type="${typeOfSub[k]}"`)
  .replace(/<text class="cnm([^"]*)"([^>]*)>([^<]+)<\/text>/g, (m, cls, rest, name) => `<text class="cnm${cls}" data-type="${typeOfCtx[name]}"${rest}>${name}</text>`);
for (const view of ["flow", "contain"]) for (const file of ["clean", "broken"]) SV[view][file].svg = typed(SV[view][file].svg);

/* ---------------- o enquadramento: uma função, dois lugares ---------------- */
/* Roda na página (stringificada) e aqui, na checagem 1. `aspect` é largura÷altura do
   palco; `lim.pad` é a folga em unidades do SVG em volta dos centros das peças, que
   cobre o hexágono, o nome e a tag da porta; `lim.maxFrame` é o zoom máximo, relativo
   ao mapa inteiro, a que um clique pode levar — uma peça com um vizinho só não deve
   encher a tela. `pts` são centros: das peças (contexto e vizinhos) ou das células
   do chão (subdomínio). */
function frameOf(pts, fit, aspect, lim) {
  var xs = pts.map(function (p) { return p[0]; }), ys = pts.map(function (p) { return p[1]; });
  var x0 = Math.min.apply(null, xs) - lim.pad, x1 = Math.max.apply(null, xs) + lim.pad;
  var y0 = Math.min.apply(null, ys) - lim.pad, y1 = Math.max.apply(null, ys) + lim.pad;
  var cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, w = x1 - x0, h = y1 - y0;
  if (w / h < aspect) w = h * aspect; else h = w / aspect;
  var fitW = Math.max(fit[2], fit[3] * aspect);
  var minW = fitW / lim.maxFrame;
  if (w < minW) { w = minW; h = w / aspect; }
  if (w > fitW) { w = fitW; h = w / aspect; }
  return [cx - w / 2, cy - h / 2, w, h];
}
const LIM = { pad: 78, maxFrame: 3, maxZoom: 5, tagPx: 1.15 };

/* ---------------- checagens ---------------- */
const fails = [];
/* 1. todo clique enquadra a peça e todos os vizinhos, e todo subdomínio o próprio
   território inteiro, em qualquer proporção de palco */
const contains = (f, p, m) => p[0] - m >= f[0] - 0.01 && p[0] + m <= f[0] + f[2] + 0.01 && p[1] - m >= f[1] - 0.01 && p[1] + m <= f[1] + f[3] + 0.01;
let framed = 0;
for (const aspect of [0.6, 1, 1.5, 2.2]) for (const id of ids) {
  const f = frameOf([id, ...near[id]].map((o) => tiles[o]), FIT, aspect, LIM);
  framed++;
  for (const o of [id, ...near[id]]) if (!contains(f, tiles[o], HR)) fails.push(`enquadrar ${id} (aspecto ${aspect}) deixa ${o} fora`);
  if (Math.abs(f[2] / f[3] - aspect) > 1e-6) fails.push(`enquadrar ${id} distorce a proporção`);
}
let framedSubs = 0;
for (const aspect of [0.6, 1, 1.5, 2.2]) for (const k of subKeys) {
  const f = frameOf(SUBS[k].cells, FIT, aspect, LIM);
  framedSubs++;
  if (SUBS[k].cells.some((p) => !contains(f, p, HR))) fails.push(`enquadrar o subdomínio ${k} (aspecto ${aspect}) corta o território`);
}
/* 1b. todo território tem o seu g.sub nas duas vistas, e toda peça a chave do seu */
for (const k of subKeys) for (const [name, svg] of [["fluxo", flow.svg], ["contenção", contain.svg]])
  if (!svg.includes(`<g class="sub" data-sub="${k}"`)) fails.push(`${name} sem território clicável para ${k}`);
const nodeSub = Object.fromEntries([...flow.svg.matchAll(/<g class="node[^"]*" data-ctx="([^"]+)" data-sub="([^"]+)"/g)].map((m) => [m[1], m[2]]));
for (const k of subKeys) for (const id of SUBS[k].ids) if (nodeSub[id] !== k) fails.push(`${id} não traz data-sub="${k}"`);
/* 1c. toda aresta tem sentido, e o sentido aponta do upstream para o downstream:
   "fwd" exige que o caminho comece no upstream, "rev" que comece no downstream */
const flows = Object.fromEntries([...flow.svg.matchAll(/data-rk="([^"]+)" data-flow="([a-z]+)"/g)].map((m) => [m[1], m[2]]));
for (const r of rels) {
  const f = flowOf[r.rk];
  if (flows[r.rk] !== f.dir) fails.push(`aresta ${r.rk} sem data-flow`);
  if (f.dir === "fwd" && f.start !== f.up) fails.push(`aresta ${r.rk}: fwd, mas o caminho não começa no upstream`);
  if (f.dir === "rev" && f.start === f.up) fails.push(`aresta ${r.rk}: rev, mas o caminho começa no upstream`);
}
/* 1d. o arquivo com erros dá exatamente os três erros plantados, e exatamente as três
   relações deles saem marcadas como inválidas; no limpo, nenhuma */
const rkOf = (a, b) => [a, b].sort().join("|");
const gotCodes = verdictB.diagnostics.map((d) => d.code).sort().join(", ");
const wantCodes = PLANTED.map((b) => b.code).sort().join(", ");
if (gotCodes !== wantCodes) fails.push(`arquivo com erros dá [${gotCodes}], esperado [${wantCodes}]`);
const marked = (svg) => [...svg.matchAll(/<g class="rel invalid" data-rk="([^"]+)"/g)].map((m) => m[1]).sort().join(", ");
const wantInvalid = PLANTED.map((b) => rkOf(b.l, b.r)).sort().join(", ");
if (marked(SV.flow.broken.svg) !== wantInvalid) fails.push(`inválidas marcadas [${marked(SV.flow.broken.svg)}], esperadas [${wantInvalid}]`);
if (marked(SV.flow.clean.svg)) fails.push(`o arquivo limpo marca relação inválida: ${marked(SV.flow.clean.svg)}`);

/* 1e. toda peça, nome e território tem tipo, nos quatro desenhos */
for (const view of ["flow", "contain"]) for (const file of ["clean", "broken"]) {
  const svg = SV[view][file].svg;
  const n = (re) => (svg.match(re) || []).length;
  if (n(/<g class="node[^"]*" data-ctx="[^"]+" data-sub="[^"]+" data-type="(core|supporting|generic|external)"/g) !== ids.length) fails.push(`${view}/${file}: peça sem tipo`);
  if (n(/<text class="cnm[^"]*" data-type="(core|supporting|generic|external)"/g) !== ids.length) fails.push(`${view}/${file}: nome sem tipo`);
  if (n(/<g class="sub" data-sub="[^"]+" data-type="(core|supporting|generic|external)"/g) !== subKeys.length) fails.push(`${view}/${file}: território sem tipo`);
}

/* 2. trocar de vista move 0 peças: o mesmo hexágono, no mesmo lugar, nas duas */
const hexes = (svg) => Object.fromEntries([...svg.matchAll(/data-ctx="([^"]+)"[^>]*>\s*<path class="tile [^"]*" d="([^"]+)"/g)].map((m) => [m[1], m[2]]));
const hf = hexes(flow.svg), hc = hexes(contain.svg);
if (Object.keys(hf).length !== ids.length) fails.push(`fluxo desenha ${Object.keys(hf).length} peças, o modelo tem ${ids.length}`);
const movedOnSwap = ids.filter((id) => hf[id] !== hc[id]);
if (movedOnSwap.length) fails.push(`trocar de vista move ${movedOnSwap.length} peças: ${movedOnSwap.slice(0, 5).join(", ")}`);
/* 2b. trocar de arquivo também: os erros plantados só mexem em tags */
const hb = hexes(SV.flow.broken.svg), hcb = hexes(SV.contain.broken.svg);
const movedOnFile = ids.filter((id) => hf[id] !== hb[id] || hc[id] !== hcb[id]);
if (movedOnFile.length) fails.push(`trocar de arquivo move ${movedOnFile.length} peças: ${movedOnFile.slice(0, 5).join(", ")}`);
/* 3. o script da página nunca toca geometria: só viewBox e classes. Confere-se no
   texto do script, depois de montado, mais abaixo. */
const GEOMETRY = /setAttribute\(\s*['"](d|x|y|cx|cy|transform|points)['"]|\.style\.transform|\.innerHTML\s*=/;
/* 4. todo nome de contexto tem rótulo, senão a seleção não consegue apagá-lo */
const labelled = new Set([...flow.svg.matchAll(/<text class="cnm[^"]*"[^>]*>([^<]+)<\/text>/g)].map((m) => m[1]));
const unlabelled = ids.filter((id) => !labelled.has(id));
if (unlabelled.length) fails.push(`sem rótulo: ${unlabelled.join(", ")}`);
/* 5. toda relação do modelo virou um grupo de aresta com a chave que a página usa */
const rks = new Set([...flow.svg.matchAll(/<g class="rel[^"]*" data-rk="([^"]+)"/g)].map((m) => m[1]));
const missing = rels.filter((r) => !rks.has(r.rk));
if (missing.length) fails.push(`aresta sem grupo: ${missing.map((r) => r.rk).join(", ")}`);

/* ---------------- as perguntas do protocolo, e as respostas tiradas do modelo ---------------- */
/* `c` é sempre relativo à linha como escrita: `l <-- r` diz que r é upstream de l */
const upOf = (r) => (r.c === "<--" ? r.r : r.c === "-->" ? r.l : null);
const downOf = (r) => (r.c === "<--" ? r.l : r.c === "-->" ? r.r : null);
const isExt = (id) => subOf[id] === "external";
const list = (xs) => xs.map((x) => `<code>${x}</code>`).join(", ");
const consumes = (id) => rels.filter((r) => downOf(r) === id).map(upOf).sort();
const consumers = (id) => rels.filter((r) => upOf(r) === id).map(downOf).sort();
function shortest(a, b) {
  const prev = { [a]: null }, q = [a];
  while (q.length) { const x = q.shift(); if (x === b) break; for (const y of near[x]) if (!(y in prev)) { prev[y] = x; q.push(y); } }
  const out = []; for (let x = b; x != null; x = prev[x]) out.unshift(x);
  return out;
}
const extPairs = rels.filter((r) => isExt(r.l) !== isExt(r.r)).map((r) => (isExt(r.l) ? [r.r, r.l] : [r.l, r.r])).sort((a, b) => a[0].localeCompare(b[0]));
const sk = rels.filter((r) => r.lt.includes("SK")), sw = rels.filter((r) => r.c === "-x-");
const payTouch = {};
rels.forEach((r) => {
  const [a, b] = [subOf[r.l], subOf[r.r]];
  if (a === b) return;
  if (a === "Payments") payTouch[b] = (payTouch[b] || 0) + 1;
  if (b === "Payments") payTouch[a] = (payTouch[a] || 0) + 1;
});
const path1 = shortest("Reviews", "SellerPayouts");
const QUESTIONS = [
  { q: "De quem o <code>Checkout</code> depende? Ou seja, de quais contextos ele é downstream?",
    a: `${list(consumes("Checkout"))}.`, tests: "marcação: as relações acesas de uma peça central" },
  { q: "Se o <code>PaymentGateway</code> mudar o contrato, quem é afetado diretamente?",
    a: `${list(consumers("PaymentGateway"))}.`, tests: "marcação + direção da seta, numa peça genérica com vizinhos espalhados" },
  { q: "Quais contextos falam com algum sistema <code>external</code>, e com qual?",
    a: extPairs.map(([a, b]) => `<code>${a}</code> → <code>${b}</code>`).join(" · ") + ".", tests: "varredura: a contenção acha o bloco, o fluxo acha as ligações" },
  { q: "Qual é o caminho mais curto entre <code>Reviews</code> e <code>SellerPayouts</code>, ignorando a direção?",
    a: `${path1.length - 1} passos: ${path1.map((x) => `<code>${x}</code>`).join(" — ")}. Outro caminho do mesmo tamanho também vale.`, tests: "andar de vizinho em vizinho, o caso que o clique-que-enquadra existe para servir" },
  { q: "Que relação é <i>Shared Kernel</i>, e qual é <i>Separate Ways</i>?",
    a: `Shared Kernel: ${sk.map((r) => `<code>${r.l} &lt;-&gt; ${r.r}</code>`).join(", ")}. Separate Ways: ${sw.map((r) => `<code>${r.l} -x- ${r.r}</code>`).join(", ")}.`, tests: "ler tag: só aparece com zoom ou com a relação acesa" },
  { q: "Quais subdomínios conversam com <b>Pagamentos</b>, e qual deles mais?",
    a: Object.entries(payTouch).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([s, n]) => `${subTitle[s]} (${n})`).join(", ") + ".", tests: "o mapa como mapa: território contra território" },
];
const exactAnswerBits = { checkout: consumes("Checkout"), payment: consumers("PaymentGateway"), path: path1 };

/* ---------------- relatório ---------------- */
const report = {
  contextos: ids.length, relacoes: rels.length, layoutMs: +layoutMs.toFixed(0),
  enquadramentos: `${framed} de contexto (4 proporções × ${ids.length} peças) e ${framedSubs} de subdomínio (4 × ${subKeys.length})`,
  trocaDeVista: `${movedOnSwap.length} peças movidas`,
  trocaDeArquivo: `${movedOnFile.length} peças movidas`,
  invalidas: wantInvalid,
  respostas: exactAnswerBits,
};
console.log(JSON.stringify(report, null, 2));

/* ---------------- página ---------------- */
const css = v4html.match(/<style>([\s\S]*?)<\/style>/)[1];
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const DATA = { tiles, near, subs: SUBS, rels: rels.map((r) => [r.rk, r.l, r.r]), fit: FIT, lim: LIM };

const pageScript = `
(function(){
var D = ${JSON.stringify(DATA)};
${frameOf.toString()}
var stage = document.getElementById('stage');
/* quatro SVGs: duas vistas × dois arquivos, sempre com a mesma câmera */
var all = stage.querySelectorAll('svg'), flows = stage.querySelectorAll('svg[data-view="flow"]');
var view = 'flow', file = 'clean';
function each(list, fn){ Array.prototype.forEach.call(list, fn); }
var cam = null, sel = null, anim = null;
var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function aspect(){ return Math.max(stage.clientWidth, 1) / Math.max(stage.clientHeight, 1); }
function fitCam(){
  var a = aspect(), f = D.fit, w = Math.max(f[2], f[3] * a), h = w / a;
  return [f[0] + f[2] / 2 - w / 2, f[1] + f[3] / 2 - h / 2, w, h];
}
function fitW(){ return fitCam()[2]; }
function pxPerUnit(c){ return stage.clientWidth / c[2]; }
function clampCam(c){
  var a = aspect(), w = Math.min(Math.max(c[2], fitW() / D.lim.maxZoom), fitW() * 1.4), h = w / a;
  var cx = c[0] + c[2] / 2, cy = c[1] + c[3] / 2, f = fitCam();
  /* o centro nunca sai do mapa: dá para olhar a borda, não para se perder no vazio */
  cx = Math.min(Math.max(cx, f[0]), f[0] + f[2]); cy = Math.min(Math.max(cy, f[1]), f[1] + f[3]);
  return [cx - w / 2, cy - h / 2, w, h];
}
function apply(c){
  cam = c;
  var vb = c.map(function(x){ return x.toFixed(2); }).join(' ');
  each(all, function(svg){ svg.setAttribute('viewBox', vb); });
  var far = pxPerUnit(c) < D.lim.tagPx;
  each(flows, function(svg){ svg.classList.toggle('far', far); });
  document.getElementById('zoomOut').textContent = Math.round(fitW() / c[2] * 100) + '%';
}
function ease(t){ return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
function go(target, ms){
  target = clampCam(target);
  if (anim) cancelAnimationFrame(anim), anim = null;
  if (reduce || !ms) return apply(target);
  var from = cam.slice(), t0 = performance.now();
  (function step(now){
    var t = Math.min(1, (now - t0) / ms), k = ease(t);
    apply(from.map(function(x, i){ return x + (target[i] - x) * k; }));
    if (t < 1) anim = requestAnimationFrame(step); else anim = null;
  })(t0);
}
/* zoom em torno de um ponto do palco: o ponto sob o cursor fica onde está */
function zoomAt(factor, px, py){
  var c = cam, w = c[2] / factor;
  w = Math.min(Math.max(w, fitW() / D.lim.maxZoom), fitW() * 1.4);
  var k = w / c[2], ux = c[0] + px / stage.clientWidth * c[2], uy = c[1] + py / stage.clientHeight * c[3];
  go([ux - (ux - c[0]) * k, uy - (uy - c[1]) * k, w, w / aspect()], 0);
}
function pan(dxPx, dyPx){
  var s = cam[2] / stage.clientWidth;
  go([cam[0] - dxPx * s, cam[1] - dyPx * s, cam[2], cam[3]], 0);
}

/* ---- seleção: os dois gestos da v4, feitos com classes ----
   'sel' é um contexto ({ctx}) ou um subdomínio ({sub}), nunca os dois; 'hov' é o
   território sob o mouse. paint() deriva toda classe dos dois, então o hover nunca
   desfaz o que a seleção acendeu. */
var hov = null, ctxSub = {};
Object.keys(D.subs).forEach(function(k){ D.subs[k].ids.forEach(function(id){ ctxSub[id] = k; }); });
function paint(){
  var cid = sel && sel.ctx, sk = sel && sel.sub, near = {}, inSub = {};
  if (cid) { near[cid] = 1; D.near[cid].forEach(function(n){ near[n] = 1; }); }
  if (sk) D.subs[sk].ids.forEach(function(id){ inSub[id] = 1; });
  function faded(c){ return cid ? !near[c] : sk ? !inSub[c] : false; }
  function hotSub(k){ return k === sk || k === hov; }
  /* o território de casa do contexto selecionado acende junto (pedido do autor,
     2026-10-09): o contorno e o nome, não as peças, que seguem a regra da vizinhança */
  var home = cid ? ctxSub[cid] : null;
  each(all, function(svg){
    Array.prototype.forEach.call(svg.querySelectorAll('g.node'), function(g){
      var c = g.getAttribute('data-ctx');
      g.classList.toggle('on', c === cid); g.classList.toggle('fade', faded(c));
      g.classList.toggle('subhot', hotSub(g.getAttribute('data-sub')));
    });
    Array.prototype.forEach.call(svg.querySelectorAll('text.cnm'), function(t){
      var c = t.textContent;
      t.classList.toggle('on', c === cid); t.classList.toggle('fade', faded(c));
    });
    Array.prototype.forEach.call(svg.querySelectorAll('g.sub'), function(g){
      var key = g.getAttribute('data-sub');
      g.classList.toggle('hot', hotSub(key) || key === home); g.classList.toggle('on', key === sk || key === home);
    });
    Array.prototype.forEach.call(svg.querySelectorAll('g.sublab'), function(g){
      var key = g.getAttribute('data-sub');
      g.classList.toggle('subhot', hotSub(key) || key === home);
    });
  });
  each(flows, function(svg){ D.rels.forEach(function(r){
    var g = svg.querySelector('g.rel[data-rk="' + r[0] + '"]'); if (!g) return;
    /* só o contexto acende relações; o foco em subdomínio é sobre o território, e
       as linhas dele apagam junto com o resto (decisão do autor, 2026-10-09) */
    var lit = cid ? (r[1] === cid || r[2] === cid) : false;
    g.classList.toggle('lit', lit); g.classList.toggle('fade', !!sel && !lit);
  }); });
  var name = '', rest = 'Clique num contexto para acender as relações, ou num território para focar o subdomínio.';
  if (cid) { var n = D.near[cid].length; name = cid; rest = ' · ' + n + ' vizinho' + (n === 1 ? '' : 's') + ' · Esc limpa'; }
  if (sk) { var m = D.subs[sk].ids.length; name = D.subs[sk].title; rest = ' · subdomínio · ' + m + ' contexto' + (m === 1 ? '' : 's') + ' · Esc limpa'; }
  document.getElementById('selName').textContent = name;
  document.getElementById('selRest').textContent = rest;
}
function select(id, frame){
  sel = id ? { ctx: id } : null; paint();
  if (id && frame) go(frameOf([id].concat(D.near[id]).map(function(o){ return D.tiles[o]; }), D.fit, aspect(), D.lim), 420);
}
function selectSub(key, frame){
  sel = key ? { sub: key } : null; paint();
  if (key && frame) go(frameOf(D.subs[key].cells, D.fit, aspect(), D.lim), 420);
}
each(all, function(svg){
  Array.prototype.forEach.call(svg.querySelectorAll('g.sub'), function(g){
    var key = g.getAttribute('data-sub');
    g.addEventListener('mouseenter', function(){ hov = key; paint(); });
    g.addEventListener('mouseleave', function(){ if (hov === key) { hov = null; paint(); } });
  });
});

/* ---- ponteiro: arrastar no vazio move; clique sem arrasto seleciona ou limpa ---- */
var drag = null;
stage.addEventListener('pointerdown', function(ev){
  if (ev.button !== 0) return;
  drag = { x: ev.clientX, y: ev.clientY, moved: false, id: ev.pointerId };
});
stage.addEventListener('pointermove', function(ev){
  if (!drag || ev.pointerId !== drag.id) return;
  var dx = ev.clientX - drag.x, dy = ev.clientY - drag.y;
  if (!drag.moved && Math.hypot(dx, dy) < 4) return;
  if (!drag.moved) { drag.moved = true; stage.setPointerCapture(ev.pointerId); stage.classList.add('dragging'); }
  drag.x = ev.clientX; drag.y = ev.clientY; pan(dx, dy);
});
function endDrag(ev){
  if (!drag || ev.pointerId !== drag.id) return;
  var wasDrag = drag.moved; drag = null; stage.classList.remove('dragging');
  if (wasDrag || ev.type === 'pointercancel') return;
  var node = ev.target.closest && ev.target.closest('g.node');
  var sub = !node && ev.target.closest && ev.target.closest('g.sub');
  if (node) select(node.getAttribute('data-ctx'), true);
  else if (sub) { var key = sub.getAttribute('data-sub'); selectSub(sel && sel.sub === key ? null : key, true); }
  else if (sel) select(null);
}
stage.addEventListener('pointerup', endDrag);
stage.addEventListener('pointercancel', endDrag);
/* roda: pinça do trackpad (ctrlKey) e roda de mouse aproximam; arrasto de dois dedos
   no trackpad move. Roda de mouse é reconhecida por saltos inteiros e grandes. */
stage.addEventListener('wheel', function(ev){
  ev.preventDefault();
  var r = stage.getBoundingClientRect(), px = ev.clientX - r.left, py = ev.clientY - r.top;
  var mouse = ev.deltaMode !== 0 || (ev.deltaX === 0 && Math.abs(ev.deltaY) >= 40 && Number.isInteger(ev.deltaY));
  if (ev.ctrlKey || mouse) {
    var dy = ev.deltaMode === 1 ? ev.deltaY * 16 : ev.deltaY;
    zoomAt(Math.exp(-dy * (ev.ctrlKey ? 0.01 : 0.0022)), px, py);
  } else pan(-ev.deltaX, -ev.deltaY);
}, { passive: false });

/* ---- teclado: Tab chega nas peças (a v4 já as faz focáveis); o palco recebe o resto ---- */
stage.addEventListener('keydown', function(ev){
  var k = ev.key, step = 80;
  var node = ev.target.closest && ev.target.closest('g.node');
  if ((k === 'Enter' || k === ' ') && node) { ev.preventDefault(); select(node.getAttribute('data-ctx'), true); return; }
  if (k === 'Escape') { if (sel) select(null); return; }
  var cx = stage.clientWidth / 2, cy = stage.clientHeight / 2;
  if (k === '+' || k === '=') zoomAt(1.4, cx, cy);
  else if (k === '-' || k === '_') zoomAt(1 / 1.4, cx, cy);
  else if (k === '0') go(fitCam(), 380);
  else if (k === 'ArrowLeft') pan(step, 0);
  else if (k === 'ArrowRight') pan(-step, 0);
  else if (k === 'ArrowUp') pan(0, step);
  else if (k === 'ArrowDown') pan(0, -step);
  else return;
  ev.preventDefault();
});
document.getElementById('zIn').addEventListener('click', function(){ zoomAt(1.4, stage.clientWidth / 2, stage.clientHeight / 2); });
document.getElementById('zOutBtn').addEventListener('click', function(){ zoomAt(1 / 1.4, stage.clientWidth / 2, stage.clientHeight / 2); });
document.getElementById('zFit').addEventListener('click', function(){ go(fitCam(), 380); });

/* ---- vista e arquivo: trocam o SVG visível, nunca a câmera ---- */
function show(){
  /* toggleAttribute, não .hidden: a propriedade só existe em HTMLElement, e num
     SVGElement a atribuição vira um campo solto que não esconde nada */
  each(all, function(svg){
    svg.toggleAttribute('hidden', svg.getAttribute('data-view') !== view || svg.getAttribute('data-file') !== file);
  });
}
function seg(id, fn){
  var el = document.getElementById(id);
  el.addEventListener('click', function(ev){
    var b = ev.target.closest('button'); if (!b) return;
    each(el.querySelectorAll('button'), function(x){ x.setAttribute('aria-pressed', String(x === b)); });
    fn(b.getAttribute('data-v')); show();
  });
}
seg('segView', function(v){ view = v; });
seg('segFile', function(v){ file = v; });
seg('segTheme', function(v){ document.documentElement.setAttribute('data-theme', v); });

/* ---- tamanho do palco: mantém centro e escala ---- */
var lastW = stage.clientWidth;
new ResizeObserver(function(){
  if (!cam) return;
  var s = cam[2] / lastW, w = stage.clientWidth * s, h = w / aspect();
  lastW = stage.clientWidth;
  apply(clampCam([cam[0] + cam[2] / 2 - w / 2, cam[1] + cam[3] / 2 - h / 2, w, h]));
}).observe(stage);

apply(fitCam());
select(null);
globalThis.__nav = { select: select, selectSub: selectSub, go: go, fitCam: fitCam, zoomAt: zoomAt, get cam(){ return cam; } };
})();
`;
if (/<\/script/i.test(pageScript)) throw new Error("o script da página contém </script");
const geoHit = pageScript.match(GEOMETRY);
if (geoHit) fails.push(`o script da página toca geometria: ${geoHit[0]}`);

const qHtml = QUESTIONS.map((x, i) => `
      <li><p>${x.q}</p>
        <details><summary>conferir</summary><p>${x.a}</p><p class="tests">testa: ${x.tests}</p></details></li>`).join("");

const page = `<title>Colmeia navegação</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap">
<style>${css}
.nav .layout{display:grid; grid-template-columns:minmax(0,1fr) 320px; gap:16px; align-items:start}
@media (max-width:960px){ .nav .layout{grid-template-columns:1fr} }
.nav .bar{margin-top:22px}
.nav .bar .sep{flex:1 1 auto}
.nav #zoomOut{font-family:"JetBrains Mono",Menlo,monospace; font-size:11.5px; color:rgb(var(--c-dim)); min-width:44px; text-align:right}
.nav #selCap{font-size:12.5px; color:rgb(var(--c-dim))}
.nav #selCap b{color:rgb(var(--c-accent)); font-weight:600; font-family:"JetBrains Mono",Menlo,monospace}
.nav kbd{font-family:"JetBrains Mono",Menlo,monospace; font-size:10.5px; border:1px solid rgb(var(--c-border));
  border-bottom-width:2px; border-radius:5px; padding:0 5px; background:rgb(var(--c-panel2)); color:rgb(var(--c-ink))}
.nav .palco{position:relative; height:min(76vh,820px); min-height:420px; border:1px solid rgb(var(--c-border));
  border-radius:16px; background:rgb(var(--c-panel)); overflow:hidden; touch-action:none; cursor:grab; outline:none}
.nav .palco:focus-visible{box-shadow:0 0 0 2px rgb(var(--c-accent))}
.nav .palco.dragging{cursor:grabbing}
.nav .palco svg{display:block; width:100%; height:100%; max-height:none}
.nav .palco svg[hidden]{display:none}
/* Detalhe por zoom: longe demais para ler uma tag, ela só faz ruído. A relação acesa
   mostra as suas em qualquer zoom, porque é para ler aquela que se clicou. */
.nav svg.far g.rel:not(.lit) .port{display:none}
/* Cor por tipo de subdomínio (2026-10-09). O roxo sai do mapa e fica só na
   interface. Linha é cinza; acesa, quase tinta. Peça e território tomam o tom do
   próprio tipo, escurecido para ler como borda sobre o chão claro (e clareado no
   escuro). A inválida segue vermelha: é a única cor forte numa linha. */
:root{ --c-core-ink:176 120 0; --c-sup-ink:61 111 232; --c-gen-ink:84 82 102; --c-edge:128 125 146; --c-edge-lit:52 50 66; }
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){
  --c-core-ink:255 200 90; --c-sup-ink:125 163 255; --c-gen-ink:196 193 214; --c-edge:118 115 140; --c-edge-lit:222 220 234; } }
:root[data-theme="dark"]{ --c-core-ink:255 200 90; --c-sup-ink:125 163 255; --c-gen-ink:196 193 214; --c-edge:118 115 140; --c-edge-lit:222 220 234; }
.nav [data-type="core"]{--t:var(--c-core-ink)}
.nav [data-type="supporting"]{--t:var(--c-sup-ink)}
.nav [data-type="generic"], .nav [data-type="external"]{--t:var(--c-gen-ink)}
.nav .edge{stroke:rgb(var(--c-edge))}
.nav .head{fill:rgb(var(--c-edge))}
.nav g.rel.lit .edge{stroke:rgb(var(--c-edge-lit)); stroke-width:2}
.nav g.rel.lit .head{fill:rgb(var(--c-edge-lit))}
.nav .port:not([class*="sev-"]) rect{stroke:rgb(var(--c-edge) / .75)}
.nav .port:not([class*="sev-"]) text{fill:rgb(var(--c-ink) / .82)}
.nav g.node:hover .tile, .nav g.node.subhot .tile{stroke:rgb(var(--t))}
.nav g.node:focus-visible .tile, .nav g.node.on .tile{stroke:rgb(var(--t))}
.nav text.cnm.on{fill:rgb(var(--t))}
.nav g.sub.hot .subwash{fill:rgb(var(--t) / .12)}
.nav g.sub.hot .bsub{stroke:rgb(var(--t) / .85)}
.nav g.sub.on .subwash{fill:rgb(var(--t) / .10)}
.nav g.sub.on .bsub{stroke:rgb(var(--t))}
.nav g.sublab.subhot .snm{fill:rgb(var(--t))}
.nav g.rel.invalid.lit .head{fill:rgb(var(--c-error))}
/* Linha (ADR-0012). Em repouso, a relação válida é sólida. Acesa, vira tracejado
   correndo do upstream para o downstream; a mútua fica tracejada e parada, porque
   não tem sentido de dependência. A inválida (diagnóstico 'error') é tracejado
   vermelho e parado, SEMPRE, acesa ou não: é a marca do RULES-EN.md §5, e movimento
   ficou reservado para o que funciona. */
.nav g.rel.lit .edge:not(.sep){stroke-dasharray:7 5; animation:dash-run .7s linear infinite}
.nav g.rel.lit[data-flow="rev"] .edge{animation-direction:reverse}
.nav g.rel.lit[data-flow="both"] .edge{animation:none}
@keyframes dash-run{to{stroke-dashoffset:-12}}
.nav g.rel.invalid .edge, .nav g.rel.invalid.lit .edge{stroke:rgb(var(--c-error)); stroke-width:1.8;
  stroke-dasharray:6 4; animation:none}
.nav g.rel.invalid .head{fill:rgb(var(--c-error))}
@media (prefers-reduced-motion: reduce){ .nav g.rel .edge{animation:none !important} }
.nav .hint{position:absolute; left:12px; bottom:10px; font-size:11.5px; color:rgb(var(--c-dim));
  background:rgb(var(--c-panel) / .88); border:1px solid rgb(var(--c-border)); border-radius:10px; padding:5px 10px; pointer-events:none}
.nav .proto{border:1px solid rgb(var(--c-border)); border-radius:16px; background:rgb(var(--c-panel)); padding:18px 20px}
.nav .proto h3{font-size:15px; margin:8px 0 4px}
.nav .proto > p{font-size:13px; color:rgb(var(--c-dim)); margin:6px 0}
.nav .proto ol{padding-left:20px; margin:10px 0 0; font-size:13.5px}
.nav .proto li{margin:0 0 12px}
.nav .proto li > p{margin:0 0 4px; line-height:1.5}
.nav .proto details{font-size:12.5px; color:rgb(var(--c-dim))}
.nav .proto summary{cursor:pointer; color:rgb(var(--c-accent)); font-size:12px}
.nav .proto details p{margin:6px 0 0; line-height:1.5}
.nav .proto .tests{font-size:11.5px; font-style:italic}
.nav details.src{margin-top:28px}
.nav details.src pre{max-height:420px; overflow:auto; font-size:11px; background:rgb(var(--c-panel)); border:1px solid rgb(var(--c-border)); border-radius:12px; padding:12px}
</style>
<!-- tema claro por padrão (pedido do autor, 2026-10-09), fixado antes do primeiro
     desenho para não piscar escuro num sistema em modo escuro; o seletor troca -->
<script>document.documentElement.setAttribute('data-theme', 'light');</script>
<div class="wrap nav">
  <div class="eyebrow">Exploração · rodada de navegação · ADR-0011 · 2026-10-09</div>
  <h1>Colmeia navegação</h1>
  <p class="lede">O mesmo marketplace do <code>colmeia-50</code>, com <b>${ids.length} contextos</b> e ${rels.length} relações. Visto inteiro e parado, o fluxo dele é ilegível: 120 cruzamentos. O <code>ADR-0011</code> apostou que quem torna esse mapa utilizável são as ferramentas de navegação, e não o layout. Esta página põe quatro na mão: <b>zoom e pan</b>, <b>clique que acende e enquadra</b> um contexto, <b>foco num subdomínio</b> (o clique no território, como na v3 e na v4) e <b>tags que só aparecem quando há zoom para lê-las</b>. O layout é o da v4, calculado uma vez, no build. Navegar não move peça nenhuma.</p>

  <div class="bar">
    <div class="grp"><span class="lbl">Vista</span>
      <div class="seg" id="segView">
        <button data-v="flow" aria-pressed="true">fluxo</button>
        <button data-v="contain" aria-pressed="false">contenção</button>
      </div>
    </div>
    <div class="grp"><span class="lbl">Zoom</span>
      <button class="act" id="zOutBtn" aria-label="afastar">−</button>
      <button class="act" id="zIn" aria-label="aproximar">+</button>
      <button class="act" id="zFit">mapa inteiro</button>
      <span id="zoomOut">100%</span>
    </div>
    <div class="grp"><span class="lbl">Arquivo</span>
      <div class="seg" id="segFile">
        <button data-v="clean" aria-pressed="true">limpo</button>
        <button data-v="broken" aria-pressed="false">com erros</button>
      </div>
    </div>
    <div class="grp"><span class="lbl">Tema</span>
      <div class="seg" id="segTheme">
        <button data-v="light" aria-pressed="true">claro</button>
        <button data-v="dark" aria-pressed="false">escuro</button>
      </div>
    </div>
    <span class="sep"></span>
    <span id="selCap"><b id="selName"></b><span id="selRest"></span></span>
  </div>

  <div class="layout">
    <div class="palco" id="stage" tabindex="0" aria-label="Mapa de contextos navegável">
      ${SV.flow.clean.svg}
      ${SV.contain.clean.svg.replace("<svg ", "<svg hidden ")}
      ${SV.flow.broken.svg.replace("<svg ", "<svg hidden ")}
      ${SV.contain.broken.svg.replace("<svg ", "<svg hidden ")}
      <div class="hint">roda ou pinça: zoom · arrastar: mover · clique na peça: relações · no território: subdomínio · <kbd>0</kbd> mapa inteiro</div>
    </div>

    <aside class="proto">
      <span class="tagpill novo">protocolo</span>
      <h3>O teste é o sinal de reversão do ADR-0011</h3>
      <p>Responda navegando, <b>sem abrir a fonte</b>. Só depois abra "conferir". O que conta não é acertar: é se cada resposta saiu do mapa com esforço razoável, ou se foi preciso caçar.</p>
      <p>O ADR é reaberto se, com estas ferramentas, a pergunta "como isto se integra?" continuar sem resposta. Anote onde travou: é isso que decide se falta minimapa ou busca, que ficaram fora de propósito. O protocolo usa o arquivo <b>limpo</b>.</p>
      <ol>${qHtml}
      </ol>
    </aside>
  </div>

  <div class="notes">
    <div class="note">
      <span class="tagpill novo">o que esta página garante</span>
      <h3>Conferido pelo <code>colmeia-navegacao.build.mjs</code></h3>
      <ul>
        <li><b>Todo clique enquadra a peça e todos os vizinhos</b>: ${framed} enquadramentos, nas ${ids.length} peças e em quatro proporções de palco, da tela de celular à ultrawide.</li>
        <li><b>Todo clique num território enquadra o subdomínio inteiro</b>: ${framedSubs} enquadramentos, nos ${subKeys.length} territórios (o <code>external</code> incluído) e nas mesmas quatro proporções.</li>
        <li><b>Trocar de vista ou de arquivo move 0 peças</b>: o mesmo hexágono, no mesmo lugar, nos quatro desenhos, e a câmera não muda.</li>
        <li><b>Só as relações com erro saem vermelhas</b>: no arquivo com erros, exatamente as três plantadas; no limpo, nenhuma. Toda relação tem o sentido do tracejado conferido contra o upstream.</li>
        <li><b>O script da página não toca geometria</b>: só escreve o <code>viewBox</code> (a câmera) e classes (a seleção).</li>
        <li><b>As respostas do protocolo saem do modelo</b>, calculadas no build, não escritas à mão.</li>
      </ul>
    </div>
    <div class="note">
      <span class="tagpill novo">ADR-0012</span>
      <h3>Movimento para o que funciona, vermelho parado para o que não</h3>
      <p><b>Relação válida:</b> sólida em repouso. Ao clicar num contexto, as relações dele viram <b>tracejado em movimento</b>, do upstream para o downstream, o sentido da dependência. A mútua (<code>&lt;-&gt;</code>) fica tracejada e parada. A <i>Separate Ways</i> nunca se move.</p>
      <p><b>Relação inválida:</b> <b>tracejado vermelho e parado, sempre</b>, acesa ou não. É a marca que o <code>RULES-EN.md</code> §5 já pedia. Inválida é a relação com diagnóstico <code>error</code>. <code>warning</code> e <code>info</code> não invalidam: a relação anima, e a severidade fica no chip da porta.</p>
      <p><b>Arquivo → com erros</b> planta três erros só nas tags, então nenhuma peça se move: <code>[OHS]</code> do lado downstream em <code>Search &lt;-- Catalog</code>, <code>[SK]</code> de um lado só em <code>Shipping &lt;-&gt; Inventory</code> e <code>[ACL]</code> na separação <code>Warehouse -x- ERPLegado</code>. Os diagnósticos são do <code>@odds/core</code> real.</p>
      <p>Também foi comparado um pulso de luz sobre linha sólida. Ficou o tracejado por decisão do autor, em 2026-10-09.</p>
    </div>
    <div class="note">
      <span class="tagpill front">fora desta rodada</span>
      <h3>Entra só se o teste pedir</h3>
      <p><b>Minimapa</b> e <b>busca por nome</b>. Cada um é resposta a um travamento específico. Construir os dois antes do teste seria responder sem a pergunta.</p>
      <p><b>O foco num subdomínio saiu desta lista e entrou na página</b> em 2026-10-09, a pedido do autor, antes do teste. Por isso o teste já não mede se ele faz falta: mede se as quatro ferramentas bastam.</p>
      <p><b>A ficha da v4</b> também ficou de fora: ela lista as relações em texto, e o teste perderia o objeto. Ele mede se o <b>mapa</b> responde, não se uma lista responde.</p>
    </div>
  </div>

  <details class="src"><summary>A fonte <code>${MODEL.file}</code>. Não abra durante o teste</summary><pre>${esc(src.text)}</pre></details>
</div>
<script>${pageScript}</script>
`;

if (fails.length) { console.error("falhas:\n  " + fails.join("\n  ")); process.exit(1); }
console.log("checagens: ok");
if (!WRITE) process.exit(0);
fs.writeFileSync(outPath, page);
console.log(`gravado ${path.relative(root, outPath)} · ${(Buffer.byteLength(page) / 1024).toFixed(0)} KB`);
