#!/usr/bin/env node
/**
 * Um mapa de 50 contextos, desenhado e medido pela colmeia v4 — o instrumento do
 * fork 4 do README de design e do segundo sinal de reversão do ADR-0009: a colmeia
 * continua legível como vista de FLUXO num mapa do tamanho de uma empresa real, ou
 * a posição subordinada à hierarquia começa a esticar e cruzar as ligações?
 *
 *   node docs/design/pages/colmeia-50.build.mjs           mede e imprime
 *   node docs/design/pages/colmeia-50.build.mjs --write   mede e regrava colmeia-50.html
 *
 * O modelo mora em colmeia-50.model.mjs, onde também está por que ele é assim.
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
const outPath = path.join(here, "colmeia-50.html");
const WRITE = process.argv.includes("--write");

const core = await import(pathToFileURL(path.join(root, "packages/core/dist/index.js")).href);
const v4html = fs.readFileSync(v4Path, "utf8");
const scripts = [...v4html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
globalThis.__V3_HEADLESS = true;
new Function(scripts[scripts.length - 1][1])();
const v = globalThis.__v3;

/* ---------------- o modelo ---------------- */
/* em colmeia-50.model.mjs, porque o colmeia-navegacao.build.mjs lê o mesmo mapa */
const nCtx = MODEL.domains[0].subdomains.reduce((a, s) => a + s.contexts.length, 0) + MODEL.domains[0].external.length;

/* ---------------- veredito real ---------------- */
const cm = v.canon(MODEL);
const src = v.sourceOf(cm, "rich");
const verdict = core.parseAndValidate(src.text);
const byCode = {};
verdict.diagnostics.forEach((d) => { byCode[d.code] = (byCode[d.code] || 0) + 1; });

/* ---------------- layout, tempo e régua ---------------- */
let geo, ms = [];
for (let i = 0; i < 7; i++) { const t0 = performance.now(); geo = v.layout(v.canon(MODEL)); ms.push(performance.now() - t0); }
ms.sort((a, b) => a - b);
const layoutMs = ms[3];
const m = v.measure(geo);

/* composição: as mesmas colisões que o colmeia-v4.check.mjs reprova */
const lab = v.placeLabels(geo, { edges: true, tags: true, ctxLabels: true, subLabels: true, subSize: 13 });
const hit = (a, b) => a[0] < b[0] + b[2] && b[0] < a[0] + a[2] && a[1] < b[1] + b[3] && b[1] < a[1] + a[3];
const ids = Object.keys(geo.tiles).sort();
const tileBox = (id) => { const p = geo.tiles[id]; return [p[0] - 28, p[1] - 24.2, 56, 48.4]; };
const labs = Object.entries(lab.labels);
const chips = [];
geo.rels.forEach((E) => [E.L, E.Rr].forEach((en) => { if (en.chip) chips.push({ id: en.id, rk: E.rk, box: en.chip.box }); }));
const segHitsBox = (a, b, box) => {
  const [x0, y0, x1, y1] = [box[0], box[1], box[0] + box[2], box[1] + box[3]];
  const inside = (p) => p[0] >= x0 && p[0] <= x1 && p[1] >= y0 && p[1] <= y1;
  for (let t = 0; t <= 1; t += 0.05) if (inside([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t])) return true;
  return false;
};
const problems = [];
for (let i = 0; i < labs.length; i++) for (let j = i + 1; j < labs.length; j++)
  if (hit(labs[i][1].box, labs[j][1].box)) problems.push(`rótulo ${labs[i][0]} × rótulo ${labs[j][0]}`);
for (const [id, L] of labs) for (const o of ids) if (o !== id && hit(L.box, tileBox(o))) problems.push(`rótulo ${id} × peça ${o}`);
for (let i = 0; i < chips.length; i++) for (let j = i + 1; j < chips.length; j++)
  if (hit(chips[i].box, chips[j].box)) problems.push(`chip ${chips[i].rk}:${chips[i].id} × chip ${chips[j].rk}:${chips[j].id}`);
for (const c of chips) for (const o of ids) if (o !== c.id && hit(c.box, tileBox(o))) problems.push(`chip ${c.rk}:${c.id} × peça ${o}`);
geo.rels.forEach((E) => {
  for (let i = 0; i < E.path.length - 1; i++)
    for (const c of chips) if (c.rk !== E.rk && segHitsBox(E.path[i], E.path[i + 1], c.box)) problems.push(`linha ${E.rk} × chip ${c.rk}:${c.id}`);
});

/* comprimento das arestas, em células, e as que atravessam o mapa */
const C = 28, cellLen = (E) => { let L = 0; for (let i = 0; i < E.path.length - 1; i++) L += Math.hypot(E.path[i + 1][0] - E.path[i][0], E.path[i + 1][1] - E.path[i][1]); return L / (C * Math.sqrt(3)); };
const lens = geo.rels.map((E) => ({ rk: E.rk, L: cellLen(E) })).sort((a, b) => b.L - a.L);
const median = lens[Math.floor(lens.length / 2)].L;

/* ---------------- localidade no mapa grande ---------------- */
const groupOf = {}, members = {};
cm.domains[0].subdomains.forEach((sd) => { members[sd.id] = sd.ids.slice(); sd.ids.forEach((id) => (groupOf[id] = sd.id)); });
members.external = cm.domains[0].externalIds.slice(); members.external.forEach((id) => (groupOf[id] = "external"));
const at = (t, id) => (t[id] ? t[id].map((x) => x.toFixed(1)).join() : "∅");
const loc = { edits: 0, crossing: 0, bad: [] };
const fresh = () => JSON.parse(JSON.stringify(MODEL));
const listOf = (mm, k) => (k === "external" ? mm.domains[0].external : mm.domains[0].subdomains.find((s) => s.id === k).contexts);
for (const k of Object.keys(members)) {
  const n = members[k].length, mm = fresh();
  listOf(mm, k).push({ id: "Novo" });
  const t = v.layout(v.canon(mm)).tiles;
  loc.edits++;
  if (v.tierOf(n) !== v.tierOf(n + 1)) { loc.crossing++; continue; }
  const out = ids.filter((id) => at(geo.tiles, id) !== at(t, id) && groupOf[id] !== k);
  if (out.length) loc.bad.push(`+ Novo em ${k}: ${out.length} fora`);
}
MODEL.mapping.forEach((rel, i) => {
  const mm = fresh(); mm.mapping.splice(i, 1);
  const t = v.layout(v.canon(mm)).tiles;
  loc.edits++;
  const ok = new Set([...members[groupOf[rel.l]], ...members[groupOf[rel.r]]]);
  const out = ids.filter((id) => at(geo.tiles, id) !== at(t, id) && !ok.has(id));
  if (out.length) loc.bad.push(`− ${rel.l} ${rel.c} ${rel.r}: ${out.length} fora`);
});

/* ---------------- relatório ---------------- */
const vb = geo.viewBox ?? null;
const report = {
  contextos: nCtx, subdominios: cm.domains[0].subdomains.length, relacoes: MODEL.mapping.length,
  layoutMs: +layoutMs.toFixed(1), cruzamentos: m.crossings, sobrePecaAlheia: m.overTile, portasDisputadas: m.congested,
  maiorDesvio: +m.detour.toFixed(2), maiorDesvioDe: m.detourOf, arestaMaisLonga: +lens[0].L.toFixed(1), arestaMaisLongaDe: lens[0].rk,
  arestaMediana: +median.toFixed(1), colisoes: problems.length, diagnosticos: byCode,
  localidade: `${loc.edits} edições, ${loc.crossing} cruzam degrau, ${loc.bad.length} violam`,
};
console.log(JSON.stringify(report, null, 2));
if (problems.length) console.log("colisões:\n  " + problems.join("\n  "));
if (loc.bad.length) console.log("localidade:\n  " + loc.bad.join("\n  "));
console.log("5 arestas mais longas: " + lens.slice(0, 5).map((e) => `${e.rk} ${e.L.toFixed(1)}`).join(" · "));

if (!WRITE) process.exit(0);

/* ---------------- página ---------------- */
const svgOf = (view) => { Object.assign(v.state, { model: "one", view, file: "clean", tags: "on", labels: "ctx", sel: null, selSub: null, selDiag: null }); return v.build(geo, [], src); };
const flow = svgOf("flow"), contain = svgOf("contain");
const css = v4html.match(/<style>([\s\S]*?)<\/style>/)[1];
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const row = (k, val, note = "") => `<tr><td>${k}</td><td><b>${val}</b></td><td>${note}</td></tr>`;
const diagList = Object.entries(byCode).map(([c, n]) => `<code>${c}</code> ×${n}`).join(", ") || "nenhum";
const page = `<title>Colmeia 50</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap">
<style>${css}
.m50 .map{margin-top:14px}
.m50 .map svg{max-height:none}
.m50 table.rep{width:100%; border-collapse:collapse; font-size:13px; margin-top:8px}
.m50 table.rep td{padding:6px 6px; border-top:1px solid rgb(var(--c-border)); color:rgb(var(--c-dim)); vertical-align:top}
.m50 table.rep td b{color:rgb(var(--c-ink)); font-weight:600}
.m50 details{margin-top:14px}
.m50 pre.src{max-height:420px; overflow:auto; font-size:11px; background:rgb(var(--c-panel)); border:1px solid rgb(var(--c-border)); border-radius:12px; padding:12px}
</style>
<div class="wrap m50">
  <div class="eyebrow">Exploração · fork 4 · colmeia v4 · 2026-10-07</div>
  <h1>Colmeia 50</h1>
  <p class="lede">Um marketplace de varejo com <b>${nCtx} contextos</b>, ${report.subdominios} subdomínios e ${report.relacoes} relações, desenhado pela colmeia v4 sem nenhum ajuste. A pergunta é a do fork 4: a colmeia continua legível como vista de <b>fluxo</b> num mapa deste tamanho, ou a posição subordinada à hierarquia começa a esticar e cruzar as ligações? É também o segundo sinal de reversão do <code>ADR-0009</code>.</p>

  <div class="notes" style="margin-top:28px">
    <div class="note">
      <span class="tagpill novo">a régua</span>
      <h3>Os números, medidos pelo <code>colmeia-50.build.mjs</code></h3>
      <table class="rep">
        ${row("Layout", report.layoutMs + " ms", "mediana de 7 execuções em Node")}
        ${row("Cruzamentos", report.cruzamentos, "os modelos de 17 e 24 contextos dão 1 cada")}
        ${row("Aresta sobre peça alheia", report.sobrePecaAlheia)}
        ${row("Portas disputadas", report.portasDisputadas)}
        ${row("Maior desvio (rota ÷ reta)", report.maiorDesvio + "×", esc(report.maiorDesvioDe))}
        ${row("Aresta mais longa", report.arestaMaisLonga + " células", esc(report.arestaMaisLongaDe))}
        ${row("Aresta mediana", report.arestaMediana + " células")}
        ${row("Colisões de composição", report.colisoes, problems.slice(0, 6).map(esc).join("; "))}
        ${row("Localidade", esc(report.localidade), "+1 contexto em cada território e −1 de cada relação")}
        ${row("Diagnósticos do @odds/core", verdict.diagnostics.length, diagList)}
      </table>
    </div>
  </div>

  <div class="notes">
    <div class="note">
      <span class="tagpill front">o que isto diz sobre o fork 4</span>
      <h3>A contenção escala; o fluxo, não</h3>
      <p>A <b>contenção</b> lê bem com 50 contextos: doze territórios distintos, os três tipos separados, o <code>external</code> fora do domínio. É a pergunta "como isto está organizado", e a colmeia responde.</p>
      <p>O <b>fluxo</b> desaba: ${report.cruzamentos} cruzamentos contra 1 nos modelos pequenos, arestas que contornam o mapa inteiro (a mais longa tem ${report.arestaMaisLonga} células) e ${report.colisoes} colisões entre linha e chip. A causa é a mesma premissa que faz a contenção funcionar: a posição é subordinada à hierarquia, então dois contextos que conversam muito mas moram em territórios opostos ficam longe, e a linha atravessa tudo no caminho.</p>
      <p><b>Não é custo do arranjo fixo do <code>ADR-0010</code>.</b> A colmeia v3, que virava os territórios para os parceiros, dá 125 cruzamentos no mesmo modelo. É da geografia.</p>
      <p>E o layout leva ${report.layoutMs.toFixed(0)} ms. Na primeira medição eram 2,4 s, dos quais ~70% no roteamento A* das arestas (<code>gridRoute</code>): a cada passo, ele testava o segmento contra todos os chips do mapa e andava por estados em string. Com o teste memorizado por passo e o A* em inteiros (2026-10-10), o tempo caiu umas quinze vezes e a geometria saiu idêntica, conferida em 29 modelos. A estimativa do ADR-0009, de folga até ~50 contextos, volta a valer.</p>
    </div>
  </div>

  <h3 style="margin-top:36px">Fluxo</h3>
  <div class="map">${flow}</div>
  <h3 style="margin-top:36px">Contenção</h3>
  <div class="map">${contain}</div>
  <details><summary>A fonte <code>${MODEL.file}</code></summary><pre class="src">${esc(src.text)}</pre></details>
</div>
`;
fs.writeFileSync(outPath, page);
console.log(`gravado ${path.relative(root, outPath)} · ${(Buffer.byteLength(page) / 1024).toFixed(0)} KB`);
