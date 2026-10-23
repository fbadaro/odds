import type { TargetedDiagnostic } from "@odds/layout";
import { describe, expect, it } from "vitest";
import { sevMarks } from "../src/features/structure/lib/sevMarks";

const d = (severity: "error" | "warning" | "info", target: TargetedDiagnostic["target"]) =>
  ({ code: "X", severity, data: {}, span: {} as never, target }) as unknown as TargetedDiagnostic;

describe("sevMarks", () => {
  it("worst severity per target kind", () => {
    const m = sevMarks([
      d("info", { kind: "edge", rk: "A|B" }),
      d("error", { kind: "port", rk: "A|B", ctx: "A" }),
      d("warning", { kind: "tile", ctx: "A" }),
      d("info", { kind: "tile", ctx: "A" }),
      d("warning", { kind: "sub", sub: "D/S" }),
      d("error", { kind: "dom", dom: "D" }),
      d("error", { kind: "file" }),
    ]);
    expect(m.rel).toEqual({ "A|B": "error" });
    expect(m.ctx).toEqual({ A: "warning" });
    expect(m.sub).toEqual({ "D/S": "warning" });
  });
});
