import { parseAndValidate, type ProgramNode, type Severity, type SubdomainType } from "@odds/core";
import { anchorsOf, modelOf, targetOf, topologyKeys } from "@odds/layout";
import type { LayoutModel, TargetedDiagnostic } from "@odds/layout";

export type Counts = Record<Severity, number>;

export interface Analysis {
  astGenerated: boolean;
  /** The tree of this text; null when it has none. */
  ast: ProgramNode | null;
  diagnostics: TargetedDiagnostic[];
  counts: Counts;
  model: LayoutModel | null;
  keys: { topo: string; full: string } | null;
}

/**
 * Text in, everything the screen needs to know about it out. Pure except for
 * `lastType`, which `modelOf` reads and updates by contract (the last valid type
 * of each subdomain) and which the caller owns.
 */
export function analyze(text: string, file: string, lastType: Map<string, SubdomainType>): Analysis {
  const res = parseAndValidate(text);
  const counts: Counts = { error: 0, warning: 0, info: 0 };
  for (const d of res.diagnostics) counts[d.severity]++;

  if (!res.astGenerated || !res.ast) {
    const diagnostics = res.diagnostics.map((d) => ({ code: d.code, severity: d.severity, data: d.data, span: d.span, target: { kind: "file" } as const }));
    return { astGenerated: false, ast: null, diagnostics, counts, model: null, keys: null };
  }
  const anchors = anchorsOf(res.ast);
  const diagnostics = res.diagnostics.map((d) => ({ code: d.code, severity: d.severity, data: d.data, span: d.span, target: targetOf(d, anchors) }));
  const model = modelOf(res.ast, file, lastType);
  return { astGenerated: true, ast: res.ast, diagnostics, counts, model, keys: topologyKeys(model) };
}
