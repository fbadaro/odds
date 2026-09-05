/**
 * `@odds/core` — a linguagem ODDS: lexer, parser, AST e validador.
 *
 * Não conhece texto de mensagem nem locale, e não depende de `@odds/messages`
 * (ADR-0004). Um `Diagnostic` daqui carrega `severity` + `code` + `span` +
 * `data`, nunca uma frase.
 */

export type {
  Diagnostic,
  DiagnosticCode,
  Position,
  Severity,
  SourceSpan,
} from "./diagnostics.js";

export { oddsLexer, spanOf, allTokens, SUPPRESSION_GROUP } from "./lexer.js";
