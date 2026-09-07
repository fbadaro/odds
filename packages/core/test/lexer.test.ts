import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { SUPPRESSION_GROUP, oddsLexer, spanOf } from "../src/lexer.js";

const goldenFile = (name: string) =>
  readFileSync(fileURLToPath(new URL(`../../../golden-files/${name}/input.odds`, import.meta.url)), "utf8");

const lex = (source: string) => {
  const result = oddsLexer.tokenize(source);
  return result;
};

const images = (source: string) => lex(source).tokens.map((t) => t.image);

describe("convenção de span (AST_SCHEMA.md §1)", () => {
  it("é 1-indexed, com `end` exclusivo", () => {
    // "domain" ocupa as colunas 1..6; o `end` exclusivo aponta para a 7.
    const [token] = lex("domain Test").tokens;
    expect(spanOf(token!)).toEqual({
      start: { line: 1, column: 1 },
      end: { line: 1, column: 7 },
    });
  });

  it("conta colunas em unidades de código UTF-16, não em code points", () => {
    // 🎯 é um par substituto: 2 unidades UTF-16, 1 code point. Se a contagem
    // fosse por code point, `depois` começaria na coluna 4 em vez da 5.
    const source = 'x🎯 depois';
    const depois = lex(source).tokens.find((t) => t.image === "depois")!;
    expect(source.indexOf("depois") + 1).toBe(5); // referência independente
    expect(spanOf(depois).start).toEqual({ line: 1, column: 5 });
    expect(spanOf(depois).end).toEqual({ line: 1, column: 11 });
  });

  it("conta acento como uma única unidade", () => {
    // `descrição` tem 9 unidades UTF-16 e 10 bytes em UTF-8. Se a unidade
    // fosse byte, o token seguinte cairia uma coluna adiante.
    const source = "descrição seguinte";
    const seguinte = lex(source).tokens.find((t) => t.image === "seguinte")!;
    expect(spanOf(seguinte).start.column).toBe(11);
  });

  it("rastreia linha através de múltiplas linhas", () => {
    const terceira = lex("a\nb\ncontexto").tokens.at(-1)!;
    expect(spanOf(terceira)).toEqual({
      start: { line: 3, column: 1 },
      end: { line: 3, column: 9 },
    });
  });
});

describe("identificadores Unicode (GRAMMAR.md §1)", () => {
  it("aceita acentuação PT-BR", () => {
    expect(images("Ação_1 descrição")).toEqual(["Ação_1", "descrição"]);
  });

  it("aceita letras fora do Latin-1, como a gramática promete", () => {
    // A gramática diz "Unicode letter", não "letra latina". Um range Latin-1
    // passaria nos dois primeiros casos e falharia nestes.
    expect(images("Ψυχή 契約 Zamówienie")).toEqual(["Ψυχή", "契約", "Zamówienie"]);
    expect(lex("Ψυχή").errors).toHaveLength(0);
  });

  it("prefere o identificador quando a palavra reservada é só um prefixo", () => {
    // Sem `longer_alt`, isto viraria `core` + `ografia`.
    expect(images("coreografia")).toEqual(["coreografia"]);
    expect(images("core")).toEqual(["core"]);
  });
});

describe("comentários e diretivas de supressão (GRAMMAR.md §1)", () => {
  it("descarta comentário comum e comentário de bloco", () => {
    expect(images("domain // isto some\n/* isto também */ Test")).toEqual(["domain", "Test"]);
  });

  it("preserva a diretiva de supressão num grupo próprio, fora da gramática", () => {
    const result = lex("// odds-disable-next-line UNDOCUMENTED_CONTRACT: em negociação\ndomain");
    expect(result.tokens.map((t) => t.image)).toEqual(["domain"]);
    expect(result.groups[SUPPRESSION_GROUP]).toHaveLength(1);
  });

  it("reconhece a diretiva pelo prefixo, mesmo quebrada", () => {
    // `MALFORMED_SUPPRESSION` é `info` na fase 6; uma diretiva sem code e sem
    // justificativa não pode virar SYNTAX_ERROR nem derrubar o arquivo.
    const result = lex("// odds-disable-next-line\ndomain");
    expect(result.errors).toHaveLength(0);
    expect(result.groups[SUPPRESSION_GROUP]).toHaveLength(1);
  });

  it("não confunde comentário comum com diretiva", () => {
    const result = lex("// odds-disable isto não é diretiva\ndomain");
    expect(result.groups[SUPPRESSION_GROUP] ?? []).toHaveLength(0);
  });
});

describe("literais e conectores", () => {
  it("aceita os escapes que a gramática define, e só eles", () => {
    expect(images('"aspas: \\" e barra: \\\\"')).toEqual(['"aspas: \\" e barra: \\\\"']);
  });

  it("não deixa string atravessar quebra de linha", () => {
    expect(lex('"sem fim\n').errors.length).toBeGreaterThan(0);
  });

  it("lê os quatro conectores como tokens únicos", () => {
    expect(images("A --> B <-- C <-> D -x- E"))
      .toEqual(["A", "-->", "B", "<--", "C", "<->", "D", "-x-", "E"]);
  });
});

describe("golden files", () => {
  it("tokeniza o baseline válido sem erro léxico", () => {
    const result = lex(goldenFile("valid-baseline"));
    expect(result.errors).toEqual([]);
    expect(result.tokens.length).toBeGreaterThan(0);
  });

  it("tokeniza o caso de supressão, preservando a diretiva", () => {
    const result = lex(goldenFile("suppression-valid"));
    expect(result.errors).toEqual([]);
    expect(result.groups[SUPPRESSION_GROUP]).toHaveLength(1);
  });
});
