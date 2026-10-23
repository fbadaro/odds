import type { Geometry } from "@odds/layout";

/**
 * O `flip` da bancada: cada peça que mudou de lugar começa onde estava e desliza para
 * o novo lugar; a que não existia nasce (`born`) e chega por fade, como o chão e as
 * linhas (`lv-enter`). As transições estão no honeycomb.css.
 */
export function flip(svg: SVGSVGElement, prev: Geometry["tiles"], next: Geometry["tiles"]): void {
  svg.classList.add("lv-anim", "lv-enter");
  const dxy: Record<string, [number, number]> = {};
  svg.querySelectorAll<SVGGElement>("g.node").forEach((g) => {
    const id = g.getAttribute("data-ctx") ?? "", a = prev[id], b = next[id];
    if (!a || !b) { g.classList.add("born"); return; }
    const dx = a[0] - b[0], dy = a[1] - b[1];
    if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
      dxy[id] = [dx, dy];
      g.style.transform = `translate(${dx}px,${dy}px)`;
    }
  });
  svg.querySelectorAll<SVGTextElement>("text.cnm").forEach((t) => {
    const d = dxy[t.textContent ?? ""];
    if (d) t.style.transform = `translate(${d[0]}px,${d[1]}px)`;
  });
  svg.getBoundingClientRect(); // o ponto de partida entra no layout antes da transição
  requestAnimationFrame(() => {
    svg.classList.remove("lv-enter");
    svg.querySelectorAll<SVGElement>("g.node, text.cnm").forEach((el) => { el.style.transform = ""; });
  });
}
