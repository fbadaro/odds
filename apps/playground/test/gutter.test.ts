import { describe, expect, it } from "vitest";
import { caretLabel, offsetOf, worstByLine } from "../src/features/editor/lib/gutter";

const span = (a: number, b: number) => ({ start: { line: a, column: 1 }, end: { line: b, column: 1 } });

describe("gutter", () => {
  it("the worst severity wins on a shared line", () => {
    const w = worstByLine([
      { severity: "info", span: span(3, 3) },
      { severity: "error", span: span(3, 3) },
      { severity: "warning", span: span(3, 3) },
      { severity: "info", span: span(5, 5) },
    ]);
    expect(w).toEqual({ 3: "error", 5: "info" });
  });

  it("a span marks every line it covers, at most 41", () => {
    const w = worstByLine([{ severity: "warning", span: span(2, 100) }]);
    expect(Object.keys(w)).toHaveLength(41);
    expect(w[2]).toBe("warning");
    expect(w[42]).toBe("warning");
    expect(w[43]).toBeUndefined();
  });

  it("offsetOf and caretLabel count from 1", () => {
    const t = "ab\ncde\nf";
    expect(offsetOf(t, { line: 2, column: 2 })).toBe(4);
    expect(caretLabel("x.odds", t, 4)).toBe("x.odds · L2:2");
    expect(caretLabel("x.odds", t, 0)).toBe("x.odds · L1:1");
  });
});
