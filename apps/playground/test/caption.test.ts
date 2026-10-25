import { describe, expect, it } from "vitest";
import { captionOf } from "../src/features/inspector/lib/caption";
import { inspectorDataOf } from "../src/features/inspector/lib/inspectorData";
import { createPlaygroundStore } from "../src/stores/playground";

const s = createPlaygroundStore().getState();
const nav = s.drawing!.nav;
const f = inspectorDataOf(s.ast!);

describe("captionOf", () => {
  it("nothing selected, no caption", () => {
    expect(captionOf(nav, null, f)).toBeNull();
  });

  it("context caption counts neighbours", () => {
    expect(nav.near.Catalog).toHaveLength(6);
    expect(captionOf(nav, { ctx: "Catalog" }, f)).toEqual({
      name: "Catalog",
      rest: " · 6 vizinhos · clique numa linha para ver só ela · Esc limpa",
    });
    const lone = Object.keys(nav.near).find((id) => nav.near[id]!.length === 1)!;
    expect(captionOf(nav, { ctx: lone }, f)!.rest).toBe(" · 1 vizinho · clique numa linha para ver só ela · Esc limpa");
  });

  it("subdomain caption counts its contexts", () => {
    const key = "RetailMarketplace/Discovery";
    expect(captionOf(nav, { sub: key }, f)).toEqual({ name: nav.subs[key]!.title, rest: " · subdomínio · 4 contextos · Esc limpa" });
  });

  it("relation from a context says how to go back", () => {
    expect(captionOf(nav, { rel: "Catalog|Search", from: "Catalog" }, f)).toEqual({
      name: "Catalog → Search",
      rest: " · relação de Catalog · Esc volta para o contexto",
    });
    expect(captionOf(nav, { rel: "Catalog|Search", from: null }, f)).toEqual({ name: "Catalog → Search", rest: " · relação · Esc limpa" });
  });
});
