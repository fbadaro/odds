/**
 * Métricas da colmeia-v4 — a mesma régua que mediu a v2 — e o degrau de território.
 * Porte literal.
 */
import { C, SQ3 } from "./hex.js";
import { dist, distPS, segX } from "./geometry.js";
import type { Geometry, Measure, Point } from "./types.js";

/* 4n+3, nao os 3n+3 da v2: la o contexto era ponto; aqui ele tem ate seis
   portas, e tres pecas com chip nao cabem em doze celulas sem encostar. */
/* v4, localidade: o territorio e dimensionado pelo DEGRAU, nao pela contagem.
   Na v3 o tamanho era funcao direta de n, e um contexto a mais crescia a massa,
   que empurrava as outras — 15-17 de 17 pecas andavam. Dentro de um degrau o
   territorio nao muda de forma, e entao nada fora dele pode mudar. Cruzar o
   degrau refaz o mapa, e isso e aceito: e raro, e a animacao mostra para onde
   cada peca foi. Degraus moderados: a folga custa territorio vazio na tela. */
export const TIERS = [4, 8, 12, 20, 32, 48, 64];
export function tierOf(n: number): number {
  for (let i = 0; i < TIERS.length; i++) if (n <= TIERS[i]) return TIERS[i];
  return Math.ceil(n / 16) * 16;
}

/* ---------------- metricas: a mesma regua que mediu a v2 ---------------- */
export function measure(geo: Geometry): Measure {
  const segs = geo.rels.map(function (E) {
    const o: [Point, Point][] = [];
    for (let i = 0; i < E.path.length - 1; i++) o.push([E.path[i], E.path[i + 1]]);
    return o;
  });
  let cross = 0,
    over = 0;
  const overList: string[] = [];
  for (let i = 0; i < segs.length; i++)
    for (let j = i + 1; j < segs.length; j++)
      segs[i].forEach(function (s1) {
        segs[j].forEach(function (s2) {
          if (segX(s1[0], s1[1], s2[0], s2[1])) cross++;
        });
      });
  geo.rels.forEach(function (E, i) {
    Object.keys(geo.tiles).forEach(function (id) {
      if (id === E.rel.l || id === E.rel.r) return;
      if (
        segs[i].some(function (s) {
          return distPS(geo.tiles[id], s[0], s[1]) < C * 0.8;
        })
      ) {
        over++;
        overList.push(E.rk + " sobre " + id);
      }
    });
  });
  const pitch = C * SQ3,
    lens = geo.rels.map(function (E) {
      let t = 0;
      for (let i = 0; i < E.path.length - 1; i++) t += dist(E.path[i], E.path[i + 1]);
      return t / pitch;
    });
  /* desvio: comprimento da rota sobre a distancia reta entre as pecas. O
     conceito C cai se passar de 2 — a volta ao redor da propria peca que a
     primeira grade produzia chegava a 4,6 */
  let detour = 0,
    detourOf = "";
  geo.rels.forEach(function (E) {
    let L = 0;
    for (let i = 0; i < E.path.length - 1; i++) L += dist(E.path[i], E.path[i + 1]);
    const d = L / dist(geo.tiles[E.rel.l], geo.tiles[E.rel.r]);
    if (d > detour) {
      detour = d;
      detourOf = E.rk;
    }
  });
  return {
    crossings: cross,
    overTile: over,
    overList: overList,
    congested: geo.congested,
    detour: detour,
    detourOf: detourOf,
    maxLen: lens.length ? Math.max(...lens) : 0,
    tiles: Object.keys(geo.tiles).length,
    rels: geo.rels.length,
  };
}

/** Os ids das peças que andaram mais de meio pixel de `a` para `b` (ou sumiram) —
    o `tilesMoved` da v4, que recebe os mapas `tiles` e devolve a lista. */
export function movedTiles(a: Record<string, Point>, b: Record<string, Point>): string[] {
  return Object.keys(a).filter(function (id) {
    return !b[id] || Math.abs(a[id][0] - b[id][0]) > 0.5 || Math.abs(a[id][1] - b[id][1]) > 0.5;
  });
}
/** Quantas peças andaram de uma geometria para a outra. */
export function tilesMoved(a: Geometry, b: Geometry): number {
  return movedTiles(a.tiles, b.tiles).length;
}
