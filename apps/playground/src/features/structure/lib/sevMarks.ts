import type { TargetedDiagnostic } from "@odds/layout";
import type { Severity } from "../../../components/icons/SeverityIcon";

type Marks = Record<string, Severity>;
const RANK: Record<Severity, number> = { error: 0, warning: 1, info: 2 };

/** O `sevMarks` da bancada: a pior severidade por relação (`rk`), contexto e subdomínio. */
export function sevMarks(markers: TargetedDiagnostic[]): { ctx: Marks; sub: Marks; rel: Marks } {
  const out = { ctx: {} as Marks, sub: {} as Marks, rel: {} as Marks };
  const put = (m: Marks, k: string, s: Severity) => {
    if (!(k in m) || RANK[s] < RANK[m[k]!]) m[k] = s;
  };
  for (const { target: t, severity } of markers) {
    if (t.kind === "edge" || t.kind === "port") put(out.rel, t.rk, severity);
    else if (t.kind === "tile") put(out.ctx, t.ctx, severity);
    else if (t.kind === "sub") put(out.sub, t.sub, severity);
  }
  return out;
}
