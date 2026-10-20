#!/usr/bin/env node
/**
 * Exporta a apresentação e o playground para um repositório à parte, público, sem
 * publicar este: só as duas páginas, já montadas, e um README.
 *
 *   node docs/design/pages/apresentacao.export.mjs ../odds-presentation
 *
 * As páginas daqui são fragmentos de artifact, sem doctype: o host monta o esqueleto.
 * No GitHub Pages ninguém monta, então o export põe o mesmo esqueleto que o page-shot
 * usa (doctype, charset, reset mínimo), para a página não cair em modo quirks.
 * A apresentação vira index.html; o link da demo (playground.html?modelo=pagamentos)
 * segue valendo porque as duas ficam lado a lado. Rode as checagens antes: o export
 * copia o que está gravado, não regrava os blocos gerados.
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const dest = process.argv[2];
if (!dest) {
  console.error("uso: apresentacao.export.mjs <pasta do repositório da apresentação>");
  process.exit(1);
}
fs.mkdirSync(dest, { recursive: true });

const page = (file) =>
  '<!doctype html>\n<html lang="pt-BR"><head><meta charset="utf-8">' +
  "<style>body{margin:0}[hidden]{display:none!important}</style></head><body>\n" +
  fs.readFileSync(path.join(here, file), "utf8") + "\n</body></html>\n";

const commit = execSync("git rev-parse --short HEAD", { cwd: here }).toString().trim();
fs.writeFileSync(path.join(dest, "index.html"), page("apresentacao.html"));
fs.writeFileSync(path.join(dest, "playground.html"), page("playground.html"));
fs.writeFileSync(path.join(dest, "README.md"), `# ODDS — apresentação

Apresentação do **ODDS (Open Domain Driven Specification)**: uma linguagem para
escrever o espaço do problema do DDD (domínio, subdomínios, contextos e as relações
entre eles) como texto, validado e desenhado como mapa no navegador.

- \`index.html\` — a apresentação, em slides de tela cheia
- \`playground.html\` — o playground da demo; \`?modelo=pagamentos\` abre o recorte de
  Pagamentos do BIAN, incoerente de propósito, com o botão **Tornar coerente**

Tudo roda no navegador, sem servidor e sem dado saindo da máquina. As duas páginas
funcionam abertas direto do disco ou servidas pelo GitHub Pages.

## Apresentar

| Tecla | O quê |
|---|---|
| → / espaço · ← | avança · volta |
| F | tela cheia |
| P | abre as notas numa janela à parte (para o monitor do notebook) |
| N | mostra as notas sobre o slide |
| A | apêndice, e volta |

\`index.html\` abre a versão de 30 minutos; \`index.html?v=60\`, a de 1 hora.

Gerado por \`docs/design/pages/apresentacao.export.mjs\`, a partir do commit \`${commit}\`
do repositório de trabalho. Não edite aqui: a fonte é lá.
`);
console.log(`exportado para ${dest} · commit ${commit}`);
