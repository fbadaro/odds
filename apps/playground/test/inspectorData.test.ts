import { describe, expect, it } from "vitest";
import { parseAndValidate } from "@odds/core";
import { inspectorDataOf, relLabel, roleText, type RelInfo } from "../src/features/inspector/lib/inspectorData";
import { FORMS, TAGS } from "../src/features/inspector/lib/glossary";
import { MODELS } from "../src/lib/models";

const TEXT = `domain Shop {
  title: "Loja"
  subdomain core Sales {
    title: "Vendas"
    description: "Vender"
    owner: "Comercial"
    context Cart {
      title: "Carrinho"
      team: "Squad"
      responsibilities: ["Manter itens"]
    }
    context Checkout {}
  }
  external {
    context Stripe { technology: "REST" }
  }
  mapping {
    Cart [OHS] --> [ACL] Checkout
    Checkout <-- Cart
    Checkout [ACL] <-- Stripe
  }
}
`;

const rel = (c: RelInfo["c"]): RelInfo => ({ rk: "A|B", l: "A", lt: [], c, rt: [], r: "B", line: 1 });

describe("inspectorDataOf", () => {
  it("inspectorDataOf collects contexts, subdomains and the first line of each relation pair", () => {
    const f = inspectorDataOf(parseAndValidate(TEXT).ast!);
    expect(f.dom).toBe("Loja");
    expect(f.sub["Shop/Sales"]).toEqual({ title: "Vendas", description: "Vender", owner: "Comercial", line: 3 });
    expect(f.ctx.Cart).toEqual({ title: "Carrinho", team: "Squad", responsibilities: ["Manter itens"], line: 7 });
    expect(f.ctx.Checkout).toEqual({ line: 12 });
    expect(f.ctx.Stripe).toEqual({ technology: "REST", line: 15 });
    // one pair, one relation: the second line for Cart/Checkout does not replace the first
    expect(Object.keys(f.rels).sort()).toEqual(["Cart|Checkout", "Checkout|Stripe"]);
    expect(f.rels["Cart|Checkout"]).toEqual({ rk: "Cart|Checkout", l: "Cart", lt: ["OHS"], c: "-->", rt: ["ACL"], r: "Checkout", line: 18 });
  });

  it("the domain falls back to its name without a title", () => {
    const f = inspectorDataOf(parseAndValidate(TEXT.replace('  title: "Loja"\n', "")).ast!);
    expect(f.dom).toBe("Shop");
  });

  it("reads the m50 model", () => {
    const f = inspectorDataOf(parseAndValidate(MODELS.m50.text).ast!);
    expect(f.rels["Inventory|Shipping"]!.lt).toEqual(["SK"]);
    expect(f.ctx.Catalog!.type).toBe("aggregate");
  });
});

describe("relLabel", () => {
  it("relLabel orders by direction", () => {
    const f = inspectorDataOf(parseAndValidate(TEXT).ast!);
    expect(relLabel("Cart|Checkout", f)).toBe("Cart → Checkout");
    // `<--`: the right side is upstream, so it comes first
    expect(relLabel("Checkout|Stripe", f)).toBe("Stripe → Checkout");
    const with_ = (c: RelInfo["c"]) => ({ ...f, rels: { "A|B": rel(c) } });
    expect(relLabel("A|B", with_("<->"))).toBe("A ⇄ B");
    expect(relLabel("A|B", with_("-x-"))).toBe("A ✕ B");
    expect(relLabel("X|Y", f)).toBe("X · Y");
    expect(relLabel("X|Y", null)).toBe("X · Y");
  });
});

describe("roleText", () => {
  it("roleText", () => {
    expect(roleText(rel("-->"), "A")).toBe("upstream de B");
    expect(roleText(rel("-->"), "B")).toBe("downstream de A");
    expect(roleText(rel("<--"), "A")).toBe("downstream de B");
    expect(roleText(rel("<--"), "B")).toBe("upstream de A");
    expect(roleText(rel("<->"), "A")).toBe("mutuamente dependentes");
    expect(roleText(rel("-x-"), "B")).toBe("caminhos separados: decisão, não falha");
  });
});

describe("glossary", () => {
  it("has the nine tags and the four forms of the bench", () => {
    expect(Object.keys(TAGS).sort()).toEqual(["ACL", "BBM", "C", "CF", "OHS", "P", "PL", "S", "SK"]);
    expect(TAGS.SK).toEqual(["Shared Kernel", "Os dois times dividem um modelo pequeno e comum, com dado e comportamento."]);
    expect(FORMS["-x-"]![0]).toBe("Separate Ways");
    expect(FORMS["-->"]).toEqual(FORMS["<--"]);
  });
});
