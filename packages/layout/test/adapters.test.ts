/**
 * Os adaptadores como API do pacote: o texto `.odds` de cada fixture
 * test/golden/bench-*.json, passado por parseAndValidate, tem de dar o mesmo modelo,
 * as mesmas chaves de topologia, os mesmos alvos e, byte a byte, o mesmo SVG.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseAndValidate } from "@odds/core";
import type { SubdomainType } from "@odds/core";
import { anchorsOf, layout, modelOf, navOf, renderSvg, targetOf, topologyKeys } from "@odds/layout";
import type { TargetedDiagnostic, ViewOptions } from "@odds/layout";

const goldenDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "golden");
const read = (name: string) => JSON.parse(fs.readFileSync(path.join(goldenDir, name), "utf8"));
const json = <T>(x: T): T => JSON.parse(JSON.stringify(x));
const benches = fs.readdirSync(goldenDir).filter((f) => f.startsWith("bench-") && f.endsWith(".json")).sort();

function optsOf(key: string): ViewOptions {
  const [view, tags, labels, sel] = key.split("|");
  return { view: view as ViewOptions["view"], tags: tags as ViewOptions["tags"], labels: labels!, sel: null, selSub: null, selDiag: sel === "selDiag0" ? 0 : null };
}

function targeted(text: string) {
  const r = parseAndValidate(text);
  const anchors = anchorsOf(r.ast!);
  const diags: TargetedDiagnostic[] = r.diagnostics.map((d) => ({ code: d.code, severity: d.severity, data: d.data, span: d.span, target: targetOf(d, anchors) }));
  return { ast: r.ast!, diags };
}

describe("adaptadores × fixtures bench-*", () => {
  it("há três fixtures", () => {
    expect(benches.length).toBe(3);
  });
  for (const file of benches) {
    describe(file, () => {
      const g = read(file);
      const { ast, diags } = targeted(g.text);
      const model = modelOf(ast, g.model.file, new Map());
      it("modelOf", () => expect(json(model)).toEqual(g.model));
      it("topologyKeys", () => expect(topologyKeys(model)).toEqual(g.keys));
      it("targets", () => expect(diags.map((d) => d.target)).toEqual(g.targets));
      it("navOf", () => {
        const nav = json(navOf(layout(model)));
        const want = json(g.nav);
        delete want.farSvg;
        delete want.fit;
        expect(nav).toEqual(want);
      });
      for (const key of Object.keys(g.svg)) {
        it(`renderSvg ${key}`, () => {
          const before = json(diags);
          expect(renderSvg(layout(model), diags, optsOf(key))).toBe(g.svg[key]);
          expect(diags).toEqual(before); // não anota `i` nos diagnósticos de quem chamou
        });
      }
    });
  }
});

describe("modelOf, os casos que o layout não aguenta", () => {
  const model = (text: string, last = new Map<string, SubdomainType>()) => modelOf(parseAndValidate(text).ast!, "x.odds", last);

  it("texto sem domínio: domains vazio, e renderSvg devolve um <svg sem lançar", () => {
    const m = model("");
    expect(m.domains).toEqual([]);
    expect(renderSvg(layout(m), [], optsOf("flow|on|ctx")).startsWith("<svg")).toBe(true);
  });

  it("tipo inválido: usa a memória do último tipo válido, senão generic", () => {
    const last = new Map<string, SubdomainType>();
    model("domain D {\n  subdomain core X {\n    context A\n  }\n}\n", last);
    expect(last.get("D/X")).toBe("core");
    const typeOf = (m: ReturnType<typeof model>) => m.domains[0]!.subdomains[0]!.type;
    const broken = "domain D {\n  subdomain cor X {\n    context A\n  }\n}\n";
    expect(typeOf(model(broken, last))).toBe("core");
    expect(typeOf(model(broken))).toBe("generic");
  });

  it("contexto repetido, relação para contexto sem peça e domínio vazio ficam de fora", () => {
    const m = model(
      "domain D {\n  subdomain core X {\n    context A\n    context B\n  }\n  subdomain supporting Y {\n    context A\n  }\n  mapping {\n    A --> B\n    B --> A\n    A --> Fantasma\n  }\n}\ndomain Vazio {\n}\n",
    );
    expect(m.domains.map((d) => d.id)).toEqual(["D"]);
    expect(m.domains[0]!.subdomains[1]!.contexts).toEqual([]);
    expect(m.mapping.map((r) => r.l + r.c + r.r)).toEqual(["A-->B"]);
    expect(() => layout(m)).not.toThrow();
  });
});
