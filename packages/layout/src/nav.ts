/**
 * O que a navegação por teclado precisa saber do mapa: vizinhos, subdomínios,
 * sentido de cada relação. Sem o `farSvg`
 * (os rótulos de longe são desenhados dentro de `renderSvg`).
 */
import type { Geometry, Point } from "./types.js";

export interface Nav {
  tiles: Record<string, Point>;
  /** `[rk, l, r]`. */
  rels: [string, string, string][];
  relOf: Record<string, [string, string, string]>;
  /** Os contextos ligados a cada contexto, em ordem alfabética. */
  near: Record<string, string[]>;
  subs: Record<string, { title: string; type: string; ids: string[]; cells: Point[] }>;
  /** Contexto → `"Dominio/Subdominio"`. */
  ctxSub: Record<string, string>;
  /** Por `rk`: `fwd`/`rev` (o sentido do traçado), `both` ou `none`. */
  flow: Record<string, "fwd" | "rev" | "both" | "none">;
  typeOfCtx: Record<string, string>;
}

export function navOf(geo: Geometry): Nav {
  const tiles = geo.tiles,
    rels: Nav["rels"] = [],
    near: Nav["near"] = {},
    subs: Nav["subs"] = {},
    ctxSub: Nav["ctxSub"] = {},
    relOf: Nav["relOf"] = {};
  Object.keys(tiles).forEach((id) => {
    near[id] = [];
  });
  geo.rels.forEach((E) => {
    const r: [string, string, string] = [E.rk, E.rel.l, E.rel.r];
    rels.push(r);
    relOf[E.rk] = r;
    near[E.rel.l].push(E.rel.r);
    near[E.rel.r].push(E.rel.l);
  });
  Object.values(near).forEach((l) => l.sort());
  geo.islands.forEach((isl) =>
    isl.masses.forEach((mass) =>
      mass.groups.forEach((g) => {
        if (!g.cells.length) return;
        const key = isl.dom.id + "/" + g.sd.id;
        subs[key] = {
          title: g.sd.title || g.sd.id,
          type: g.sd.type,
          ids: g.sd.ids.slice().sort(),
          cells: g.cells.map((c) => mass.pos[c[0] + "," + c[1]]),
        };
        g.sd.ids.forEach((id) => {
          ctxSub[id] = key;
        });
      }),
    ),
  );
  const d2 = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1]),
    flow: Nav["flow"] = {};
  geo.rels.forEach((E) => {
    const r = E.rel,
      startsAtL = d2(E.path[0], tiles[r.l]) < d2(E.path[0], tiles[r.r]);
    const up = r.c === "<--" ? r.r : r.c === "-->" ? r.l : null;
    flow[E.rk] = r.c === "-x-" ? "none" : r.c === "<->" ? "both" : (up === r.l) === startsAtL ? "fwd" : "rev";
  });
  const typeOfCtx: Nav["typeOfCtx"] = {};
  Object.keys(subs).forEach((k) => subs[k].ids.forEach((id) => {
    typeOfCtx[id] = subs[k].type;
  }));
  return { tiles, rels, relOf, near, subs, ctxSub, flow, typeOfCtx };
}
