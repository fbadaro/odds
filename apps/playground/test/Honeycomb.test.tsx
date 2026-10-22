import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Honeycomb } from "../src/features/honeycomb/components/Honeycomb";
import { createPlaygroundStore, usePlayground } from "../src/stores/playground";

const initial = usePlayground.getState();
const drawing = () => createPlaygroundStore().getState().drawing!;

describe("Honeycomb", () => {
  beforeEach(() => usePlayground.setState({ ...initial, drawing: drawing(), stale: false, layoutError: null }, true));
  afterEach(() => {
    usePlayground.setState(initial, true);
  });

  it("mounts the drawing's svg inside the container", () => {
    render(<Honeycomb />);
    expect(screen.getByTestId("honeycomb").querySelector("svg")).not.toBeNull();
  });

  it("keeps the same svg node when the svg string does not change", () => {
    const { rerender } = render(<Honeycomb />);
    const first = screen.getByTestId("honeycomb").querySelector("svg");
    act(() => usePlayground.setState({ stale: true }));
    act(() => usePlayground.setState({ drawing: { ...usePlayground.getState().drawing!, topo: "other" } }));
    rerender(<Honeycomb />);
    expect(screen.getByTestId("honeycomb").querySelector("svg")).toBe(first);
  });

  it("replaces the svg when the string changes", () => {
    render(<Honeycomb />);
    const first = screen.getByTestId("honeycomb").querySelector("svg");
    act(() => usePlayground.setState({ drawing: { ...usePlayground.getState().drawing!, svg: usePlayground.getState().drawing!.svg + " " } }));
    expect(screen.getByTestId("honeycomb").querySelector("svg")).not.toBe(first);
  });

  it("marks a stale drawing and announces the banner", () => {
    usePlayground.setState({ stale: true });
    render(<Honeycomb />);
    expect(screen.getByTestId("honeycomb").getAttribute("data-stale")).toBe("true");
    expect(screen.getByRole("status").textContent).toContain("Erro de sintaxe — o mapa mostra o último texto válido");
  });

  it("shows the empty text without an svg when there is no drawing", () => {
    usePlayground.setState({ drawing: null });
    render(<Honeycomb />);
    expect(screen.getByText("O mapa aparece quando o texto tiver uma árvore.")).toBeTruthy();
    expect(screen.getByTestId("honeycomb").querySelector("svg")).toBeNull();
  });

  it("a layout failure shows the bench's flag, with the error icon, over the kept drawing", () => {
    usePlayground.setState({ layoutError: "boom" });
    render(<Honeycomb />);
    const flag = screen.getByRole("status");
    expect(flag.textContent).toBe("Diagrama congelado. O layout falhou: boom");
    expect(flag.querySelector('svg[data-icon="error"]')).not.toBeNull();
    expect(screen.getByTestId("honeycomb").querySelector(":scope > div > svg")).not.toBeNull();
  });

  it("the layout flag takes the stale banner's place: one status at a time", () => {
    usePlayground.setState({ layoutError: "boom", stale: true });
    render(<Honeycomb />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status").textContent).toContain("O layout falhou: boom");
  });
});
