import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Honeycomb } from "../src/features/honeycomb/components/Honeycomb";
import { useGlobalEscape } from "../src/features/honeycomb/useGlobalEscape";
import { flip } from "../src/features/honeycomb/lib/flip";
import { createPlaygroundStore, usePlayground } from "../src/stores/playground";

const initial = usePlayground.getState();
// one layout of the 50 contexts for the whole file: nothing here mutates it
const once = createPlaygroundStore().getState().drawing!;
const drawing = () => once;

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

  it("the map root carries data-feature=map", () => {
    render(<Honeycomb />);
    const root = map();
    expect(root.getAttribute("data-feature")).toBe("map");
    expect(root.classList.contains("odds-map")).toBe(true);
    expect(root.tabIndex).toBe(0);
    expect(root.getAttribute("aria-label")).toBe("Mapa: arraste para mover, roda ou pinça para aproximar, setas e + − 0 no teclado");
  });

  it("stale adds the frozen class", () => {
    render(<Honeycomb />);
    expect(map().classList.contains("frozen")).toBe(false);
    act(() => usePlayground.setState({ stale: true }));
    expect(map().classList.contains("frozen")).toBe(true);
    act(() => usePlayground.setState({ stale: false }));
    expect(map().classList.contains("frozen")).toBe(false);
  });

  it("clicking a tile selects its context", () => {
    render(<Honeycomb />);
    const id = firstCtx();
    click(tile(id));
    expect(usePlayground.getState().selection).toEqual({ ctx: id });
    expect(tile(id).classList.contains("on")).toBe(true);
  });

  it("clicking a line selects the relation", () => {
    render(<Honeycomb />);
    const [rk] = usePlayground.getState().drawing!.nav.rels[0]!;
    click(map().querySelector(`g.rel[data-rk="${rk}"] .edge`)!);
    expect(usePlayground.getState().selection).toEqual({ rel: rk, from: null });
  });

  it("clicking a territory selects the subdomain, and again lets it go", () => {
    render(<Honeycomb />);
    const sub = map().querySelector("g.sub")!;
    const key = sub.getAttribute("data-sub");
    click(sub.querySelector(".subwash")!);
    expect(usePlayground.getState().selection).toEqual({ sub: key });
    click(sub.querySelector(".subwash")!);
    expect(usePlayground.getState().selection).toBeNull();
  });

  it("clicking empty map clears the selection", () => {
    render(<Honeycomb />);
    act(() => usePlayground.getState().select({ ctx: firstCtx() }));
    click(map());
    expect(usePlayground.getState().selection).toBeNull();
  });

  it("a drag of more than 4px does not select", () => {
    render(<Honeycomb />);
    const node = tile(firstCtx());
    fireEvent.pointerDown(node, { button: 0, pointerId: 1, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(node, { pointerId: 1, clientX: 20, clientY: 10 });
    expect(map().classList.contains("dragging")).toBe(true);
    fireEvent.pointerUp(node, { pointerId: 1, clientX: 20, clientY: 10 });
    expect(map().classList.contains("dragging")).toBe(false);
    expect(usePlayground.getState().selection).toBeNull();
  });

  it("hovering a territory lights it", () => {
    render(<Honeycomb />);
    const sub = map().querySelector("g.sub")!;
    fireEvent.pointerMove(sub.querySelector(".subwash")!, { pointerId: 1, clientX: 5, clientY: 5 });
    expect(usePlayground.getState().hover).toBe(sub.getAttribute("data-sub"));
    expect(sub.classList.contains("hot")).toBe(true);
    fireEvent.pointerLeave(map());
    expect(usePlayground.getState().hover).toBeNull();
  });

  it("Escape on the map clears the selection", () => {
    render(<WithEscape />);
    act(() => usePlayground.getState().select({ ctx: firstCtx() }));
    fireEvent.keyDown(map(), { key: "Escape" });
    expect(usePlayground.getState().selection).toBeNull();
  });

  it("Escape from the textarea, or with a menu open, leaves the selection", () => {
    render(
      <>
        <WithEscape />
        <textarea aria-label="Fonte .odds" />
      </>,
    );
    const id = firstCtx();
    act(() => usePlayground.getState().select({ ctx: id }));
    fireEvent.keyDown(screen.getByLabelText("Fonte .odds"), { key: "Escape" });
    expect(usePlayground.getState().selection).toEqual({ ctx: id });
    const menu = document.body.appendChild(document.createElement("div"));
    menu.setAttribute("role", "menu");
    fireEvent.keyDown(map(), { key: "Escape" });
    menu.remove();
    expect(usePlayground.getState().selection).toEqual({ ctx: id });
  });

  it("Enter on a focused tile selects it", () => {
    render(<Honeycomb />);
    const id = firstCtx();
    fireEvent.keyDown(tile(id), { key: "Enter" });
    expect(usePlayground.getState().selection).toEqual({ ctx: id });
  });

  it("the camera writes the viewBox and publishes the zoom", () => {
    render(<Honeycomb />);
    const svg = map().querySelector("svg")!;
    const before = svg.getAttribute("viewBox");
    fireEvent.keyDown(map(), { key: "+" });
    expect(svg.getAttribute("viewBox")).not.toBe(before);
    expect(usePlayground.getState().zoomPct).toBe(140);
  });

  it("camera commands zoom in, out and back to the whole map", () => {
    // reduced motion: every camera move lands at once, so the percent reads the command alone
    const mm = window.matchMedia;
    window.matchMedia = ((q: string) => ({ matches: q.includes("reduce"), media: q }) as MediaQueryList);
    try {
      render(<Honeycomb />);
      const pct = () => usePlayground.getState().zoomPct;
      const command = (k: "in" | "out" | "fit") => act(() => usePlayground.getState().commandCamera(k));
      expect(pct()).toBe(100);
      command("in");
      expect(pct()).toBe(140);
      command("out");
      expect(pct()).toBe(100);
      command("in");
      command("in");
      expect(pct()).toBe(196);
      command("fit");
      expect(pct()).toBe(100);
    } finally {
      window.matchMedia = mm;
    }
  });
});

function WithEscape() {
  useGlobalEscape();
  return <Honeycomb />;
}

const map = () => screen.getByTestId("honeycomb");
const firstCtx = () => Object.keys(usePlayground.getState().drawing!.nav.tiles)[0]!;
const tile = (id: string) => map().querySelector(`g.node[data-ctx="${id}"]`)!;
function click(el: Element) {
  fireEvent.pointerDown(el, { button: 0, pointerId: 1, clientX: 10, clientY: 10 });
  fireEvent.pointerUp(el, { button: 0, pointerId: 1, clientX: 10, clientY: 10 });
}

describe("flip", () => {
  it("flip offsets moved tiles and marks new ones born", () => {
    const d = drawing();
    const host = document.createElement("div");
    host.innerHTML = d.svg;
    const svg = host.querySelector("svg")!;
    const [moved, gone] = Object.keys(d.geo.tiles);
    const prev = { ...d.geo.tiles };
    prev[moved!] = [d.geo.tiles[moved!]![0] + 30, d.geo.tiles[moved!]![1] - 10];
    delete prev[gone!];
    flip(svg, prev, d.geo.tiles);
    expect(svg.classList.contains("lv-anim")).toBe(true);
    expect(svg.classList.contains("lv-enter")).toBe(true);
    const g = (id: string) => svg.querySelector<SVGGElement>(`g.node[data-ctx="${id}"]`)!;
    const t = (el: SVGElement) => el.style.transform.replace(/\s/g, "");
    expect(t(g(moved!))).toBe("translate(30px,-10px)");
    expect(g(gone!).classList.contains("born")).toBe(true);
    const third = Object.keys(d.geo.tiles)[2]!;
    expect(t(g(third))).toBe("");
    const label = [...svg.querySelectorAll<SVGTextElement>("text.cnm")].find((t) => t.textContent === moved)!;
    expect(t(label)).toBe("translate(30px,-10px)");
  });
});
