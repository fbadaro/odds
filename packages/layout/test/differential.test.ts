/**
 * Verificação diferencial do desenho: o `build` da colmeia-v4, carregado sem DOM da
 * página congelada (docs/design/pages/colmeia-v4.html), contra o `buildSvg` portado.
 *
 * Os goldens fixam só quatro estados, com `sel` e `selSub` nulos e `labels: "ctx"`.
 * Aqui se varre o resto da matriz — seleção de contexto, de subdomínio, de
 * diagnóstico, e os rótulos "sub" e "dom" — sobre os modelos da v4, comparando o SVG
 * e o `viewBox` que cada lado escreve na geo.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import { layout } from "@odds/layout";
import type { LayoutModel, TargetedDiagnostic, ViewOptions } from "@odds/layout";
import { buildSvg } from "../src/render.js";

type Legacy = any;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const g = globalThis as Record<string, unknown>;
const saved = { headless: Object.hasOwn(g, "__V3_HEADLESS"), v3: Object.hasOwn(g, "__v3"), h: g.__V3_HEADLESS, x: g.__v3 };

/** A mesma técnica de scripts/capture-legacy.mjs: o último <script> da página. */
function loadPage(): Legacy {
  const html = fs.readFileSync(path.join(root, "docs/design/pages/colmeia-v4.html"), "utf8");
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  g.__V3_HEADLESS = true;
  new Function(scripts[scripts.length - 1]![1]!)();
  return g.__v3;
}
const v3 = loadPage();

afterAll(() => {
  if (saved.headless) g.__V3_HEADLESS = saved.h;
  else delete g.__V3_HEADLESS;
  if (saved.v3) g.__v3 = saved.x;
  else delete g.__v3;
});

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));

/** A geo da bancada, como na captura: o modelo entra por MODELS.__live. */
function legacyGeo(M: LayoutModel): Legacy {
  v3.MODELS.__live = clone(M);
  try {
    return v3.layout(v3.canon(v3.declared("__live", "clean", 0, 0)));
  } finally {
    delete v3.MODELS.__live;
  }
}

/** A matriz: cada seleção sozinha, mais uma combinada, sob as 12 vistas. */
function statesOf(ctxs: string[], subs: string[], nDiags: number): ViewOptions[] {
  const picks: [string | null, string | null, number | null][] = [
    [null, null, null],
    [ctxs[0]!, null, null],
    [ctxs[ctxs.length - 1]!, null, null],
    [null, subs[0]!, null],
    [null, subs[subs.length - 1]!, null],
    ...Array.from({ length: nDiags }, (_, i): [null, null, number] => [null, null, i]),
    [ctxs[1]!, subs[0]!, nDiags ? 0 : null],
  ];
  const out: ViewOptions[] = [];
  for (const view of ["flow", "contain"] as const)
    for (const tags of ["on", "off"] as const)
      for (const labels of ["ctx", "sub", "dom"])
        for (const [sel, selSub, selDiag] of picks) out.push({ view, tags, labels, sel, selSub, selDiag });
  return out;
}

const CASES: [string, "clean" | "broken", number][] = [
  ["one", "clean", 0],
  ["one", "broken", 0],
  ["one", "clean", 1],
  ["many", "clean", 0],
  ["many", "broken", 0],
  ["many", "clean", 1],
];

describe("buildSvg × build da v4 congelada", () => {
  for (const [model, file, extra] of CASES) {
    it(`${model}-${file}-extra${extra}`, () => {
      const M: LayoutModel = v3.declared(model, file, 0, extra);
      const diags: TargetedDiagnostic[] = v3.diagsFor(model, file, v3.sourceOf(M, "today")).items;
      const lg = legacyGeo(M);
      const geo = layout(M);
      const ctxs = Object.keys(geo.tiles);
      const subs: string[] = [];
      M.domains.forEach((d) => {
        d.subdomains.forEach((s) => subs.push(d.id + "/" + s.id));
        if ((d.external || []).length) subs.push(d.id + "/external");
      });
      const states = statesOf(ctxs, subs, diags.length);
      const differ: string[] = [];
      for (const st of states) {
        Object.assign(v3.state, st);
        const want = v3.build(lg, clone(diags), null);
        const got = buildSvg(geo, clone(diags), st);
        if (got !== want || JSON.stringify(geo.viewBox) !== JSON.stringify(lg.viewBox)) differ.push(JSON.stringify(st));
      }
      Object.assign(v3.state, { view: "flow", tags: "on", labels: "ctx", sel: null, selSub: null, selDiag: null });
      expect(states.length).toBeGreaterThan(60);
      expect(differ).toEqual([]);
    });
  }
});
