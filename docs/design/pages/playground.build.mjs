#!/usr/bin/env node
/**
 * Embute no playground.html o core, o layout da colmeia v4 e o marketplace de 50
 * contextos, pela mesma montagem da colmeia-ao-vivo (colmeia-embed.mjs): duas
 * páginas, nenhuma cópia. Embute também o recorte de Pagamentos do BIAN
 * (pagamentos.odds), que a apresentação abre com ?modelo=pagamentos; só este
 * build o conhece, para a colmeia-ao-vivo não mudar de carimbo.
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

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");
const embedded = await embedBlocks();

/* o recorte entra como o marketplace: tem de validar limpo, os erros são os da demo */
const pagText = fs.readFileSync(path.join(here, "pagamentos.odds"), "utf8");
const core = await import(pathToFileURL(path.join(root, "packages/core/dist/index.js")).href);
const pagDiags = core.parseAndValidate(pagText).diagnostics;
if (pagDiags.length) throw new Error(`pagamentos.odds deveria validar limpo: ${pagDiags.map((d) => d.code).join(", ")}`);
embedded.blocks.PAG = `<script>globalThis.__PAG = ${JSON.stringify({ file: "pagamentos.odds", text: pagText })};</script>`;

stamp(path.join(here, "playground.html"), embedded, process.argv.includes("--write"));
