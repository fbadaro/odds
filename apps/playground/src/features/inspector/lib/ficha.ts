import type { ContextNode, ProgramNode } from "@odds/core";
import { pairKey } from "../../../lib/selection";

/** One relation pair, as its first line in the mapping writes it. */
export interface RelInfo { rk: string; l: string; lt: string[]; c: "-->" | "<--" | "<->" | "-x-"; rt: string[]; r: string; line: number }
/** What a context documents: its title and properties, and where it is declared. */
export interface DocInfo { title?: string; description?: string; responsibilities?: string[]; type?: string; maturity?: string; team?: string; technology?: string; line: number }
export interface Ficha { rels: Record<string, RelInfo>; ctx: Record<string, DocInfo>; sub: Record<string, { title?: string; description?: string; owner?: string; line: number }>; dom: string }

// an absent key stays absent (exactOptionalPropertyTypes)
const docOf = (c: ContextNode): DocInfo => ({ ...c.properties, ...(c.title !== undefined && { title: c.title }), line: c.span.start.line });

/** The bench's `fichaOf`: what the ficha reads from the text, not from the map. */
export function fichaOf(ast: ProgramNode): Ficha {
  const rels: Ficha["rels"] = {}, ctx: Ficha["ctx"] = {}, sub: Ficha["sub"] = {};
  for (const d of ast.domains) {
    for (const sd of d.subdomains) {
      sub[d.name + "/" + sd.name] = {
        ...(sd.description !== undefined && { description: sd.description }),
        ...(sd.owner !== undefined && { owner: sd.owner }),
        ...(sd.title !== undefined && { title: sd.title }),
        line: sd.span.start.line,
      };
      for (const c of sd.contexts) if (!ctx[c.name]) ctx[c.name] = docOf(c);
    }
    for (const c of d.external?.contexts ?? []) if (!ctx[c.name]) ctx[c.name] = docOf(c);
    for (const r of d.mapping?.relationships ?? []) {
      const rk = pairKey(r.left, r.right);
      if (rels[rk] || r.left === r.right) continue;
      rels[rk] = { rk, l: r.left, lt: r.leftTags.map((t) => t.tag), c: r.connector, rt: r.rightTags.map((t) => t.tag), r: r.right, line: r.span.start.line };
    }
  }
  const d0 = ast.domains[0];
  return { rels, ctx, sub, dom: d0 ? d0.title || d0.name : "" };
}

/** Upstream first on a directional line; the pair as written otherwise. */
export function relLabel(rk: string, f: Ficha | null): string {
  const r = f?.rels[rk];
  if (!r) return rk.replace("|", " · ");
  if (r.c === "-->") return r.l + " → " + r.r;
  if (r.c === "<--") return r.r + " → " + r.l;
  return r.l + (r.c === "<->" ? " ⇄ " : " ✕ ") + r.r;
}

/** The role of `id` in the relation, seen from `id`. */
export function roleText(r: RelInfo, id: string): string {
  if (r.c === "<->") return "mutuamente dependentes";
  if (r.c === "-x-") return "caminhos separados: decisão, não falha";
  const upLeft = r.c === "-->", selLeft = r.l === id, other = selLeft ? r.r : r.l;
  return upLeft === selLeft ? "upstream de " + other : "downstream de " + other;
}
