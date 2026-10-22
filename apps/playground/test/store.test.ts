import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { layout, renderSvg } from "@odds/layout";
import { marketplace } from "@odds/layout/fixtures";
import { PAUSE_MS, createPlaygroundStore } from "../src/stores/playground";

// pass-through spies, so a single test can make the layout throw
vi.mock("@odds/layout", async (orig) => {
  const m = await orig<typeof import("@odds/layout")>();
  return { ...m, layout: vi.fn(m.layout), renderSvg: vi.fn(m.renderSvg) };
});

const base = marketplace().text;
const boom = () => {
  throw new Error("boom");
};
/** The diagnostic markers renderSvg drew (badges carry data-diag). */
const markers = (svg: string) => (svg.match(/class="badge"/g) ?? []).length;

/** A tag swapped for another one on the same side: same topology, new markers. */
function tagSwapped(text: string): string {
  const m = /\[(ACL|OHS|CF)\]/.exec(text);
  if (!m) throw new Error("no swappable tag in the fixture");
  const to = m[1] === "ACL" ? "CF" : "ACL";
  return text.slice(0, m.index) + `[${to}]` + text.slice(m.index + m[0].length);
}
/** A new context in the first subdomain: new topology. */
function withContext(text: string, name = "ZZNovo"): string {
  const i = text.indexOf("context ");
  const lineStart = text.lastIndexOf("\n", i) + 1;
  const indent = text.slice(lineStart, i);
  return text.slice(0, lineStart) + `${indent}context ${name}\n` + text.slice(lineStart);
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("the text cycle", () => {
  it("starts with marketplace, drawn at once, no diagnostics", () => {
    const s = createPlaygroundStore();
    const st = s.getState();
    expect(st.text).toBe(base);
    expect(st.drawing).not.toBeNull();
    expect(st.stale).toBe(false);
    expect(st.waiting).toBe(false);
    expect(st.analysis.counts).toEqual({ error: 0, warning: 0, info: 0 });
  });

  it("same topology, other markers: the svg changes on the spot", () => {
    const s = createPlaygroundStore();
    const before = s.getState().drawing!;
    s.getState().setText(tagSwapped(base));
    const after = s.getState().drawing!;
    expect(after.svg).not.toBe(before.svg);
    expect(s.getState().waiting).toBe(false);
  });

  it("new topology waits the pause", () => {
    const s = createPlaygroundStore();
    const topo0 = s.getState().drawing!.topo;
    s.getState().setText(withContext(base));
    expect(s.getState().waiting).toBe(true);
    vi.advanceTimersByTime(PAUSE_MS - 1);
    expect(s.getState().drawing!.topo).toBe(topo0);
    vi.advanceTimersByTime(1);
    expect(s.getState().drawing!.topo).not.toBe(topo0);
    expect(s.getState().waiting).toBe(false);
  });

  it("the timer restarts on each new topology: only the second is drawn", () => {
    const s = createPlaygroundStore();
    s.getState().setText(withContext(base, "AAUm"));
    vi.advanceTimersByTime(100);
    s.getState().setText(withContext(base, "BBDois"));
    vi.advanceTimersByTime(PAUSE_MS - 1);
    expect(s.getState().waiting).toBe(true);
    vi.advanceTimersByTime(1);
    const svg = s.getState().drawing!.svg;
    expect(svg).toContain("BBDois");
    expect(svg).not.toContain("AAUm");
  });

  it("a return to the drawn topology cancels the pending timer", () => {
    const s = createPlaygroundStore();
    const drawn = s.getState().drawing!;
    s.getState().setText(withContext(base));
    expect(s.getState().waiting).toBe(true);
    s.getState().setText(base);
    expect(s.getState().waiting).toBe(false);
    vi.advanceTimersByTime(PAUSE_MS * 2);
    expect(s.getState().drawing!.topo).toBe(drawn.topo);
    expect(s.getState().drawing!.geo).toBe(drawn.geo);
  });

  it("a syntax error freezes the same drawing, marked stale; fixing unfreezes", () => {
    const s = createPlaygroundStore();
    const before = s.getState().drawing;
    s.getState().setText(base + "\ndomain {");
    expect(s.getState().stale).toBe(true);
    expect(s.getState().drawing).toBe(before);
    expect(s.getState().analysis.counts.error).toBe(1);
    s.getState().setText(base);
    expect(s.getState().stale).toBe(false);
  });

  it("a text that never had a tree: no drawing, not stale, no throw", () => {
    const s = createPlaygroundStore("domain {");
    expect(s.getState().drawing).toBeNull();
    expect(s.getState().stale).toBe(false);
    expect(() => s.getState().setText("domain {{")).not.toThrow();
    expect(s.getState().drawing).toBeNull();
  });

  it("a text with a tree but nothing to draw: drawing null, not stale", () => {
    const s = createPlaygroundStore();
    s.getState().setText("");
    expect(s.getState().analysis.astGenerated).toBe(true);
    expect(s.getState().drawing).toBeNull();
    expect(s.getState().stale).toBe(false);
    expect(s.getState().waiting).toBe(false);
  });

  it("a syntax error during the pause: the pending layout lands, still stale", () => {
    const s = createPlaygroundStore();
    const topo0 = s.getState().drawing!.topo;
    s.getState().setText(withContext(base));
    s.getState().setText(withContext(base) + "\ndomain {");
    expect(s.getState().waiting).toBe(true);
    vi.advanceTimersByTime(PAUSE_MS);
    expect(s.getState().stale).toBe(true);
    expect(s.getState().waiting).toBe(false);
    expect(s.getState().drawing!.topo).not.toBe(topo0);
    s.getState().setText(withContext(base));
    expect(s.getState().stale).toBe(false);
  });

  it("markers follow the text while the geometry waits", () => {
    const s = createPlaygroundStore();
    const topo0 = s.getState().drawing!.topo;
    const grown = withContext(base);
    s.getState().setText(grown);
    const svg1 = s.getState().drawing!.svg;
    // a repeated line on an existing pair: same pending topology, new diagnostic on a drawn edge
    const line = /^\s*Affiliates.*Campaigns.*$/m.exec(grown);
    if (!line) throw new Error("no Affiliates/Campaigns line in the fixture");
    s.getState().setText(grown.replace(line[0], line[0] + "\n" + line[0]));
    expect(s.getState().waiting).toBe(true);
    expect(s.getState().analysis.diagnostics.length).toBeGreaterThan(0);
    expect(s.getState().drawing!.svg).not.toBe(svg1);
    expect(s.getState().drawing!.topo).toBe(topo0);
  });

  it("each store keeps its own lastType", () => {
    const src = (type: string) => `domain T {\n  subdomain ${type} S {\n    context C\n  }\n}\n`;
    const typeOf = (st: ReturnType<typeof createPlaygroundStore>) => st.getState().analysis.model!.domains[0]!.subdomains[0]!.type;
    const a = createPlaygroundStore(src("core"));
    const b = createPlaygroundStore(src("critical"));
    expect(typeOf(b)).toBe("generic");
    a.getState().setText(src("critical"));
    expect(typeOf(a)).toBe("core");
    expect(typeOf(b)).toBe("generic");
  });

  it("each store keeps its own timers", () => {
    const a = createPlaygroundStore();
    const b = createPlaygroundStore();
    a.getState().setText(withContext(base));
    expect(a.getState().waiting).toBe(true);
    expect(b.getState().waiting).toBe(false);
  });
});

describe("a layout failure (the bench's try/catch around runLayout)", () => {
  afterEach(() => {
    // drop any unconsumed once-throw; mockReset goes back to the pass-through given to vi.fn
    vi.mocked(layout).mockReset();
    vi.mocked(renderSvg).mockReset();
  });

  it("setText does not throw: text and counts follow the keystroke, the drawing stays, the flag holds the message", () => {
    const s = createPlaygroundStore();
    const before = s.getState().drawing;
    const broken = tagSwapped(base).replace(/^(\s*Affiliates.*Campaigns.*)$/m, "$1\n$1");
    vi.mocked(layout).mockImplementationOnce(boom);
    expect(() => s.getState().setText(broken)).not.toThrow();
    const st = s.getState();
    expect(st.text).toBe(broken);
    expect(st.analysis.counts.error).toBeGreaterThan(0);
    expect(st.drawing).toBe(before);
    expect(st.layoutError).toBe("boom");
    expect(st.waiting).toBe(false);
    expect(st.stale).toBe(false);
    // the next successful draw clears the flag
    s.getState().setText(base);
    expect(s.getState().layoutError).toBeNull();
    expect(s.getState().drawing).not.toBe(before);
  });

  it("a throw in renderSvg is caught the same way", () => {
    const s = createPlaygroundStore();
    const before = s.getState().drawing;
    vi.mocked(renderSvg).mockImplementationOnce(boom);
    expect(() => s.getState().setText(tagSwapped(base))).not.toThrow();
    expect(s.getState().text).toBe(tagSwapped(base));
    expect(s.getState().drawing).toBe(before);
    expect(s.getState().layoutError).toBe("boom");
  });

  it("a throw when the pause flushes: waiting clears, the old drawing stays, no exception escapes the timer", () => {
    const s = createPlaygroundStore();
    const before = s.getState().drawing!;
    s.getState().setText(withContext(base));
    expect(s.getState().waiting).toBe(true);
    vi.mocked(layout).mockImplementationOnce(boom);
    expect(() => vi.advanceTimersByTime(PAUSE_MS)).not.toThrow();
    expect(s.getState().waiting).toBe(false);
    expect(s.getState().drawing!.geo).toBe(before.geo);
    expect(s.getState().layoutError).toBe("boom");
  });

  it("a throw on the initial draw: no drawing, the flag set, the store still built", () => {
    vi.mocked(layout).mockImplementationOnce(boom);
    const s = createPlaygroundStore();
    expect(s.getState().drawing).toBeNull();
    expect(s.getState().layoutError).toBe("boom");
    s.getState().setText(base);
    expect(s.getState().drawing).not.toBeNull();
    expect(s.getState().layoutError).toBeNull();
  });
});

describe("a late flush while the text is broken (the bench's flush paints lastDiags)", () => {
  it("keeps the last tree's markers, not the syntax error's", () => {
    const s = createPlaygroundStore();
    // a drawn map with markers: a repeated line on a drawn pair
    const line = /^\s*Affiliates.*Campaigns.*$/m.exec(base)!;
    const marked = base.replace(line[0], line[0] + "\n" + line[0]);
    s.getState().setText(marked);
    expect(markers(s.getState().drawing!.svg)).toBeGreaterThan(0);
    // topology change (the new context brings its own marker), then a syntax error before the pause ends
    const grown = withContext(marked);
    s.getState().setText(grown);
    const { model: grownModel, diagnostics: treeDiags } = s.getState().analysis;
    s.getState().setText(grown + "\ndomain {");
    vi.advanceTimersByTime(PAUSE_MS);
    const st = s.getState();
    expect(st.stale).toBe(true);
    // what the bench's flush paints: the pending geometry with the last tree's diagnostics
    const bench = renderSvg(layout(grownModel!), treeDiags, st.view);
    const syntaxOnly = renderSvg(layout(grownModel!), st.analysis.diagnostics, st.view);
    expect(markers(bench)).toBeGreaterThan(markers(syntaxOnly));
    expect(markers(st.drawing!.svg)).toBe(markers(bench));
    expect(st.drawing!.svg).toBe(bench);
  });
});
