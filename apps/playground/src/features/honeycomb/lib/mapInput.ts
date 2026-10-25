import type { CameraController } from "./cameraController";

/** O que o mapa pede ao resto da aplicação; o Honeycomb liga isto ao store. */
export interface MapActions {
  /** Há desenho: sem ele, o mapa não reage (o `!cur` da bancada). */
  ready(): boolean;
  /** Clique ou Enter numa peça: seleciona e enquadra o contexto. */
  pickContext(id: string): void;
  pickRelation(rk: string): void;
  /** Clique num território: o mesmo de novo desfaz. */
  pickSubdomain(key: string): void;
  /** Clique no vazio. */
  clear(): void;
  hover(key: string | null): void;
}

const closest = (t: EventTarget | null, sel: string): Element | null => (t instanceof Element ? t.closest(sel) : null);

/**
 * O bloco "mapa: arrasto, roda, teclado" da bancada: arrastar a partir de 4 px move,
 * soltar sem ter arrastado é um clique; a roda do mouse dá zoom, a do trackpad move,
 * e a pinça (`ctrlKey`) dá zoom; `+ = - _ 0` e as setas no teclado. Devolve o desligar.
 */
export function bindMapInput(mapEl: HTMLElement, camera: CameraController, act: MapActions): () => void {
  let drag: { x: number; y: number; moved: boolean; id: number } | null = null;

  const down = (ev: PointerEvent) => {
    if (ev.button !== 0 || !act.ready()) return;
    drag = { x: ev.clientX, y: ev.clientY, moved: false, id: ev.pointerId };
  };
  const move = (ev: PointerEvent) => {
    if (!drag || ev.pointerId !== drag.id) {
      act.hover(closest(ev.target, "g.sub")?.getAttribute("data-sub") ?? null);
      return;
    }
    const dx = ev.clientX - drag.x, dy = ev.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 4) return;
    if (!drag.moved) {
      drag.moved = true;
      // o jsdom não tem setPointerCapture
      if (typeof mapEl.setPointerCapture === "function") {
        try { mapEl.setPointerCapture(ev.pointerId); } catch { /* o ponteiro já saiu */ }
      }
      mapEl.classList.add("dragging");
    }
    drag.x = ev.clientX;
    drag.y = ev.clientY;
    camera.pan(dx, dy);
  };
  const leave = () => {
    if (!drag) act.hover(null);
  };
  const end = (ev: PointerEvent) => {
    if (!drag || ev.pointerId !== drag.id) return;
    const wasDrag = drag.moved;
    drag = null;
    mapEl.classList.remove("dragging");
    if (wasDrag || ev.type === "pointercancel" || !act.ready()) return;
    const node = closest(ev.target, "g.node");
    const rel = !node && closest(ev.target, "g.rel");
    const sub = !node && !rel && closest(ev.target, "g.sub");
    if (node) act.pickContext(node.getAttribute("data-ctx") ?? "");
    else if (rel) act.pickRelation(rel.getAttribute("data-rk") ?? "");
    else if (sub) act.pickSubdomain(sub.getAttribute("data-sub") ?? "");
    else act.clear();
  };
  const wheel = (ev: WheelEvent) => {
    if (!act.ready()) return;
    ev.preventDefault();
    const r = mapEl.getBoundingClientRect(), px = ev.clientX - r.left, py = ev.clientY - r.top;
    // a roda do mouse anda em degraus inteiros e grandes; o trackpad, em frações e nos dois eixos
    const mouse = ev.deltaMode !== 0 || (ev.deltaX === 0 && Math.abs(ev.deltaY) >= 40 && Number.isInteger(ev.deltaY));
    if (ev.ctrlKey || mouse) {
      const dy = ev.deltaMode === 1 ? ev.deltaY * 16 : ev.deltaY;
      camera.zoomAtPx(Math.exp(-dy * (ev.ctrlKey ? 0.01 : 0.0022)), px, py);
    } else camera.pan(-ev.deltaX, -ev.deltaY);
  };
  const key = (ev: KeyboardEvent) => {
    if (!act.ready()) return;
    const k = ev.key, step = 80, node = closest(ev.target, "g.node");
    if ((k === "Enter" || k === " ") && node) {
      ev.preventDefault();
      act.pickContext(node.getAttribute("data-ctx") ?? "");
      return;
    }
    if (k === "+" || k === "=") camera.zoomMid(1.4);
    else if (k === "-" || k === "_") camera.zoomMid(1 / 1.4);
    else if (k === "0") camera.fit();
    else if (k === "ArrowLeft") camera.pan(step, 0);
    else if (k === "ArrowRight") camera.pan(-step, 0);
    else if (k === "ArrowUp") camera.pan(0, step);
    else if (k === "ArrowDown") camera.pan(0, -step);
    else return;
    ev.preventDefault();
  };

  mapEl.addEventListener("pointerdown", down);
  mapEl.addEventListener("pointermove", move);
  mapEl.addEventListener("pointerleave", leave);
  mapEl.addEventListener("pointerup", end);
  mapEl.addEventListener("pointercancel", end);
  mapEl.addEventListener("wheel", wheel, { passive: false });
  mapEl.addEventListener("keydown", key);
  return () => {
    mapEl.removeEventListener("pointerdown", down);
    mapEl.removeEventListener("pointermove", move);
    mapEl.removeEventListener("pointerleave", leave);
    mapEl.removeEventListener("pointerup", end);
    mapEl.removeEventListener("pointercancel", end);
    mapEl.removeEventListener("wheel", wheel);
    mapEl.removeEventListener("keydown", key);
  };
}
