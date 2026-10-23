import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { StructurePanel } from "../src/features/structure/components/StructurePanel";
import { usePlayground } from "../src/stores/playground";

const initial = usePlayground.getState();
const st = () => usePlayground.getState();
const tree = () => document.querySelector('[data-feature="panel-tree"]')!;
const rows = (sel: string) => [...tree().querySelectorAll(sel)] as HTMLElement[];

function open(text?: string) {
  act(() => {
    st().loadModel("m17");
    if (text) {
      st().setText(text);
      st().flush();
    }
    st().togglePanel("tree");
  });
  return render(<StructurePanel />);
}

describe("StructurePanel", () => {
  beforeEach(() => usePlayground.setState({ ...initial }, true));
  afterEach(() => {
    cleanup();
    usePlayground.setState(initial, true);
  });

  it("lists the subdomains and relations of the text", () => {
    open();
    expect(tree().getAttribute("aria-label")).toBe("Estrutura");
    expect(screen.getByText("clicar enquadra no mapa · o mesmo quadrado fecha o painel")).toBeTruthy();
    const mapping = st().ast!.domains[0]!.mapping!.relationships;
    expect(rows("[data-rel]")).toHaveLength(mapping.length);
    expect(rows("[data-sub]").length).toBe(st().ast!.domains[0]!.subdomains.length);
    expect(tree().querySelector("h5 small")!.textContent).toBe(String(mapping.length));
    expect(tree().querySelector('[data-sub] [data-type]')).not.toBeNull();
  });

  it("collapsing a subdomain survives typing", () => {
    open();
    const sub = st().ast!.domains[0]!.subdomains[0]!;
    const before = rows("[data-ctx]").length;
    const key = `s:${st().ast!.domains[0]!.name}/${sub.name}`;
    fireEvent.click(tree().querySelector(`[data-tog="${key}"]`)!);
    expect(rows("[data-ctx]").length).toBe(before - sub.contexts.length);
    act(() => st().setText(st().text + "\n"));
    expect(rows("[data-ctx]").length).toBe(before - sub.contexts.length);
  });

  it("clicking a context selects it with framing", () => {
    open();
    const seq = st().frameSeq;
    const b = rows("[data-ctx]")[0]!;
    fireEvent.click(b);
    expect(st().selection).toEqual({ ctx: b.dataset.ctx });
    expect(st().frameSeq).toBe(seq + 1);
    expect(rows("[data-ctx]")[0]!.dataset.on === "true").toBe(true);
  });

  it("a relation not on the map jumps to its line", () => {
    act(() => st().loadModel("m17"));
    const known = st().ast!.domains[0]!.subdomains[0]!.contexts[0]!.name;
    const text = st().text.replace(/(\n\s*)mapping\s*\{/, `$1mapping {\n    Ghost --> ${known}`);
    expect(text).not.toBe(st().text);
    open(text);
    const row = rows("[data-rel]").find((r) => r.textContent!.includes("Ghost"))!;
    expect(row).toBeTruthy();
    const line = st().ast!.domains[0]!.mapping!.relationships.find((r) => r.left === "Ghost")!.span.start.line;
    fireEvent.click(row);
    expect(st().reveal!.start.line).toBe(line);
    expect(st().selection).toBeNull();
  });

  it("after a syntax error the tree still shows the last structure", () => {
    open();
    const n = rows("[data-rel]").length;
    act(() => st().setText(st().text + "\n{"));
    expect(st().analysis.astGenerated).toBe(false);
    expect(rows("[data-rel]")).toHaveLength(n);
  });

  it("says so when there is no structure, and only renders while open", () => {
    const { container } = render(<StructurePanel />);
    expect(container.innerHTML).toBe("");
    act(() => {
      usePlayground.setState({ ast: null, openPanel: "tree" });
    });
    expect(screen.getByText("O texto ainda não tem estrutura.")).toBeTruthy();
  });
});
