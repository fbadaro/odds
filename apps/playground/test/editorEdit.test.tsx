import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CodePanel } from "../src/features/editor/components/CodePanel";
import { usePlayground } from "../src/stores/playground";

const initial = usePlayground.getState();
const SHOP = "domain Shop {\n  subdomain core Sales {\n    context Cart\n  }\n}\n";
const editor = () => screen.getByLabelText("Fonte .odds") as HTMLTextAreaElement;
const gutterRow = (line: number) => document.querySelector<HTMLElement>(`[data-line="${line}"]`)!;

/** Commits a form and lets the editor apply the edit, which it does after the committing event. */
function commit(name: string, extra: Record<string, string> = {}) {
  act(() => usePlayground.getState().commitCreate({ kind: "context", domain: 0, parent: "Sales", fields: { name, ...extra } }));
  act(() => vi.advanceTimersByTime(0));
}

function mount() {
  return render(
    <>
      <button type="button">gatilho</button>
      <CodePanel />
    </>,
  );
}

describe("the editor applies a form's edit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    usePlayground.setState({ ...initial, text: "" }, true);
    usePlayground.getState().setText(SHOP);
  });
  afterEach(() => {
    vi.useRealTimers();
    usePlayground.setState(initial, true);
    Reflect.deleteProperty(document, "execCommand");
  });

  it("writes the snippet into the textarea and the store, after the event that committed the form", () => {
    mount();
    act(() => usePlayground.getState().commitCreate({ kind: "context", domain: 0, parent: "Sales", fields: { name: "Promo" } }));
    // an editing command nested in the form field's key event would be left out of the undo history
    expect(editor().value).toBe(SHOP);
    act(() => vi.advanceTimersByTime(0));
    expect(editor().value).toBe("domain Shop {\n  subdomain core Sales {\n    context Cart\n    context Promo\n  }\n}\n");
    expect(usePlayground.getState().text).toBe(editor().value);
  });

  it("goes through insertText where the browser has it, so one undo removes it", () => {
    const calls: unknown[][] = [];
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: (...args: unknown[]) => {
        calls.push(args);
        const ta = editor();
        ta.setRangeText(String(args[2]), ta.selectionStart, ta.selectionEnd, "end");
        ta.dispatchEvent(new Event("input", { bubbles: true }));
        return true;
      },
    });
    mount();
    commit("Promo");
    expect(calls).toEqual([["insertText", false, "    context Promo\n"]]);
    expect(usePlayground.getState().text).toContain("    context Promo\n");
  });

  it("waits for a closing modal to let the focus go, so the edit still lands in the undo history", async () => {
    vi.useRealTimers();
    let native = 0;
    // like a browser: insertText acts only on the focused field
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: (_cmd: string, _ui: boolean, text: string) => {
        const ta = editor();
        if (document.activeElement !== ta) return false;
        ta.setRangeText(text, ta.selectionStart, ta.selectionEnd, "end");
        ta.dispatchEvent(new Event("input", { bubbles: true }));
        native++;
        return true;
      },
    });
    mount();
    // the dialog's focus trap: the first two attempts to focus the editor go nowhere
    const real = HTMLTextAreaElement.prototype.focus;
    let refused = 0;
    const spy = vi.spyOn(HTMLTextAreaElement.prototype, "focus").mockImplementation(function (this: HTMLTextAreaElement) {
      if (refused++ < 2) return;
      real.call(this);
    });
    act(() => usePlayground.getState().commitCreate({ kind: "context", domain: 0, parent: "Sales", fields: { name: "Promo" } }));
    await waitFor(() => expect(usePlayground.getState().text).toContain("    context Promo\n"));
    // written by the native command, not by the fallback's direct replacement
    expect(native).toBe(1);
    spy.mockRestore();
  });

  it("gives the keyboard focus back to where it was", () => {
    mount();
    const trigger = screen.getByRole("button", { name: "gatilho" });
    trigger.focus();
    commit("Promo");
    expect(document.activeElement).toBe(trigger);
  });

  it("highlights the new lines for a moment", () => {
    mount();
    commit("Promo", { title: "P" });
    expect([3, 4, 5, 6, 7].map((l) => gutterRow(l).hasAttribute("data-fresh"))).toEqual([false, true, true, true, false]);
    act(() => vi.advanceTimersByTime(2000));
    expect(gutterRow(4).hasAttribute("data-fresh")).toBe(false);
  });

  it("does not apply an edit planned on another text", () => {
    mount();
    commit("Promo");
    const after = editor().value;
    act(() => usePlayground.setState({ edit: { ...usePlayground.getState().edit!, seq: 99, base: "outro" } }));
    act(() => vi.advanceTimersByTime(0));
    expect(editor().value).toBe(after);
    expect(usePlayground.getState().edit!.lines).toBeNull();
  });
});
