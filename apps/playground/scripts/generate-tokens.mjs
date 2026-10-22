#!/usr/bin/env node
/**
 * Gera `src/styles/tokens.css` a partir do front matter do `DESIGN.md`.
 *
 * O DESIGN.md é a fonte editável; o CSS é derivado e commitado, e um teste
 * confere byte a byte que está em dia (mesmo idioma de `messages.json`).
 *
 * Uso: node apps/playground/scripts/generate-tokens.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const ROOT = new URL("../../../", import.meta.url);
const SOURCE = fileURLToPath(new URL("DESIGN.md", ROOT));
const TARGET = fileURLToPath(new URL("apps/playground/src/styles/tokens.css", ROOT));

const HEADER =
  "/* gerado de DESIGN.md por apps/playground/scripts/generate-tokens.mjs — não edite */";

/** grupo do front matter -> prefixo da variável CSS */
const PREFIX = { colors: "c", rounded: "radius", spacing: "space", elevation: "sh" };

const HEX = /^#([0-9a-fA-F]{6})$/;
const REF = /\{([a-z0-9-]+)\.([a-z0-9-]+)\}/g;

function rgbTriplet(hex) {
  const n = parseInt(HEX.exec(hex)[1], 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

/** Nome CSS (sem `--`) do token `group.name`. */
function cssName(group, name) {
  if (group === "elevation") {
    if (name === "shadow-strength") return "shadow-strength";
    if (name === "gradient-primary") return "grad-primary";
  }
  if (!(group in PREFIX)) throw new Error(`grupo sem variável CSS: ${group}`);
  return `${PREFIX[group]}-${name}`;
}

function resolveRefs(value) {
  return String(value).replace(REF, (_, group, name) => `var(--${cssName(group, name)})`);
}

export function extractFrontMatter(markdown) {
  const match = /^---\n([\s\S]*?)\n---/.exec(markdown);
  if (!match) throw new Error("DESIGN.md sem front matter");
  return parse(match[1]);
}

export function generateTokens(designMd) {
  const fm = extractFrontMatter(designMd);
  const light = [];
  const dark = [];

  for (const [name, value] of Object.entries(fm.colors)) {
    if (name.endsWith("-dark")) {
      dark.push(`--c-${name.slice(0, -5)}: ${rgbTriplet(value)};`);
    } else {
      light.push(`--c-${name}: ${rgbTriplet(value)};`);
    }
  }

  for (const [token, props] of Object.entries(fm.typography)) {
    const map = {
      family: "fontFamily",
      size: "fontSize",
      weight: "fontWeight",
      "line-height": "lineHeight",
      "letter-spacing": "letterSpacing",
    };
    for (const [suffix, key] of Object.entries(map)) {
      if (props[key] !== undefined) light.push(`--font-${token}-${suffix}: ${props[key]};`);
    }
  }

  for (const [name, value] of Object.entries(fm.rounded)) light.push(`--radius-${name}: ${value};`);
  for (const [name, value] of Object.entries(fm.spacing)) light.push(`--space-${name}: ${value};`);

  for (const [name, value] of Object.entries(fm.elevation)) {
    if (name === "shadow-strength") light.push(`--shadow-strength: ${value};`);
    else if (name === "shadow-strength-dark") dark.push(`--shadow-strength: ${value};`);
    else light.push(`--${cssName("elevation", name)}: ${resolveRefs(value)};`);
  }

  const body = (lines) => lines.map((l) => `  ${l}`).join("\n");
  return `${HEADER}\n:root {\n${body(light)}\n}\n\n[data-theme="dark"] {\n${body(dark)}\n}\n`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  writeFileSync(TARGET, generateTokens(readFileSync(SOURCE, "utf8")));
  console.log(`escrito: ${TARGET}`);
}
