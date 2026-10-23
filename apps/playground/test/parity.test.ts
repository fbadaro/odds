import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// ADR-0020: a bancada marca o que validou com data-feature; a aplicação
// precisa de um componente com o mesmo literal, nas duas direções.
const BENCH = fileURLToPath(
  new URL("../../../docs/design/pages/playground.html", import.meta.url),
);
const SRC = fileURLToPath(new URL("../src", import.meta.url));
const MARK = /data-feature="([a-z0-9-]+)"/g;

const SEVENTEEN = [
  "map", "file-menu", "view-switch", "share", "export-svg", "theme-toggle",
  "rail", "panel-code", "panel-tree", "panel-help", "ficha",
  "selection-caption", "frozen-flag", "wait-indicator", "diagnostics-dock",
  "zoom-controls", "toast",
];

// Uma feature que a bancada validou e a aplicação ainda não tem entra aqui, com a razão.
// A paridade de 2026-10-22 portou as 17: vazio.
const PENDING: Record<string, string> = {};

const ids = (text: string) => new Set([...text.matchAll(MARK)].map((m) => m[1]!));

const B = ids(readFileSync(BENCH, "utf8"));
const A = new Set<string>();
for (const rel of readdirSync(SRC, { recursive: true }) as string[]) {
  if (!rel.endsWith(".tsx")) continue;
  for (const id of ids(readFileSync(`${SRC}/${rel}`, "utf8"))) A.add(id);
}

describe("bench/app parity", () => {
  it("the bench still marks the 17 features of 2026-10-22", () => {
    expect([...B]).toEqual(expect.arrayContaining(SEVENTEEN));
  });

  it("every validated feature has a component, or is PENDING with a reason", () => {
    for (const id of B) {
      if (id in PENDING) continue;
      expect(A.has(id), `${id} has no component`).toBe(true);
    }
  });

  it("PENDING lists only bench features the app still lacks", () => {
    for (const k of Object.keys(PENDING)) {
      expect(B.has(k), `${k} not in the bench`).toBe(true);
      expect(A.has(k), `${k} is implemented, drop it from PENDING`).toBe(false);
    }
  });

  it("the app implements nothing the bench has not validated", () => {
    for (const id of A) expect(B.has(id), `${id} not in the bench`).toBe(true);
  });
});
