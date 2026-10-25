/**
 * Rótulos da colmeia-v4: o nome de cada contexto e o título de cada território,
 * postos onde não cobrem peça, chip nem outro rótulo. Porte literal de `placeLabels`.
 */
import { DIRS, HIN, HR, kk, px } from "./hex.js";
import { boxHit, dist, segBox } from "./geometry.js";
import { centroidOf, interiorCells } from "./territories.js";
import type { Box, CtxLabel, Geometry, LabelOptions, LabelResult, Point, SubSpot } from "./types.js";

interface Spot {
  p: Point;
  edge: boolean;
  rim?: boolean;
}
interface SubCand {
  p: Point;
  box: Box;
  size: number;
  n: number;
}

/* ---------------- rotulos ---------------- */
export function placeLabels(geo: Geometry, opts: LabelOptions): LabelResult {
  const tiles = geo.tiles,
    ids = Object.keys(tiles).sort();
  const tileBoxes: Record<string, Box> = {};
  ids.forEach(function (id) {
    const p = tiles[id];
    tileBoxes[id] = [p[0] - HR, p[1] - HIN, 2 * HR, 2 * HIN];
  });
  const chips: Box[] = [],
    segs: [Point, Point][] = [];
  if (opts.edges)
    geo.rels.forEach(function (E) {
      [E.L, E.Rr].forEach(function (en) {
        if (en.chip && opts.tags) chips.push(en.chip.box);
      });
      for (let i = 0; i < E.path.length - 1; i++) segs.push([E.path[i], E.path[i + 1]]);
    });
  const labels: Record<string, CtxLabel> = {},
    taken: Box[] = [];
  if (opts.ctxLabels)
    ids.forEach(function (id) {
      const pt = tiles[id],
        w = id.length * 6.1,
        h = 13;
      const cands: CtxLabel[] = [
        { x: pt[0], y: pt[1] + HIN + 13, a: "middle", box: [pt[0] - w / 2, pt[1] + HIN + 3, w, h] },
        { x: pt[0], y: pt[1] - HIN - 6, a: "middle", box: [pt[0] - w / 2, pt[1] - HIN - 17, w, h] },
        { x: pt[0] + HR + 7, y: pt[1] + 3.4, a: "start", box: [pt[0] + HR + 7, pt[1] - 6.5, w, h] },
        { x: pt[0] - HR - 7, y: pt[1] + 3.4, a: "end", box: [pt[0] - HR - 7 - w, pt[1] - 6.5, w, h] },
        { x: pt[0] + HR * 0.6, y: pt[1] + HIN + 15, a: "start", box: [pt[0] + HR * 0.6, pt[1] + HIN + 5, w, h] },
        { x: pt[0] - HR * 0.6, y: pt[1] + HIN + 15, a: "end", box: [pt[0] - HR * 0.6 - w, pt[1] + HIN + 5, w, h] },
        { x: pt[0] + HR * 0.6, y: pt[1] - HIN - 8, a: "start", box: [pt[0] + HR * 0.6, pt[1] - HIN - 19, w, h] },
        { x: pt[0] - HR * 0.6, y: pt[1] - HIN - 8, a: "end", box: [pt[0] - HR * 0.6 - w, pt[1] - HIN - 19, w, h] },
        { x: pt[0] + w / 3, y: pt[1] + HIN + 13, a: "middle", box: [pt[0] - w / 6, pt[1] + HIN + 3, w, h] },
        { x: pt[0] - w / 3, y: pt[1] + HIN + 13, a: "middle", box: [pt[0] - (w * 5) / 6, pt[1] + HIN + 3, w, h] },
        { x: pt[0] + w / 3, y: pt[1] - HIN - 6, a: "middle", box: [pt[0] - w / 6, pt[1] - HIN - 17, w, h] },
        { x: pt[0] - w / 3, y: pt[1] - HIN - 6, a: "middle", box: [pt[0] - (w * 5) / 6, pt[1] - HIN - 17, w, h] },
        { x: pt[0], y: pt[1] + HIN + 27, a: "middle", box: [pt[0] - w / 2, pt[1] + HIN + 17, w, h] },
        { x: pt[0], y: pt[1] - HIN - 20, a: "middle", box: [pt[0] - w / 2, pt[1] - HIN - 31, w, h] },
      ];
      let best = cands[0],
        bn = Infinity;
      /* embaixo e em cima primeiro; nas diagonais o nome fica mais perto da
         peca vizinha do que da propria e passa a rotular a peca errada */
      const POS_COST = [0, 0.3, 1.2, 1.2, 2.5, 2.5, 2.8, 2.8, 0.8, 0.8, 1.0, 1.0, 1.6, 1.8];
      cands.forEach(function (c, ci) {
        let n = POS_COST[ci];
        ids.forEach(function (o) {
          if (o !== id && boxHit(c.box, tileBoxes[o])) n += 10;
        });
        taken.forEach(function (b) {
          if (boxHit(c.box, b)) n += 9;
        });
        chips.forEach(function (b) {
          if (boxHit(c.box, b)) n += 9;
        });
        segs.forEach(function (s) {
          if (segBox(s[0], s[1], c.box)) n += 0.5;
        });
        /* o nome tem de ficar mais perto da propria peca do que de qualquer
           outra — senao ele rotula a vizinha (achado de captura: Recommendations) */
        const bc: Point = [c.box[0] + c.box[2] / 2, c.box[1] + c.box[3] / 2],
          own = dist(bc, pt);
        ids.forEach(function (o) {
          if (o !== id && dist(bc, tiles[o]) < own) n += 12;
        });
        if (n < bn) {
          bn = n;
          best = c;
        }
      });
      labels[id] = best;
      taken.push(best.box);
    });
  const subSpots: SubSpot[] = [];
  if (opts.subLabels) {
    const busy = ids
      .map(function (id) {
        return tileBoxes[id];
      })
      .concat(chips, taken);
    const size = opts.subSize as number;
    geo.islands.forEach(function (isl) {
      isl.masses.forEach(function (mass) {
        mass.groups.forEach(function (g) {
          if (!g.cells.length) return;
          const txt = g.sd.id.toUpperCase();
          /* qualquer celula serve; o que decide e nao cobrir peca (V1), chip ou
             rotulo. Orla pesa pouco: nome de territorio na borda le como da vizinha. */
          /* candidatos: centro de cada celula E o ponto entre duas celulas vizinhas
             do territorio — o titulo cresceu para 13px e em territorio apertado so
             cabe no meio do caminho. Se nem assim, encolhe um degrau, nunca mais. */
          const inner: Record<string, 1> = {};
          interiorCells(g).forEach(function (c) {
            inner[kk(c[0], c[1])] = 1;
          });
          const spots: Spot[] = [];
          g.cells.forEach(function (c) {
            const k1 = kk(c[0], c[1]),
              p1 = mass.pos[k1];
            spots.push({ p: p1, edge: !inner[k1] });
            [0, 1, 2].forEach(function (j) {
              const k2 = kk(c[0] + DIRS[j][0], c[1] + DIRS[j][1]);
              if (g.set[k2]) {
                const p2 = mass.pos[k2];
                spots.push({ p: [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2], edge: !(inner[k1] && inner[k2]) });
              }
            });
            /* orla: meio dentro, meio fora da fronteira. So vale para territorio
               minimo (uma peca em 7 celulas), onde os chips ocupam todo o miolo */
            if (g.cells.length <= 8)
              DIRS.forEach(function (d) {
                if (g.set[kk(c[0] + d[0], c[1] + d[1])]) return;
                const q = px(c[0] + d[0], c[1] + d[1]);
                spots.push({ p: [(p1[0] + q[0]) / 2, (p1[1] + q[1]) / 2], edge: true, rim: true });
              });
          });
          const ct = centroidOf(g.cells, mass.pos);
          let best: SubCand | null = null;
          [size, size * 0.85].some(function (sz) {
            const w2 = txt.length * sz * 0.8,
              h2 = sz * 1.5;
            let bn = Infinity,
              bd = Infinity,
              cand: SubCand | null = null;
            spots.forEach(function (sp) {
              const pp = sp.p,
                box: Box = [pp[0] - w2 / 2, pp[1] - h2 / 2, w2, h2];
              let n = sp.rim ? 3 : sp.edge ? 1.5 : 0;
              busy.forEach(function (o) {
                if (boxHit(box, o)) n += 8;
              });
              segs.forEach(function (s) {
                if (segBox(s[0], s[1], box)) n += 1;
              });
              const d = dist(pp, ct);
              if (n < bn || (n === bn && d < bd - 1e-6)) {
                bn = n;
                bd = d;
                cand = { p: pp, box: box, size: sz, n: n };
              }
            });
            const cd = cand as unknown as SubCand;
            if (!best || cd.n < best.n) best = cd;
            return best.n < 8;
          });
          const b = best as unknown as SubCand;
          busy.push(b.box);
          subSpots.push({ sub: isl.dom.id + "/" + g.sd.id, id: g.sd.id, p: b.p, box: b.box, size: b.size });
        });
      });
    });
  }
  return { labels: labels, subSpots: subSpots };
}
