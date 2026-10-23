import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../src/App";

describe("App", () => {
  it("mostra a região principal", () => {
    render(<App />);
    expect(screen.getByRole("main")).toBeTruthy();
  });

  it("mounts the diagnostics dock, the frozen flag and the pause indicator", () => {
    render(<App />);
    expect(screen.getByRole("region", { name: "Diagnósticos" }).closest('[data-feature="diagnostics-dock"]')).not.toBeNull();
    expect(screen.getByTitle("esconder erros").getAttribute("aria-pressed")).toBe("true");
    expect(document.querySelector('[data-feature="frozen-flag"]')).not.toBeNull();
    expect(document.querySelector('[data-feature="wait-indicator"]')).not.toBeNull();
    // the flag and the indicator are islands of their own, not inside the map root
    expect(screen.getByTestId("honeycomb").querySelector('[data-feature="frozen-flag"], [data-feature="wait-indicator"]')).toBeNull();
  });
});
