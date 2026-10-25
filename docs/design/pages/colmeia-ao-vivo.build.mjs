#!/usr/bin/env node
/**
 * Embute na colmeia-ao-vivo.html tudo o que ela precisa para rodar sozinha, e confere
 * que o que está embutido não envelheceu.
 *
 *   node docs/design/pages/colmeia-ao-vivo.build.mjs           confere; sai com 1 se algo envelheceu
 *   node docs/design/pages/colmeia-ao-vivo.build.mjs --write   regrava os blocos gerados
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
 * Cinco blocos, delimitados por marcadores dentro da página:
 *
 *   1. CORE   chevrotain + @odds/core (dist) + @odds/messages (dist, com o JSON inline)
 *             + @odds/layout (dist, com as fixtures; desde 2026-10-21)
 *   ·  TOKENS os tokens de cor da bancada, de bancada-tokens.css: a mesma paleta nas
 *             duas páginas vivas (desde 2026-10-21; antes vinham no V3CSS)
 *   2. V3CSS  o map.css do @odds/layout, com os apelidos que o vestem com os tokens da
 *             bancada (até 2026-10-21, o <style> da colmeia-v4.html, inteiro)
 *   3. V3SRC  a ponte que monta o __v3 a partir do pacote (até 2026-10-21, o <script>
 *             da colmeia-v4.html, rodado sem DOM); vem depois do CORE na página
 *   4. M50    o marketplace de 50 contextos documentado, como texto .odds: o texto
 *             inicial da bancada (o marketplace() das fixtures do pacote)
 *
 * Desde 2026-10-16 a montagem mora em colmeia-embed.mjs, compartilhada com o
 * playground.build.mjs; aqui fica só o destino.
 *
 * Exige os pacotes compilados (`npm run typecheck`).
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { embedBlocks, stamp } from "./colmeia-embed.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
stamp(path.join(here, "colmeia-ao-vivo.html"), await embedBlocks(), process.argv.includes("--write"));
