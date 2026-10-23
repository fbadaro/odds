import { beforeAll, describe, expect, it } from "vitest";
import { parseAndValidate } from "@odds/core";
import { layout, modelOf, navOf, renderSvg } from "@odds/layout";
import { MODELS } from "../src/lib/models";
import { paintSelection } from "../src/features/honeycomb/lib/paintSelection";

const geo = layout(modelOf(parseAndValidate(MODELS.m17.text).ast!, "vendas.odds", new Map()));
const nav = navOf(geo);
let svg: SVGSVGElement;

beforeAll(() => {
  const div = document.createElement("div");
  div.innerHTML = renderSvg(geo, [], { view: "flow", tags: "on", labels: "ctx", sel: null, selSub: null, selDiag: null });
  svg = div.querySelector("svg")!;
});

const node = (id: string) => svg.querySelector(`g.node[data-ctx="${id}"]`)!;
const [, a] = nav.rels[0]!;

describe("paintSelection", () => {
  it("a selected context is on, its neighbours are not faded, the rest are", () => {
    paintSelection(svg, nav, { ctx: a }, null);
    expect(node(a).classList.contains("on")).toBe(true);
    for (const n of nav.near[a]!) expect(node(n).classList.contains("fade")).toBe(false);
    const far = Object.keys(nav.tiles).find((id) => id !== a && !nav.near[a]!.includes(id))!;
    expect(node(far).classList.contains("fade")).toBe(true);
    expect(svg.classList.contains("sel-on")).toBe(true);
  });

  it("a relation in focus lights itself and mutes its siblings from the origin", () => {
    const hub = Object.keys(nav.near).find((id) => nav.near[id]!.length >= 2)!;
    const [hrk, hl, hr] = nav.rels.find(([, l, r]) => l === hub || r === hub)!;
    const sibling = nav.rels.find(([k, l, r]) => k !== hrk && (l === hub || r === hub))!;
    paintSelection(svg, nav, { rel: hrk, from: hub }, null);
    const g = svg.querySelector(`g.rel[data-rk="${hrk}"]`)!;
    expect(g.classList.contains("focus")).toBe(true);
    expect(g.classList.contains("lit")).toBe(true);
    const s = svg.querySelector(`g.rel[data-rk="${sibling[0]}"]`)!;
    expect(s.classList.contains("mute")).toBe(true);
    expect(s.classList.contains("fade")).toBe(false);
    expect(node(hl === hub ? hr : hl).classList.contains("fade")).toBe(false);
  });

  it("a selected subdomain marks its territory hot and on", () => {
    const key = Object.keys(nav.subs)[0]!;
    paintSelection(svg, nav, { sub: key }, null);
    const g = svg.querySelector(`g.sub[data-sub="${key}"]`)!;
    expect(g.classList.contains("hot")).toBe(true);
    expect(g.classList.contains("on")).toBe(true);
    expect(svg.querySelector(`g.sublab[data-sub="${key}"]`)!.classList.contains("subhot")).toBe(true);
  });

  it("hover lights a territory without selecting", () => {
    const key = Object.keys(nav.subs)[0]!;
    paintSelection(svg, nav, null, key);
    expect(svg.querySelector(`g.sub[data-sub="${key}"]`)!.classList.contains("hot")).toBe(true);
    expect(svg.querySelector(`g.sub[data-sub="${key}"]`)!.classList.contains("on")).toBe(false);
    expect(svg.classList.contains("sel-on")).toBe(false);
  });

  it("null selection clears every class and sel-on", () => {
    paintSelection(svg, nav, { ctx: a }, null);
    paintSelection(svg, nav, null, null);
    expect(svg.classList.contains("sel-on")).toBe(false);
    expect(svg.querySelectorAll("g.node.on, g.node.fade, g.node.subhot, g.sub.hot, g.sub.on, g.rel.lit, g.rel.fade, g.rel.focus, g.rel.mute, text.cnm.on, text.cnm.fade").length).toBe(0);
  });
});
