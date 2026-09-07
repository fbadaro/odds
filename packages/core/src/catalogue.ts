/**
 * Fase e severidade padrão de cada code — espelho de `AST_SCHEMA.md` §1.3.
 *
 * A **fase** não é decorativa: `RULES-EN.md` §3.3 fixa a ordem de emissão como
 * fase → linha inicial → coluna inicial → coluna final → code alfabético, e os
 * golden files asserem o array inteiro por igualdade estrutural. Um code sem
 * fase não tem posição definida no array e não é testável.
 *
 * A severidade aqui é a **padrão** do catálogo. Ela é um campo do diagnóstico,
 * nunca parte do nome do code.
 */

import type { DiagnosticCode, Severity } from "./diagnostics.js";

export interface CodeMetadata {
  readonly phase: number;
  readonly severity: Severity;
}

export const CATALOGUE: Readonly<Record<DiagnosticCode, CodeMetadata>> = {
  SYNTAX_ERROR: { phase: 0, severity: "error" },
  ORPHAN_CONTEXT: { phase: 1, severity: "error" },
  ORPHAN_SUBDOMAIN: { phase: 1, severity: "error" },
  REMOVED_CONSTRUCT: { phase: 1, severity: "error" },
  INVALID_DOMAIN_CARDINALITY: { phase: 2, severity: "error" },
  INVALID_SUBDOMAIN_TYPE: { phase: 2, severity: "error" },
  DUPLICATE_CONTEXT: { phase: 2, severity: "error" },
  DUPLICATE_SUBDOMAIN: { phase: 2, severity: "error" },
  PHANTOM_REFERENCE: { phase: 3, severity: "error" },
  SELF_RELATIONSHIP: { phase: 3, severity: "error" },
  DUPLICATE_RELATIONSHIP: { phase: 3, severity: "error" },
  EXTERNAL_ONLY_RELATIONSHIP: { phase: 3, severity: "error" },
  UPSTREAM_ONLY_TAG_MISPLACED: { phase: 4, severity: "error" },
  DOWNSTREAM_ONLY_TAG_MISPLACED: { phase: 4, severity: "error" },
  MUTUAL_TAG_ON_DIRECTIONAL: { phase: 4, severity: "error" },
  POSITIONAL_TAG_ON_MUTUAL: { phase: 4, severity: "error" },
  INCOMPLETE_MUTUAL_TAG: { phase: 4, severity: "error" },
  MUTUAL_TAG_WITH_EXTERNAL: { phase: 4, severity: "error" },
  SEPARATION_CONFLICT: { phase: 4, severity: "error" },
  ROLE_CONFLICT: { phase: 4, severity: "error" },
  PROTECTION_CONFLICT: { phase: 4, severity: "error" },
  CONFORMIST_CORE: { phase: 5, severity: "warning" },
  GENERIC_WITHOUT_OHS: { phase: 5, severity: "warning" },
  CORE_UPSTREAM_OF_GENERIC: { phase: 5, severity: "warning" },
  CORE_IN_SHARED_KERNEL: { phase: 5, severity: "warning" },
  DOMAIN_WITHOUT_CORE: { phase: 5, severity: "warning" },
  INCONSISTENT_BBM: { phase: 5, severity: "warning" },
  INCOMPLETE_CUSTOMER_SUPPLIER: { phase: 5, severity: "warning" },
  EXCESSIVE_SHARED_KERNEL: { phase: 5, severity: "info" },
  UNDOCUMENTED_CONTRACT: { phase: 5, severity: "info" },
  UNMAPPED_CONTEXT: { phase: 5, severity: "info" },
  EMPTY_SUBDOMAIN: { phase: 5, severity: "info" },
  PL_WITHOUT_OHS: { phase: 5, severity: "info" },
  MALFORMED_SUPPRESSION: { phase: 6, severity: "info" },
  UNUSED_SUPPRESSION: { phase: 6, severity: "info" },
};

/**
 * Ordem de emissão normativa — `RULES-EN.md` §3.3.
 *
 * Os golden files comparam o array inteiro por igualdade estrutural, então esta
 * função é o que decide se um caso passa ou falha por um motivo que não é a
 * regra em si. Nenhum critério é opcional e a ordem entre eles é fixa.
 */
export function compareDiagnostics(
  a: { code: DiagnosticCode; span: { start: { line: number; column: number }; end: { column: number } } },
  b: { code: DiagnosticCode; span: { start: { line: number; column: number }; end: { column: number } } },
): number {
  return (
    CATALOGUE[a.code].phase - CATALOGUE[b.code].phase ||
    a.span.start.line - b.span.start.line ||
    a.span.start.column - b.span.start.column ||
    a.span.end.column - b.span.end.column ||
    a.code.localeCompare(b.code)
  );
}
