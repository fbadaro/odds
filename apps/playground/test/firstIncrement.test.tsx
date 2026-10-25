import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../src/App";
import { PAUSE_MS, usePlayground } from "../src/stores/playground";
import waitStyles from "../src/features/honeycomb/components/WaitIndicator.module.css";

const initial = usePlayground.getState();

// the dock's counters: the button's name is the severity and the number, its text is the number
const counter = (severity: "erros" | "avisos" | "infos") => screen.getByRole("button", { name: new RegExp(`^${severity}: `) });
const wait = () => document.querySelector('[data-feature="wait-indicator"]')!;
const editor = () => screen.getByLabelText("Fonte .odds") as HTMLTextAreaElement;
const open = () => fireEvent.click(screen.getByRole("button", { name: "Código" })); // o painel começa fechado, como na bancada
const type = (text: string) => act(() => void fireEvent.change(editor(), { target: { value: text } }));

describe("first increment", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    usePlayground.setState(initial, true);
  });
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    usePlayground.setState(initial, true);
  });

  it("shows the marketplace with the three counters at zero", () => {
    render(<App />);
    open();
    expect(editor().value).toBe(initial.text);
    expect(counter("erros").textContent).toBe("0");
    expect(counter("avisos").textContent).toBe("0");
    expect(counter("infos").textContent).toBe("0");
  });

  it("each counter has its icon", () => {
    render(<App />);
    const icons = (["erros", "avisos", "infos"] as const).map((s) => counter(s).querySelector("svg")!.getAttribute("data-icon"));
    expect(icons).toEqual(["error", "warning", "info"]);
  });

  it("an invalid tag raises the error counter without advancing the clock", () => {
    render(<App />);
    open();
    const text = initial.text;
    const i = text.indexOf("-->");
    expect(i).toBeGreaterThan(0);
    type(text.slice(0, i) + "[XYZ] " + text.slice(i));
    expect(counter("erros").textContent).toBe("1");
  });

  it("deleting the last brace leaves the map stale", () => {
    render(<App />);
    open();
    const text = initial.text;
    type(text.slice(0, text.lastIndexOf("}")));
    expect(screen.getByTestId("honeycomb").classList.contains("frozen")).toBe(true);
  });

  it("visible during the pause, gone after it", () => {
    render(<App />);
    open();
    expect(wait().textContent).toBe("topologia mudou · o mapa redesenha na pausa");
    expect(wait().classList.contains(waitStyles.on!)).toBe(false);
    const text = initial.text;
    type(text.replace("    context Catalog {", "    context Lonely {}\n    context Catalog {"));
    expect(usePlayground.getState().waiting).toBe(true);
    expect(wait().classList.contains(waitStyles.on!)).toBe(true);
    act(() => void vi.advanceTimersByTime(PAUSE_MS));
    expect(wait().classList.contains(waitStyles.on!)).toBe(false);
  });
});
