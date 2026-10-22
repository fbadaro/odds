/**
 * O modelo como o autor o escreveu: `declared` da colmeia-v4, com variante, relação
 * extra e embaralhamento. Porte literal.
 */
import { clone } from "../geometry.js";
import { flip, prep } from "../canon.js";
import type { LayoutRelation, PreparedModel } from "../types.js";
import { BREAKS, EXTRA, MODELS } from "./models.js";

export function mulberry(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function shuffleArr<T>(a: T[], rnd: () => number): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1)),
      t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
}
/* O modelo como o autor o escreveu: variante, relacao extra e embaralhamento.
   Embaralhar mexe em TODA ordem que o texto tem — dominios, subdominios,
   contextos, relacoes, tags dentro do grupo — e inverte metade das relacoes. */
export function declared(model: string, file: string, shuffle: number, extra: number): PreparedModel {
  const m = clone(MODELS[model]);
  if (file === "broken" && BREAKS[model])
    BREAKS[model].forEach(function (b) {
      m.mapping.forEach(function (rel) {
        if (rel.l === b.l && rel.r === b.r)
          (Object.keys(b.set) as ("lt" | "rt")[]).forEach(function (k) {
            rel[k] = (b.set[k] as string[]).slice();
          });
      });
    });
  if (extra) m.mapping.push(clone(EXTRA[model][extra - 1]));
  if (shuffle) {
    const rnd = mulberry(shuffle * 7919 + 13);
    shuffleArr(m.domains, rnd);
    m.domains.forEach(function (d) {
      shuffleArr(d.subdomains, rnd);
      d.subdomains.forEach(function (sd) {
        shuffleArr(sd.contexts, rnd);
      });
      shuffleArr(d.external as NonNullable<typeof d.external>, rnd);
    });
    shuffleArr(m.mapping, rnd);
    m.mapping = m.mapping.map(function (rel): LayoutRelation {
      shuffleArr(rel.lt, rnd);
      shuffleArr(rel.rt, rnd);
      return rnd() < 0.5 ? flip(rel) : rel;
    });
  }
  return prep(m);
}
