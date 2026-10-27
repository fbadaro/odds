/**
 * Verificação diferencial do desenho: o `buildSvg` sobre a matriz de estados que os
 * goldens de svg não cobrem.
 *
 * Os goldens fixam só quatro estados, com `sel` e `selSub` nulos e `labels: "ctx"`.
 * Aqui se varre o resto da matriz — seleção de contexto, de subdomínio, de
 * diagnóstico, e os rótulos "sub" e "dom" — sobre os modelos da v4.
 *
 * O oráculo era o `build` da colmeia-v4, carregado sem DOM de
 * docs/design/pages/colmeia-v4.html. A página foi apagada em 2026-10-24, depois de
 * validada: nesse dia o porte batia com ela nos 540 estados, e o resultado ficou
 * congelado na chave `matrix` dos seis goldens, um hash por estado do SVG e do
 * `viewBox` que a v4 escrevia. A página segue no git:
 * `git show e282c83:docs/design/pages/colmeia-v4.html`.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { layout } from "@odds/layout";
import type { LayoutModel, TargetedDiagnostic, ViewOptions } from "@odds/layout";
import { buildSvg } from "../src/render.js";

const goldenDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "golden");
const read = (name: string) => JSON.parse(fs.readFileSync(path.join(goldenDir, name + ".json"), "utf8"));
const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));

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

const keyOf = (s: ViewOptions) => [s.view, s.tags, s.labels, s.sel ?? "-", s.selSub ?? "-", s.selDiag ?? "-"].join("|");
const hash = (svg: string, viewBox: unknown) =>
  crypto.createHash("sha256").update(svg + "\n" + JSON.stringify(viewBox)).digest("hex").slice(0, 16);

const CASES = ["one-clean", "one-broken", "one-clean-extra1", "many-clean", "many-broken", "many-clean-extra1"];

describe("buildSvg × matriz congelada da v4", () => {
  for (const name of CASES) {
    it(name, () => {
      const g = read(name);
      const M: LayoutModel = g.model;
      const diags: TargetedDiagnostic[] = g.diags;
      // build escreve na geo (viewBox, badges, labels): uma geo só, na ordem da matriz,
      // como a v4 foi varrida
      const geo = layout(M);
      const ctxs = Object.keys(geo.tiles);
      const subs: string[] = [];
      M.domains.forEach((d) => {
        d.subdomains.forEach((s) => subs.push(d.id + "/" + s.id));
        if ((d.external || []).length) subs.push(d.id + "/external");
      });
      const states = statesOf(ctxs, subs, diags.length);
      const got: Record<string, string> = {};
      for (const st of states) got[keyOf(st)] = hash(buildSvg(geo, clone(diags), st), geo.viewBox);
      expect(states.length).toBeGreaterThan(60);
      expect(Object.keys(got)).toEqual(Object.keys(g.matrix));
      expect(got).toEqual(g.matrix);
    });
  }
});
