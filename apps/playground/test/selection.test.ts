import { describe, expect, it } from "vitest";
import { parseAndValidate } from "@odds/core";
import { layout, modelOf, navOf } from "@odds/layout";
import { MODELS } from "../src/lib/models";
import { aliveSelection, escapeSelection, framePoints, pairKey, relationClick } from "../src/lib/selection";

const nav = navOf(layout(modelOf(parseAndValidate(MODELS.m17.text).ast!, "vendas.odds", new Map())));
const [rk, a, b] = nav.rels[0]!;
const lonely = Object.keys(nav.tiles).find((id) => id !== a && id !== b && !nav.near[id]!.includes(a) && !nav.near[a]!.includes(id));

describe("selection", () => {
  it("pairKey is the unordered pair", () => {
    expect(pairKey(a, b)).toBe(rk);
    expect(pairKey(b, a)).toBe(rk);
  });

  it("aliveSelection drops a context that left the map", () => {
    expect(aliveSelection({ ctx: "Nope" }, nav)).toBeNull();
    expect(aliveSelection({ sub: "Nope/Nope" }, nav)).toBeNull();
    expect(aliveSelection({ rel: "Nope|Zed", from: null }, nav)).toBeNull();
  });

  it("aliveSelection keeps a living selection as the same object", () => {
    const sel = { ctx: a };
    expect(aliveSelection(sel, nav)).toBe(sel);
    expect(aliveSelection(null, nav)).toBeNull();
  });

  it("aliveSelection keeps a relation but forgets a vanished origin", () => {
    expect(aliveSelection({ rel: rk, from: "Nope" }, nav)).toEqual({ rel: rk, from: null });
  });

  it("framePoints of a context is the context plus its neighbours", () => {
    const pts = framePoints({ ctx: a }, nav)!;
    expect(pts).toHaveLength(1 + nav.near[a]!.length);
    expect(pts[0]).toEqual(nav.tiles[a]);
  });

  it("framePoints of a subdomain is its cells; of a relation alone, its two ends", () => {
    const key = Object.keys(nav.subs)[0]!;
    expect(framePoints({ sub: key }, nav)).toEqual(nav.subs[key]!.cells);
    expect(framePoints({ rel: rk, from: null }, nav)).toEqual([nav.tiles[a], nav.tiles[b]]);
  });

  it("framePoints of a relation seen from a context is null", () => {
    expect(framePoints({ rel: rk, from: a }, nav)).toBeNull();
    expect(framePoints(null, nav)).toBeNull();
    expect(framePoints({ ctx: "Nope" }, nav)).toBeNull();
  });

  it("relationClick toggles: same relation from a context goes back to the context", () => {
    expect(relationClick({ rel: rk, from: a }, rk, nav)).toEqual({ ctx: a });
    expect(relationClick({ rel: rk, from: null }, rk, nav)).toBeNull();
  });

  it("relationClick from a context that touches it keeps the origin", () => {
    expect(relationClick({ ctx: a }, rk, nav)).toEqual({ rel: rk, from: a });
    expect(relationClick({ rel: "x", from: b }, rk, nav)).toEqual({ rel: rk, from: b });
  });

  it("relationClick from elsewhere has no origin; an unknown relation changes nothing", () => {
    expect(relationClick(null, rk, nav)).toEqual({ rel: rk, from: null });
    if (lonely) expect(relationClick({ ctx: lonely }, rk, nav)).toEqual({ rel: rk, from: null });
    const sel = { ctx: a };
    expect(relationClick(sel, "Nope|Zed", nav)).toBe(sel);
  });

  it("escapeSelection steps back from relation to origin, then to nothing", () => {
    const back = escapeSelection({ rel: rk, from: a });
    expect(back).toEqual({ ctx: a });
    expect(escapeSelection(back)).toBeNull();
    expect(escapeSelection({ rel: rk, from: null })).toBeNull();
    expect(escapeSelection({ sub: "x" })).toBeNull();
    expect(escapeSelection(null)).toBeNull();
  });
});
