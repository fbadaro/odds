/**
 * Lexer da linguagem ODDS — `GRAMMAR.md` §1.
 *
 * Duas decisões deste arquivo merecem ser lidas antes de mexer nele:
 *
 * **1. `identifier` usa um matcher customizado, não uma `RegExp` direta.**
 * A gramática define `identifier` como "Unicode letter, incluindo acentuação
 * PT-BR". A forma natural seria uma RegExp com `\p{L}` e flag `u` — mas o Chevrotain
 * 11.2.0 **não** casa padrões com escape de propriedade Unicode: a tokenização
 * inteira falha, silenciosamente, com zero tokens. Um range Latin-1
 * (`[a-zA-ZÀ-ÿ]`) funcionaria e cobriria PT-BR, mas estreitaria a gramática,
 * que diz "Unicode letter" e não "letra latina". O matcher customizado abaixo
 * usa a regex de verdade, com flag sticky, e mantém a gramática como escrita.
 * Coberto por teste — se o Chevrotain passar a suportar `\p{L}`, o teste
 * continua valendo e esta indireção pode sumir.
 *
 * **2. Comentários não são todos descartáveis.** Um `line_comment` cujo
 * primeiro token após `//` é `odds-disable-next-line` é uma
 * `suppression_directive` e precisa sobreviver até o validador. O lexer decide
 * **só pelo prefixo**; o interior nunca é parseado, para que uma diretiva
 * quebrada vire `MALFORMED_SUPPRESSION` (`info`) na fase 6 e jamais um
 * `SYNTAX_ERROR`. Por isso ela vai num grupo próprio, não em `Lexer.SKIPPED`.
 */

import { createToken, Lexer, type IToken, type TokenType } from "chevrotain";
import type { SourceSpan } from "./diagnostics.js";

/** Grupo em que as diretivas de supressão são coletadas, fora da gramática. */
export const SUPPRESSION_GROUP = "suppressions";

// --- Identificador, com o matcher customizado explicado acima ---------------

const IDENTIFIER_PATTERN = /[\p{L}][\p{L}\p{N}_]*/uy;

function matchIdentifier(text: string, startOffset: number): RegExpExecArray | null {
  IDENTIFIER_PATTERN.lastIndex = startOffset;
  return IDENTIFIER_PATTERN.exec(text);
}

export const Identifier = createToken({
  name: "Identifier",
  pattern: matchIdentifier,
  line_breaks: false,
});

// --- Palavras reservadas ----------------------------------------------------
// `GRAMMAR.md` §1: nenhuma pode ser usada como `identifier`. `longer_alt` faz o
// lexer preferir o identificador quando a palavra é só um prefixo — sem isso,
// `coreografia` seria lida como `core` + `ografia`.

const RESERVED_WORDS = [
  "domain", "subdomain", "context", "mapping", "external",
  "core", "supporting", "generic",
  "title", "type", "description", "responsibilities", "maturity", "team", "technology",
  "experimental", "growing", "mature", "legacy",
] as const;

export type ReservedWord = (typeof RESERVED_WORDS)[number];

export const reservedTokens: Record<ReservedWord, TokenType> = Object.fromEntries(
  RESERVED_WORDS.map((word) => [
    word,
    createToken({
      name: word.charAt(0).toUpperCase() + word.slice(1),
      pattern: new RegExp(word),
      longer_alt: Identifier,
    }),
  ]),
) as Record<ReservedWord, TokenType>;

// --- Conectores, pontuação e literais ---------------------------------------
// Conectores vêm antes de tudo que possa prefixá-los. `-x-` e `<->` não colidem
// entre si, mas a ordem é fixada explicitamente para não depender de acidente.

export const MutualConnector = createToken({ name: "MutualConnector", pattern: /<->/ });
export const UpstreamConnector = createToken({ name: "UpstreamConnector", pattern: /-->/ });
export const DownstreamConnector = createToken({ name: "DownstreamConnector", pattern: /<--/ });
export const SeparateConnector = createToken({ name: "SeparateConnector", pattern: /-x-/ });

export const LBrace = createToken({ name: "LBrace", pattern: /\{/ });
export const RBrace = createToken({ name: "RBrace", pattern: /\}/ });
export const LBracket = createToken({ name: "LBracket", pattern: /\[/ });
export const RBracket = createToken({ name: "RBracket", pattern: /\]/ });
export const Colon = createToken({ name: "Colon", pattern: /:/ });
export const Comma = createToken({ name: "Comma", pattern: /,/ });

/** `GRAMMAR.md` §1: só `\"` e `\\` são escapes; string não atravessa newline. */
export const StringLiteral = createToken({
  name: "StringLiteral",
  pattern: /"(?:\\["\\]|[^"\\\n\r])*"/,
});

// --- Trivia -----------------------------------------------------------------

/**
 * Diretiva de supressão. Precede `LineComment` porque é um caso especial dele,
 * e o resto da linha é deliberadamente não estruturado (ver nota 2 no topo).
 */
export const SuppressionDirective = createToken({
  name: "SuppressionDirective",
  pattern: /\/\/[ \t]*odds-disable-next-line[^\n\r]*/,
  group: SUPPRESSION_GROUP,
});

export const LineComment = createToken({
  name: "LineComment",
  pattern: /\/\/[^\n\r]*/,
  group: Lexer.SKIPPED,
});

export const BlockComment = createToken({
  name: "BlockComment",
  pattern: /\/\*[\s\S]*?\*\//,
  line_breaks: true,
  group: Lexer.SKIPPED,
});

export const WhiteSpace = createToken({
  name: "WhiteSpace",
  pattern: /\s+/,
  line_breaks: true,
  group: Lexer.SKIPPED,
});

/**
 * Ordem importa: trivia primeiro (a diretiva antes do comentário comum),
 * conectores antes da pontuação que os prefixa, palavras reservadas antes de
 * `Identifier`, e `Identifier` por último como fallback.
 */
export const allTokens: TokenType[] = [
  WhiteSpace,
  SuppressionDirective,
  LineComment,
  BlockComment,
  MutualConnector,
  DownstreamConnector,
  UpstreamConnector,
  SeparateConnector,
  StringLiteral,
  LBrace, RBrace, LBracket, RBracket, Colon, Comma,
  ...RESERVED_WORDS.map((w) => reservedTokens[w]),
  Identifier,
];

export const oddsLexer = new Lexer(allTokens, { positionTracking: "full" });

/**
 * Converte a posição de um token do Chevrotain para a convenção normativa do
 * `AST_SCHEMA.md` §1: 1-indexed, UTF-16, **`end` exclusivo**.
 *
 * O Chevrotain já entrega linha e coluna 1-indexed em unidades UTF-16 (as
 * colunas vêm de offsets de string JavaScript), mas seu `endColumn` é
 * **inclusivo** — aponta para o último caractere do token, não para o seguinte.
 * O `+ 1` abaixo é essa única diferença, e é o motivo de esta função existir em
 * vez de os spans serem lidos direto do token.
 */
export function spanOf(token: IToken): SourceSpan {
  return {
    start: { line: token.startLine!, column: token.startColumn! },
    end: { line: token.endLine!, column: token.endColumn! + 1 },
  };
}
