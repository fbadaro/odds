import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { FileMenu } from "../src/features/topbar/components/FileMenu";
import { useGlobalEscape } from "../src/features/honeycomb/useGlobalEscape";
import { MODELS } from "../src/lib/models";
import { usePlayground } from "../src/stores/playground";

const initial = usePlayground.getState();

function Harness() {
  useGlobalEscape();
  return <FileMenu />;
}

describe("FileMenu", () => {
  afterEach(() => usePlayground.setState(initial, true));

  it("opens the menu and switches to vendas.odds", async () => {
    const { container } = render(<FileMenu />);
    expect(container.querySelector('[data-feature="file-menu"]')).not.toBeNull();
    expect(screen.getByText("odds")).toBeTruthy();
    const btn = screen.getByRole("button", { name: /marketplace\.odds/ });
    expect(btn.getAttribute("aria-haspopup")).toBe("menu");
    fireEvent.click(btn);
    expect(await screen.findByText("50 contextos")).toBeTruthy();
    expect(screen.getByText("17 contextos")).toBeTruthy();
    const item = await screen.findByRole("menuitemradio", { name: /vendas\.odds/ });
    fireEvent.click(item);
    expect(usePlayground.getState().text).toBe(MODELS.m17.text);
    expect(usePlayground.getState().modelKey).toBe("m17");
    expect(screen.getByRole("button", { name: /vendas\.odds/ })).toBeTruthy();
  });

  it("restore puts the initial text back", async () => {
    usePlayground.getState().loadModel("m17");
    usePlayground.getState().setText("context X {}");
    render(<FileMenu />);
    fireEvent.click(screen.getByRole("button", { name: /vendas\.odds/ }));
    fireEvent.click(await screen.findByRole("menuitem", { name: /restaurar o texto inicial/ }));
    expect(usePlayground.getState().text).toBe(MODELS.m17.text);
  });

  it("Escape with the menu open closes the menu and keeps the selection", async () => {
    usePlayground.getState().select({ ctx: "Catalog" });
    const before = usePlayground.getState().selection;
    expect(before).not.toBeNull();
    render(<Harness />);
    const btn = screen.getByRole("button", { name: /marketplace\.odds/ });
    fireEvent.click(btn);
    await screen.findByRole("menu");
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
    await Promise.resolve();
    expect(screen.queryByRole("menu")).toBeNull();
    expect(usePlayground.getState().selection).toBe(before);
  });
});
