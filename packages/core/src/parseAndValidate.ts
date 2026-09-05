/**
 * A fachada que o `TEST_SUITE.md` §3 especifica: uma função, um resultado.
 *
 * É deliberadamente a única superfície que o harness dos golden files toca.
 * Enquanto essa fronteira existir, o test runner é intercambiável por
 * construção (`ADR-0005`).
 */

import type { IToken } from "chevrotain";

import type { ProgramNode } from "./ast.js";
import { compareDiagnostics } from "./catalogue.js";
import type { Diagnostic, SourceSpan } from "./diagnostics.js";
import { SUPPRESSION_GROUP, oddsLexer, spanOf } from "./lexer.js";
import { OddsParser, parseSuppressions } from "./parser.js";

export interface ParseResult {
  /**
   * `AST_SCHEMA.md` §1.4: significa apenas *"existe árvore"*, e **não**
   * "renderizável". Desde a renderização degradada, a AST parcial sempre
   * desenha o que for desenhável — `false` aqui é `SYNTAX_ERROR` puro.
   */
  readonly astGenerated: boolean;
  readonly diagnostics: Diagnostic[];
  readonly ast?: ProgramNode;
}

const parser = new OddsParser();

/**
 * Os literais da gramática aceitos num ponto do arquivo, derivados da própria
 * gramática — não de uma lista escrita à mão que envelheceria a cada produção
 * nova. `MESSAGES.md` §1 exige que `SYNTAX_ERROR.expected` seja uma lista de
 * literais idêntica nos dois idiomas, e é por isso que cada token carrega o
 * `label` com o literal em vez do nome interno.
 */
function expectedAt(prefix: IToken[]): string {
  const suggestions = parser.computeContentAssist("program", prefix);
  const literals: string[] = [];
  for (const { nextTokenType } of suggestions) {
    const literal = nextTokenType.LABEL ?? nextTokenType.name;
    if (!literals.includes(literal)) literals.push(literal);
  }
  return literals.join(", ");
}

export function parseAndValidate(source: string): ParseResult {
  const lexed = oddsLexer.tokenize(source);

  // `GRAMMAR.md` §5: um SYNTAX_ERROR puro impede totalmente a geração da AST.
  // Sendo terminal, só o **primeiro** é reportado: os seguintes são derivados
  // dele, e o princípio do erro-raiz (`RULES-EN.md` §3.1) manda não emiti-los.
  const lexError = lexed.errors[0];
  if (lexError !== undefined) {
    const line = lexError.line ?? 1;
    const column = lexError.column ?? 1;
    const span: SourceSpan = {
      start: { line, column },
      end: { line, column: column + lexError.length },
    };
    return {
      astGenerated: false,
      diagnostics: [{
        severity: "error",
        code: "SYNTAX_ERROR",
        span,
        data: {
          found: source.slice(lexError.offset, lexError.offset + lexError.length),
          expected: expectedAt(lexed.tokens.filter((t) => t.startOffset < lexError.offset)),
        },
      }],
    };
  }

  parser.reset();
  parser.input = lexed.tokens;
  const ast = parser.program();

  const parseError = parser.errors[0];
  if (parseError !== undefined) {
    const token = parseError.token;
    const span: SourceSpan = token.startLine === undefined
      ? { start: { line: 1, column: 1 }, end: { line: 1, column: 1 } }
      : spanOf(token);
    return {
      astGenerated: false,
      diagnostics: [{
        severity: "error",
        code: "SYNTAX_ERROR",
        span,
        data: {
          found: token.image,
          expected: expectedAt(lexed.tokens.filter((t) => t.startOffset < token.startOffset)),
        },
      }],
    };
  }

  const diagnostics: Diagnostic[] = [...parser.diagnostics];
  const suppressions = parseSuppressions(lexed.groups[SUPPRESSION_GROUP] ?? []);
  diagnostics.sort(compareDiagnostics);

  return { astGenerated: true, diagnostics, ast: { ...ast, suppressions } };
}
