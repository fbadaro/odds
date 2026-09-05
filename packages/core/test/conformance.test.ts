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
const PENDING: Record<string, string> = {
  "conformist-core": "fase 5 — CONFORMIST_CORE",
  "conformist-core-bbm": "fase 5 — CONFORMIST_CORE, UNDOCUMENTED_CONTRACT",
  "core-in-shared-kernel": "fase 5 — CORE_IN_SHARED_KERNEL",
  "core-upstream-of-generic": "fase 5 — CORE_UPSTREAM_OF_GENERIC",
  "domain-without-core": "fase 5 — DOMAIN_WITHOUT_CORE",
  "downstream-only-tag-misplaced": "fase 4 — DOWNSTREAM_ONLY_TAG_MISPLACED",
  "duplicate-context": "fase 2 — DUPLICATE_CONTEXT",
  "duplicate-context-external": "fase 2 — DUPLICATE_CONTEXT",
  "duplicate-relationship": "fase 3 — DUPLICATE_RELATIONSHIP",
  "duplicate-subdomain": "fase 2 — DUPLICATE_SUBDOMAIN",
  "empty-subdomain": "fase 5 — EMPTY_SUBDOMAIN",
  "excessive-shared-kernel": "fase 5 — EXCESSIVE_SHARED_KERNEL",
  "external-only-relationship": "fase 3 — EXTERNAL_ONLY_RELATIONSHIP",
  "generic-without-ohs": "fase 5 — GENERIC_WITHOUT_OHS",
  "incomplete-customer-supplier": "fase 5 — INCOMPLETE_CUSTOMER_SUPPLIER",
  "incomplete-mutual-tag": "fase 4 — INCOMPLETE_MUTUAL_TAG",
  "inconsistent-bbm": "fase 5 — INCONSISTENT_BBM",
  "invalid-domain-cardinality-multiple": "fase 2 — INVALID_DOMAIN_CARDINALITY",
  "invalid-domain-cardinality-zero": "fase 2 — INVALID_DOMAIN_CARDINALITY",
  "invalid-subdomain-type": "fase 2/5 — DOMAIN_WITHOUT_CORE, INVALID_SUBDOMAIN_TYPE",
  "malformed-suppression-missing-justification": "fase 5/6 — MALFORMED_SUPPRESSION, UNDOCUMENTED_CONTRACT",
  "malformed-suppression-not-suppressible": "fase 3/6 — MALFORMED_SUPPRESSION, PHANTOM_REFERENCE",
  "malformed-suppression-unknown-code": "fase 5/6 — MALFORMED_SUPPRESSION, UNDOCUMENTED_CONTRACT",
  "mutual-tag-on-directional": "fase 4 — MUTUAL_TAG_ON_DIRECTIONAL",
  "mutual-tag-with-external": "fase 4 — MUTUAL_TAG_WITH_EXTERNAL",
  "phantom-reference": "fase 3 — PHANTOM_REFERENCE",
  "pl-without-ohs": "fase 5 — PL_WITHOUT_OHS",
  "positional-tag-on-mutual": "fase 4 — POSITIONAL_TAG_ON_MUTUAL",
  "protection-conflict": "fase 4 — PROTECTION_CONFLICT",
  "role-conflict": "fase 4 — DOWNSTREAM_ONLY_TAG_MISPLACED, ROLE_CONFLICT",
  "self-relationship": "fase 3 — SELF_RELATIONSHIP",
  "separation-conflict": "fase 4 — SEPARATION_CONFLICT",
  "suppression-valid": "fase 5 — GENERIC_WITHOUT_OHS",
  "undocumented-contract": "fase 5 — UNDOCUMENTED_CONTRACT",
  "unmapped-context": "fase 5 — UNMAPPED_CONTEXT",
  "unused-suppression": "fase 6 — UNUSED_SUPPRESSION",
  "upstream-only-tag-misplaced": "fase 4 — UPSTREAM_ONLY_TAG_MISPLACED",
};

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
