import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FrozenFlag } from "../src/features/honeycomb/components/FrozenFlag";
import { usePlayground } from "../src/stores/playground";

const initial = usePlayground.getState();
const st = () => usePlayground.getState();

describe("FrozenFlag", () => {
  beforeEach(() => usePlayground.setState({ ...initial }, true));
  afterEach(() => usePlayground.setState(initial, true));

  it("syntax error text names line and column", () => {
    render(<FrozenFlag />);
    act(() => st().setText(st().text + "\n{"));
    const { line, column } = st().analysis.diagnostics[0]!.span.start;
    const flag = screen.getByRole("status");
    expect(flag.getAttribute("data-feature")).toBe("frozen-flag");
    expect(flag.textContent).toBe(`Diagrama congelado. Erro de sintaxe em L${line}:${column}; o mapa mostra o último texto válido.`);
    expect(flag.querySelector("b")!.textContent).toBe("Diagrama congelado.");
    expect(flag.querySelector('svg[data-icon="error"]')).not.toBeNull();
  });

  it("layout failure text", () => {
    usePlayground.setState({ layoutError: "boom" });
    render(<FrozenFlag />);
    expect(screen.getByRole("status").textContent).toBe("Diagrama congelado. O layout falhou: boom");
  });

  it("hidden when the map is fresh", () => {
    render(<FrozenFlag />);
    expect(screen.queryByRole("status")).toBeNull();
    expect(document.querySelector<HTMLElement>('[data-feature="frozen-flag"]')!.hidden).toBe(true);
    act(() => st().setText(st().text + "\n{"));
    expect(screen.queryByRole("status")).not.toBeNull();
    act(() => st().setText(initial.text));
    expect(screen.queryByRole("status")).toBeNull();
  });
});
