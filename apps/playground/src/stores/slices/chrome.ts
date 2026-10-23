import type { StateCreator } from "zustand";
import type { Position, Severity } from "@odds/core";
import type { PlaygroundState } from "../playground";

export type PanelName = "code" | "tree" | "help";
/** A stretch of the text the editor should select and scroll to; `seq` makes the same stretch twice a new request. */
export interface Reveal {
  start: Position;
  end: Position;
  /** Lines kept above `start` when scrolling: the dock's 6, the bench's jumpTo 4. */
  lead: number;
  seq: number;
}
export interface CameraCommand {
  kind: "in" | "out" | "fit";
  seq: number;
}

export interface ChromeSlice {
  /** The rail's panels: one at a time. */
  openPanel: PanelName | null;
  reveal: Reveal | null;
  /** The dock's counters: which severities the list shows. */
  filters: Record<Severity, boolean>;
  listOpen: boolean;
  /** "ver todos": the whole list instead of the first three rows. */
  allOpen: boolean;
  theme: "light" | "dark";
  toast: { message: string; seq: number } | null;
  /** The zoom the camera publishes, rounded. */
  zoomPct: number;
  cameraCommand: CameraCommand | null;
  /** The same name closes (the bench's setPanel). */
  togglePanel(name: PanelName): void;
  closePanel(): void;
  /** From the map or a diagnostic to the text: the code panel opens if needed. */
  revealInEditor(start: Position, end: Position, lead?: number): void;
  /** The bench's jumpTo (tree, ficha links): the whole line `line`, four lines of lead. */
  revealLine(line: number): void;
  /** A hidden list opens again when a counter is pressed. */
  toggleFilter(s: Severity): void;
  setListOpen(open: boolean): void;
  toggleAll(): void;
  toggleTheme(): void;
  showToast(message: string): void;
  dismissToast(): void;
  setZoomPct(pct: number): void;
  commandCamera(kind: CameraCommand["kind"]): void;
}

export const createChromeSlice: StateCreator<PlaygroundState, [], [], ChromeSlice> = (set, get) => ({
  openPanel: null,
  reveal: null,
  filters: { error: true, warning: true, info: true },
  listOpen: true,
  allOpen: false,
  theme: "light",
  toast: null,
  zoomPct: 100,
  cameraCommand: null,
  togglePanel: (name) => set((s) => ({ openPanel: s.openPanel === name ? null : name })),
  closePanel: () => set({ openPanel: null }),
  revealInEditor: (start, end, lead = 6) =>
    set((s) => ({ openPanel: "code", reveal: { start, end, lead, seq: (s.reveal?.seq ?? 0) + 1 } })),
  revealLine: (line) => {
    const text = get().text.split("\n")[line - 1] ?? "";
    get().revealInEditor({ line, column: 1 }, { line, column: text.length + 1 }, 4);
  },
  toggleFilter: (sev) => set((s) => ({ filters: { ...s.filters, [sev]: !s.filters[sev] }, listOpen: true })),
  setListOpen: (listOpen) => set({ listOpen }),
  toggleAll: () => set((s) => ({ allOpen: !s.allOpen })),
  toggleTheme: () => set((s) => ({ theme: s.theme === "dark" ? "light" : "dark" })),
  showToast: (message) => set((s) => ({ toast: { message, seq: (s.toast?.seq ?? 0) + 1 } })),
  dismissToast: () => set({ toast: null }),
  setZoomPct: (zoomPct) => set({ zoomPct }),
  commandCamera: (kind) => set((s) => ({ cameraCommand: { kind, seq: (s.cameraCommand?.seq ?? 0) + 1 } })),
});
