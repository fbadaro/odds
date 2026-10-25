#!/usr/bin/env node
/**
 * Embute no playground.html o core, o @odds/layout e o marketplace de 50 contextos, pela mesma montagem da colmeia-ao-vivo (colmeia-embed.mjs): duas
 * páginas, nenhuma cópia.
 *
 *   node docs/design/pages/playground.build.mjs           confere; sai com 1 se algo envelheceu
 *   node docs/design/pages/playground.build.mjs --write   regrava os blocos gerados
 *
 * Rode com --write depois de mexer no core ou no layout. Exige os pacotes compilados
 * (`npm run typecheck`).
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { embedBlocks, stamp } from "./colmeia-embed.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
stamp(path.join(here, "playground.html"), await embedBlocks(), process.argv.includes("--write"));
