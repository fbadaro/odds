import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../src/App";
import { usePlayground } from "../src/stores/playground";

const initial = usePlayground.getState();

const counter = (name: RegExp) => screen.getByLabelText(name);
const editor = () => screen.getByLabelText("Texto .odds") as HTMLTextAreaElement;
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
    expect(counter(/^0 erros$/).textContent).toBe("0");
    expect(counter(/^0 avisos$/).textContent).toBe("0");
    expect(counter(/^0 informações$/).textContent).toBe("0");
  });

  it("each counter has its icon", () => {
    render(<App />);
    for (const s of ["error", "warning", "info"])
      expect(document.querySelector(`[data-icon="${s}"]`)).not.toBeNull();
  });

  it("an invalid tag raises the error counter without advancing the clock", () => {
    render(<App />);
    open();
    const text = initial.text;
    const i = text.indexOf("-->");
    expect(i).toBeGreaterThan(0);
    type(text.slice(0, i) + "[XYZ] " + text.slice(i));
    expect(counter(/^1 erro$/).textContent).toBe("1");
  });

  it("deleting the last brace leaves the map stale", () => {
    render(<App />);
    open();
    const text = initial.text;
    type(text.slice(0, text.lastIndexOf("}")));
    expect(screen.getByTestId("honeycomb").classList.contains("frozen")).toBe(true);
  });
});
