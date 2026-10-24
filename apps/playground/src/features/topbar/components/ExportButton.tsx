import tokens from "../../../styles/tokens.css?raw";
import bridge from "../../../styles/map-bridge.css?raw";
import mapBase from "@odds/layout/map.css?raw";
import honeycomb from "../../honeycomb/honeycomb.css?raw";
import { Button } from "../../../components/button/Button";
import { Tooltip } from "../../../components/ui/Tooltip";
import { MODELS } from "../../../lib/models";
import { usePlayground } from "../../../stores/playground";
import { buildExportSvg } from "../lib/exportSvg";

const CSS = [tokens, mapBase, bridge, honeycomb].join("\n");

/** Exporta o mapa inteiro, com os marcadores, num .svg que se basta (bancada: btnExport). */
export function ExportButton() {
  const showToast = usePlayground((s) => s.showToast);

  function onExport() {
    const { drawing, view, theme, markers, modelKey } = usePlayground.getState();
    const svg = document.querySelector<SVGSVGElement>('[data-feature="map"] svg');
    if (!svg || !drawing) return;
    const viewBox = drawing.geo.viewBox ?? drawing.fit;
    const markup = buildExportSvg(svg, [...viewBox], view.view, theme, CSS);
    const blob = new Blob([markup], { type: "image/svg+xml" });
    const name = MODELS[modelKey].file.replace(/\.odds$/, "") + ".svg";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    const n = markers.length;
    showToast(`Exportado: ${name}, com ${n} marcador${n === 1 ? "" : "es"}.`);
  }

  return (
    <Tooltip label="Exportar SVG, com os marcadores">
      <Button data-feature="export-svg" aria-label="Exportar SVG" onClick={onExport}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M8 2.5V10M5 7l3 3 3-3M3 13h10" />
        </svg>
      </Button>
    </Tooltip>
  );
}
