import type { ProgramNode } from "@odds/core";
import type { Analysis } from "../../../lib/analyze";

/**
 * Why nothing can be created now, or null when it can. On a pure SYNTAX_ERROR
 * there is no tree, so no span to insert at (ADR-0026): the forms wait, and say
 * where the error is.
 */
export function blockedReason(analysis: Analysis): string | null {
  if (analysis.astGenerated) return null;
  const line = analysis.diagnostics[0]?.span.start.line;
  return line ? `Corrija o erro de sintaxe na linha ${line} para criar.` : "Corrija o erro de sintaxe para criar.";
}

/** The index of a domain in the tree, by name; 0 when it is not found (one domain per file). */
export function domainIndex(ast: ProgramNode | null, name: string): number {
  return Math.max(0, ast?.domains.findIndex((d) => d.name === name) ?? 0);
}

/** The index of the domain that declares a context, internal or external. */
export function domainOfContext(ast: ProgramNode | null, ctx: string): number {
  const i = ast?.domains.findIndex((d) => d.subdomains.some((s) => s.contexts.some((c) => c.name === ctx)) || d.external?.contexts.some((c) => c.name === ctx)) ?? 0;
  return Math.max(0, i);
}
