import type { Nav } from "@odds/layout";

/** A point of the map, in the geometry's units. */
export type Point = [number, number];
/** `[x, y, w, h]`, a viewBox. */
export type Box = [number, number, number, number];

/** One thing picked on the map: a context, a subdomain (`"Domain/Sub"`) or a relation, seen from a context or not. */
export type Selection = { ctx: string } | { sub: string } | { rel: string; from: string | null } | null;

/** The identity of a relationship: the unordered pair. */
export const pairKey = (a: string, b: string): string => (a < b ? a + "|" + b : b + "|" + a);

/** The bench's `selAlive`: what no longer is on the map drops; a relation only forgets an origin that left. */
export function aliveSelection(sel: Selection, nav: Nav): Selection {
  if (!sel) return null;
  if ("ctx" in sel) return nav.tiles[sel.ctx] ? sel : null;
  if ("sub" in sel) return nav.subs[sel.sub] ? sel : null;
  if (!nav.relOf[sel.rel]) return null;
  return sel.from && !nav.tiles[sel.from] ? { rel: sel.rel, from: null } : sel;
}

/** What the camera frames for a selection; null when it does not move (a relation seen from its context). */
export function framePoints(sel: Selection, nav: Nav): Point[] | null {
  if (!sel) return null;
  if ("ctx" in sel) {
    if (!nav.tiles[sel.ctx]) return null;
    return [sel.ctx, ...(nav.near[sel.ctx] ?? [])].map((id) => nav.tiles[id]!);
  }
  if ("sub" in sel) return nav.subs[sel.sub]?.cells ?? null;
  const r = nav.relOf[sel.rel];
  if (!r || sel.from) return null;
  return [nav.tiles[r[1]]!, nav.tiles[r[2]]!];
}

/** The bench's `relClick`: the same relation again steps back; another one keeps the context it was seen from. */
export function relationClick(sel: Selection, rk: string, nav: Nav): Selection {
  const r = nav.relOf[rk];
  if (!r) return sel;
  if (sel && "rel" in sel && sel.rel === rk) return sel.from ? { ctx: sel.from } : null;
  const base = sel ? ("ctx" in sel ? sel.ctx : "rel" in sel ? sel.from : null) : null;
  return { rel: rk, from: base && (r[1] === base || r[2] === base) ? base : null };
}

/** The bench's `escape`: from a relation seen from a context back to it, otherwise nothing. */
export function escapeSelection(sel: Selection): Selection {
  return sel && "rel" in sel && sel.from ? { ctx: sel.from } : null;
}
