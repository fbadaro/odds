/**
 * Suíte de conformidade dos golden files — executor do `TEST_SUITE.md` §3.
 *
 * **Como um caso "pendente" é tratado.** O validador semântico ainda não
 * existe, então a maioria dos 44 casos não passa. Marcá-los com `skip` os
 * tornaria invisíveis; deixá-los falhando tornaria a suíte inútil como sinal.
 * Em vez disso, cada caso pendente está em `PENDING` com o motivo, e a suíte
 * assere **os dois lados**: um caso fora de `PENDING` precisa passar
 * integralmente, e um caso dentro de `PENDING` precisa continuar falhando.
 *
 * A segunda metade é o que importa: quando uma fase do validador entrar, os
 * casos que ela resolve começam a passar e a suíte **falha**, exigindo que
 * saiam de `PENDING`. A lista não pode apodrecer em silêncio.
 */

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { parseAndValidate } from "../src/parseAndValidate.js";

const GOLDEN_DIR = fileURLToPath(new URL("../../../golden-files/", import.meta.url));

/**
 * Casos que ainda não passam, com o motivo. Remova a entrada quando o caso
 * passar — a suíte cobra isso.
 */
const PENDING: Record<string, string> = {};

interface Expectation {
  astGenerated: boolean;
  diagnostics: unknown[];
}

const cases = readdirSync(GOLDEN_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

function runCase(name: string) {
  const source = readFileSync(`${GOLDEN_DIR}${name}/input.odds`, "utf8");
  const expected = JSON.parse(
    readFileSync(`${GOLDEN_DIR}${name}/expected.json`, "utf8"),
  ) as Expectation;
  const result = parseAndValidate(source);
  // `TEST_SUITE.md` §3: só estes quatro campos entram na asserção. `description`
  // e `interpretationNote` são documentação para quem depura.
  const actual = result.diagnostics.map((d) => ({
    severity: d.severity,
    code: d.code,
    data: d.data,
    span: d.span,
  }));
  return { expected, actual, astGenerated: result.astGenerated };
}

describe("golden files (TEST_SUITE.md §3)", () => {
  it("encontra os 44 casos da suíte", () => {
    expect(cases).toHaveLength(44);
  });

  for (const name of cases) {
    const pending = PENDING[name];

    it(pending ? `${name} — pendente: ${pending}` : name, () => {
      const { expected, actual, astGenerated } = runCase(name);
      if (!pending) {
        expect(astGenerated).toBe(expected.astGenerated);
        expect(actual).toEqual(expected.diagnostics);
        return;
      }
      // Pendente: precisa continuar divergindo. Se passou, saiu da pendência e
      // a entrada em PENDING tem de ser removida.
      const conforms =
        astGenerated === expected.astGenerated &&
        JSON.stringify(actual) === JSON.stringify(expected.diagnostics);
      expect(conforms, `${name} agora passa — remova de PENDING`).toBe(false);
    });
  }
});
