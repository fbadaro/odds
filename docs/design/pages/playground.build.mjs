#!/usr/bin/env node
/**
 * Embute no playground.html o core, o layout da colmeia v4 e o marketplace de 50
 * contextos, pela mesma montagem da colmeia-ao-vivo (colmeia-embed.mjs): duas
 * páginas, nenhuma cópia. Embute também o recorte de Pagamentos do BIAN
 * (pagamentos.odds), que a apresentação abre com ?modelo=pagamentos; só este
 * build o conhece, para a colmeia-ao-vivo não mudar de carimbo. O recorte entra
 * incoerente, com os passos do botão "Tornar coerente" (pagamentos.ajustes.mjs), e o
 * build confere o roteiro inteiro contra o validador antes de gravar.
 *
 *   node docs/design/pages/playground.build.mjs           confere; sai com 1 se algo envelheceu
 *   node docs/design/pages/playground.build.mjs --write   regrava os blocos gerados
 *
 * Rode com --write depois de mexer na v4, no core ou no pagamentos.odds. Exige o
 * core compilado (`npm run typecheck`).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { embedBlocks, stamp } from "./colmeia-embed.mjs";
import { AJUSTES, quebrar } from "./pagamentos.ajustes.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");
const embedded = await embedBlocks();

/* o ponto de chegada valida limpo; o de partida sai dele, desfazendo os ajustes */
const pagText = fs.readFileSync(path.join(here, "pagamentos.odds"), "utf8");
const core = await import(pathToFileURL(path.join(root, "packages/core/dist/index.js")).href);
const codes = (t) => core.parseAndValidate(t).diagnostics.map((d) => d.code).sort().join(", ");
const once = (t, s) => t.split(s).length === 2;
if (codes(pagText)) throw new Error(`pagamentos.odds deveria validar limpo: ${codes(pagText)}`);
for (const a of AJUSTES) if (!once(pagText, a.depois)) throw new Error(`ajuste ${a.code}: a linha de chegada não aparece uma vez só em pagamentos.odds: ${a.depois.trim()}`);
const start = quebrar(pagText);
/* um a um: antes do passo i, sobram exatamente os diagnósticos dos passos i em diante */
let t = start;
AJUSTES.forEach((a, i) => {
  const want = AJUSTES.slice(i).map((x) => x.code).sort().join(", ");
  if (codes(t) !== want) throw new Error(`antes do ajuste ${i + 1} (${a.code}) o validador deu «${codes(t)}», esperava «${want}»`);
  if (!once(t, a.antes)) throw new Error(`ajuste ${a.code}: a linha de partida não aparece uma vez só: ${a.antes.trim()}`);
  t = t.replace(a.antes, a.depois);
});
if (t !== pagText) throw new Error("os ajustes, aplicados em ordem, não voltam a pagamentos.odds");
embedded.blocks.PAG = `<script>globalThis.__PAG = ${JSON.stringify({ file: "pagamentos.odds", text: start, ajustes: AJUSTES })};</script>`;

stamp(path.join(here, "playground.html"), embedded, process.argv.includes("--write"));
