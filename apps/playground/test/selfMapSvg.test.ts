// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { layout, renderSvg } from "@odds/layout";
import { describe, expect, it } from "vitest";
import { buildExportSvg } from "../src/features/topbar/lib/exportSvg";
import { analyze } from "../src/lib/analyze";

/**
 * The README's picture of the project: `docs/odds.odds` exported exactly as the
 * Export button does it, once per theme. The SVG files are file snapshots, so the
 * picture can't go stale: change the map, the layout or the styles and this fails
 * until `npm run generate:map` writes them again.
 *
 * Files are read from disk: under vitest a `?raw` CSS import comes back empty.
 * The paths are strings because jsdom replaces the global `URL`.
 */
const at = (p: string) => readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), p), "utf8");
const CSS = [
  at("../src/styles/tokens.css"),
  at("../../../packages/layout/map.css"),
  at("../src/styles/map-bridge.css"),
  at("../src/features/honeycomb/honeycomb.css"),
].join("\n");

function exported(theme: "light" | "dark"): string {
  const analysis = analyze(at("../../../docs/odds.odds"), "odds.odds", new Map());
  const geo = layout(analysis.model!);
  const markup = renderSvg(geo, analysis.diagnostics, { view: "flow", tags: "on", labels: "ctx", sel: null, selSub: null, selDiag: null });
  // parsed as XML: jsdom's HTML parser lowercases feDropShadow, and a filter with no valid primitive hides every piece
  const svg = new DOMParser().parseFromString(markup, "image/svg+xml").documentElement as unknown as SVGSVGElement;
  return buildExportSvg(svg, [...geo.viewBox!], "flow", theme, CSS) + "\n";
}

describe("docs/odds-*.svg", () => {
  it.each(["light", "dark"] as const)("is the exported self-map, %s theme", async (theme) => {
    await expect(exported(theme)).toMatchFileSnapshot(`../../../docs/odds-${theme}.svg`);
  });
});
