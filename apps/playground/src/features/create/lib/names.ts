import { oddsLexer } from "@odds/core";
import { pairKey } from "../../../lib/selection";

/** What is being named, as the sentence says it. */
export type Noun = "domínio" | "subdomínio" | "context";

/**
 * Why `raw` cannot be the name of a new element, or null when it can. The shape
 * of an identifier is the lexer's, not a second copy of the grammar: a name is
 * good when the lexer reads it as exactly one `Identifier` (`GRAMMAR.md` §1).
 * `taken` holds the names already declared in the same namespace.
 */
export function nameProblem(raw: string, taken: ReadonlySet<string>, noun: Noun): string | null {
  const name = raw.trim();
  if (name === "") return "Escreva um nome.";
  const { tokens, errors } = oddsLexer.tokenize(name);
  const only = tokens.length === 1 && errors.length === 0 ? tokens[0]! : null;
  if (!only || only.image !== name) return "Use letras, dígitos e _, começando por uma letra e sem espaços.";
  if (only.tokenType.name !== "Identifier") {
    // one whole word that is not an identifier is a reserved word (`longer_alt` keeps `coreografia` an identifier)
    return /^\p{L}/u.test(name) ? `\`${name}\` é uma palavra reservada da linguagem.` : "Use letras, dígitos e _, começando por uma letra e sem espaços.";
  }
  if (taken.has(name)) return `Já existe um ${noun} com esse nome.`;
  return null;
}

/**
 * Why `left`–`right` cannot be a new relationship, or null when it can: the
 * three errors of `RULES-EN.md` §1.A that a pair alone decides. `related` holds the
 * pairs already in the mapping, as `pairKey`; `external`, the external contexts.
 */
export function pairProblem(left: string, right: string, related: ReadonlySet<string>, external: ReadonlySet<string>): string | null {
  if (left === "" || right === "") return "Escolha os dois contexts.";
  if (left === right) return "Um context não se relaciona consigo mesmo.";
  if (related.has(pairKey(left, right))) return "Esses dois contexts já têm uma relação no mapping.";
  if (external.has(left) && external.has(right)) return "Uma relação entre dois contexts externos não é sua para mapear.";
  return null;
}
