import { parseAndValidate, type ProgramNode } from "@odds/core";
import { describe, expect, it } from "vitest";
import { applyInsertion, planInsertion, type CreateRequest } from "../src/features/create/lib/insertion";

const SHOP = `domain Shop {
  subdomain core Sales {
    context Cart
  }

  external {
    context Stripe
  }

  mapping {
    Cart --> Stripe
  }
}
`;

function astOf(text: string): ProgramNode {
  const r = parseAndValidate(text);
  if (!r.astGenerated || !r.ast) throw new Error("fixture has no tree");
  return r.ast;
}

/** The text after the insertion, which must still parse. */
function create(text: string, req: CreateRequest): string {
  const out = applyInsertion(text, planInsertion(text, astOf(text), req));
  expect(parseAndValidate(out).astGenerated).toBe(true);
  return out;
}

describe("planInsertion: a context", () => {
  it("goes at the end of its subdomain, with its siblings' indentation", () => {
    const out = create(SHOP, { kind: "context", domain: 0, parent: "Sales", fields: { name: "Checkout" } });
    expect(out).toContain("    context Cart\n    context Checkout\n  }\n");
  });

  it("writes every field the grammar accepts, title first and in the grammar's order, quotes escaped", () => {
    const out = create(SHOP, {
      kind: "context",
      domain: 0,
      parent: "Sales",
      fields: {
        name: "Pricing",
        technology: "Go",
        team: "Preço",
        maturity: "growing",
        responsibilities: ["Calcular", 'Aplicar "cupom"'],
        description: "Preço final \\ por item",
        type: "policy",
        title: "Precificação",
      },
    });
    expect(out).toContain(
      [
        "    context Cart",
        "    context Pricing {",
        '      title: "Precificação"',
        '      type: "policy"',
        '      description: "Preço final \\\\ por item"',
        '      responsibilities: ["Calcular", "Aplicar \\"cupom\\""]',
        "      maturity: growing",
        '      team: "Preço"',
        '      technology: "Go"',
        "    }",
        "  }",
      ].join("\n"),
    );
  });

  it("leaves out blank fields and an empty list", () => {
    const out = create(SHOP, { kind: "context", domain: 0, parent: "Sales", fields: { name: "Promo", title: "  ", responsibilities: [" ", ""] } });
    expect(out).toContain("    context Cart\n    context Promo\n  }");
  });

  it("indents one step deeper than an empty subdomain", () => {
    const text = SHOP.replace("  external {", "  subdomain supporting Ops {\n  }\n\n  external {");
    const out = create(text, { kind: "context", domain: 0, parent: "Ops", fields: { name: "Dispatch" } });
    expect(out).toContain("  subdomain supporting Ops {\n    context Dispatch\n  }\n");
  });

  it("breaks a block closed on its own line without touching what was there", () => {
    const text = SHOP.replace("  external {", "  subdomain generic Id {}\n\n  external {");
    const out = create(text, { kind: "context", domain: 0, parent: "Id", fields: { name: "Auth" } });
    expect(out).toContain("  subdomain generic Id {\n    context Auth\n  }\n");
  });

  it("goes at the end of external when the parent is external", () => {
    const out = create(SHOP, { kind: "context", domain: 0, parent: null, fields: { name: "Correios" } });
    expect(out).toContain("  external {\n    context Stripe\n    context Correios\n  }\n");
  });

  it("creates external before the mapping when there is none, with blank lines around it", () => {
    const text = SHOP.replace("  external {\n    context Stripe\n  }\n\n", "").replace("Cart --> Stripe", "Cart --> Cart");
    const out = create(text, { kind: "context", domain: 0, parent: null, fields: { name: "Stripe" } });
    expect(out).toBe(`domain Shop {
  subdomain core Sales {
    context Cart
  }

  external {
    context Stripe
  }

  mapping {
    Cart --> Cart
  }
}
`);
  });

  it("reports the lines the new element occupies in the new text", () => {
    const ins = planInsertion(SHOP, astOf(SHOP), { kind: "context", domain: 0, parent: "Sales", fields: { name: "Promo", title: "Promoções" } });
    expect(ins.lines).toEqual([4, 6]);
    const lines = applyInsertion(SHOP, ins).split("\n");
    expect(lines.slice(3, 6)).toEqual(["    context Promo {", '      title: "Promoções"', "    }"]);
  });
});

describe("planInsertion: a subdomain", () => {
  it("goes after the last subdomain, before external, separated by blank lines", () => {
    const out = create(SHOP, {
      kind: "subdomain",
      domain: 0,
      fields: { type: "supporting", name: "Ops", title: "Operações", owner: "Ops Squad", description: "Entregar" },
    });
    expect(out).toContain(
      [
        "    context Cart",
        "  }",
        "",
        "  subdomain supporting Ops {",
        '    title: "Operações"',
        '    description: "Entregar"',
        '    owner: "Ops Squad"',
        "  }",
        "",
        "  external {",
      ].join("\n"),
    );
  });

  it("is the first child of an empty domain, with no blank line after the brace", () => {
    const text = "domain Shop {\n}\n";
    const out = create(text, { kind: "subdomain", domain: 0, fields: { type: "core", name: "Sales" } });
    expect(out).toBe("domain Shop {\n  subdomain core Sales {\n  }\n}\n");
  });

  it("follows the file's indentation unit", () => {
    const text = "domain Shop {\n\tsubdomain core Sales {\n\t\tcontext Cart\n\t}\n}\n";
    const out = create(text, { kind: "context", domain: 0, parent: "Sales", fields: { name: "Promo", title: "P" } });
    expect(out).toContain('\t\tcontext Cart\n\t\tcontext Promo {\n\t\t\ttitle: "P"\n\t\t}\n\t}');
  });
});

describe("planInsertion: a relationship", () => {
  it("goes at the end of the mapping, tags in brackets on each side", () => {
    const text = SHOP.replace("    context Cart\n", "    context Cart\n    context Checkout\n");
    const out = create(text, {
      kind: "relationship",
      domain: 0,
      fields: { left: "Checkout", connector: "<--", right: "Stripe", leftTags: ["ACL"], rightTags: ["OHS", "PL"] },
    });
    expect(out).toContain("  mapping {\n    Cart --> Stripe\n    Checkout [ACL] <-- [OHS, PL] Stripe\n  }\n");
  });

  it("creates the mapping at the end of the domain when there is none", () => {
    const text = "domain Shop {\n  subdomain core Sales {\n    context A\n    context B\n  }\n}\n";
    const out = create(text, { kind: "relationship", domain: 0, fields: { left: "A", connector: "<->", right: "B", leftTags: ["SK"], rightTags: ["SK"] } });
    expect(out).toBe("domain Shop {\n  subdomain core Sales {\n    context A\n    context B\n  }\n\n  mapping {\n    A [SK] <-> [SK] B\n  }\n}\n");
  });
});

describe("planInsertion: the domain", () => {
  it("is the whole text of an empty file", () => {
    const out = create("", { kind: "domain", fields: { name: "Shop", title: "Loja" } });
    expect(out).toBe('domain Shop {\n  title: "Loja"\n}\n');
  });

  it("goes after what a file without a domain already has", () => {
    const out = create("// rascunho", { kind: "domain", fields: { name: "Shop" } });
    expect(out).toBe("// rascunho\n\ndomain Shop {\n}\n");
  });
});
