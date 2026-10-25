import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "../src/components/ui/Tooltip";
import { DiagnosticsDock } from "../src/features/diagnostics/components/DiagnosticsDock";
import { usePlayground } from "../src/stores/playground";

const initial = usePlayground.getState();
const st = () => usePlayground.getState();
const dock = () => document.querySelector('[data-feature="diagnostics-dock"]')!;
const rows = () => [...dock().querySelectorAll<HTMLButtonElement>("button[data-code]")];
const toggle = () => screen.getByRole("button", { name: /^(Recolher|Abrir) a lista$/ });

/** Text with `n` unmapped contexts before Catalog: n UNMAPPED_CONTEXT infos, each a tile on the map. */
function lonely(n: number) {
  const extra = Array.from({ length: n }, (_, i) => `    context Lonely${i} {}\n`).join("");
  const text = st().text.replace("    context Catalog {", extra + "    context Catalog {");
  expect(text).not.toBe(st().text);
  act(() => {
    st().setText(text);
    st().flush();
  });
}

describe("DiagnosticsDock", () => {
  beforeEach(() => usePlayground.setState({ ...initial }, true));
  afterEach(() => usePlayground.setState(initial, true));

  it("empty model says the model is coherent", () => {
    render(<DiagnosticsDock />);
    expect(st().analysis.diagnostics).toHaveLength(0);
    const section = screen.getByRole("region", { name: "Diagnósticos" });
    expect(section.textContent).toContain("nenhum diagnóstico · o modelo é coerente");
    expect(rows()).toHaveLength(0);
    for (const [name, n] of [["erros: 0", "0"], ["avisos: 0", "0"], ["infos: 0", "0"]] as const) {
      const b = screen.getByRole("button", { name });
      expect(b.hasAttribute("title")).toBe(false);
      expect(b.textContent).toBe(n);
      expect(b.getAttribute("aria-pressed")).toBe("true");
      expect(b.querySelector("svg[data-icon]")).not.toBeNull();
    }
  });

  it("counters filter and reopen a collapsed list", () => {
    lonely(2);
    render(<DiagnosticsDock />);
    expect(screen.getByText("2 diagnósticos")).toBeTruthy();
    expect(rows()).toHaveLength(2);

    fireEvent.click(toggle());
    expect(toggle().getAttribute("aria-label")).toBe("Abrir a lista");
    expect(toggle().getAttribute("aria-expanded")).toBe("false");
    expect(rows()).toHaveLength(0);

    // a counter pressed with the list collapsed opens it again, with the filter applied
    fireEvent.click(screen.getByRole("button", { name: "infos: 2" }));
    expect(toggle().getAttribute("aria-label")).toBe("Recolher a lista");
    expect(toggle().getAttribute("aria-expanded")).toBe("true");
    const info = screen.getByRole("button", { name: "infos: 2" });
    expect(info.getAttribute("aria-pressed")).toBe("false");
    expect(info.textContent).toBe("2");
    expect(rows()).toHaveLength(0);
    expect(screen.getByText("Os filtros escondem todos os diagnósticos.")).toBeTruthy();

    fireEvent.click(info);
    expect(rows()).toHaveLength(2);
  });

  it("a counter's hint says what pressing it does", async () => {
    render(
      <TooltipProvider delay={0}>
        <DiagnosticsDock />
      </TooltipProvider>,
    );
    const errors = screen.getByRole("button", { name: "erros: 0" });
    await act(async () => void fireEvent.mouseEnter(errors));
    expect(await screen.findByText("esconder erros")).toBeTruthy();
    // pressing closes the hint, as any Base UI tooltip; hovering again reads the new state
    fireEvent.click(errors);
    expect(errors.getAttribute("aria-pressed")).toBe("false");
    await act(async () => void fireEvent.mouseLeave(errors));
    await act(async () => void fireEvent.mouseEnter(errors));
    expect(await screen.findByText("mostrar erros")).toBeTruthy();
  });

  it("the list toggle controls the list it collapses", () => {
    lonely(1);
    render(<DiagnosticsDock />);
    const list = rows()[0]!.parentElement!;
    expect(toggle().getAttribute("aria-controls")).toBe(list.id);
  });

  it("shows three rows and expands to all", () => {
    lonely(5);
    render(<DiagnosticsDock />);
    expect(rows()).toHaveLength(3);
    const first = rows()[0]!;
    const d = st().analysis.diagnostics[0]!;
    expect(first.querySelector("svg[data-icon]")!.getAttribute("data-icon")).toBe(d.severity);
    expect(first.textContent).toContain(d.code);
    expect(first.querySelector("code")!.textContent).toBe("Lonely0");
    expect(first.textContent!.endsWith(`L${d.span.start.line}:${d.span.start.column}`)).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "ver os 5 diagnósticos" }));
    expect(rows()).toHaveLength(5);
    fireEvent.click(screen.getByRole("button", { name: "mostrar só os três primeiros" }));
    expect(rows()).toHaveLength(3);
  });

  it("clicking a context diagnostic selects it, frames it and reveals the span", () => {
    lonely(1);
    render(<DiagnosticsDock />);
    const d = st().analysis.diagnostics.find((x) => x.code === "UNMAPPED_CONTEXT")!;
    const seq = st().frameSeq;
    fireEvent.click(rows()[0]!);
    expect(st().selection).toEqual({ ctx: "Lonely0" });
    expect(st().frameSeq).toBe(seq + 1);
    expect(st().openPanel).toBe("code");
    expect(st().reveal).toMatchObject({ start: d.span.start, end: d.span.end });
  });

  it("a syntax error row only reveals in the editor", () => {
    render(<DiagnosticsDock />);
    const ctx = Object.keys(st().drawing!.nav.tiles)[0]!;
    act(() => st().select({ ctx }));
    act(() => st().setText(st().text + "\n{"));
    expect(st().analysis.astGenerated).toBe(false);
    const d = st().analysis.diagnostics[0]!;
    expect(d.code).toBe("SYNTAX_ERROR");
    const seq = st().frameSeq;
    expect(rows()[0]!.textContent).toContain("SYNTAX_ERROR");
    fireEvent.click(rows()[0]!);
    expect(st().selection).toEqual({ ctx });
    expect(st().frameSeq).toBe(seq);
    expect(st().reveal).toMatchObject({ start: d.span.start, end: d.span.end });
  });

  it("a diagnostic whose target is not on the map only reveals", () => {
    act(() => st().loadModel("m17"));
    const known = st().ast!.domains[0]!.subdomains[0]!.contexts[0]!.name;
    const text = st().text.replace(/(\n\s*)mapping\s*\{/, `$1mapping {\n    Ghost --> ${known}`);
    expect(text).not.toBe(st().text);
    act(() => {
      st().setText(text);
      st().flush();
    });
    render(<DiagnosticsDock />);
    const d = st().analysis.diagnostics.find((x) => x.code === "PHANTOM_REFERENCE")!;
    expect(d).toBeTruthy();
    const row = rows().find((r) => r.textContent!.includes("PHANTOM_REFERENCE"))!;
    expect(row).toBeTruthy();
    const seq = st().frameSeq;
    fireEvent.click(row);
    expect(st().selection).toBeNull();
    expect(st().frameSeq).toBe(seq);
    expect(st().reveal).toMatchObject({ start: d.span.start, end: d.span.end });
  });

  it("centres between the open panel (or the rail) and the zoom, and not below 760px", () => {
    const rect = (right: number, left: number) => ({ right, left }) as DOMRect;
    const place = (id: string, r: DOMRect) => {
      const el = document.body.appendChild(document.createElement("div"));
      el.setAttribute("data-feature", id);
      vi.spyOn(el, "getBoundingClientRect").mockReturnValue(r);
      return el;
    };
    const w = window.innerWidth;
    const rail = place("rail", rect(62, 20));
    const zoom = place("zoom-controls", rect(w - 20, w - 170));
    try {
      render(<DiagnosticsDock />);
      const el = dock() as HTMLElement;
      expect(el.style.getPropertyValue("--dl")).toBe("78px");
      expect(el.style.getPropertyValue("--dr")).toBe("186px");

      const panel = place("panel-code", rect(480, 78));
      act(() => st().togglePanel("code"));
      expect(el.style.getPropertyValue("--dl")).toBe("496px");
      panel.remove();

      Object.defineProperty(window, "innerWidth", { configurable: true, value: 700 });
      act(() => void window.dispatchEvent(new Event("resize")));
      expect(el.style.getPropertyValue("--dl")).toBe("");
      expect(el.style.getPropertyValue("--dr")).toBe("");
    } finally {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: w });
      rail.remove();
      zoom.remove();
    }
  });

  it("ignores the hidden code panel that stays mounted while closed", () => {
    const rect = (right: number, left: number) => ({ right, left }) as DOMRect;
    const place = (id: string, r: DOMRect) => {
      const el = document.body.appendChild(document.createElement("div"));
      el.setAttribute("data-feature", id);
      vi.spyOn(el, "getBoundingClientRect").mockReturnValue(r);
      return el;
    };
    const w = window.innerWidth;
    const rail = place("rail", rect(62, 20));
    const zoom = place("zoom-controls", rect(w - 20, w - 170));
    const panel = place("panel-code", rect(480, 78));
    panel.hidden = true;
    try {
      render(<DiagnosticsDock />);
      const el = dock() as HTMLElement;
      expect(st().openPanel).toBeNull();
      expect(el.style.getPropertyValue("--dl")).toBe("78px");
      act(() => st().togglePanel("code"));
      act(() => st().closePanel());
      expect(el.style.getPropertyValue("--dl")).toBe("78px");
    } finally {
      rail.remove();
      zoom.remove();
      panel.remove();
    }
  });

  it("re-places itself when the inspector opens or closes, as the bench's safeChanged does", () => {
    const place = (id: string, right: number, left: number) => {
      const el = document.body.appendChild(document.createElement("div"));
      el.setAttribute("data-feature", id);
      const spy = vi.spyOn(el, "getBoundingClientRect").mockReturnValue({ right, left } as DOMRect);
      return { el, spy };
    };
    const w = window.innerWidth;
    const rail = place("rail", 62, 20);
    const zoom = place("zoom-controls", w - 20, w - 170);
    // measured mid-animation (the panel slides in from -6px), then at rest
    const panel = place("panel-code", 472, 72);
    try {
      render(<DiagnosticsDock />);
      const el = dock() as HTMLElement;
      act(() => st().togglePanel("code"));
      expect(el.style.getPropertyValue("--dl")).toBe("488px");

      panel.spy.mockReturnValue({ right: 478, left: 78 } as DOMRect);
      act(() => st().select({ ctx: "Checkout" }));
      expect(st().selection).not.toBeNull();
      expect(el.style.getPropertyValue("--dl")).toBe("494px");
    } finally {
      rail.el.remove();
      zoom.el.remove();
      panel.el.remove();
    }
  });
});
