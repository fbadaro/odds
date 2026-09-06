import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { CATALOGUE, type DiagnosticCode, parseAndValidate } from "@odds/core";

import { extract, serialize } from "../scripts/extract-messages.mjs";
import { coveredCodes, render, renderMessage } from "../src/index.js";

const repoFile = (name: string) =>
  readFileSync(fileURLToPath(new URL(`../../../${name}`, import.meta.url)), "utf8");
const packageFile = (name: string) =>
  readFileSync(fileURLToPath(new URL(`../${name}`, import.meta.url)), "utf8");

/** Placeholders `{chave}` de um template. */
const placeholders = (template: string): string[] =>
  [...template.matchAll(/\{([a-zA-Z]+)\}/g)].map((m) => m[1]!);

interface Template { en?: string; pt?: string }
interface Entry { variantKey?: string; variants?: Record<string, Template> }

const catalogue = JSON.parse(packageFile("src/messages.json")) as Record<
  string,
  Template & Entry
>;

/** Todo template do catálogo, achatado, com o code e a variante de origem. */
function allTemplates(): { code: string; variant?: string; locale: "en" | "pt"; text: string }[] {
  const out: { code: string; variant?: string; locale: "en" | "pt"; text: string }[] = [];
  for (const [code, entry] of Object.entries(catalogue)) {
    const pairs: [string | undefined, Template][] = entry.variants
      ? Object.entries(entry.variants)
      : [[undefined, entry]];
    for (const [variant, template] of pairs) {
      for (const locale of ["en", "pt"] as const) {
        const text = template[locale];
        if (text !== undefined) out.push({ code, locale, text, ...(variant ? { variant } : {}) });
      }
    }
  }
  return out;
}

describe("messages.json é derivado do MESSAGES.md, nunca escrito à mão", () => {
  it("está em dia com as tabelas do MESSAGES.md", () => {
    // Sem esta checagem o derivado vira um segundo original e diverge em
    // silêncio — a classe de erro que este repositório inteiro combate.
    expect(packageFile("src/messages.json")).toBe(serialize(extract(repoFile("MESSAGES.md"))));
  });
});

describe("cobertura e integridade do catálogo", () => {
  it("cobre exatamente os 35 codes de AST_SCHEMA.md §1.3", () => {
    expect(coveredCodes().sort()).toEqual(Object.keys(CATALOGUE).sort());
  });

  it("traz os dois idiomas para todo template", () => {
    for (const [code, entry] of Object.entries(catalogue)) {
      const templates = entry.variants ? Object.values(entry.variants) : [entry];
      for (const template of templates) {
        expect(template.en, `${code} sem EN`).toBeTypeOf("string");
        expect(template.pt, `${code} sem PT`).toBeTypeOf("string");
      }
    }
  });

  it("usa os mesmos placeholders nos dois idiomas", () => {
    for (const [code, entry] of Object.entries(catalogue)) {
      const templates = entry.variants ? Object.entries(entry.variants) : [["—", entry] as const];
      for (const [variant, template] of templates) {
        expect(placeholders(template.en!).sort(), `${code} / ${variant}`)
          .toEqual(placeholders(template.pt!).sort());
      }
    }
  });

  it("nunca embute severidade nem ícone no texto (MESSAGES.md §0)", () => {
    // Texto que carrega severidade fica errado no instante em que uma regra é
    // reclassificada — e severidade é um campo, não parte da frase.
    for (const { code, locale, text } of allTemplates()) {
      expect(text, `${code}/${locale}`).not.toMatch(/⚠|❌|^(Erro|Aviso|Error|Warning):/);
    }
  });

  it("declara a chave seletora de toda variante", () => {
    for (const [code, entry] of Object.entries(catalogue)) {
      if (!entry.variants) continue;
      expect(entry.variantKey, `${code} tem variantes sem variantKey`).toBeTypeOf("string");
    }
  });
});

describe("renderização", () => {
  it("interpola os placeholders nomeados", () => {
    expect(renderMessage("SELF_RELATIONSHIP", { context: "Checkout" }, "pt"))
      .toBe("`Checkout` não pode se relacionar consigo mesmo.");
    expect(renderMessage("SELF_RELATIONSHIP", { context: "Checkout" }, "en"))
      .toBe("`Checkout` cannot be in a relationship with itself.");
  });

  it("escolhe a variante pela chave declarada no catálogo", () => {
    const conformist = renderMessage(
      "CONFORMIST_CORE", { context: "Checkout", trigger: "conformist" }, "pt");
    const bbm = renderMessage("CONFORMIST_CORE", { context: "Checkout", trigger: "bbm" }, "pt");
    expect(conformist).toContain("se conformando ao modelo");
    expect(bbm).toContain("Big Ball of Mud");
    expect(conformist).not.toBe(bbm);
  });

  it("aceita um Diagnostic direto", () => {
    const span = { start: { line: 1, column: 1 }, end: { line: 1, column: 2 } };
    expect(render(
      { severity: "info", code: "UNMAPPED_CONTEXT", span, data: { context: "Inventory" } },
      "en",
    )).toBe("`Inventory` is declared but never appears in the `mapping` block.");
  });

  it("renderiza todo code sem deixar placeholder por resolver", () => {
    // Versão em runtime da regra de integridade do MESSAGES.md §1: se um
    // template interpola dado que o diagnóstico não carrega, sobra `{chave}`.
    for (const { code, variant, locale, text } of allTemplates()) {
      const data = Object.fromEntries(placeholders(text).map((k) => [k, "X"]));
      if (variant) {
        const key = catalogue[code]!.variantKey!;
        data[key] = variant;
      }
      expect(renderMessage(code, data, locale), `${code}/${variant ?? "—"}/${locale}`)
        .not.toMatch(/\{[a-zA-Z]+\}/);
    }
  });
});

describe("renderização de diagnósticos que o validador de fato emite", () => {
  // Esta suíte existe por causa de um bug que escapou de todas as outras. O
  // teste acima sintetiza `data` **a partir do template**, então nunca vê um
  // `data` real incompleto; e ler os `expected.json` não ajudaria, porque eles
  // são completos por construção — é o que a suíte *deveria* produzir, não o
  // que o código produz. Foi assim que `SYNTAX_ERROR` chegou a ser emitido só
  // com `found`, deixando `{expected}` cru na frase.
  //
  // A única forma de pegar isso é rodar `parseAndValidate` e renderizar o que
  // sair — inclusive sobre entradas malformadas, que são justamente as que não
  // têm golden file.
  const goldenDir = fileURLToPath(new URL("../../../golden-files/", import.meta.url));
  const sources = readdirSync(goldenDir, { withFileTypes: true })
    .filter((e) => e.isDirectory()).map((e) => e.name).sort()
    .map((name) => ({ label: name, source: readFileSync(`${goldenDir}${name}/input.odds`, "utf8") }));

  // Caminhos de emissão sem golden file correspondente.
  const malformed = [
    {
      label: "tag desconhecida",
      source: `domain T {\n  subdomain core S {\n    context A\n    context B\n  }\n  mapping {\n    A [XYZ] --> B\n  }\n}`,
    },
    { label: "conector inválido", source: `domain T {\n  subdomain core S {\n    context A\n    context B\n  }\n  mapping {\n    A ==> B\n  }\n}` },
    { label: "bloco não fechado", source: `domain T {\n  subdomain core S {\n    context A\n` },
  ];

  const emitted = [...sources, ...malformed].flatMap(({ label, source }) =>
    parseAndValidate(source).diagnostics.map((diagnostic) => ({ label, diagnostic })));

  it("exercita todos os codes que a suíte alcança", () => {
    const reached = new Set(emitted.map((e) => e.diagnostic.code));
    expect(reached.size).toBeGreaterThanOrEqual(35);
  });

  it("renderiza cada um sem deixar placeholder cru, nos dois idiomas", () => {
    for (const { label, diagnostic } of emitted) {
      for (const locale of ["pt", "en"] as const) {
        const text = render(diagnostic, locale);
        const where = `${label} / ${diagnostic.code} / ${locale}`;
        expect(text, where).not.toMatch(/\{[a-zA-Z]+\}/);
        // Cair no fallback significa template ou variante faltando.
        expect(text, where).not.toContain(diagnostic.code);
      }
    }
  });
});

describe("comportamento em caso de falta (MESSAGES.md §8)", () => {
  it("cai para o code mais o data quando o code é desconhecido", () => {
    // Nunca lança, nunca devolve string vazia: engolir o diagnóstico esconderia
    // um problema real do modelo atrás de um problema de catálogo.
    expect(renderMessage("NAO_EXISTE", { context: "Checkout" }, "pt"))
      .toBe("NAO_EXISTE (context=Checkout)");
    expect(renderMessage("NAO_EXISTE", {}, "pt")).toBe("NAO_EXISTE");
  });

  it("cai para o code quando a variante pedida não existe", () => {
    expect(renderMessage("CONFORMIST_CORE", { context: "C", trigger: "inventada" }, "pt"))
      .toBe("CONFORMIST_CORE (context=C, trigger=inventada)");
  });

  it("mantém visível um placeholder sem dado, em vez de truncar a frase", () => {
    expect(renderMessage("SELF_RELATIONSHIP", {}, "en")).toContain("{context}");
  });

  it("nunca devolve string vazia para nenhum code do catálogo", () => {
    for (const code of Object.keys(CATALOGUE) as DiagnosticCode[]) {
      expect(renderMessage(code, {}, "pt").length, code).toBeGreaterThan(0);
    }
  });
});
