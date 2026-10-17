#!/usr/bin/env node
/**
 * Embute na colmeia-ao-vivo.html tudo o que ela precisa para rodar sozinha, e confere
 * que o que está embutido não envelheceu.
 *
 *   node docs/design/pages/colmeia-ao-vivo.build.mjs           confere; sai com 1 se algo envelheceu
 *   node docs/design/pages/colmeia-ao-vivo.build.mjs --write   regrava os três blocos gerados
 *
 * Por que embutir: a página tem de abrir por file:// (é assim que a skill page-shot
 * captura) e como artifact publicado, e nos dois casos não há servidor para resolver
 * `../../../packages/core/dist`. Não há bundler no repositório (ADR-0005), e o protótipo
 * não é motivo para adotar um.
 *
 * Por que SCRIPT CLÁSSICO INLINE e nada mais: a primeira versão usava import map com
 * módulos em data: URL e `new Function` para carregar a v3. Por file:// tudo rodava; no
 * visualizador de artifact a página abria vazia — a política de conteúdo de lá não é a
 * de um arquivo local. Script inline clássico é o que as colmeias v1–v3 usam e o que
 * sabidamente roda lá. Então os módulos ES viram funções num registro (`__odds`), com
 * `import`/`export` reescritos para leitura e escrita nele, na ordem de dependência. As
 * formas reconhecidas são só as que o `tsc` e o Chevrotain emitem hoje; forma nova
 * derruba o build em vez de passar calada.
 *
 * Três blocos, delimitados por marcadores dentro da página:
 *
 *   1. CORE   chevrotain + @odds/core (dist) + @odds/messages (dist, com o JSON inline)
 *   2. V3CSS  o <style> da colmeia-v4.html, inteiro — o protótipo veste a mesma pele
 *   3. V3SRC  o <script> da colmeia-v4.html, inteiro, rodado sem DOM — o MESMO layout
 *   4. M50    o marketplace de 50 contextos do colmeia-50, com a documentação do
 *             colmeia-navegacao.docs.mjs, como texto .odds: o texto inicial da bancada
 *
 * Desde 2026-10-16 a montagem mora em colmeia-embed.mjs, compartilhada com o
 * playground.build.mjs; aqui fica só o destino.
 *
 * Exige o core compilado (`npm run typecheck`).
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { embedBlocks, stamp } from "./colmeia-embed.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
stamp(path.join(here, "colmeia-ao-vivo.html"), await embedBlocks(), process.argv.includes("--write"));
