/**
 * `@odds/messages` — o único lugar do sistema onde texto de mensagem existe.
 *
 * O `MESSAGES.md` é o catálogo: um template por code, PT + EN, com
 * placeholders nomeados que correspondem às chaves de `data` do diagnóstico.
 * O texto **não** faz parte do contrato de diagnósticos — `AST_SCHEMA.md` §1.3
 * é quem define code, fase, severidade e chaves; a frase é renderizada aqui.
 *
 * Este pacote depende de `@odds/core` apenas pelos **tipos**. O inverso não
 * existe e não deve passar a existir: é essa ausência de dependência que torna
 * a proibição "um `Diagnostic` nunca carrega `message`" uma fronteira de
 * módulo em vez de uma promessa em prosa (ADR-0004).
 *
 * Ainda não implementado — o passe atual é o lexer.
 */

import type { Diagnostic } from "@odds/core";

/** Os dois idiomas do catálogo. Não existe locale dentro de `@odds/core`. */
export type Locale = "pt" | "en";

/** Renderiza a frase de um diagnóstico. Ainda não implementado. */
export declare function render(diagnostic: Diagnostic, locale: Locale): string;
