/**
 * O que as páginas vivas da colmeia embutem para rodar sozinhas, e o carimbo que
 * confere que o embutido não envelheceu. Saiu da colmeia-ao-vivo.build.mjs em
 * 2026-10-16, quando o playground.html passou a precisar do mesmo: duas páginas, um
 * core e um layout, nenhuma cópia.
 *
 * Por que embutir, e por que script clássico inline: ver colmeia-ao-vivo.build.mjs.
 *
 *   embedBlocks()   →  { CORE, V3CSS, V3SRC, M50 }, os quatro blocos de texto
 *   stamp(page, blocks, write)  regrava os marcadores <!--NOME-->…<!--/NOME--> e o
 *                    <!--BUILD:hash-->; sem `write`, sai com 1 se algo envelheceu
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
// a v4 é a v3 com localidade (ADR-0010); os marcadores V3CSS/V3SRC e o __v3 ficaram
// com o nome antigo para não reescrever as páginas por causa de um rótulo
const v3Path = path.join(here, "colmeia-v4.html");
const read = (p) => fs.readFileSync(p, "utf8");
const stripMap = (code) => code.replace(/\n?\/\/# sourceMappingURL=.*$/m, "");

export async function embedBlocks() {
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
  return { blocks, modules: order.length };
}

export function stamp(pagePath, { blocks, modules }, write) {
  const hash = createHash("sha256").update(Object.values(blocks).join("\n")).digest("hex").slice(0, 12);
  let page = read(pagePath);
  const stale = [];
  for (const [name, body] of Object.entries(blocks)) {
    const re = new RegExp(`(<!--${name}-->)[\\s\\S]*?(<!--/${name}-->)`);
    if (!re.test(page)) throw new Error(`marcador <!--${name}--> ausente de ${path.basename(pagePath)}`);
    const next = `<!--${name}-->${body}<!--/${name}-->`;
    if (page.match(re)[0] !== next) stale.push(name);
    page = page.replace(re, () => next);
  }
  page = page.replace(/(<!--BUILD:)[0-9a-f]*(-->)/, `$1${hash}$2`);
  const kb = (n) => (n / 1024).toFixed(0) + " KB";
  const name = path.basename(pagePath);
  if (write) {
    fs.writeFileSync(pagePath, page);
    console.log(`${name}: gravado · ${modules} módulos · página ${kb(Buffer.byteLength(page))} · build ${hash}`);
  } else if (stale.length) {
    console.error(`${name}: envelhecido: ${stale.join(", ")} — rode com --write`);
    process.exit(1);
  } else {
    console.log(`${name}: ok · build ${hash}`);
  }
}
