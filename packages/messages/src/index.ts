/**
 * `@odds/messages` — o unico lugar do sistema onde uma frase existe.
 *
 * O `MESSAGES.md` e o catalogo editavel; `messages.json` e derivado dele pelo
 * extrator (`MESSAGES.md` §8), e um teste confere que nao divergiram.
 *
 * Este pacote depende de `@odds/core` apenas pelos **tipos**. O inverso nao
 * existe e nao deve passar a existir: e essa ausencia de dependencia que torna
 * a proibicao "um `Diagnostic` nunca carrega `message`" uma fronteira de
 * modulo em vez de uma promessa em prosa (ADR-0004).
 */

import type { Diagnostic } from "@odds/core";

import catalogue from "./messages.json" with { type: "json" };

/** Os dois idiomas do catalogo. Nao existe locale dentro de `@odds/core`. */
export type Locale = "pt" | "en";

interface Template {
  readonly en?: string;
  readonly pt?: string;
}

interface VariantEntry {
  readonly variantKey: string;
  readonly variants: Readonly<Record<string, Template>>;
}

type CatalogueEntry = Template | VariantEntry;

const MESSAGES = catalogue as Readonly<Record<string, CatalogueEntry>>;

const hasVariants = (entry: CatalogueEntry): entry is VariantEntry =>
  "variantKey" in entry;

/**
 * Ultimo recurso: o proprio code mais o `data` serializado.
 *
 * `MESSAGES.md` §8 e explicita quanto a isto — **nunca lance excecao e nunca
 * renderize string vazia.** Uma mensagem faltando e um bug de catalogo, e
 * engolir o diagnostico por causa dele esconderia um problema real do modelo
 * do usuario atras de um problema de traducao.
 */
function fallback(code: string, data: Readonly<Record<string, string>>): string {
  const pairs = Object.entries(data).map(([key, value]) => `${key}=${value}`);
  return pairs.length > 0 ? `${code} (${pairs.join(", ")})` : code;
}

function interpolate(template: string, data: Readonly<Record<string, string>>): string {
  // Um placeholder sem dado correspondente fica visivel de proposito: apagar
  // silenciosamente produziria uma frase truncada que parece correta.
  return template.replace(/\{([a-zA-Z]+)\}/g, (whole, key: string) =>
    Object.hasOwn(data, key) ? data[key]! : whole);
}

function templateFor(
  code: string,
  data: Readonly<Record<string, string>>,
): Template | undefined {
  const entry = MESSAGES[code];
  if (entry === undefined) return undefined;
  if (!hasVariants(entry)) return entry;
  // Variante e sempre selecionada por uma chave de `data` declarada no
  // catalogo. Escolher no codigo da UI reintroduziria a mensagem como contrato.
  const selector = data[entry.variantKey];
  return selector === undefined ? undefined : entry.variants[selector];
}

/**
 * A assinatura que o `MESSAGES.md` §0 especifica.
 *
 * Ordem de queda: locale pedido -> `en` -> code + `data`.
 */
export function renderMessage(
  code: string,
  data: Readonly<Record<string, string>>,
  locale: Locale,
): string {
  const template = templateFor(code, data);
  const text = template?.[locale] ?? template?.en;
  return text === undefined ? fallback(code, data) : interpolate(text, data);
}

/** Conveniencia sobre `renderMessage`, para quem ja tem o diagnostico em maos. */
export function render(diagnostic: Diagnostic, locale: Locale): string {
  return renderMessage(diagnostic.code, diagnostic.data, locale);
}

/** Os codes que o catalogo cobre. Util para conferencias de completude. */
export function coveredCodes(): string[] {
  return Object.keys(MESSAGES);
}
