import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TooltipProvider } from "../src/components/ui/Tooltip";
import { Rail } from "../src/features/panels/components/Rail";
import { usePlayground } from "../src/stores/playground";

const initial = usePlayground.getState();

describe("Rail", () => {
  afterEach(() => usePlayground.setState(initial, true));

  it("one panel at a time, and the same square closes", () => {
    const { container } = render(<Rail />);
    expect(container.querySelector('nav[data-feature="rail"][aria-label="Painéis"]')).not.toBeNull();
    const code = screen.getByRole("button", { name: "Código" });
    const tree = screen.getByRole("button", { name: "Estrutura" });
    screen.getByRole("button", { name: "Como ler" });
    fireEvent.click(code);
    expect(usePlayground.getState().openPanel).toBe("code");
    expect(code.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(tree);
    expect(usePlayground.getState().openPanel).toBe("tree");
    expect(code.getAttribute("aria-pressed")).toBe("false");
    expect(tree.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(tree);
    expect(usePlayground.getState().openPanel).toBeNull();
    expect(tree.getAttribute("aria-pressed")).toBe("false");
  });

  it("arrows move between the squares, top to bottom", async () => {
    render(<Rail />);
    const code = screen.getByRole("button", { name: "Código" });
    const tree = screen.getByRole("button", { name: "Estrutura" });
    act(() => code.focus());
    fireEvent.keyDown(code, { key: "ArrowDown" });
    await waitFor(() => expect(document.activeElement).toBe(tree));
  });

  it("each square has its name as a hint, not a title", async () => {
    render(
      <TooltipProvider delay={0}>
        <Rail />
      </TooltipProvider>,
    );
    const help = screen.getByRole("button", { name: "Como ler" });
    expect(help.hasAttribute("title")).toBe(false);
    await act(async () => void fireEvent.mouseEnter(help));
    expect((await screen.findAllByText("Como ler")).length).toBeGreaterThan(0);
  });
});
