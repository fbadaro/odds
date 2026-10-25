/**
 * Caracterização do porte: o @odds/layout tem de reproduzir a colmeia-v4 byte a byte.
 *
 * O oráculo é test/golden/*.json, capturado uma vez por scripts/capture-legacy.mjs.
 * A geo legada tem referências circulares, então o golden guarda só o recorte
 * `{tiles, rels: [{rk, path}], viewBox}`; aqui se comparam `tiles` e `rels`. O
 * `viewBox` não sai de layout() — quem o escreve é o build() da v4 (render, Task 4).
 * O desenho (`buildSvg`, o `build` da v4) é comparado byte a byte com `svg[chave]`,
 * e o `viewBox` que ele escreve na geo com `viewBoxes[chave]`.
 * Os `bench-*.json` são da Task 5; daqui só se lê o `text` deles, para conferir o
 * gerador de fonte das fixtures.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { layout } from "@odds/layout";
import type { TargetedDiagnostic, ViewOptions } from "@odds/layout";
import { canon, declared, EXTRA, marketplace, sourceOf } from "@odds/layout/fixtures";
import { buildSvg } from "../src/render.js";

const goldenDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "golden");
const read = (name: string) => JSON.parse(fs.readFileSync(path.join(goldenDir, name), "utf8"));
const modelGoldens = fs
  .readdirSync(goldenDir)
  .filter((f) => f.endsWith(".json") && !f.startsWith("bench-"))
  .sort();
const json = <T>(x: T): T => JSON.parse(JSON.stringify(x));

describe("layout × golden da v4", () => {
  it("há goldens de modelo para comparar", () => {
    expect(modelGoldens.length).toBeGreaterThanOrEqual(12);
  });
  for (const file of modelGoldens) {
    it(file, () => {
      const g = read(file);
      expect(g.throws).toBeUndefined();
      const geo = layout(g.model);
      const got = json({ tiles: geo.tiles, rels: geo.rels.map((E) => ({ rk: E.rk, path: E.path })) });
      // a ordem das chaves também é saída: o render itera `tiles` nessa ordem
      expect(Object.keys(got.tiles)).toEqual(Object.keys(g.geo.tiles));
      expect(got.tiles).toEqual(g.geo.tiles);
      expect(got.rels).toEqual(g.geo.rels);
    });
  }
});

describe("fixtures × golden da v4", () => {
  it("declared reproduz o modelo de entrada dos casos da v4", () => {
    for (const model of ["one", "many"] as const) {
      for (const file of ["clean", "broken"] as const) {
        expect(json(declared(model, file, 0, 0))).toEqual(read(`${model}-${file}.json`).model);
      }
      EXTRA[model]!.forEach((_, i) => {
        expect(json(declared(model, "clean", 0, i + 1))).toEqual(read(`${model}-clean-extra${i + 1}.json`).model);
      });
    }
  });

  it("marketplace() é o texto e o arquivo que a bancada embute", () => {
    const g = read("bench-marketplace50.json");
    const m = marketplace();
    expect(m.file).toBe(g.model.file);
    expect(m.text).toBe(g.text);
  });

  it("sourceOf gera a mesma fonte rica de `one`, limpa e com erros", () => {
    expect(sourceOf(declared("one", "clean", 0, 0), "rich").text + "\n").toBe(read("bench-one.json").text);
    expect(sourceOf(canon(declared("one", "broken", 0, 0)), "rich").text + "\n").toBe(read("bench-one-broken.json").text);
  });
});

/** O estado da v4 que scripts/capture-legacy.mjs fixou para cada chave de `svg`
    (DEFAULT_STATE + COMBOS): `sel` e `selSub` sempre nulos. */
function optsOf(key: string): ViewOptions {
  const [view, tags, labels, sel] = key.split("|");
  return {
    view: view as ViewOptions["view"],
    tags: tags as ViewOptions["tags"],
    labels: labels!,
    sel: null,
    selSub: null,
    selDiag: sel === "selDiag0" ? 0 : null,
  };
}

describe("buildSvg × golden da v4", () => {
  for (const file of modelGoldens) {
    describe(file, () => {
      const g = read(file);
      it("tem as quatro combinações e nenhuma lançou", () => {
        expect(Object.keys(g.svg)).toEqual(["flow|on|ctx", "flow|off|ctx", "contain|on|ctx", "flow|on|ctx|selDiag0"]);
        expect(g.svgThrows).toBeUndefined();
      });
      for (const key of Object.keys(g.svg)) {
        it(key, () => {
          // build escreve na geo (viewBox, badges, labels) e em cada diagnóstico (`i`):
          // geo nova e diags clonados a cada combinação, como a captura fez com os diags
          const geo = layout(g.model);
          const diags = json(g.diags) as TargetedDiagnostic[];
          expect(buildSvg(geo, diags, optsOf(key))).toBe(g.svg[key]);
          expect(json(geo.viewBox)).toEqual(g.viewBoxes[key]);
        });
      }
    });
  }
});
