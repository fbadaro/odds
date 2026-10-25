/**
 * Massas da colmeia-v4: uma por tipo de subdomínio, mais a do external; a extensão
 * angular de cada uma e o arranjo delas dentro do domínio. Porte literal.
 */
import { C, CELL_AREA, GAP, kk, TYPES } from "./hex.js";
import { tierOf } from "./metrics.js";
import type { Group, Mass, PreparedDomain, Point } from "./types.js";

export function cellsFor(nCtx: number): number {
  return Math.max(Math.ceil(tierOf(nCtx) * 4.0) + 3, 7);
}
export function massesOf(dom: PreparedDomain): Mass[] {
  const out: Mass[] = [];
  TYPES.forEach(function (t) {
    const gs: Group[] = [];
    dom.subdomains.forEach(function (sd) {
      if (sd.type === t) gs.push({ sd: sd, n: cellsFor(sd.ids.length) } as Group);
    });
    if (!gs.length) return;
    const n = gs.reduce(function (a, g) {
      return a + g.n;
    }, 0);
    const R0 = Math.sqrt((n * CELL_AREA) / Math.PI) * 1.14;
    out.push({ type: t, groups: gs, n: n, R: R0, Rcap: R0 } as Mass);
  });
  if (dom.external.length) {
    const n2 = cellsFor(dom.externalIds.length),
      R1 = Math.sqrt((n2 * CELL_AREA) / Math.PI) * 1.14;
    out.push({
      type: "external",
      external: true,
      n: n2,
      R: R1,
      Rcap: R1,
      groups: [{ sd: { id: "external", type: "external", contexts: dom.external, ids: dom.externalIds }, n: n2 } as Group],
    } as Mass);
  }
  out.forEach(function (m) {
    m.groups.forEach(function (g) {
      g.mass = m;
    });
  });
  return out;
}
export function extentFn(mass: Mass): number[] {
  const N = 24,
    ext: number[] = new Array(N);
  let i: number;
  for (i = 0; i < N; i++) ext[i] = C;
  mass.groups.forEach(function (g) {
    g.cells.forEach(function (c) {
      const pp = mass.pos[kk(c[0], c[1])],
        dx = pp[0] - mass.ctr[0],
        dy = pp[1] - mass.ctr[1],
        a = Math.atan2(dy, dx);
      for (i = 0; i < N; i++) {
        const ang = (i / N) * Math.PI * 2,
          diff = Math.abs(((a - ang + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
        if (diff < Math.PI / 4.2) {
          const proj = dx * Math.cos(ang) + dy * Math.sin(ang) + C;
          if (proj > ext[i]) ext[i] = proj;
        }
      }
    });
  });
  return ext;
}
export function extAt(mass: Mass, ang: number): number {
  if (!mass.ext) return mass.R;
  const N = mass.ext.length,
    i = Math.round(((((ang % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2)) * N) % N;
  return mass.ext[i];
}
/* v4: em duas etapas. Primeiro as massas proprias se acomodam entre si, sem o
   external; depois o external desce pelo raio do angulo dele e para na primeira
   distancia em que nao encosta em ninguem. Na v3 todas se empurravam juntas, e
   o external — fosse cedendo, fosse empurrando — ou movia massa alheia ao girar,
   ou ficava preso entre duas e acabava dentro do core. */
export function layoutMasses(masses: Mass[], extAng: number): number {
  const ANG: Record<string, number> = { supporting: Math.PI, generic: 0 };
  const own = masses.filter(function (m) {
    return !m.external;
  });
  const extM = masses.filter(function (m) {
    return m.external;
  })[0];
  const hub =
    own.filter(function (m) {
      return m.type === "core";
    })[0] ||
    own[0] ||
    extM;
  hub.c = [0, 0];
  own.forEach(function (m, idx) {
    if (m === hub) return;
    const ang = ANG[m.type] !== undefined ? ANG[m.type] : -Math.PI / 2 + idx * 2.1;
    const d = extAt(hub, ang) + GAP + extAt(m, ang + Math.PI);
    m.c = [Math.cos(ang) * d, Math.sin(ang) * d];
  });
  for (let it = 0; it < 80; it++) {
    let moved = false;
    for (let i = 0; i < own.length; i++)
      for (let j = i + 1; j < own.length; j++) {
        const A = own[i],
          B = own[j],
          dx = B.c[0] - A.c[0],
          dy = B.c[1] - A.c[1],
          d = Math.hypot(dx, dy) || 1;
        const ab = Math.atan2(dy, dx),
          need = extAt(A, ab) + extAt(B, ab + Math.PI) + GAP;
        if (d >= need) continue;
        moved = true;
        const u: Point = [dx / d, dy / d],
          push = need - d;
        if (A === hub) B.c = [B.c[0] + u[0] * push, B.c[1] + u[1] * push];
        else if (B === hub) A.c = [A.c[0] - u[0] * push, A.c[1] - u[1] * push];
        else {
          A.c = [A.c[0] - (u[0] * push) / 2, A.c[1] - (u[1] * push) / 2];
          B.c = [B.c[0] + (u[0] * push) / 2, B.c[1] + (u[1] * push) / 2];
        }
      }
    if (!moved) break;
  }
  if (extM && extM !== hub) {
    const u2: Point = [Math.cos(extAng), Math.sin(extAng)];
    const clear = function (c: Point): boolean {
      return own.every(function (m) {
        const dx = c[0] - m.c[0],
          dy = c[1] - m.c[1],
          ab = Math.atan2(dy, dx);
        return Math.hypot(dx, dy) >= extAt(m, ab) + extAt(extM, ab + Math.PI) + GAP + 22;
      });
    };
    let dd = extAt(hub, extAng) + GAP + extAt(extM, extAng + Math.PI) + 22;
    while (!clear([u2[0] * dd, u2[1] * dd])) dd += C;
    extM.c = [u2[0] * dd, u2[1] * dd];
  }
  let rad = 0;
  masses.forEach(function (m) {
    const far = m.ext ? Math.max(...m.ext) : m.R;
    rad = Math.max(rad, Math.hypot(m.c[0], m.c[1]) + far);
  });
  return rad;
}
