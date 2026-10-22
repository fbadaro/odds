import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { marketplace } from "@odds/layout/fixtures";
import { PAUSE_MS, createPlaygroundStore } from "../src/stores/playground";

const base = marketplace().text;

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

  it("each store keeps its own lastType and timers", () => {
    const a = createPlaygroundStore();
    const b = createPlaygroundStore();
    a.getState().setText(withContext(base));
    expect(b.getState().waiting).toBe(false);
  });
});
