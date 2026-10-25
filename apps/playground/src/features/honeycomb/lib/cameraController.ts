import type { Box, Point } from "../../../lib/selection";
import { camFor, clampCam, ease, fitCam, frameOf, isFar, pan, safeArea, zoomAt, zoomPercent, type RectLike, type Viewport } from "./camera";

export interface CameraController {
  /** Um SVG novo no mapa (o `paint` da bancada); `animate` é o FLIP do `relayout`. */
  setDrawing(svg: SVGSVGElement, fit: Box, animate: boolean): void;
  /** O `frameTo` da bancada: enquadra os pontos na área livre, em 420 ms. */
  frame(pts: Point[]): void;
  /** O `toFit` da bancada: o mapa inteiro, e a câmera volta a ser automática. */
  fit(): void;
  /** Zoom no centro da área livre. */
  zoomMid(f: number): void;
  /** Zoom com o ponto (px, py) do mapa fixo. */
  zoomAtPx(f: number, px: number, py: number): void;
  pan(dx: number, dy: number): void;
  /** Painel ou inspetor abriu ou fechou: quem não mexeu na câmera segue vendo o mapa inteiro. */
  safeChanged(): void;
  /** Um arquivo novo: a câmera volta a ser automática e enquadra o mapa inteiro, sem animar. */
  reset(): void;
  destroy(): void;
}

export interface CameraOptions {
  reducedMotion: boolean;
  /** Chamado só quando a porcentagem arredondada muda. */
  onZoomPct(pct: number): void;
}

/**
 * A câmera da bancada (`apply`, `go`, `frameTo`, `toFit`, `safeChanged` e o
 * `ResizeObserver`): só o `viewBox` muda, e `camAuto` quer dizer "quem navega ainda não
 * mexeu". Todo enquadramento mira a área livre que trilho, painel e inspetor deixam.
 * Fica fora do store: só a porcentagem de zoom é publicada.
 */
export function createCameraController(mapEl: HTMLElement, opts: CameraOptions): CameraController {
  const doc = mapEl.ownerDocument;
  let svg: SVGSVGElement | null = null;
  let fitBox: Box | null = null;
  let cam: Box | null = null;
  let camAuto = true;
  let anim: number | null = null;
  let pct: number | null = null;

  const W = () => Math.max(mapEl.clientWidth, 1), H = () => Math.max(mapEl.clientHeight, 1);
  const rectOf = (el: Element | null | undefined): RectLike | null =>
    el && !(el as HTMLElement).hidden ? el.getBoundingClientRect() : null;
  const vp = (): Viewport => {
    const w = W(), h = H();
    const panel = [...doc.querySelectorAll('[data-feature^="panel-"]')].find((el) => !(el as HTMLElement).hidden);
    const safe = safeArea(w, h, rectOf(doc.querySelector('[data-feature="rail"]')), rectOf(panel), rectOf(doc.querySelector('[data-feature="inspector"]')));
    return { w, h, safe };
  };

  const apply = (c: Box) => {
    cam = c;
    if (!svg || !fitBox) return;
    const v = vp();
    svg.setAttribute("viewBox", c.map((x) => x.toFixed(2)).join(" "));
    mapEl.style.setProperty("--k", (c[2] / v.w).toFixed(4));
    svg.classList.toggle("far", isFar(c, v));
    const p = zoomPercent(c, fitBox, v);
    if (p !== pct) {
      pct = p;
      opts.onZoomPct(p);
    }
  };
  const stop = () => {
    if (anim !== null) cancelAnimationFrame(anim);
    anim = null;
  };
  const go = (target: Box, ms: number) => {
    if (!fitBox) return;
    const to = clampCam(target, fitBox, vp());
    stop();
    if (opts.reducedMotion || !ms || !cam) { apply(to); return; }
    const from = cam.slice() as Box, t0 = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / ms), k = ease(t);
      apply(from.map((x, i) => x + (to[i]! - x) * k) as Box);
      anim = t < 1 ? requestAnimationFrame(step) : null;
    };
    step(t0);
  };
  const fitNow = () => fitCam(fitBox!, vp());

  const zoomAtPx = (f: number, px: number, py: number) => {
    if (!cam || !fitBox) return;
    camAuto = false;
    go(zoomAt(cam, f, px, py, fitBox, vp()), 0);
  };

  // a janela mudou: a câmera automática reenquadra; a manual mantém a escala e o centro
  let lastW = W();
  const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => {
    if (!cam || !fitBox || !lastW) { lastW = W(); return; }
    if (camAuto) { lastW = W(); apply(fitNow()); return; }
    const s = cam[2] / lastW, w = W() * s, h = w / (W() / H());
    lastW = W();
    apply(clampCam([cam[0] + cam[2] / 2 - w / 2, cam[1] + cam[3] / 2 - h / 2, w, h], fitBox, vp()));
  });
  ro?.observe(mapEl);

  return {
    setDrawing(next, fit, animate) {
      const camWas = cam && (cam.slice() as Box), hadFit = fitBox !== null;
      svg = next;
      fitBox = fit;
      if (!cam || camAuto) cam = fitNow();
      apply(clampCam(cam, fit, vp()));
      // a topologia mudou e ninguém mexeu na câmera: do enquadramento anterior para o novo
      if (animate && camAuto && camWas && hadFit) {
        apply(clampCam(camWas, fit, vp()));
        go(fitNow(), 460);
      }
    },
    frame(pts) {
      if (!fitBox || pts.length === 0) return;
      const v = vp();
      camAuto = false;
      go(camFor(frameOf(pts, fitBox, v.safe.w / v.safe.h), v), 420);
    },
    fit() {
      if (!fitBox) return;
      camAuto = true;
      go(fitNow(), 380);
    },
    zoomMid(f) {
      const s = vp().safe;
      zoomAtPx(f, s.l + s.w / 2, s.t + s.h / 2);
    },
    zoomAtPx,
    pan(dx, dy) {
      if (!cam || !fitBox) return;
      camAuto = false;
      go(pan(cam, dx, dy, vp()), 0);
    },
    safeChanged() {
      if (camAuto && svg && fitBox) go(fitNow(), 300);
    },
    reset() {
      stop();
      camAuto = true;
      if (svg && fitBox) apply(fitNow());
    },
    destroy() {
      stop();
      ro?.disconnect();
    },
  };
}
