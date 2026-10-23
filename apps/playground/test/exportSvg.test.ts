// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { buildExportSvg } from "../src/features/topbar/lib/exportSvg";

const NS = "http://www.w3.org/2000/svg";
function live(): SVGSVGElement {
  const svg = document.createElementNS(NS, "svg") as SVGSVGElement;
  svg.setAttribute("class", "v-flow");
  svg.setAttribute("viewBox", "10 10 50 50");
  svg.innerHTML = '<g class="node on lit focus keep"><rect class="fade mute hot subhot"/></g>';
  return svg;
}

describe("buildExportSvg", () => {
  it("strips selection classes and sets the full viewBox", () => {
    const src = live();
    const out = buildExportSvg(src, [0, 0, 800, 600], "flow", "light", "");
    expect(out).toContain('viewBox="0 0 800 600"');
    expect(out).toContain('width="800"');
    expect(out).toContain('height="600"');
    const doc = new DOMParser().parseFromString(out, "image/svg+xml");
    const g = doc.querySelector("g")!;
    expect(g.getAttribute("class")).toBe("node keep");
    expect(doc.querySelector("rect")!.hasAttribute("class")).toBe(false);
    // the live node is untouched
    expect(src.querySelector("g")!.getAttribute("class")).toContain("on");
  });

  it("embeds the css and the theme", () => {
    const out = buildExportSvg(live(), [0, 0, 10, 10], "flow", "dark", ".x{color:red}");
    const doc = new DOMParser().parseFromString(out, "image/svg+xml");
    const root = doc.documentElement;
    expect(root.namespaceURI).toBe(NS);
    expect(out).toContain(`xmlns="${NS}"`);
    expect(root.getAttribute("class")).toBe("odds-map");
    expect(root.getAttribute("data-theme")).toBe("dark");
    expect(doc.querySelector("style")!.textContent).toContain(".x{color:red}");
  });

  it("names the view class", () => {
    const flow = buildExportSvg(live(), [0, 0, 10, 10], "flow", "light", "");
    const contain = buildExportSvg(live(), [0, 0, 10, 10], "contain", "light", "");
    expect(flow).toContain('class="v-flow"');
    expect(contain).toContain('class="v-contain"');
    expect(contain).not.toContain("v-flow");
  });
});
