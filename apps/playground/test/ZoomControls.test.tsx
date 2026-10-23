import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ZoomControls } from "../src/features/honeycomb/components/ZoomControls";
import { usePlayground } from "../src/stores/playground";

const initial = usePlayground.getState();

describe("ZoomControls", () => {
  afterEach(() => usePlayground.setState(initial, true));

  it("buttons command the camera", () => {
    render(<ZoomControls />);
    fireEvent.click(screen.getByRole("button", { name: "Aproximar" }));
    expect(usePlayground.getState().cameraCommand?.kind).toBe("in");
    fireEvent.click(screen.getByRole("button", { name: "Afastar" }));
    expect(usePlayground.getState().cameraCommand?.kind).toBe("out");
    const fit = screen.getByRole("button", { name: "Mapa inteiro" });
    expect(fit.getAttribute("title")).toBe("Mapa inteiro (0)");
    fireEvent.click(fit);
    expect(usePlayground.getState().cameraCommand).toEqual({ kind: "fit", seq: 3 });
  });

  it("shows zoomPct", () => {
    const { container } = render(<ZoomControls />);
    expect(screen.getByText("100%")).toBeTruthy();
    act(() => usePlayground.setState({ zoomPct: 137 }));
    expect(screen.getByText("137%")).toBeTruthy();
    expect(container.querySelector('[data-feature="zoom-controls"]')).not.toBeNull();
  });
});
