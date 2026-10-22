/**
 * O adaptador AST → modelo do layout e o alvo de cada diagnóstico no mapa. Porte
 * literal do `toModel`, `keysOf`, `anchorsOf` e `targetOf` do adaptador da bancada
 * (docs/design/pages/playground.html), com os tipos postos e os globais de módulo
 * (`lastType`, `file`) passados como parâmetros.
 */
import type { Diagnostic, ProgramNode, RelationshipNode, SourceSpan, SubdomainType } from "@odds/core";
import { cmp, pairKey } from "./geometry.js";
import type { LayoutContext, LayoutDomain, LayoutModel, LayoutRelation, LayoutSubdomain, Target } from "./types.js";

const TYPES: string[] = ["core", "supporting", "generic"];
const TAG_ORDER = ["OHS", "PL", "S", "ACL", "CF", "C", "SK", "P", "BBM"];

/** Uma região do texto e o elemento do mapa a que ela pertence. */
export interface Anchor {
  span: SourceSpan;
  target: Target;
}

/**
 * O modelo que o layout desenha. `lastType` é a memória do último tipo válido por
 * `"Dominio/Subdominio"`: um tipo inválido a meio da digitação não faz o subdomínio
 * pular de massa. A função a atualiza; quem chama a guarda entre as chamadas.
 *
 * Duplicatas ficam de fora (domínio, subdomínio, contexto, par de relação), assim
 * como domínios sem nada desenhável e relações para contexto sem peça: o layout
 * lança nesses casos e o editor tem de continuar desenhando.
 */
export function modelOf(ast: ProgramNode, file: string, lastType: Map<string, SubdomainType>): LayoutModel {
  const domains: LayoutDomain[] = [],
    rels: RelationshipNode[] = [],
    ctxSeen = new Set<string>(),
    domSeen = new Set<string>();
  for (const d of ast.domains) {
    if (domSeen.has(d.name)) continue;
    domSeen.add(d.name);
    const subs: LayoutSubdomain[] = [],
      subSeen = new Set<string>();
    for (const sd of d.subdomains) {
      if (subSeen.has(sd.name)) continue;
      subSeen.add(sd.name);
      const key = d.name + "/" + sd.name;
      let type: string = sd.subdomainType;
      if (TYPES.includes(type)) lastType.set(key, type as SubdomainType);
      else type = lastType.get(key) || "generic";
      const contexts: LayoutContext[] = [];
      for (const c of sd.contexts)
        if (!ctxSeen.has(c.name)) {
          ctxSeen.add(c.name);
          contexts.push({ id: c.name });
        }
      subs.push({ id: sd.name, type, title: sd.title, contexts } as LayoutSubdomain);
    }
    const external: LayoutContext[] = [];
    for (const c of d.external?.contexts ?? [])
      if (!ctxSeen.has(c.name)) {
        ctxSeen.add(c.name);
        external.push({ id: c.name });
      }
    for (const r of d.mapping?.relationships ?? []) rels.push(r);
    if (!subs.length && !external.length) continue;
    domains.push({ id: d.name, title: d.title, subdomains: subs, external } as LayoutDomain);
  }
  const drawn = new Set<string>();
  domains.forEach((d) => {
    d.subdomains.forEach((s) => s.contexts.forEach((c) => drawn.add(c.id)));
    d.external!.forEach((c) => drawn.add(c.id));
  });
  const mapping: LayoutRelation[] = [],
    pairs = new Set<string>();
  for (const r of rels) {
    if (r.left === r.right || !drawn.has(r.left) || !drawn.has(r.right)) continue;
    const rk = pairKey(r.left, r.right);
    if (pairs.has(rk)) continue;
    pairs.add(rk);
    mapping.push({ l: r.left, lt: r.leftTags.map((t) => t.tag), c: r.connector, rt: r.rightTags.map((t) => t.tag), r: r.right });
  }
  return { file, domains, mapping };
}

/** As chaves de topologia: `topo` muda quando o desenho tem de ser refeito do zero,
    `full` quando muda qualquer coisa que se vê (conector, tags). Independem da
    ordem em que o texto declara as coisas e do lado em que escreve cada relação. */
export function topologyKeys(m: LayoutModel): { topo: string; full: string } {
  const topo = m.domains
    .map((d) => [
      d.id,
      d.subdomains.map((s) => [s.id, s.type, s.contexts.map((c) => c.id).sort()]).sort((a, b) => cmp(a[0] as string, b[0] as string)),
      d.external!.map((c) => c.id).sort(),
    ])
    .sort((a, b) => cmp(a[0] as string, b[0] as string));
  const rels = m.mapping
    .map((r) => {
      const flip = r.l > r.r,
        l = flip ? r.r : r.l,
        rr = flip ? r.l : r.r;
      const lt = (flip ? r.rt : r.lt).slice().sort((a, b) => TAG_ORDER.indexOf(a) - TAG_ORDER.indexOf(b));
      const rt = (flip ? r.lt : r.rt).slice().sort((a, b) => TAG_ORDER.indexOf(a) - TAG_ORDER.indexOf(b));
      const c = flip ? ({ "-->": "<--", "<--": "-->" } as Record<string, string>)[r.c] || r.c : r.c;
      return [l, rr, c, lt, rt] as const;
    })
    .sort((a, b) => cmp(a[0] + "|" + a[1], b[0] + "|" + b[1]));
  const topoKey = JSON.stringify([topo, rels.map((r) => r[0] + "|" + r[1])]);
  return { topo: topoKey, full: topoKey + JSON.stringify(rels.map((r) => r.slice(2))) };
}

type Span = SourceSpan;
const within = (a: Span, b: Span) =>
  (a.start.line > b.start.line || (a.start.line === b.start.line && a.start.column >= b.start.column)) &&
  (a.end.line < b.end.line || (a.end.line === b.end.line && a.end.column <= b.end.column));
const same = (a: Span, b: Span) => a.start.line === b.start.line && a.start.column === b.start.column && a.end.line === b.end.line && a.end.column === b.end.column;
const size = (s: Span) => (s.end.line - s.start.line) * 10000 + (s.end.column - s.start.column);

/** Cada trecho do texto que o mapa sabe mostrar, com o elemento que o mostra. */
export function anchorsOf(ast: ProgramNode): Anchor[] {
  const out: Anchor[] = [],
    add = (span: Span | undefined, target: Target) => {
      if (span) out.push({ span, target });
    };
  for (const d of ast.domains) {
    add(d.span, { kind: "dom", dom: d.name });
    add(d.headerSpan, { kind: "dom", dom: d.name });
    if (d.mapping) add(d.mapping.keywordSpan, { kind: "dom", dom: d.name });
    for (const sd of d.subdomains) {
      const sub = d.name + "/" + sd.name;
      add(sd.span, { kind: "sub", sub });
      add(sd.headerSpan, { kind: "sub", sub });
      add(sd.subdomainTypeSpan, { kind: "sub", sub });
      for (const c of sd.contexts) {
        add(c.span, { kind: "tile", ctx: c.name });
        add(c.nameSpan, { kind: "tile", ctx: c.name });
      }
    }
    for (const c of d.external?.contexts ?? []) {
      add(c.span, { kind: "tile", ctx: c.name });
      add(c.nameSpan, { kind: "tile", ctx: c.name });
    }
    for (const r of d.mapping?.relationships ?? []) {
      const rk = pairKey(r.left, r.right);
      add(r.span, { kind: "edge", rk });
      add(r.connectorSpan, { kind: "edge", rk });
      add(r.leftSpan, { kind: "port", rk, ctx: r.left });
      add(r.rightSpan, { kind: "port", rk, ctx: r.right });
      add(r.leftTagGroupSpan, { kind: "port", rk, ctx: r.left });
      add(r.rightTagGroupSpan, { kind: "port", rk, ctx: r.right });
      r.leftTags.forEach((t) => add(t.span, { kind: "port", rk, ctx: r.left }));
      r.rightTags.forEach((t) => add(t.span, { kind: "port", rk, ctx: r.right }));
    }
  }
  return out;
}

/** O elemento do mapa onde um diagnóstico mora: a âncora de span idêntico (a última
    vence), senão a menor que o contém, senão o arquivo. */
export function targetOf(diag: Pick<Diagnostic, "span">, anchors: Anchor[]): Target {
  const exact = anchors.filter((a) => same(a.span, diag.span));
  if (exact.length) return exact[exact.length - 1]!.target;
  const inside = anchors.filter((a) => within(diag.span, a.span)).sort((a, b) => size(a.span) - size(b.span));
  return inside.length ? inside[0]!.target : { kind: "file" };
}
