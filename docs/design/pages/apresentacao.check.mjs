#!/usr/bin/env node
/**
 * Checagem mecânica da apresentacao.html, e o gerador do GSAP que ela embute.
 *
 *   node docs/design/pages/apresentacao.check.mjs           confere; sai com 1 se algo falhar
 *   node docs/design/pages/apresentacao.check.mjs --write   regrava o bloco <!--GSAP-->
 *
 * O GSAP vai embutido porque a sala pode não ter rede (ADR-0014). O resto confere o
 * roteiro da spec (docs/superpowers/specs/2026-10-19-apresentacao-odds-design.md):
 * a ordem dos slides de cada versão, os minutos somando 30 e 60, notas em todo
 * slide, o selo de visão onde a coisa ainda não existe, o link da demo e a
 * pergunta-âncora. Lê o HTML como texto, sem DOM.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { stamp } from "./colmeia-embed.mjs";
import { AJUSTES } from "./pagamentos.ajustes.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");
const pagePath = path.join(here, "apresentacao.html");
const WRITE = process.argv.includes("--write");

const V30 = ["capa", "pergunta", "dor-espacos", "dor-custo", "odds-texto-mapa", "odds-contratos",
  "demo-ida", "demo-volta", "encaixe-camadas", "encaixe-visao", "estado", "decisao"];
const V60 = ["capa", "pergunta", "dor-espacos", "dor-custo", "odds-texto-mapa", "odds-contratos",
  "bian-catalogo", "bian-correspondencia", "demo-ida", "demo-volta", "encaixe-camadas", "encaixe-visao",
  "encaixe-fluxo", "estado", "decisao"];
const ANCORA = "Em que domínio e contexto este serviço está, e o que ele resolve?";
// a sobreposição de encaixe-camadas também é ilustração: a ligação serviço ↔ contexto não existe
const VISAO = ["encaixe-camadas", "encaixe-visao", "encaixe-fluxo"];

if (!fs.existsSync(pagePath)) {
  console.error("apresentacao.html: página ausente");
  process.exit(1);
}
const gsap = fs.readFileSync(path.join(root, "node_modules/gsap/dist/gsap.min.js"), "utf8");
if (/<\/script/i.test(gsap)) throw new Error("o gsap.min.js contém </script");

const html = fs.readFileSync(pagePath, "utf8");
const failures = [];
const fail = (m) => failures.push(m);

// sem rede na sala: nada de script externo (só o <link> das fontes, que tem fallback)
if (/<script\b[^>]*\bsrc=/i.test(html)) fail("há <script src=…>: a página tem de rodar sem rede");

const slides = [...html.matchAll(/<section class="slide"([^>]*)>([\s\S]*?)<\/section>/g)].map(([, attrs, body]) => {
  const data = Object.fromEntries([...attrs.matchAll(/data-([\w-]+)(?:="([^"]*)")?/g)].map(([, k, v]) => [k, v ?? ""]));
  return { id: data.id, data, body };
});
const ids = slides.map((s) => s.id);
const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
if (dup.length) fail(`data-id repetido: ${dup.join(", ")}`);
for (const s of slides) {
  if (!s.id) fail("slide sem data-id");
  const notes = s.body.match(/<aside class="notes">([\s\S]*?)<\/aside>/);
  if (!notes || !notes[1].replace(/<[^>]+>/g, "").trim()) fail(`${s.id}: sem notas`);
}

const inSeq = slides.filter((s) => !("apendice" in s.data));
const seq30 = inSeq.filter((s) => s.data.only !== "60");
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
if (!same(seq30.map((s) => s.id), V30)) fail(`sequência da versão 30: ${seq30.map((s) => s.id).join(" ")}`);
if (!same(inSeq.map((s) => s.id), V60)) fail(`sequência da versão 60: ${inSeq.map((s) => s.id).join(" ")}`);

const sum = (list, key) => list.reduce((n, s) => n + Number(s.data[key] ?? s.data.min), 0);
if (sum(seq30, "min") !== 30) fail(`a versão 30 soma ${sum(seq30, "min")} minutos`);
if (sum(inSeq, "min60") !== 60) fail(`a versão 60 soma ${sum(inSeq, "min60")} minutos`);

const byId = Object.fromEntries(slides.map((s) => [s.id, s]));
for (const id of VISAO) if (!/class="[^"]*\bselo-visao\b/.test(byId[id]?.body ?? "")) fail(`${id}: sem o selo de visão`);
const link = /<a\b(?=[^>]*\bhref="playground\.html\?modelo=pagamentos")(?=[^>]*\btarget="_blank")[^>]*>/;
if (!link.test(byId["demo-ida"]?.body ?? "")) fail("demo-ida: sem o link playground.html?modelo=pagamentos em aba nova");
if (!byId.pergunta?.body.includes(ANCORA)) fail("pergunta: sem a pergunta-âncora no texto exato");

// o achado "descoberto, não declarado" tem de ser uma chamada que o desenho de produção mostra
if (!/data-call="orders-svc>ledger-db"/.test(html)) fail("tpl-solucao: sem a chamada orders-svc → ledger-db que encaixe-visao cita");
// Cmd+Tab troca de aplicativo no Mac, não de aba: a nota não pode mandar o apresentador para fora do navegador
if (/Cmd\/Ctrl\+Tab/.test(html)) fail("notas: Cmd+Tab não troca de aba no Mac");
// atrás de um proxy que não responde, uma folha de estilo bloqueante segura a primeira pintura até o timeout
for (const [nome, texto] of [["apresentacao.html", html], ["playground.html", fs.readFileSync(path.join(here, "playground.html"), "utf8")]]) {
  for (const tag of texto.match(/<link\b[^>]*rel="stylesheet"[^>]*>/g) ?? []) {
    if (!/media="print"/.test(tag) || !/onload=/.test(tag)) fail(`${nome}: folha de estilo externa bloqueante: ${tag.slice(0, 60)}…`);
  }
}

/* O roteiro da demo, nas notas de demo-ida, conferido contra o validador: se o core
   mudar, a nota que promete um diagnóstico tem de mudar junto. Cada edição parte do
   pagamentos.odds limpo; as duas últimas são a construção do zero da versão 60. */
const core = await import(pathToFileURL(path.join(root, "packages/core/dist/index.js")).href);
const pag = fs.readFileSync(path.join(here, "pagamentos.odds"), "utf8");
const edit = (t, a, b) => (t.includes(a) ? t.replace(a, b) : (fail(`demo: a linha mudou em pagamentos.odds: ${a.trim()}`), t));
const novo = edit(pag, "  external {", "  subdomain supporting Reconciliation {\n    context AccountReconciliation\n  }\n\n  external {");
const DEMO = [
  ["CONFORMIST_CORE", edit(pag, "--> [ACL] PaymentOrder", "--> [CF] PaymentOrder")],
  ["GENERIC_WITHOUT_OHS", edit(pag, "PartyAuthentication [OHS, PL] -->      PaymentInitiation", "PartyAuthentication [S]       --> [C]  PaymentInitiation")],
  ["DOWNSTREAM_ONLY_TAG_MISPLACED", edit(pag, "SPI                 [OHS, PL] --> [ACL] PaymentRailOperations", "SPI                 [ACL]     -->      PaymentRailOperations")],
  ["UNMAPPED_CONTEXT", novo],
  ["", edit(novo, "    ACHOperations       -x-                CardNetwork", "    ACHOperations       -x-                CardNetwork\n    PositionKeeping     [OHS]     -->      AccountReconciliation")],
];
const notesDemo = byId["demo-ida"]?.body ?? "";
for (const [code, text] of DEMO) {
  const got = core.parseAndValidate(text).diagnostics.map((d) => d.code).join(", ");
  if (got !== code) fail(`demo: esperava ${code || "limpo"}, o validador deu ${got || "limpo"}`);
  if (code && !notesDemo.includes(code)) fail(`demo-ida: as notas não citam ${code}`);
}
// o playground abre o recorte incoerente: a nota tem de dizer o que o botão vai apagar
if (!notesDemo.includes("Tornar coerente")) fail("demo-ida: as notas não falam do botão Tornar coerente");
for (const a of AJUSTES) if (!notesDemo.includes(a.code)) fail(`demo-ida: as notas não citam ${a.code}, que o ajuste ao vivo apaga`);
// o "L73" da nota é onde o apresentador põe o cursor: tem de ser a linha do arquivo
const solto = (s) => s.replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/\s+/g, " ").trim();
const linhas = pag.split("\n").map(solto);
for (const [, n, trecho] of notesDemo.matchAll(/<td>L(\d+)<\/td><td>(?:<b>[^<]*<\/b>\s*)?<code>([^<]*)<\/code>/g)) {
  const achada = linhas.indexOf(solto(trecho)) + 1;
  if (achada !== Number(n)) fail(`demo-ida: a nota diz L${n} para «${solto(trecho)}», o arquivo tem na linha ${achada || "nenhuma"}`);
}

if (failures.length) {
  for (const f of failures) console.error("FALHA  " + f);
  process.exit(1);
}
stamp(pagePath, { blocks: { GSAP: `<script>${gsap}</script>` }, modules: 1 }, WRITE);
