import { describe, expect, it } from "vitest";
import { legendOf } from "../src/features/help/lib/legend";
import { createPlaygroundStore } from "../src/stores/playground";

describe("legendOf", () => {
  it("counts subdomains per type and external contexts", () => {
    const nav = createPlaygroundStore().getState().drawing!.nav;
    const by = (t: string) => Object.values(nav.subs).filter((s) => s.type === t).length;
    const ext = Object.keys(nav.tiles).filter((id) => !nav.ctxSub[id]).length;
    const legend = legendOf(nav);
    expect(legend.external).toBe(ext);
    const expected = (["core", "supporting", "generic"] as const)
      .map((type) => ({ type, count: by(type) }))
      .filter((r) => r.count > 0);
    expect(legend.types).toEqual(expected);
    expect(legend.types.length).toBeGreaterThan(0);
  });

  it("counts a tile with no ctxSub entry as external", () => {
    const nav = { subs: {}, tiles: { x: {}, y: {} }, ctxSub: { y: "D/a" } } as never;
    expect(legendOf(nav)).toEqual({ types: [], external: 1 });
  });

  it("leaves out empty types", () => {
    const nav = { subs: { "D/a": { type: "generic" } }, tiles: { x: {} }, ctxSub: { x: "D/a" } } as never;
    expect(legendOf(nav)).toEqual({ types: [{ type: "generic", count: 1 }], external: 0 });
  });
});
