import { describe, expect, it } from "vitest";
import type { SubdomainType } from "@odds/core";
import { marketplace } from "@odds/layout/fixtures";
import { analyze } from "../src/lib/analyze";

describe("analyze", () => {
  it("a clean model has a tree, a model, keys and zero counts", () => {
    const { file, text } = marketplace();
    const a = analyze(text, file, new Map<string, SubdomainType>());
    expect(a.astGenerated).toBe(true);
    expect(a.ast).not.toBeNull();
    expect(a.model).not.toBeNull();
    expect(a.keys).not.toBeNull();
    expect(a.counts).toEqual({ error: 0, warning: 0, info: 0 });
  });

  it("without a tree: no model, no keys, every diagnostic targets the file", () => {
    const a = analyze("domain {", "x.odds", new Map<string, SubdomainType>());
    expect(a.astGenerated).toBe(false);
    expect(a.ast).toBeNull();
    expect(a.model).toBeNull();
    expect(a.keys).toBeNull();
    expect(a.counts.error).toBe(1);
    expect(a.diagnostics.every((d) => d.target.kind === "file")).toBe(true);
  });

  it("is pure over its input but feeds lastType", () => {
    const { file, text } = marketplace();
    const last = new Map<string, SubdomainType>();
    analyze(text, file, last);
    expect(last.size).toBeGreaterThan(0);
  });
});
