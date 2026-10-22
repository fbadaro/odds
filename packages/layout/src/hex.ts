/**
 * A grade hexagonal da colmeia-v4: constantes, coordenada axial e espiral.
 * Porte literal do bloco de utilitários do script da v4.
 */
import type { Axial, Point } from "./types.js";

export const C = 28,
  HR = C,
  SQ3 = Math.sqrt(3),
  HIN = (C * SQ3) / 2;
export const GAP = 50,
  MIN_STEP = 2,
  CELL_AREA = ((3 * SQ3) / 2) * C * C;
export const DIRS: Axial[] = [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]];
export const EDGE_OF_DIR: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0]];
export const TYPES = ["core", "supporting", "generic"];
export const TAG_ORDER = ["OHS", "PL", "S", "ACL", "CF", "C", "SK", "P", "BBM"];

export function px(q: number, r: number): Point {
  return [C * 1.5 * q, C * SQ3 * (r + q / 2)];
}
export function kk(q: number, r: number): string {
  return q + "," + r;
}
export function unkk(k: string): Axial {
  const p = k.split(",");
  return [+p[0]!, +p[1]!];
}
export function corner(cx: number, cy: number, i: number, rad: number): Point {
  const a = (Math.PI / 180) * 60 * i;
  return [cx + rad * Math.cos(a), cy + rad * Math.sin(a)];
}
export function hexPath(cx: number, cy: number, rad: number): string {
  let d = "";
  for (let i = 0; i < 6; i++) {
    const c = corner(cx, cy, i, rad);
    d += (i ? "L" : "M") + c[0].toFixed(1) + " " + c[1].toFixed(1);
  }
  return d + "Z";
}
export function hexDist(a: Axial, b: Axial): number {
  const dq = a[0] - b[0],
    dr = a[1] - b[1];
  return (Math.abs(dq) + Math.abs(dq + dr) + Math.abs(dr)) / 2;
}
export function pixelToAxial(x: number, y: number): Axial {
  const q = ((2 / 3) * x) / C,
    r = ((-1 / 3) * x + (SQ3 / 3) * y) / C;
  const cx = q,
    cz = r,
    cy = -cx - cz;
  let rx = Math.round(cx),
    ry = Math.round(cy),
    rz = Math.round(cz);
  const dx = Math.abs(rx - cx),
    dy = Math.abs(ry - cy),
    dz = Math.abs(rz - cz);
  if (dx > dy && dx > dz) rx = -ry - rz;
  else if (dy > dz) ry = -rx - rz;
  else rz = -rx - ry;
  return [rx, rz];
}

/* ---------------- geografia ---------------- */
export function spiral(radius: number): Axial[] {
  const out: Axial[] = [[0, 0]];
  let q: number, r: number;
  for (let k = 1; k <= radius; k++) {
    q = DIRS[4]![0] * k;
    r = DIRS[4]![1] * k;
    for (let i = 0; i < 6; i++)
      for (let j = 0; j < k; j++) {
        out.push([q, r]);
        q += DIRS[i]![0];
        r += DIRS[i]![1];
      }
  }
  return out;
}
