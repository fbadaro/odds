import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ViewSwitch } from "../src/features/topbar/components/ViewSwitch";
import { usePlayground } from "../src/stores/playground";

const initial = usePlayground.getState();

describe("ViewSwitch", () => {
  afterEach(() => usePlayground.setState(initial, true));

  it("Contenção sets view to contain and marks it pressed", () => {
    const { container } = render(<ViewSwitch />);
    expect(container.querySelector('[data-feature="view-switch"]')).not.toBeNull();
    expect(screen.getByRole("group", { name: "Vista" })).toBeTruthy();
    const flow = screen.getByRole("button", { name: "Fluxo" });
    const contain = screen.getByRole("button", { name: "Contenção" });
    expect(flow.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(contain);
    expect(usePlayground.getState().view.view).toBe("contain");
    expect(contain.getAttribute("aria-pressed")).toBe("true");
    expect(flow.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(contain);
    expect(usePlayground.getState().view.view).toBe("contain");
  });
});
