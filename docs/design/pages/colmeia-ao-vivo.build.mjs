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
 * Exige o core compilado (`npm run typecheck`).
 */
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import { MODEL as BARE } from "./colmeia-50.model.mjs";
import { documented } from "./colmeia-navegacao.docs.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");
const pagePath = path.join(here, "colmeia-ao-vivo.html");
// a v4 é a v3 com localidade (ADR-0010); os marcadores V3CSS/V3SRC e o __v3 ficaram
// com o nome antigo para não reescrever a página inteira por causa de um rótulo
const v3Path = path.join(here, "colmeia-v4.html");
const WRITE = process.argv.includes("--write");

const read = (p) => fs.readFileSync(p, "utf8");
const stripMap = (code) => code.replace(/\n?\/\/# sourceMappingURL=.*$/m, "");

/* ---- 1. os módulos, e a conversão para o registro ---- */
const modules = {}; // especificador → código-fonte ES
modules["chevrotain"] = stripMap(read(path.join(root, "node_modules/chevrotain/lib/chevrotain.min.mjs")));
const coreDist = path.join(root, "packages/core/dist");
for (const file of fs.readdirSync(coreDist).filter((f) => f.endsWith(".js")).sort()) {
  modules[`odds-core/${file}`] = stripMap(read(path.join(coreDist, file)));
}
const msgDist = path.join(root, "packages/messages/dist");
const jsonImport = /import\s+catalogue\s+from\s+"\.\/messages\.json"\s+with\s+\{\s*type:\s*"json"\s*\};/;
const msgSrc = stripMap(read(path.join(msgDist, "index.js")));
if (!jsonImport.test(msgSrc)) throw new Error("@odds/messages mudou a forma do import do catálogo; ajuste o build");
modules["odds-messages/index.js"] = msgSrc.replace(jsonImport,
  `const catalogue = ${read(path.join(msgDist, "messages.json")).trim()};`);

function resolveSpec(from, spec) {
  if (!spec.startsWith("./")) return spec;
  return from.slice(0, from.lastIndexOf("/") + 1) + spec.slice(2);
}
const bindings = (list) => list.split(",").map((s) => s.trim()).filter(Boolean).map((s) => {
  const [a, b] = s.split(/\s+as\s+/);
  return { local: a.trim(), exported: (b ?? a).trim() };
});

function convert(spec, code) {
  const deps = new Set(), exps = [];
  const req = (s) => { const r = resolveSpec(spec, s); deps.add(r); return `__odds[${JSON.stringify(r)}]`; };
  let out = code
    // export { a, b as c } from "./x.js";
    .replace(/^export\s*\{([^}]*)\}\s*from\s*"([^"]+)";?/gm, (_, list, s) => {
      const m = req(s);
      return bindings(list).map((b) => `__exp.${b.exported} = ${m}.${b.local};`).join(" ");
    })
    // import * as t from "./x.js";
    .replace(/^import\s*\*\s*as\s+(\w+)\s+from\s*"([^"]+)";?/gm, (_, name, s) => `const ${name} = ${req(s)};`)
    // import { a, b as c } from "./x.js";
    .replace(/^import\s*\{([^}]*)\}\s*from\s*"([^"]+)";?/gm, (_, list, s) =>
      `const { ${bindings(list).map((b) => (b.local === b.exported ? b.local : `${b.local}: ${b.exported}`)).join(", ")} } = ${req(s)};`)
    // export const X = / export function f( / export class C
    .replace(/^export\s+(const|let|var|function|class)\s+(\w+)/gm, (_, kw, name) => { exps.push(name); return `${kw} ${name}`; })
    // export {};
    .replace(/^export\s*\{\s*\};?/gm, "")
    // export{ra as Alternation, ...};  — o fim do Chevrotain minificado, que não começa linha
    .replace(/export\s*\{([^}]*)\};?/g, (_, list) =>
      bindings(list).map((b) => `__exp.${b.exported} = ${b.local};`).join(" "));
  if (/(^|[;\s}])(import|export)(?![\w$])\s*[\w{*"]/m.test(out.replace(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/g, '""')
    .replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, ""))) {
    throw new Error(`${spec}: sobrou import/export numa forma que o build não conhece`);
  }
  out += "\n" + exps.map((n) => `__exp.${n} = ${n};`).join(" ");
  return { deps: [...deps], body: out };
}

const converted = Object.fromEntries(Object.entries(modules).map(([s, c]) => [s, convert(s, c)]));
const order = [], seen = new Set();
(function visit(list, stack) {
  for (const s of list) {
    if (seen.has(s)) continue;
    if (stack.includes(s)) throw new Error(`ciclo de import: ${[...stack, s].join(" → ")}`);
    if (!converted[s]) throw new Error(`módulo não embutido: ${s}`);
    visit(converted[s].deps, [...stack, s]);
    seen.add(s); order.push(s);
  }
})(Object.keys(converted).sort(), []);

const coreScript = "var __odds = globalThis.__odds = {};\n" + order.map((s) =>
  `/* ---- ${s} ---- */\n(function (__exp) {\n"use strict";\n${converted[s].body}\n})(__odds[${JSON.stringify(s)}] = {});`).join("\n");
if (/<\/script/i.test(coreScript)) throw new Error("o core embutido contém </script");

/* ---- 2 e 3. a colmeia v3, inteira ---- */
const v3 = read(v3Path);
const v3Css = v3.match(/<style>([\s\S]*?)<\/style>/)[1];
const scripts = [...v3.matchAll(/<script>([\s\S]*?)<\/script>/g)];
const v3Src = scripts[scripts.length - 1][1];
if (/<\/script/i.test(v3Src)) throw new Error("o script da v3 contém </script");

/* ---- 4. o marketplace de 50, como texto ---- */
/* A fonte sai do mesmo gerador da v4 (modo "rich", com description e owner de
   subdomínio), sobre o modelo documentado. Tem de validar limpa: a bancada começa
   sem erro, e os erros são os que quem testa digitar. */
globalThis.__V3_HEADLESS = true;
new Function(v3Src)();
delete globalThis.__V3_HEADLESS;
const v4 = globalThis.__v3;
const { model: M50, undocumented } = documented(BARE, v4.MODELS);
if (undocumented.length) throw new Error(`contextos sem documentação: ${undocumented.join(", ")}`);
const m50Text = v4.sourceOf(v4.canon(M50), "rich").text + "\n";
const core = await import(pathToFileURL(path.join(root, "packages/core/dist/index.js")).href);
const m50Diags = core.parseAndValidate(m50Text).diagnostics;
if (m50Diags.length) throw new Error(`o marketplace deveria validar limpo: ${m50Diags.map((d) => d.code).join(", ")}`);

/* ---- montagem ---- */
const blocks = {
  CORE: `<script>\n${coreScript}\n</script>`,
  V3CSS: `<style id="v3css">${v3Css}</style>`,
  // a v3 olha __V3_HEADLESS ao começar: com ele, não toca o DOM e só expõe globalThis.__v3
  V3SRC: `<script>globalThis.__V3_HEADLESS = true;</script><script>${v3Src}</script><script>delete globalThis.__V3_HEADLESS;</script>`,
  M50: `<script>globalThis.__M50 = ${JSON.stringify({ file: M50.file, text: m50Text })};</script>`,
};
const hash = createHash("sha256").update(Object.values(blocks).join("\n")).digest("hex").slice(0, 12);

let page = read(pagePath);
const stale = [];
for (const [name, body] of Object.entries(blocks)) {
  const re = new RegExp(`(<!--${name}-->)[\\s\\S]*?(<!--/${name}-->)`);
  if (!re.test(page)) throw new Error(`marcador <!--${name}--> ausente da página`);
  const next = `<!--${name}-->${body}<!--/${name}-->`;
  if (page.match(re)[0] !== next) stale.push(name);
  page = page.replace(re, () => next);
}
page = page.replace(/(<!--BUILD:)[0-9a-f]*(-->)/, `$1${hash}$2`);

const kb = (n) => (n / 1024).toFixed(0) + " KB";
if (WRITE) {
  fs.writeFileSync(pagePath, page);
  console.log(`gravado · ${order.length} módulos · página ${kb(Buffer.byteLength(page))} · build ${hash}`);
} else if (stale.length) {
  console.error(`envelhecido: ${stale.join(", ")} — rode com --write`);
  process.exit(1);
} else {
  console.log(`ok · build ${hash}`);
}
