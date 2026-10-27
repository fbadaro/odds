/**
 * Territórios da colmeia: o empacotamento de cada subdomínio dentro da sua
 * massa, o preenchimento de buracos, a erosão e o contorno. Porte literal.
 */
import { C, DIRS, EDGE_OF_DIR, corner, hexPath, kk, pixelToAxial, px, spiral, unkk } from "./hex.js";
import { dist, f, tieLess } from "./geometry.js";
import type { Axial, Group, Mass, Point, Region } from "./types.js";

/* Semente de cada territorio dentro da massa, e o crescimento de cada um a
   partir dela. */
export function packMass(mass: Mass, origin: Point, occupied: Record<string, Group>): void {
  const ctr: Point = [origin[0] + mass.c[0], origin[1] + mass.c[1]];
  const base = pixelToAxial(ctr[0], ctr[1]);
  const cap = mass.Rcap || mass.R,
    span = Math.ceil(cap / (C * 1.5)) + 3;
  const cand: Axial[] = [],
    pos: Record<string, Point> = {};
  spiral(span).forEach(function (c) {
    const q = c[0] + base[0],
      r = c[1] + base[1],
      p = px(q, r);
    if (Math.hypot(p[0] - ctr[0], p[1] - ctr[1]) > cap + 1e-6) return;
    cand.push([q, r]);
    pos[kk(q, r)] = p;
  });
  mass.ctr = ctr;
  mass.pos = pos;
  mass.base = base;
  const gs = mass.groups,
    R = cap * 0.46;
  /* v4, localidade de relacao: o arranjo e FIXO — territorios em ordem de id,
     o primeiro no alto, os outros em volta no sentido horario. A v3 testava
     permutacoes e rotacoes e ficava com a que punha cada territorio mais perto
     dos parceiros; era a principal fonte de movimento sob edicao: uma relacao
     de Vendas virava a massa core e levava Descoberta junto. Medido: com o
     arranjo fixo, nenhuma edicao de relacao mexe fora das duas pontas. A puxada
     para o parceiro continua existindo, mas so dentro do territorio (passo 4). */
  gs.forEach(function (g, slot) {
    if (gs.length === 1) {
      g.seed = ctr;
      return;
    }
    const a = (slot * 2 * Math.PI) / gs.length - Math.PI / 2;
    g.seed = [ctr[0] + Math.cos(a) * R, ctr[1] + Math.sin(a) * R];
  });
  gs.forEach(function (g) {
    const blob: Axial[] = [],
      set: Record<string, 1> = {};
    let seedCell: Axial | null = null,
      bd = Infinity;
    cand.forEach(function (c) {
      const key = kk(c[0], c[1]);
      if (occupied[key]) return;
      const d = dist(pos[key], g.seed);
      if (tieLess(d, c, bd, seedCell, base)) {
        bd = d;
        seedCell = c;
      }
    });
    if (!seedCell) {
      g.cells = [];
      g.set = {};
      return;
    }
    const sc: Axial = seedCell;
    occupied[kk(sc[0], sc[1])] = g;
    blob.push(sc);
    set[kk(sc[0], sc[1])] = 1;
    while (blob.length < g.n) {
      let pick: Axial | null = null,
        pd = Infinity;
      for (let b = 0; b < blob.length; b++)
        for (let j = 0; j < 6; j++) {
          const nq = blob[b][0] + DIRS[j][0],
            nr = blob[b][1] + DIRS[j][1],
            key = kk(nq, nr);
          if (occupied[key] || !(key in pos)) continue;
          const d2 = dist(pos[key], g.seed);
          if (tieLess(d2, [nq, nr], pd, pick, base)) {
            pd = d2;
            pick = [nq, nr];
          }
        }
      if (!pick) break;
      const pk: Axial = pick;
      occupied[kk(pk[0], pk[1])] = g;
      blob.push(pk);
      set[kk(pk[0], pk[1])] = 1;
    }
    g.cells = blob;
    g.set = set;
    g.pos = pos;
  });
}
export function dilateFill(setObj: Record<string, 1>, rings: number): Record<string, 1> {
  let cur: Record<string, 1> = {};
  for (const k in setObj) cur[k] = 1;
  for (let i = 0; i < rings; i++) {
    const next: Record<string, 1> = {};
    for (const k in cur) {
      next[k] = 1;
      const pp = unkk(k);
      for (let j = 0; j < 6; j++) next[kk(pp[0] + DIRS[j][0], pp[1] + DIRS[j][1])] = 1;
    }
    cur = next;
  }
  return fillHoles(cur);
}
export function fillHoles(cur: Record<string, 1>): Record<string, 1> {
  const qs: number[] = [],
    rs: number[] = [];
  let a: number, b: number;
  for (const k in cur) {
    const p2 = unkk(k);
    qs.push(p2[0]);
    rs.push(p2[1]);
  }
  if (!qs.length) return cur;
  const q0 = Math.min(...qs) - 2,
    q1 = Math.max(...qs) + 2,
    r0 = Math.min(...rs) - 2,
    r1 = Math.max(...rs) + 2;
  const outside: Record<string, 1> = {},
    stack: Axial[] = [];
  for (a = q0; a <= q1; a++) {
    stack.push([a, r0]);
    stack.push([a, r1]);
  }
  for (b = r0; b <= r1; b++) {
    stack.push([q0, b]);
    stack.push([q1, b]);
  }
  while (stack.length) {
    const c = stack.pop() as Axial;
    if (c[0] < q0 || c[0] > q1 || c[1] < r0 || c[1] > r1) continue;
    const key = kk(c[0], c[1]);
    if (outside[key] || cur[key]) continue;
    outside[key] = 1;
    for (let j = 0; j < 6; j++) stack.push([c[0] + DIRS[j][0], c[1] + DIRS[j][1]]);
  }
  for (a = q0; a <= q1; a++)
    for (b = r0; b <= r1; b++) {
      const k2 = kk(a, b);
      if (!cur[k2] && !outside[k2]) cur[k2] = 1;
    }
  return cur;
}
export function fillMassHoles(mass: Mass): void {
  const union: Record<string, 1> = {},
    owner: Record<string, Group> = {};
  mass.groups.forEach(function (g) {
    g.cells.forEach(function (c) {
      union[kk(c[0], c[1])] = 1;
      owner[kk(c[0], c[1])] = g;
    });
  });
  if (!Object.keys(union).length) return;
  const filled = fillHoles(Object.assign({}, union));
  /* ordem numerica, nao de string: "10,3" antes de "9,3" mudaria com uma translacao */
  Object.keys(filled)
    .map(unkk)
    .sort(function (a, b) {
      return a[0] - b[0] || a[1] - b[1];
    })
    .map(function (c) {
      return kk(c[0], c[1]);
    })
    .forEach(function (k3) {
      if (union[k3]) return;
      const c = unkk(k3),
        tally: Record<string, number> = {};
      let bestG: Group | null = null,
        bn = 0;
      for (let j = 0; j < 6; j++) {
        const og = owner[kk(c[0] + DIRS[j][0], c[1] + DIRS[j][1])];
        if (!og) continue;
        tally[og.sd.id] = (tally[og.sd.id] || 0) + 1;
        if (tally[og.sd.id] > bn) {
          bn = tally[og.sd.id];
          bestG = og;
        }
      }
      if (!bestG) return;
      const bg: Group = bestG;
      bg.cells.push(c);
      bg.set[k3] = 1;
      union[k3] = 1;
      owner[k3] = bg;
      if (!(k3 in mass.pos)) mass.pos[k3] = px(c[0], c[1]);
    });
}
export function erode(setObj: Record<string, 1>, rings: number): Record<string, 1> {
  let cur = setObj;
  for (let i = 0; i < rings; i++) {
    const next: Record<string, 1> = {};
    for (const k in cur) {
      const pp = unkk(k);
      let ok = true;
      for (let j = 0; j < 6; j++)
        if (!cur[kk(pp[0] + DIRS[j][0], pp[1] + DIRS[j][1])]) {
          ok = false;
          break;
        }
      if (ok) next[k] = 1;
    }
    if (!Object.keys(next).length) return cur;
    cur = next;
  }
  return cur;
}
export function regionOf(setObj: Record<string, 1>): Region {
  const cells: Axial[] = [],
    pos: Record<string, Point> = {};
  Object.keys(setObj).forEach(function (k) {
    const c = unkk(k);
    cells.push(c);
    pos[k] = px(c[0], c[1]);
  });
  return { cells: cells, set: setObj, pos: pos };
}
export function outline(cells: Axial[], set: Record<string, 1>, pos: Record<string, Point>): string {
  let d = "";
  cells.forEach(function (c) {
    const p = pos[kk(c[0], c[1])];
    DIRS.forEach(function (dd, i) {
      if (set[kk(c[0] + dd[0], c[1] + dd[1])]) return;
      const e = EDGE_OF_DIR[i],
        a = corner(p[0], p[1], e[0], C),
        b = corner(p[0], p[1], e[1], C);
      d += "M" + f(a) + "L" + f(b);
    });
  });
  return d;
}
export function fillOf(cells: Axial[], pos: Record<string, Point>): string {
  let d = "";
  cells.forEach(function (c) {
    const p = pos[kk(c[0], c[1])];
    d += hexPath(p[0], p[1], C);
  });
  return d;
}
export function centroidOf(cells: Axial[], pos: Record<string, Point>): Point {
  let cx = 0,
    cy = 0;
  cells.forEach(function (c) {
    const p = pos[kk(c[0], c[1])];
    cx += p[0];
    cy += p[1];
  });
  return [cx / cells.length, cy / cells.length];
}
export function interiorCells(g: Group): Axial[] {
  return g.cells.filter(function (c) {
    return DIRS.every(function (dd) {
      return g.set[kk(c[0] + dd[0], c[1] + dd[1])];
    });
  });
}
