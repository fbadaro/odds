/**
 * Oraculo de teste: o adaptador da bancada, copiado de docs/design/pages/playground.html
 * (script principal, linhas ~4451-4625) em 2026-10-21. Nao e codigo de producao.
 *
 * Copiado textualmente; as unicas edicoes, para trocar dependencias de modulo por
 * parametros explicitos:
 *   1. `v3` (globalThis.__v3) nao e mais global do modulo: navOf(geo, v3) e
 *      decorate(svg, nav, lastDiags, v3) o recebem.
 *   2. `lastDiags` (let de modulo) vira parametro de decorate.
 *   3. `lastType` (Map de modulo) e `MODELS[modelKey].file` viram parametros de
 *      toModel(ast, lastType, file).
 *   4. Linhas `export` acrescentadas ao fim; `const` de modulo mantidos.
 * Nada mais mudou; a logica e identica.
 */
const TYPES = ["core", "supporting", "generic"];
const TAG_ORDER = ["OHS", "PL", "S", "ACL", "CF", "C", "SK", "P", "BBM"];
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const pairKey = (a, b) => (a < b ? a + "|" + b : b + "|" + a);

function toModel(ast, lastType, file) {
  const domains = [], rels = [], ctxSeen = new Set(), domSeen = new Set();
  for (const d of ast.domains) {
    if (domSeen.has(d.name)) continue;
    domSeen.add(d.name);
    const subs = [], subSeen = new Set();
    for (const sd of d.subdomains) {
      if (subSeen.has(sd.name)) continue;
      subSeen.add(sd.name);
      const key = d.name + "/" + sd.name;
      let type = sd.subdomainType;
      if (TYPES.includes(type)) lastType.set(key, type); else type = lastType.get(key) || "generic";
      const contexts = [];
      for (const c of sd.contexts) if (!ctxSeen.has(c.name)) { ctxSeen.add(c.name); contexts.push({ id: c.name }); }
      subs.push({ id: sd.name, type, title: sd.title, contexts });
    }
    const external = [];
    for (const c of d.external?.contexts ?? []) if (!ctxSeen.has(c.name)) { ctxSeen.add(c.name); external.push({ id: c.name }); }
    for (const r of d.mapping?.relationships ?? []) rels.push(r);
    if (!subs.length && !external.length) continue;
    domains.push({ id: d.name, title: d.title, subdomains: subs, external });
  }
  const drawn = new Set();
  domains.forEach((d) => { d.subdomains.forEach((s) => s.contexts.forEach((c) => drawn.add(c.id))); d.external.forEach((c) => drawn.add(c.id)); });
  const mapping = [], pairs = new Set();
  for (const r of rels) {
    if (r.left === r.right || !drawn.has(r.left) || !drawn.has(r.right)) continue;
    const rk = pairKey(r.left, r.right);
    if (pairs.has(rk)) continue;
    pairs.add(rk);
    mapping.push({ l: r.left, lt: r.leftTags.map((t) => t.tag), c: r.connector, rt: r.rightTags.map((t) => t.tag), r: r.right });
  }
  return { file, domains, mapping };
}
function keysOf(m) {
  const topo = m.domains.map((d) => [d.id,
    d.subdomains.map((s) => [s.id, s.type, s.contexts.map((c) => c.id).sort()]).sort((a, b) => cmp(a[0], b[0])),
    d.external.map((c) => c.id).sort()]).sort((a, b) => cmp(a[0], b[0]));
  const rels = m.mapping.map((r) => {
    const flip = r.l > r.r, l = flip ? r.r : r.l, rr = flip ? r.l : r.r;
    const lt = (flip ? r.rt : r.lt).slice().sort((a, b) => TAG_ORDER.indexOf(a) - TAG_ORDER.indexOf(b));
    const rt = (flip ? r.lt : r.rt).slice().sort((a, b) => TAG_ORDER.indexOf(a) - TAG_ORDER.indexOf(b));
    const c = flip ? ({ "-->": "<--", "<--": "-->" }[r.c] || r.c) : r.c;
    return [l, rr, c, lt, rt];
  }).sort((a, b) => cmp(a[0] + "|" + a[1], b[0] + "|" + b[1]));
  const topoKey = JSON.stringify([topo, rels.map((r) => r[0] + "|" + r[1])]);
  return { topo: topoKey, full: topoKey + JSON.stringify(rels.map((r) => r.slice(2))) };
}

const within = (a, b) => (a.start.line > b.start.line || (a.start.line === b.start.line && a.start.column >= b.start.column)) &&
  (a.end.line < b.end.line || (a.end.line === b.end.line && a.end.column <= b.end.column));
const same = (a, b) => a.start.line === b.start.line && a.start.column === b.start.column && a.end.line === b.end.line && a.end.column === b.end.column;
const size = (s) => (s.end.line - s.start.line) * 10000 + (s.end.column - s.start.column);
function anchorsOf(ast) {
  const out = [], add = (span, target) => { if (span) out.push({ span, target }); };
  for (const d of ast.domains) {
    add(d.span, { kind: "dom", dom: d.name }); add(d.headerSpan, { kind: "dom", dom: d.name });
    if (d.mapping) add(d.mapping.keywordSpan, { kind: "dom", dom: d.name });
    for (const sd of d.subdomains) {
      const sub = d.name + "/" + sd.name;
      add(sd.span, { kind: "sub", sub }); add(sd.headerSpan, { kind: "sub", sub }); add(sd.subdomainTypeSpan, { kind: "sub", sub });
      for (const c of sd.contexts) { add(c.span, { kind: "tile", ctx: c.name }); add(c.nameSpan, { kind: "tile", ctx: c.name }); }
    }
    for (const c of d.external?.contexts ?? []) { add(c.span, { kind: "tile", ctx: c.name }); add(c.nameSpan, { kind: "tile", ctx: c.name }); }
    for (const r of d.mapping?.relationships ?? []) {
      const rk = pairKey(r.left, r.right);
      add(r.span, { kind: "edge", rk }); add(r.connectorSpan, { kind: "edge", rk });
      add(r.leftSpan, { kind: "port", rk, ctx: r.left }); add(r.rightSpan, { kind: "port", rk, ctx: r.right });
      add(r.leftTagGroupSpan, { kind: "port", rk, ctx: r.left }); add(r.rightTagGroupSpan, { kind: "port", rk, ctx: r.right });
      r.leftTags.forEach((t) => add(t.span, { kind: "port", rk, ctx: r.left }));
      r.rightTags.forEach((t) => add(t.span, { kind: "port", rk, ctx: r.right }));
    }
  }
  return out;
}
function targetOf(diag, anchors) {
  const exact = anchors.filter((a) => same(a.span, diag.span));
  if (exact.length) return exact[exact.length - 1].target;
  const inside = anchors.filter((a) => within(diag.span, a.span)).sort((a, b) => size(a.span) - size(b.span));
  return inside.length ? inside[0].target : { kind: "file" };
}

/* ---------------- o que a navegação precisa saber do mapa ---------------- */
function navOf(geo, v3) {
  const tiles = geo.tiles, rels = [], near = {}, subs = {}, ctxSub = {}, relOf = {};
  Object.keys(tiles).forEach((id) => { near[id] = []; });
  geo.rels.forEach((E) => {
    const r = [E.rk, E.rel.l, E.rel.r];
    rels.push(r); relOf[E.rk] = r;
    near[E.rel.l].push(E.rel.r); near[E.rel.r].push(E.rel.l);
  });
  Object.values(near).forEach((l) => l.sort());
  geo.islands.forEach((isl) => isl.masses.forEach((mass) => mass.groups.forEach((g) => {
    if (!g.cells.length) return;
    const key = isl.dom.id + "/" + g.sd.id;
    subs[key] = { title: g.sd.title || g.sd.id, type: g.sd.type, ids: g.sd.ids.slice().sort(),
      cells: g.cells.map((c) => mass.pos[c[0] + "," + c[1]]) };
    g.sd.ids.forEach((id) => { ctxSub[id] = key; });
  })));
  const d2 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]), flow = {};
  geo.rels.forEach((E) => {
    const r = E.rel, startsAtL = d2(E.path[0], tiles[r.l]) < d2(E.path[0], tiles[r.r]);
    const up = r.c === "<--" ? r.r : r.c === "-->" ? r.l : null;
    flow[E.rk] = r.c === "-x-" ? "none" : r.c === "<->" ? "both" : (up === r.l) === startsAtL ? "fwd" : "rev";
  });
  const far = v3.placeLabels(geo, { edges: false, tags: false, ctxLabels: false, subLabels: true, subSize: 18 });
  const farSvg = far.subSpots.map((sp) =>
    `<g class="sublab far-lab" data-sub="${esc(sp.sub)}"><text class="snm" style="font-size:${sp.size}px" x="${sp.p[0].toFixed(0)}" y="${(sp.p[1] + sp.size * 0.36).toFixed(0)}">${esc(sp.id.toUpperCase())}</text></g>`).join("");
  const typeOfCtx = {};
  Object.keys(subs).forEach((k) => subs[k].ids.forEach((id) => { typeOfCtx[id] = subs[k].type; }));
  return { tiles, rels, relOf, near, subs, ctxSub, flow, farSvg, typeOfCtx, fit: null };
}

function decorate(svg, nav, lastDiags, v3) {
  svg = svg.replace(/<\/svg>\s*$/, nav.farSvg + "</svg>");
  if (v3.state.view === "flow") {
    const bad = new Set(lastDiags.filter((d) => d.severity === "error" && d.target.rk).map((d) => d.target.rk));
    svg = svg.replace(/<g class="rel" data-rk="([^"]+)"><path class="ecase" d="([^"]+)"\/>/g, (m, rk, d) =>
      `<g class="rel${bad.has(rk) ? " invalid" : ""}" data-rk="${rk}" data-flow="${nav.flow[rk] || "none"}"><path class="ecase" d="${d}"/><path class="rhit" d="${d}"/>`);
  }
  const typeOfSub = (k) => (nav.subs[k] ? nav.subs[k].type : "external");
  return svg
    .replace(/data-ctx="([^"]+)" data-sub="([^"]+)"/g, (m, c, k) => `${m} data-type="${typeOfSub(k)}"`)
    .replace(/(<g class="sub(?:lab)?[^"]*" data-sub="([^"]+)")/g, (m, head, k) => `${head} data-type="${typeOfSub(k)}"`)
    .replace(/<text class="cnm([^"]*)"([^>]*)>([^<]+)<\/text>/g, (m, cls, rest, name) => `<text class="cnm${cls}" data-type="${nav.typeOfCtx[name] || "external"}"${rest}>${name}</text>`);
}
export { toModel, keysOf, anchorsOf, targetOf, navOf, decorate, TAG_ORDER, TYPES, pairKey };
