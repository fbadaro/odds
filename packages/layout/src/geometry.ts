/**
 * Geometria plana e utilitários da colmeia: distância, segmento × segmento,
 * segmento × caixa, o desempate `tieLess`. Porte literal.
 */
import type { Axial, Box, Point } from "./types.js";

export function esc(s: unknown): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
export function unit(p: Point, q: Point): Point {
  const dx = q[0] - p[0],
    dy = q[1] - p[1],
    L = Math.hypot(dx, dy) || 1;
  return [dx / L, dy / L];
}
export function dist(a: Point, b: Point): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}
export function f(p: Point): string {
  return p[0].toFixed(1) + " " + p[1].toFixed(1);
}
export function add(p: Point, v: Point, s: number): Point {
  return [p[0] + v[0] * s, p[1] + v[1] * s];
}
export function distPS(p: Point, a: Point, b: Point): number {
  const vx = b[0] - a[0],
    vy = b[1] - a[1],
    L2 = vx * vx + vy * vy;
  const t = L2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / L2)) : 0;
  return Math.hypot(p[0] - a[0] - t * vx, p[1] - a[1] - t * vy);
}
export function segX(a: Point, b: Point, c: Point, d: Point): boolean {
  function cr(p: Point, q: Point, r: Point): number {
    return (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  }
  const d1 = cr(c, d, a),
    d2 = cr(c, d, b),
    d3 = cr(a, b, c),
    d4 = cr(a, b, d);
  return d1 * d2 < 0 && d3 * d4 < 0;
}
export function boxHit(a: Box, b: Box): boolean {
  return a[0] < b[0] + b[2] && b[0] < a[0] + a[2] && a[1] < b[1] + b[3] && b[1] < a[1] + a[3];
}
export function segBox(a: Point, b: Point, box: Box): boolean {
  const x0 = box[0],
    y0 = box[1],
    x1 = box[0] + box[2],
    y1 = box[1] + box[3];
  function inside(p: Point): boolean {
    return p[0] >= x0 && p[0] <= x1 && p[1] >= y0 && p[1] <= y1;
  }
  if (inside(a) || inside(b)) return true;
  const c: Point[] = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  for (let i = 0; i < 4; i++) if (segX(a, b, c[i], c[(i + 1) % 4])) return true;
  return false;
}
export function cmp<T extends string | number>(a: T, b: T): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
/* v4: d menor que bd, e no empate (dentro do ruido de ponto flutuante) a celula
   de menor coordenada RELATIVA a base da massa. Desempatar pela ordem de
   varredura, ou deixar o ruido decidir, fazia um dominio transladado pela
   prateleira trocar pecas simetricas de lugar: o ruido depende da posicao
   absoluta, a coordenada relativa nao. A direcao (maior q, depois maior r) e
   arbitraria; das quatro, foi a unica que passou a regua nos dois modelos. */
export function tieLess(d: number, c: Axial, bd: number, bc: Axial | null, base: Axial): boolean {
  if (d < bd - 1e-6) return true;
  if (d > bd + 1e-6 || !bc) return false;
  const a0 = c[0] - base[0],
    b0 = bc[0] - base[0];
  return a0 > b0 || (a0 === b0 && c[1] - base[1] > bc[1] - base[1]);
}
export function pairKey(a: string, b: string): string {
  return a < b ? a + "|" + b : b + "|" + a;
}
export function clone<T>(o: T): T {
  return JSON.parse(JSON.stringify(o));
}
