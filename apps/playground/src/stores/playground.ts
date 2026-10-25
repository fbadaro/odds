import { create } from "zustand";
import { MODELS } from "../lib/models";
import { createChromeSlice, type ChromeSlice } from "./slices/chrome";
import { createDocumentSlice, type DocumentSlice } from "./slices/document";
import { createSelectionSlice, type SelectionSlice } from "./slices/selection";

export { PAUSE_MS, type Drawing } from "./slices/document";
export type { CameraCommand, PanelName, Reveal } from "./slices/chrome";
export type { Box, Selection } from "../lib/selection";

/** The text cycle and the file (document), what is picked on the map (selection), and the islands around it (chrome). */
export type PlaygroundState = DocumentSlice & SelectionSlice & ChromeSlice;

export function createPlaygroundStore(initialText: string = MODELS.m50.text) {
  return create<PlaygroundState>()((...a) => ({
    ...createSelectionSlice(...a),
    ...createChromeSlice(...a),
    ...createDocumentSlice(initialText)(...a),
  }));
}

export const usePlayground = createPlaygroundStore();
