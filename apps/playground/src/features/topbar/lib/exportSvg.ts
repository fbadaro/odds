import type { Box } from "../../../lib/selection";

const NS = "http://www.w3.org/2000/svg";
const SELECTION = ["on", "fade", "lit", "focus", "mute", "hot", "subhot"];

/**
 * O mapa inteiro, em repouso, com o tema e os marcadores.
 * `viewBox` é o quadro completo da geometria, nunca o da câmera.
 */
export function buildExportSvg(
  svg: SVGSVGElement,
  viewBox: Box,
  view: "flow" | "contain",
  theme: "light" | "dark",
  css: string,
): string {
  const inner = svg.cloneNode(true) as SVGSVGElement;
  inner.setAttribute("viewBox", viewBox.join(" "));
  // um <svg> aninhado sem x/y/width/height fica na origem 0 0 do de fora; o quadro começa em minX, minY
  (["x", "y", "width", "height"] as const).forEach((k, i) => inner.setAttribute(k, String(viewBox[i])));
  inner.setAttribute("class", view === "flow" ? "v-flow" : "v-contain");
  for (const el of inner.querySelectorAll(SELECTION.map((c) => `.${c}`).join(", "))) {
    el.classList.remove(...SELECTION);
    if (el.classList.length === 0) el.removeAttribute("class");
  }

  const out = document.createElementNS(NS, "svg");
  // o xmlns sai do serializador, pelo namespace; setAttribute("xmlns") o duplicaria (XML inválido)
  out.setAttribute("class", "odds-map");
  out.setAttribute("data-theme", theme);
  out.setAttribute("viewBox", viewBox.join(" "));
  out.setAttribute("width", viewBox[2].toFixed(0));
  out.setAttribute("height", viewBox[3].toFixed(0));
  const style = document.createElementNS(NS, "style");
  style.textContent = css;
  out.append(style, inner);
  return new XMLSerializer().serializeToString(out);
}
