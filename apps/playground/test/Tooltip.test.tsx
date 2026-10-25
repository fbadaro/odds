import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "../src/components/button/Button";
import { Tooltip, TooltipProvider } from "../src/components/ui/Tooltip";

function Harness() {
  return (
    <TooltipProvider delay={0}>
      <Tooltip label="Tema">
        <Button aria-label="Alternar tema">
          <svg aria-hidden="true" />
        </Button>
      </Tooltip>
    </TooltipProvider>
  );
}

describe("Tooltip", () => {
  it("the trigger keeps its own name and content, with no title", () => {
    render(<Harness />);
    const b = screen.getByRole("button", { name: "Alternar tema" });
    expect(b.querySelector("svg")).not.toBeNull();
    expect(b.hasAttribute("title")).toBe(false);
    expect(screen.queryByText("Tema")).toBeNull();
  });

  it("shows the hint on hover", async () => {
    render(<Harness />);
    const b = screen.getByRole("button", { name: "Alternar tema" });
    await act(async () => {
      fireEvent.pointerEnter(b, { pointerType: "mouse" });
      fireEvent.mouseEnter(b);
      fireEvent.mouseMove(b);
    });
    expect(await screen.findByText("Tema")).toBeTruthy();
  });
});
