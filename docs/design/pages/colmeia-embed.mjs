/**
 * O que as páginas vivas da colmeia embutem para rodar sozinhas, e o carimbo que
 * confere que o embutido não envelheceu. Saiu da colmeia-ao-vivo.build.mjs em
 * 2026-10-16, quando o playground.html passou a precisar do mesmo: duas páginas, um
 * core e um layout, nenhuma cópia.
 *
 * Desde 2026-10-21 o layout é o pacote `@odds/layout`, e não mais o script da
 * colmeia-v4.html, que ficou como registro congelado do ADR-0010 até 2026-10-24, quando
 * foi apagada depois de validada (segue no git em e282c83). O pacote entra no mesmo
 * registro do core; a v4 não é mais lida.
 *
 * Por que embutir, e por que script clássico inline: ver colmeia-ao-vivo.build.mjs.
 *
 *   embedBlocks()   →  { CORE, TOKENS, V3CSS, V3SRC, M50 }, os cinco blocos de texto
 *   stamp(page, blocks, write)  regrava os marcadores <!--NOME-->…<!--/NOME--> e o
 *                    <!--BUILD:hash-->; sem `write`, sai com 1 se algo envelheceu
 *
 * Exige o core, o messages e o layout compilados (`npm run typecheck`).
 */
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");
const read = (p) => fs.readFileSync(p, "utf8");
const stripMap = (code) => code.replace(/\n?\/\/# sourceMappingURL=.*$/m, "");

/* Os marcadores V3CSS/V3SRC e o __v3 ficaram com o nome antigo (a v3, depois a v4,
   era o layout) para não reescrever as páginas por causa de um rótulo. */

/* Cada variável do map.css e o token da bancada que a veste. A tabela é explícita
   de propósito: variável nova no pacote sem apelido aqui derruba o build, em vez de
   o mapa cair calado na paleta padrão do pacote. */
const ALIAS = {
  bg: "--c-bg", panel: "--c-panel", panel2: "--c-panel2", border: "--c-border",
  ink: "--c-ink", dim: "--c-dim", accent: "--c-accent", azure: "--c-azure", pulse: "--c-pulse",
  solar: "--c-solar", error: "--c-error", warning: "--c-warning", info: "--c-info",
  "shadow-strength": "--shadow-strength",
  "mix-core": "--mix-core", "mix-sup": "--mix-sup", "mix-gen": "--mix-gen",
  "tile-core": "--tile-core", "tile-sup": "--tile-sup", "tile-gen": "--tile-gen", "tile-edge": "--tile-edge",
  edge: "--c-edge",
};

/* A ponte: o __v3 que as páginas chamam, montado do pacote embutido no CORE (que
   por isso vem antes deste bloco na página). Só nomes da v4, com a assinatura da
   v4; o `build(geo, diags, src)` dela vira `renderSvg(geo, diags, state)`, e o `src`
   (a fonte gerada, de onde a v4 ancorava diagnósticos) não serve mais. O que é do
   pacote e não da v4 (renderSvg, modelOf, topologyKeys, anchorsOf, targetOf, navOf)
   as páginas tomam direto de __odds["odds-layout/index.js"]. */
const BRIDGE = `
(function () {
  "use strict";
  var L = globalThis.__odds["odds-layout/index.js"], F = globalThis.__odds["odds-layout/fixtures/index.js"];
  var state = { view: "flow", tags: "on", labels: "ctx", sel: null, selSub: null, selDiag: null };
  globalThis.__v3 = {
    state: state,
    MODELS: F.MODELS, BREAKS: F.BREAKS, EXTRA: F.EXTRA, declared: F.declared, canon: F.canon, sourceOf: F.sourceOf,
    layout: L.layout, placeLabels: L.placeLabels, measure: L.measure, tilesMoved: L.tilesMoved, tierOf: L.tierOf,
    build: function (geo, diags) { return L.renderSvg(geo, diags, state); }
  };
})();
`;

/* Os nomes que uma declaração `export const a = …, b = …;` exporta. O `tsc` junta
   constantes numa linha só (hex.ts: `C = 28, HR = C, …`); ler só o primeiro nome
   deixaria os outros como `undefined` em quem os importa. */
function declaredNames(code, from, spec) {
  const names = [];
  let i = from, depth = 0, expectName = true;
  while (i < code.length) {
    if (expectName) {
      const m = /^\s*([A-Za-z_$][\w$]*)/.exec(code.slice(i, i + 200));
      if (!m) throw new Error(`${spec}: declaração exportada numa forma que o build não conhece`);
      names.push(m[1]); i += m[0].length; expectName = false; continue;
    }
    const ch = code[i];
    if (ch === '"' || ch === "'" || ch === "`") {
      for (i++; i < code.length && code[i] !== ch; i++) if (code[i] === "\\") i++;
      i++; continue;
    }
    if (ch === "/" && code[i + 1] === "*") { i = code.indexOf("*/", i + 2) + 2; continue; }
    if (ch === "/" && code[i + 1] === "/") { i = code.indexOf("\n", i); continue; }
    // literal de regex (`pattern: /\{/`): onde uma expressão começa, `/` abre um
    if (ch === "/" && /[(,=:[!&|?{};+]/.test(code.slice(0, i).trimEnd().slice(-1))) {
      let cls = false;
      for (i++; i < code.length && (code[i] !== "/" || cls); i++) {
        if (code[i] === "\\") i++;
        else if (code[i] === "[") cls = true;
        else if (code[i] === "]") cls = false;
      }
      i++; continue;
    }
    if ("([{".includes(ch)) depth++;
    else if (")]}".includes(ch)) depth--;
    else if (depth === 0 && ch === ",") expectName = true;
    else if (depth === 0 && ch === ";") break;
    i++;
  }
  return names;
}

export async function embedBlocks() {
  /* ---- 1. os módulos, e a conversão para o registro ---- */
  const modules = {}; // especificador → código-fonte ES
  modules["chevrotain"] = stripMap(read(path.join(root, "node_modules/chevrotain/lib/chevrotain.min.mjs")));
  const addDist = (dir, prefix) => {
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".js")).sort()) {
      modules[`${prefix}/${file}`] = stripMap(read(path.join(dir, file)));
    }
  };
  addDist(path.join(root, "packages/core/dist"), "odds-core");
  addDist(path.join(root, "packages/layout/dist"), "odds-layout");
  addDist(path.join(root, "packages/layout/dist/fixtures"), "odds-layout/fixtures");
  const msgDist = path.join(root, "packages/messages/dist");
  const jsonImport = /import\s+catalogue\s+from\s+"\.\/messages\.json"\s+with\s+\{\s*type:\s*"json"\s*\};/;
  const msgSrc = stripMap(read(path.join(msgDist, "index.js")));
  if (!jsonImport.test(msgSrc)) throw new Error("@odds/messages mudou a forma do import do catálogo; ajuste o build");
  modules["odds-messages/index.js"] = msgSrc.replace(jsonImport,
    `const catalogue = ${read(path.join(msgDist, "messages.json")).trim()};`);

  // "./x.js" e "../x.js" relativos a quem importa; o resto (chevrotain) é o próprio nome
  function resolveSpec(from, spec) {
    if (!spec.startsWith("./") && !spec.startsWith("../")) return spec;
    const dir = from.split("/").slice(0, -1);
    for (const part of spec.split("/")) {
      if (part === "..") dir.pop();
      else if (part !== ".") dir.push(part);
    }
    return dir.join("/");
  }
  const bindings = (list) => list.split(",").map((s) => s.trim()).filter(Boolean).map((s) => {
    const [a, b] = s.split(/\s+as\s+/);
    return { local: a.trim(), exported: (b ?? a).trim() };
  });

  function convert(spec, code) {
    const deps = new Set(), exps = [], exported = new Set(), needs = [];
    const req = (s) => { const r = resolveSpec(spec, s); deps.add(r); return `__odds[${JSON.stringify(r)}]`; };
    const need = (s, names) => names.forEach((n) => needs.push([resolveSpec(spec, s), n]));
    for (const m of code.matchAll(/^export\s+(const|let|var)\s+/gm)) {
      declaredNames(code, m.index + m[0].length, spec).forEach((n) => { exps.push(n); exported.add(n); });
    }
    let out = code
      // export { a, b as c } from "./x.js";
      .replace(/^export\s*\{([^}]*)\}\s*from\s*"([^"]+)";?/gm, (_, list, s) => {
        const m = req(s);
        need(s, bindings(list).map((b) => b.local));
        return bindings(list).map((b) => { exported.add(b.exported); return `__exp.${b.exported} = ${m}.${b.local};`; }).join(" ");
      })
      // import * as t from "./x.js";
      .replace(/^import\s*\*\s*as\s+(\w+)\s+from\s*"([^"]+)";?/gm, (_, name, s) => `const ${name} = ${req(s)};`)
      // import { a, b as c } from "./x.js";
      .replace(/^import\s*\{([^}]*)\}\s*from\s*"([^"]+)";?/gm, (_, list, s) => {
        need(s, bindings(list).map((b) => b.local));
        return `const { ${bindings(list).map((b) => (b.local === b.exported ? b.local : `${b.local}: ${b.exported}`)).join(", ")} } = ${req(s)};`;
      })
      // export const X = / export function f( / export class C — os nomes já foram lidos acima
      .replace(/^export\s+(const|let|var)\s+/gm, (_, kw) => `${kw} `)
      .replace(/^export\s+(function|class)\s+(\w+)/gm, (_, kw, name) => { exps.push(name); exported.add(name); return `${kw} ${name}`; })
      // export {};
      .replace(/^export\s*\{\s*\};?/gm, "")
      // export{ra as Alternation, ...};  — o fim do Chevrotain minificado, que não começa linha
      .replace(/export\s*\{([^}]*)\};?/g, (_, list) =>
        bindings(list).map((b) => { exported.add(b.exported); return `__exp.${b.exported} = ${b.local};`; }).join(" "));
    if (/(^|[;\s}])(import|export)(?![\w$])\s*[\w{*"]/m.test(out.replace(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/g, '""')
      .replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, ""))) {
      throw new Error(`${spec}: sobrou import/export numa forma que o build não conhece`);
    }
    out += "\n" + exps.map((n) => `__exp.${n} = ${n};`).join(" ");
    return { deps: [...deps], body: out, exported, needs };
  }

  const converted = Object.fromEntries(Object.entries(modules).map(([s, c]) => [s, convert(s, c)]));
  /* Todo nome importado tem de ser exportado por quem o importa: é o que pega uma
     forma de export que a conversão leu pela metade, antes que vire `undefined` no
     navegador. */
  const missing = [];
  for (const [s, c] of Object.entries(converted)) {
    for (const [dep, name] of c.needs) if (converted[dep] && !converted[dep].exported.has(name)) missing.push(`${s} → ${dep}.${name}`);
  }
  if (missing.length) throw new Error(`importado mas não exportado: ${missing.join(", ")}`);
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

  /* ---- 2. a pele do mapa: o map.css do pacote, vestido com os tokens da bancada ---- */
  const mapCss = read(path.join(root, "packages/layout/map.css")).trim();
  if (/<\/style/i.test(mapCss)) throw new Error("o map.css contém </style");
  const vars = new Set([...mapCss.matchAll(/--odds-map-([\w-]+)\s*:/g)].map((m) => m[1]));
  const unaliased = [...vars].filter((v) => !ALIAS[v]), stale = Object.keys(ALIAS).filter((v) => !vars.has(v));
  if (unaliased.length || stale.length) {
    throw new Error(`apelidos fora do map.css: sem apelido ${unaliased.join(", ") || "—"}; apelido sem variável ${stale.join(", ") || "—"}`);
  }
  const aliasCss = "/* Apelidos da bancada (colmeia-embed.mjs): cada variável do mapa lê o token\n" +
    "   da página, que muda com o tema. Depois dos padrões do pacote, e com mais\n" +
    "   especificidade que eles (que estão em :where), então vencem sempre. */\n" +
    ":root{\n" + Object.entries(ALIAS).map(([v, t]) => `  --odds-map-${v}:var(${t});`).join("\n") + "\n}";

  /* ---- 3. os tokens da bancada: um arquivo, as duas páginas ---- */
  const tokensCss = read(path.join(here, "bancada-tokens.css")).trim();
  if (/<\/style/i.test(tokensCss)) throw new Error("bancada-tokens.css contém </style");
  const tokenNames = new Set([...tokensCss.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
  const noToken = Object.values(ALIAS).filter((t) => !tokenNames.has(t));
  if (noToken.length) throw new Error(`apelido para token que bancada-tokens.css não define: ${noToken.join(", ")}`);

  /* ---- 4. o marketplace de 50, como texto ---- */
  /* A fonte sai do `marketplace()` das fixtures do pacote, o porte do gerador da v4
     (modo "rich", com description e owner de subdomínio) sobre o modelo documentado.
     Tem de validar limpa: a bancada começa sem erro, e os erros são os que quem
     testa digitar. */
  const fixtures = await import(pathToFileURL(path.join(root, "packages/layout/dist/fixtures/index.js")).href);
  const m50 = fixtures.marketplace();
  const core = await import(pathToFileURL(path.join(root, "packages/core/dist/index.js")).href);
  const m50Diags = core.parseAndValidate(m50.text).diagnostics;
  if (m50Diags.length) throw new Error(`o marketplace deveria validar limpo: ${m50Diags.map((d) => d.code).join(", ")}`);

  /* ---- montagem ---- */
  const blocks = {
    CORE: `<script>\n${coreScript}\n</script>`,
    TOKENS: `<style id="tokens">\n${tokensCss}\n</style>`,
    V3CSS: `<style id="v3css">\n${mapCss}\n${aliasCss}\n</style>`,
    V3SRC: `<script>${BRIDGE}</script>`,
    M50: `<script>globalThis.__M50 = ${JSON.stringify({ file: m50.file, text: m50.text })};</script>`,
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
