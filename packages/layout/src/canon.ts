/**
 * `prep` e `canon` da colmeia: a forma canônica é a única que o layout vê.
 * Porte literal.
 */
import { TAG_ORDER } from "./hex.js";
import { clone, cmp, pairKey } from "./geometry.js";
import type { CanonModel, CanonRelation, Connector, LayoutContext, LayoutModel, LayoutRelation, PreparedModel } from "./types.js";

/** Normaliza contextos escritos como string e anota `ids`/`externalIds`. Muta e devolve `m`. */
export function prep<M extends LayoutModel>(m: M): M & PreparedModel {
  m.domains.forEach(function (d) {
    d.subdomains.forEach(function (sd) {
      sd.contexts = sd.contexts.map(function (c: LayoutContext | string) {
        return typeof c === "string" ? { id: c } : c;
      });
      sd.ids = sd.contexts.map(function (c) {
        return c.id;
      });
    });
    d.external = (d.external || []).map(function (c: LayoutContext | string) {
      return typeof c === "string" ? { id: c } : c;
    });
    d.externalIds = d.external.map(function (c) {
      return c.id;
    });
  });
  return m as M & PreparedModel;
}
export const MIRROR: Record<Connector, Connector> = { "-->": "<--", "<--": "-->", "<->": "<->", "-x-": "-x-" };
export function flip(rel: LayoutRelation): LayoutRelation {
  return { l: rel.r, lt: rel.rt, c: MIRROR[rel.c], rt: rel.lt, r: rel.l };
}
export function sortTags(t: string[]): string[] {
  return t.slice().sort(function (a, b) {
    return TAG_ORDER.indexOf(a) - TAG_ORDER.indexOf(b);
  });
}
/* A forma canonica: e so ela que o layout ve. Tudo ordenado por id, e cada
   relacao escrita com o menor id a esquerda — `A --> B` e `B <-- A` sao a mesma
   relacao (a identidade e o par nao ordenado, RULES secao 3). */
export function canon(m: LayoutModel): CanonModel {
  const c = clone(m) as PreparedModel;
  c.domains.sort(function (a, b) {
    return cmp(a.id, b.id);
  });
  c.domains.forEach(function (d) {
    d.subdomains.sort(function (a, b) {
      return cmp(a.id, b.id);
    });
    d.subdomains.forEach(function (sd) {
      sd.contexts.sort(function (a, b) {
        return cmp(a.id, b.id);
      });
    });
    d.external.sort(function (a, b) {
      return cmp(a.id, b.id);
    });
  });
  c.mapping = c.mapping
    .map(function (rel) {
      const r2 = rel.l > rel.r ? flip(rel) : clone(rel);
      r2.lt = sortTags(r2.lt);
      r2.rt = sortTags(r2.rt);
      r2.rk = pairKey(r2.l, r2.r);
      return r2 as CanonRelation;
    })
    .sort(function (a, b) {
      return cmp(a.rk as string, b.rk as string);
    });
  return prep(c) as CanonModel;
}
