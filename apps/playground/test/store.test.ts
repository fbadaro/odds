import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { layout, renderSvg } from "@odds/layout";
import { marketplace } from "@odds/layout/fixtures";
import { analyze } from "../src/lib/analyze";
import { MODELS } from "../src/lib/models";
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

/** The text without `context Catalog { … }` and without every mapping line that names it. */
function withoutCatalog(text: string): string {
  const out = text.replace(/\n {4}context Catalog \{[\s\S]*?\n {4}\}/, "");
  if (out === text) throw new Error("no Catalog block in the fixture");
  return out
    .split("\n")
    .filter((l) => !(/\bCatalog\b/.test(l) && /(-->|<--|<->|-x-)/.test(l)))
    .join("\n");
}

describe("the document: file, view, last tree", () => {
  it("loadModel swaps text and file and drops the pending pause", () => {
    const s = createPlaygroundStore();
    const m17 = analyze(MODELS.m17.text, MODELS.m17.file, new Map()).keys!.full;
    s.getState().select({ ctx: "Catalog" });
    s.getState().setHover("RetailMarketplace/Discovery");
    const epoch = s.getState().epoch;
    s.getState().setText(withContext(base));
    expect(s.getState().waiting).toBe(true);
    s.getState().loadModel("m17");
    vi.advanceTimersByTime(1000);
    const st = s.getState();
    expect(st.modelKey).toBe("m17");
    expect(st.text).toBe(MODELS.m17.text);
    expect(st.waiting).toBe(false);
    expect(st.drawing!.full).toBe(m17);
    expect(st.drawing!.svg).not.toContain("ZZNovo");
    expect(st.selection).toBeNull();
    expect(st.hover).toBeNull();
    expect(st.epoch).toBe(epoch + 1);
    expect(st.drawing!.prevTiles).toBeNull();
  });

  it("resetText puts the current model's text back", () => {
    const s = createPlaygroundStore();
    s.getState().loadModel("m17");
    s.getState().setText(MODELS.m17.text + "\ndomain {");
    s.getState().resetText();
    expect(s.getState().modelKey).toBe("m17");
    expect(s.getState().text).toBe(MODELS.m17.text);
    expect(s.getState().stale).toBe(false);
  });

  it("a selection whose context is deleted is dropped on the next draw", () => {
    const s = createPlaygroundStore();
    s.getState().select({ ctx: "Catalog" });
    s.getState().setText(withoutCatalog(base));
    expect(s.getState().analysis.astGenerated).toBe(true);
    expect(s.getState().analysis.counts.error).toBe(0);
    // the geometry waits the pause: the old map still has Catalog
    expect(s.getState().waiting).toBe(true);
    expect(s.getState().selection).toEqual({ ctx: "Catalog" });
    s.getState().flush();
    expect(s.getState().drawing!.nav.tiles.Catalog).toBeUndefined();
    expect(s.getState().selection).toBeNull();
  });

  it("a relation keeps itself but forgets an origin that left the map", () => {
    const s = createPlaygroundStore();
    const rk = s.getState().drawing!.nav.relOf["Cart|Checkout"]![0];
    s.getState().select({ rel: rk, from: "Catalog" });
    s.getState().setText(withoutCatalog(base));
    s.getState().flush();
    expect(s.getState().selection).toEqual({ rel: rk, from: null });
  });

  it("syntax error keeps the last ast and markers", () => {
    const s = createPlaygroundStore();
    const line = /^\s*Affiliates.*Campaigns.*$/m.exec(base)!;
    s.getState().setText(base.replace(line[0], line[0] + "\n" + line[0]));
    const { ast, markers: before } = s.getState();
    expect(ast).not.toBeNull();
    expect(before.length).toBeGreaterThan(0);
    s.getState().setText(s.getState().text + "{");
    expect(s.getState().analysis.astGenerated).toBe(false);
    expect(s.getState().ast).toBe(ast);
    expect(s.getState().markers).toBe(before);
  });

  it("setView repaints the current geometry in the other view", () => {
    const s = createPlaygroundStore();
    const before = s.getState().drawing!;
    s.getState().setView("contain");
    const after = s.getState().drawing!;
    expect(s.getState().view.view).toBe("contain");
    expect(after.svg).not.toBe(before.svg);
    expect(after.geo).toBe(before.geo);
    expect(after.nav).toBe(before.nav);
    // the fit is the flow view's: renewed only in the flow view
    expect(after.fit).toEqual(before.fit);
    s.getState().setView("flow");
    expect(s.getState().drawing!.fit).toEqual(s.getState().drawing!.geo.viewBox);
  });

  it("a drawing carries nav and fit; prevTiles only after a pause with a new topology", () => {
    const s = createPlaygroundStore();
    const first = s.getState().drawing!;
    expect(first.prevTiles).toBeNull();
    expect(first.fit).toEqual(first.geo.viewBox);
    expect(first.fit).not.toBe(first.geo.viewBox);
    expect(Object.keys(first.nav.tiles).length).toBe(Object.keys(first.geo.tiles).length);
    s.getState().setText(tagSwapped(base));
    const routed = s.getState().drawing!;
    expect(routed.prevTiles).toBeNull();
    s.getState().setText(withContext(tagSwapped(base)));
    expect(s.getState().drawing!.prevTiles).toBeNull();
    vi.advanceTimersByTime(PAUSE_MS);
    expect(s.getState().drawing!.prevTiles).toBe(routed.geo.tiles);
    expect(s.getState().drawing!.nav.tiles.ZZNovo).toBeDefined();
  });
});

describe("the selection", () => {
  it("select with frame bumps frameSeq; without, it does not", () => {
    const s = createPlaygroundStore();
    const seq = s.getState().frameSeq;
    s.getState().select({ ctx: "Catalog" });
    expect(s.getState().selection).toEqual({ ctx: "Catalog" });
    expect(s.getState().frameSeq).toBe(seq);
    s.getState().select({ ctx: "Cart" }, true);
    expect(s.getState().selection).toEqual({ ctx: "Cart" });
    expect(s.getState().frameSeq).toBe(seq + 1);
  });

  it("clickRelation goes to the relation, framed only when it has no origin, and back", () => {
    const s = createPlaygroundStore();
    const rk = s.getState().drawing!.nav.relOf["Cart|Catalog"]![0];
    s.getState().select({ ctx: "Catalog" });
    const seq = s.getState().frameSeq;
    s.getState().clickRelation(rk);
    expect(s.getState().selection).toEqual({ rel: rk, from: "Catalog" });
    s.getState().clickRelation(rk);
    expect(s.getState().selection).toEqual({ ctx: "Catalog" });
    s.getState().select(null);
    s.getState().clickRelation(rk);
    expect(s.getState().selection).toEqual({ rel: rk, from: null });
    expect(s.getState().frameSeq).toBeGreaterThan(seq);
    const before = s.getState().selection;
    s.getState().clickRelation("Nope|Zed");
    expect(s.getState().selection).toBe(before);
  });

  it("escape steps back from relation to origin, then clears", () => {
    const s = createPlaygroundStore();
    const rk = s.getState().drawing!.nav.relOf["Cart|Catalog"]![0];
    s.getState().select({ rel: rk, from: "Cart" });
    s.getState().escape();
    expect(s.getState().selection).toEqual({ ctx: "Cart" });
    s.getState().escape();
    expect(s.getState().selection).toBeNull();
  });
});

describe("the chrome", () => {
  it("togglePanel opens one at a time and the same name closes", () => {
    const s = createPlaygroundStore();
    expect(s.getState().openPanel).toBeNull();
    s.getState().togglePanel("tree");
    expect(s.getState().openPanel).toBe("tree");
    s.getState().togglePanel("help");
    expect(s.getState().openPanel).toBe("help");
    s.getState().togglePanel("help");
    expect(s.getState().openPanel).toBeNull();
    s.getState().togglePanel("code");
    s.getState().closePanel();
    expect(s.getState().openPanel).toBeNull();
  });

  it("revealInEditor opens the code panel and bumps seq", () => {
    const s = createPlaygroundStore();
    s.getState().togglePanel("tree");
    const start = { line: 3, column: 2 }, end = { line: 3, column: 9 };
    s.getState().revealInEditor(start, end);
    const r1 = s.getState().reveal!;
    expect(s.getState().openPanel).toBe("code");
    expect(r1).toMatchObject({ start, end });
    s.getState().revealInEditor(start, end);
    expect(s.getState().openPanel).toBe("code");
    expect(s.getState().reveal!.seq).toBe(r1.seq + 1);
  });

  it("revealLine reveals the whole line", () => {
    const s = createPlaygroundStore();
    const line2 = base.split("\n")[1]!;
    s.getState().revealLine(2);
    expect(s.getState().reveal).toMatchObject({ start: { line: 2, column: 1 }, end: { line: 2, column: line2.length + 1 } });
    expect(s.getState().openPanel).toBe("code");
  });

  it("toggleFilter reopens a closed list", () => {
    const s = createPlaygroundStore();
    expect(s.getState().filters).toEqual({ error: true, warning: true, info: true });
    expect(s.getState().listOpen).toBe(true);
    s.getState().setListOpen(false);
    s.getState().toggleFilter("warning");
    expect(s.getState().filters).toEqual({ error: true, warning: false, info: true });
    expect(s.getState().listOpen).toBe(true);
    s.getState().toggleFilter("warning");
    expect(s.getState().filters.warning).toBe(true);
  });

  it("toggleAll flips the full list", () => {
    const s = createPlaygroundStore();
    expect(s.getState().allOpen).toBe(false);
    s.getState().toggleAll();
    expect(s.getState().allOpen).toBe(true);
  });

  it("theme, toast, zoom and camera commands are plain state", () => {
    const s = createPlaygroundStore();
    expect(s.getState().theme).toBe("light");
    s.getState().toggleTheme();
    expect(s.getState().theme).toBe("dark");
    s.getState().toggleTheme();
    expect(s.getState().theme).toBe("light");

    expect(s.getState().toast).toBeNull();
    s.getState().showToast("oi");
    const t = s.getState().toast!;
    expect(t.message).toBe("oi");
    s.getState().showToast("oi");
    expect(s.getState().toast!.seq).toBe(t.seq + 1);
    s.getState().dismissToast();
    expect(s.getState().toast).toBeNull();

    s.getState().setZoomPct(140);
    expect(s.getState().zoomPct).toBe(140);

    expect(s.getState().cameraCommand).toBeNull();
    s.getState().commandCamera("in");
    const c = s.getState().cameraCommand!;
    expect(c.kind).toBe("in");
    s.getState().commandCamera("fit");
    expect(s.getState().cameraCommand).toEqual({ kind: "fit", seq: c.seq + 1 });
  });

  it("setHover holds a subdomain key or nothing", () => {
    const s = createPlaygroundStore();
    s.getState().setHover("RetailMarketplace/Sales");
    expect(s.getState().hover).toBe("RetailMarketplace/Sales");
    s.getState().setHover(null);
    expect(s.getState().hover).toBeNull();
  });
});
