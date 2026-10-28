import type { Box, Point } from "../../../lib/selection";

/** Os limites da câmera. */
export const LIM = { pad: 78, maxFrame: 3, maxZoom: 5, tagPx: 1.15 } as const;

/** A área livre, em pixels da tela: o que sobra entre trilho/painel, inspetor, topo e rodapé. */
export interface Safe { l: number; t: number; w: number; h: number }
/** O mapa (w x h, em pixels) e a sua área livre. */
export interface Viewport { w: number; h: number; safe: Safe }
export interface RectLike { left: number; right: number }

/** A área livre; os retângulos são `null` quando o elemento não existe ou está oculto. */
export function safeArea(w: number, h: number, rail: RectLike | null, panel: RectLike | null, inspector: RectLike | null): Safe {
  const narrow = w <= 760;
  let l = 32, r = 32;
  const t = narrow ? 116 : 76, b = narrow ? 124 : 72;
  if (!narrow) {
    if (panel) l = panel.right + 24;
    else if (rail) l = rail.right + 24;
    if (inspector) r = w - inspector.left + 24;
  }
  return { l, t, w: Math.max(w - l - r, 120), h: Math.max(h - t - b, 120) };
}

/** O quadro, com o aspecto da área livre, que enquadra os pontos. */
export function frameOf(pts: Point[], fit: Box, aspect: number): Box {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs) - LIM.pad, x1 = Math.max(...xs) + LIM.pad;
  const y0 = Math.min(...ys) - LIM.pad, y1 = Math.max(...ys) + LIM.pad;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  let w = x1 - x0, h = y1 - y0;
  if (w / h < aspect) w = h * aspect;
  else h = w / aspect;
  const fitW = Math.max(fit[2], fit[3] * aspect);
  const minW = fitW / LIM.maxFrame;
  if (w < minW) { w = minW; h = w / aspect; }
  if (w > fitW) { w = fitW; h = w / aspect; }
  return [cx - w / 2, cy - h / 2, w, h];
}

/** Um quadro com o aspecto da área livre -> a câmera da tela inteira que o põe nela. */
export function camFor(frame: Box, vp: Viewport): Box {
  const s = vp.safe, k = frame[2] / s.w;
  return [frame[0] - s.l * k, frame[1] - s.t * k, vp.w * k, vp.h * k];
}

export function fitFrame(fit: Box, vp: Viewport): Box {
  const a = vp.safe.w / vp.safe.h;
  const w = Math.max(fit[2], fit[3] * a), h = w / a;
  return [fit[0] + fit[2] / 2 - w / 2, fit[1] + fit[3] / 2 - h / 2, w, h];
}

export const fitCam = (fit: Box, vp: Viewport): Box => camFor(fitFrame(fit, vp), vp);
const fitW = (fit: Box, vp: Viewport): number => fitCam(fit, vp)[2];
const pxPerUnit = (c: Box, vp: Viewport): number => vp.w / c[2];

export function clampCam(c: Box, fit: Box, vp: Viewport): Box {
  const fw = fitW(fit, vp);
  const w = Math.min(Math.max(c[2], fw / LIM.maxZoom), fw * 1.4), h = w / (vp.w / vp.h);
  // o centro não se perde no vazio; a folga de 35% da câmera deixa enquadrar uma peça da borda com o painel aberto
  const m = w * 0.35;
  let cx = c[0] + c[2] / 2, cy = c[1] + c[3] / 2;
  cx = Math.min(Math.max(cx, fit[0] - m), fit[0] + fit[2] + m);
  cy = Math.min(Math.max(cy, fit[1] - m), fit[1] + fit[3] + m);
  return [cx - w / 2, cy - h / 2, w, h];
}

/** O ponto (px, py) da tela fica fixo. A largura é limitada aqui; o chamador passa por `clampCam`. */
export function zoomAt(c: Box, factor: number, px: number, py: number, fit: Box, vp: Viewport): Box {
  const fw = fitW(fit, vp);
  const w = Math.min(Math.max(c[2] / factor, fw / LIM.maxZoom), fw * 1.4);
  const k = w / c[2], ux = c[0] + (px / vp.w) * c[2], uy = c[1] + (py / vp.h) * c[3];
  return [ux - (ux - c[0]) * k, uy - (uy - c[1]) * k, w, w / (vp.w / vp.h)];
}

export function pan(c: Box, dxPx: number, dyPx: number, vp: Viewport): Box {
  const s = c[2] / vp.w;
  return [c[0] - dxPx * s, c[1] - dyPx * s, c[2], c[3]];
}

export const zoomPercent = (c: Box, fit: Box, vp: Viewport): number => Math.round((fitW(fit, vp) / c[2]) * 100);
export const isFar = (c: Box, vp: Viewport): boolean => pxPerUnit(c, vp) < LIM.tagPx;
export const ease = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
