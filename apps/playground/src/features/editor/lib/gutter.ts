import type { Position, Severity } from "@odds/core";

const RANK: Record<Severity, number> = { error: 0, warning: 1, info: 2 };

/** Por linha, a pior severidade; um span cobre da linha inicial até min(fim, início + 40). */
export function worstByLine(
  diags: readonly { severity: Severity; span: { start: Position; end: Position } }[],
): Record<number, Severity> {
  const worst: Record<number, Severity> = {};
  for (const d of diags) {
    const last = Math.min(d.span.end.line, d.span.start.line + 40);
    for (let l = d.span.start.line; l <= last; l++) {
      const cur = worst[l];
      if (!cur || RANK[d.severity] < RANK[cur]) worst[l] = d.severity;
    }
  }
  return worst;
}

/** `arquivo · L3:7`, a partir do deslocamento do cursor. */
export function caretLabel(file: string, text: string, offset: number): string {
  const before = text.slice(0, offset).split("\n");
  return `${file} · L${before.length}:${before[before.length - 1]!.length + 1}`;
}

/** Posição (1-based) para deslocamento no texto. */
export function offsetOf(text: string, pos: Position): number {
  const lines = text.split("\n");
  let o = 0;
  for (let i = 0; i < pos.line - 1 && i < lines.length; i++) o += lines[i]!.length + 1;
  return o + pos.column - 1;
}
