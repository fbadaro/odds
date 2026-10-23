import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Toast } from "../src/components/ui/Toast";
import { Actions } from "../src/features/topbar/components/Actions";
import { usePlayground } from "../src/stores/playground";

const initial = usePlayground.getState();

function mount() {
  return render(
    <>
      <Actions />
      <Toast />
    </>,
  );
}

describe("Actions and Toast", () => {
  beforeEach(() => {
    document.documentElement.dataset.theme = "light";
  });
  afterEach(() => {
    usePlayground.setState(initial, true);
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("share shows the open-decision toast", () => {
    const { container } = mount();
    expect(container.querySelector('[data-feature="share"]')).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Compartilhar" }));
    expect(screen.getByRole("status").textContent).toBe(
      "Compartilhar ainda é só o lugar do botão: o formato do link, com o texto e a versão da linguagem na URL, é decisão em aberto.",
    );
  });

  it("theme toggles data-theme on <html>", () => {
    const { container } = mount();
    expect(container.querySelector('[data-feature="theme-toggle"]')).not.toBeNull();
    const btn = screen.getByRole("button", { name: "Alternar tema" });
    fireEvent.click(btn);
    expect(document.documentElement.dataset.theme).toBe("dark");
    fireEvent.click(btn);
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("export creates a download named after the file and toasts the marker count", () => {
    const { container } = mount();
    // the live map svg is mounted by Honeycomb; stand one in
    const host = document.createElement("div");
    host.setAttribute("data-feature", "map");
    host.innerHTML = '<svg class="v-flow" viewBox="0 0 10 10"></svg>';
    document.body.appendChild(host);
    const create = vi.fn(() => "blob:x");
    const revoke = vi.fn();
    Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    usePlayground.setState({
      drawing: { geo: { viewBox: [0, 0, 100, 80] }, svg: "", fit: [0, 0, 100, 80] } as never,
    });
    expect(container.querySelector('[data-feature="export-svg"]')).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Exportar SVG" }));
    expect(create).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    const a = click.mock.contexts[0] as HTMLAnchorElement;
    expect(a.download).toBe("marketplace.svg");
    expect(screen.getByRole("status").textContent).toBe("Exportado: marketplace.svg, com 0 marcadores.");
    host.remove();
  });

  it("the toast hides after 4200 ms", () => {
    vi.useFakeTimers();
    const { container } = mount();
    expect(container.querySelector('[data-feature="toast"]')).not.toBeNull();
    act(() => usePlayground.getState().showToast("oi"));
    const el = screen.getByRole("status");
    expect(el.hidden).toBe(false);
    act(() => void vi.advanceTimersByTime(4199));
    expect(el.hidden).toBe(false);
    act(() => void vi.advanceTimersByTime(2));
    expect(el.hidden).toBe(true);
  });
});
