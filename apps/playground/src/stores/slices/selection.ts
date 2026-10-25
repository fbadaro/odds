import type { StateCreator } from "zustand";
import { aliveSelection, escapeSelection, relationClick, type Selection } from "../../lib/selection";
import type { PlaygroundState } from "../playground";

export interface SelectionSlice {
  selection: Selection;
  /** Bumped by each framed selection: the camera frames `framePoints(selection)` when it changes. */
  frameSeq: number;
  /** The subdomain under the pointer (`"Domain/Sub"`). */
  hover: string | null;
  /** The bench's select/selectSub/selectRel; only what is on the map stays selected. */
  select(sel: Selection, frame?: boolean): void;
  /** The bench's relClick: framed only when the relation is not seen from a context. */
  clickRelation(rk: string): void;
  /** The bench's escape: from a relation back to its context, otherwise nothing. */
  escape(): void;
  setHover(sub: string | null): void;
}

export const createSelectionSlice: StateCreator<PlaygroundState, [], [], SelectionSlice> = (set, get) => ({
  selection: null,
  frameSeq: 0,
  hover: null,
  select: (sel, frame = false) =>
    set((s) => ({
      selection: s.drawing ? aliveSelection(sel, s.drawing.nav) : null,
      frameSeq: frame ? s.frameSeq + 1 : s.frameSeq,
    })),
  clickRelation: (rk) => {
    const { selection, drawing, select } = get();
    if (!drawing) return;
    const next = relationClick(selection, rk, drawing.nav);
    if (next === selection) return;
    select(next, next !== null && "rel" in next);
  },
  escape: () => {
    const { selection } = get();
    if (selection) set({ selection: escapeSelection(selection) });
  },
  setHover: (hover) => set({ hover }),
});
