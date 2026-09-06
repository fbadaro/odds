import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { CATALOGUE, type DiagnosticCode } from "@odds/core";

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
