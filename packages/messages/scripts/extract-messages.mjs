#!/usr/bin/env node
/**
 * Extrai `MESSAGES.md` para `src/messages.json` — `MESSAGES.md` §8.
 *
 * As tabelas do documento continuam sendo a **fonte de verdade editável**; o
 * JSON é derivado delas. Isso não é escolha desta implementação: a §8 já
 * especifica a forma serializada, inclusive o formato com `variantKey`.
 *
 * O arquivo gerado é commitado, para que quem consome `@odds/messages` não
 * precise do `.md`. Um teste confere que ele está atualizado — sem isso, o
 * derivado vira um segundo original e passa a divergir em silêncio.
 *
 * Uso:
 *   node packages/messages/scripts/extract-messages.mjs           # escreve
 *   node packages/messages/scripts/extract-messages.mjs --check   # só confere
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = new URL("../../../", import.meta.url);
const SOURCE = fileURLToPath(new URL("MESSAGES.md", ROOT));
const TARGET = fileURLToPath(new URL("packages/messages/src/messages.json", ROOT));

/** `| `CODE` | Variante | EN | PT |` — quatro células, nesta ordem. */
const ROW = /^\|\s*`([A-Z_]+)`\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*$/;
/** Uma variante é declarada como `chave: "valor"`. */
const VARIANT = /^`?([a-zA-Z]+):\s*"([^"]+)"`?$/;

export function extract(markdown) {
  /** @type {Record<string, unknown>} */
  const catalogue = {};

  for (const line of markdown.split("\n")) {
    const match = ROW.exec(line);
    if (!match) continue;
    const [, code, variantCell, en, pt] = match;

    if (variantCell === "—") {
      if (catalogue[code]) throw new Error(`${code}: template sem variante duplicado`);
      catalogue[code] = { en, pt };
      continue;
    }

    const variant = VARIANT.exec(variantCell);
    if (!variant) throw new Error(`${code}: célula de variante ilegível: ${variantCell}`);
    const [, variantKey, value] = variant;

    const existing = catalogue[code];
    if (existing === undefined) {
      catalogue[code] = { variantKey, variants: { [value]: { en, pt } } };
    } else if (existing.variantKey !== variantKey) {
      throw new Error(`${code}: duas chaves seletoras diferentes (${existing.variantKey} e ${variantKey})`);
    } else {
      existing.variants[value] = { en, pt };
    }
  }

  if (Object.keys(catalogue).length === 0) {
    throw new Error("nenhum template encontrado — o formato das tabelas do MESSAGES.md mudou?");
  }
  // Ordem estável, para que o diff do arquivo gerado seja legível.
  return Object.fromEntries(Object.entries(catalogue).sort(([a], [b]) => a.localeCompare(b)));
}

export function serialize(catalogue) {
  return `${JSON.stringify(catalogue, null, 2)}\n`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const generated = serialize(extract(readFileSync(SOURCE, "utf8")));
  if (process.argv.includes("--check")) {
    const current = readFileSync(TARGET, "utf8");
    if (current !== generated) {
      console.error("messages.json está desatualizado — rode `npm run generate:messages`");
      process.exit(1);
    }
    console.log("messages.json está em dia com MESSAGES.md");
  } else {
    writeFileSync(TARGET, generated);
    console.log(`escrito: ${TARGET}`);
  }
}
