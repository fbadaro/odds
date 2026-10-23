import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CodePanel } from "../src/features/editor/components/CodePanel";
import { offsetOf } from "../src/features/editor/lib/gutter";
import { MODELS } from "../src/lib/models";
import { usePlayground } from "../src/stores/playground";

const initial = usePlayground.getState();
const editor = () => screen.getByLabelText("Texto .odds") as HTMLTextAreaElement;

function mount() {
  return render(
    <>
      <div data-feature="map" tabIndex={0} />
      <CodePanel />
    </>,
  );
}

describe("CodePanel", () => {
  beforeEach(() => usePlayground.setState({ ...initial, text: "ab\ncde\nf" }, true));
  afterEach(() => usePlayground.setState(initial, true));

  it("exists only while the code panel is open", () => {
    const { container } = mount();
    expect(container.querySelector('[data-feature="panel-code"]')).toBeNull();
    act(() => usePlayground.getState().togglePanel("code"));
    expect(container.querySelector('[data-feature="panel-code"]')).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
    expect(usePlayground.getState().openPanel).toBeNull();
  });

  it("Tab inserts two spaces", () => {
    usePlayground.setState({ openPanel: "code" });
    mount();
    const ta = editor();
    ta.setSelectionRange(2, 2);
    fireEvent.keyDown(ta, { key: "Tab" });
    expect(usePlayground.getState().text).toBe("ab  \ncde\nf");
    expect(ta.value).toBe("ab  \ncde\nf");
    expect(ta.selectionStart).toBe(4);
  });

  it("Escape leaves the editor and keeps the selection", () => {
    usePlayground.setState({ openPanel: "code" });
    const sel = { kind: "context", id: "x" } as never;
    usePlayground.setState({ selection: sel });
    mount();
    editor().focus();
    fireEvent.keyDown(editor(), { key: "Escape" });
    expect(document.activeElement).toBe(document.querySelector('[data-feature="map"]'));
    expect(usePlayground.getState().selection).toBe(sel);
  });

  it("caret shows file and line:column", () => {
    usePlayground.setState({ openPanel: "code" });
    mount();
    const ta = editor();
    expect(screen.getByText(`${MODELS.m50.file} · L1:1`)).toBeTruthy();
    ta.setSelectionRange(4, 4);
    fireEvent.keyUp(ta);
    expect(screen.getByText(`${MODELS.m50.file} · L2:2`)).toBeTruthy();
  });

  it("revealInEditor selects the span", () => {
    mount();
    const start = { line: 2, column: 2 };
    const end = { line: 3, column: 1 };
    act(() => usePlayground.getState().revealInEditor(start, end));
    const ta = editor();
    expect(ta.selectionStart).toBe(offsetOf(usePlayground.getState().text, start));
    expect(ta.selectionEnd).toBe(offsetOf(usePlayground.getState().text, end));
    expect(document.activeElement).toBe(ta);
  });

  it("gutter shows a severity icon on a line with a diagnostic", () => {
    usePlayground.setState({ openPanel: "code" });
    const { container } = mount();
    expect(container.querySelector('[data-feature="panel-code"] [data-icon]')).toBeNull();
    const text = MODELS.m50.text;
    const i = text.indexOf("-->");
    act(() => usePlayground.getState().setText(text.slice(0, i) + "[XYZ] " + text.slice(i)));
    expect(container.querySelector('[data-feature="panel-code"] [data-icon="error"]')).not.toBeNull();
  });

  it("reopening the code panel shows L1:1", () => {
    usePlayground.setState({ openPanel: "code" });
    mount();
    editor().setSelectionRange(4, 4);
    fireEvent.keyUp(editor());
    expect(screen.getByText(`${MODELS.m50.file} · L2:2`)).toBeTruthy();
    act(() => usePlayground.getState().closePanel());
    act(() => usePlayground.getState().togglePanel("code"));
    expect(screen.getByText(`${MODELS.m50.file} · L1:1`)).toBeTruthy();
  });

  it("switching file resets the caret to L1:1", () => {
    usePlayground.setState({ openPanel: "code" });
    mount();
    editor().setSelectionRange(4, 4);
    fireEvent.keyUp(editor());
    act(() => usePlayground.getState().loadModel("m17"));
    expect(screen.getByText(`${MODELS.m17.file} · L1:1`)).toBeTruthy();
    expect(editor().selectionStart).toBe(0);
  });
});
