/**
 * Regressões de conformidade do parser com a `GRAMMAR.md`.
 *
 * Os três casos aqui vieram de um code review da PR #4, e os três eram reais:
 * o parser aceitava ordem e repetição que a §2 não permite, e tratava tag
 * desconhecida como erro não-terminal com `data` incompleto. Os golden files
 * não pegaram nenhum deles porque todos os 44 são arquivos **bem formados** na
 * ordem canônica — a suíte cobre os 35 codes, não a forma da gramática.
 */

import { describe, expect, it } from "vitest";

import { parseAndValidate } from "../src/parseAndValidate.js";

const VALID = `domain Test {
  subdomain core Sales {
    context Checkout
  }

  subdomain generic Payments {
    context PaymentGateway
  }
}`;

const codes = (source: string) => parseAndValidate(source).diagnostics.map((d) => d.code);

describe("ordem e cardinalidade dos blocos (GRAMMAR.md §2)", () => {
  it("aceita a ordem canônica: subdomains, external, mapping", () => {
    const result = parseAndValidate(`domain Test {
  title: "Loja"
  subdomain core Sales {
    context Checkout
  }
  external {
    context StripeApi
  }
  mapping {
    Checkout [ACL] <-- [OHS] StripeApi
  }
}`);
    expect(result.astGenerated).toBe(true);
    expect(codes(`domain T {
  subdomain core S {
    context A
  }
}`)).not.toContain("SYNTAX_ERROR");
  });

  it("rejeita `mapping` antes dos subdomains", () => {
    // A ordem e fixa para o arquivo ler como narrativa: seu dominio primeiro,
    // a fronteira depois, as integracoes por ultimo.
    const result = parseAndValidate(`domain Test {
  mapping {
    Checkout --> PaymentGateway
  }
  subdomain core Sales {
    context Checkout
  }
}`);
    expect(result.astGenerated).toBe(false);
    expect(result.diagnostics.map((d) => d.code)).toEqual(["SYNTAX_ERROR"]);
  });

  it("rejeita `external` depois de `mapping`", () => {
    const result = parseAndValidate(`domain Test {
  subdomain core Sales {
    context Checkout
  }
  mapping {
    Checkout --> StripeApi
  }
  external {
    context StripeApi
  }
}`);
    expect(result.astGenerated).toBe(false);
  });

  it("rejeita um segundo bloco `external`", () => {
    // Antes, o segundo sobrescrevia o primeiro em silencio: os contextos do
    // bloco descartado sumiam da AST sem diagnostico nenhum.
    const result = parseAndValidate(`domain Test {
  subdomain core Sales {
    context Checkout
  }
  external {
    context StripeApi
  }
  external {
    context SapErp
  }
}`);
    expect(result.astGenerated).toBe(false);
  });

  it("rejeita um segundo bloco `mapping`", () => {
    const result = parseAndValidate(`domain Test {
  subdomain core Sales {
    context Checkout
    context Billing
  }
  mapping {
    Checkout [OHS] --> Billing
  }
  mapping {
    Billing [OHS] --> Checkout
  }
}`);
    expect(result.astGenerated).toBe(false);
  });

  it("continua recuperando de um `context` solto no domain (GRAMMAR.md §5.1)", () => {
    const result = parseAndValidate(`domain Test {
  context Orphan
  subdomain core Sales {
    context Checkout
  }
}`);
    expect(result.astGenerated).toBe(true);
    expect(result.diagnostics.map((d) => d.code)).toContain("ORPHAN_CONTEXT");
  });
});

describe("tag desconhecida (GRAMMAR.md §3: conjunto fechado de nove)", () => {
  const source = `domain Test {
  subdomain core Sales {
    context Checkout
    context Billing
  }
  mapping {
    Checkout [XYZ] --> Billing
  }
}`;

  it("é erro sintático puro e impede a geração da AST", () => {
    // §5: um SYNTAX_ERROR puro para o pipeline na fase 0. Antes, a AST era
    // gerada e a linha seguia para o validador, produzindo um
    // UNDOCUMENTED_CONTRACT derivado de um erro de sintaxe.
    const result = parseAndValidate(source);
    expect(result.astGenerated).toBe(false);
    expect(result.diagnostics.map((d) => d.code)).toEqual(["SYNTAX_ERROR"]);
  });

  it("carrega `found` e `expected`, que é o que o template interpola", () => {
    const [diagnostic] = parseAndValidate(source).diagnostics;
    expect(diagnostic!.data).toEqual({
      found: "XYZ",
      expected: "OHS, PL, ACL, CF, SK, C, S, P, BBM",
    });
  });

  it("não confunde `SW` com tag desconhecida — ela tem code próprio", () => {
    // Construto removido ganha diagnostico dedicado e recuperacao; a AST
    // sobrevive, ao contrario do caso da tag inexistente.
    const result = parseAndValidate(`domain Test {
  subdomain core Sales {
    context Checkout
    context Billing
  }
  mapping {
    Checkout [SW] -x- Billing
  }
}`);
    expect(result.astGenerated).toBe(true);
    expect(result.diagnostics.map((d) => d.code)).toEqual(["REMOVED_CONSTRUCT"]);
  });
});

describe("o arquivo bem formado continua bem formado", () => {
  it("não produz erro sintático no baseline usado por estes testes", () => {
    expect(parseAndValidate(VALID).astGenerated).toBe(true);
    expect(codes(VALID)).not.toContain("SYNTAX_ERROR");
  });
});

describe("propriedades de subdomain (GRAMMAR.md §2, ADR-0008)", () => {
  const withProps = (body: string) => `domain Test {
  subdomain core Sales {
${body}
  }
}`;
  const subdomain = (source: string) => parseAndValidate(source).ast?.domains[0]?.subdomains[0];

  it("lê `description` e `owner` para o SubdomainNode, depois do title", () => {
    const result = parseAndValidate(withProps(`    title: "Vendas"
    description: "Converter intenção de compra em pedido pago"
    owner: "Diretoria Comercial"
    context Checkout`));
    expect(result.diagnostics).toEqual([]);
    expect(result.ast?.domains[0]?.subdomains[0]).toMatchObject({
      title: "Vendas",
      description: "Converter intenção de compra em pedido pago",
      owner: "Diretoria Comercial",
    });
  });

  it("aceita as duas em qualquer ordem entre si", () => {
    expect(subdomain(withProps(`    owner: "Diretoria Comercial"
    description: "Converter intenção de compra em pedido pago"
    context Checkout`))).toMatchObject({ owner: "Diretoria Comercial", description: "Converter intenção de compra em pedido pago" });
  });

  it("deixa os campos ausentes, não vazios, quando não declarados", () => {
    const sub = subdomain(withProps("    context Checkout"));
    expect(sub).toBeDefined();
    expect(sub && "description" in sub).toBe(false);
    expect(sub && "owner" in sub).toBe(false);
  });

  it("rejeita propriedade depois de um context", () => {
    expect(codes(withProps(`    context Checkout
    owner: "Diretoria Comercial"`))).toEqual(["SYNTAX_ERROR"]);
  });

  it("rejeita propriedade antes do title, que é sempre a primeira linha", () => {
    expect(codes(withProps(`    owner: "Diretoria Comercial"
    title: "Vendas"
    context Checkout`))).toEqual(["SYNTAX_ERROR"]);
  });

  it("não libera as chaves do context no subdomain", () => {
    expect(codes(withProps(`    team: "Vendas Squad"
    context Checkout`))).toEqual(["SYNTAX_ERROR"]);
  });

  it("não aceita `owner` dentro de um context", () => {
    expect(codes(withProps(`    context Checkout {
      owner: "Vendas Squad"
    }`))).toEqual(["SYNTAX_ERROR"]);
  });

  it("aceita só string_literal: `owner` sem aspas é erro", () => {
    expect(codes(withProps(`    owner: Diretoria
    context Checkout`))).toEqual(["SYNTAX_ERROR"]);
  });

  it("torna `owner` reservada: um contexto com esse nome falha como qualquer palavra reservada", () => {
    const result = parseAndValidate(withProps("    context owner"));
    expect(result.diagnostics.map((d) => d.code)).toEqual(["SYNTAX_ERROR"]);
    expect(result.diagnostics[0]?.data).toEqual({ found: "owner", expected: "identifier" });
  });

  it("não reserva prefixo: `ownership` continua sendo identifier", () => {
    expect(codes(withProps("    context ownership"))).not.toContain("SYNTAX_ERROR");
  });
});
