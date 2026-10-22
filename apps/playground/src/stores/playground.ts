import { create } from "zustand";
import type { SubdomainType } from "@odds/core";
import { layout, renderSvg } from "@odds/layout";
import type { Geometry, LayoutModel, ViewOptions } from "@odds/layout";
import { marketplace } from "@odds/layout/fixtures";
import { analyze, type Analysis } from "../lib/analyze";

/** How long a new topology waits before the geometry moves (the bench's PAUSE_MS). */
export const PAUSE_MS = 300;

export interface Drawing {
  geo: Geometry;
  svg: string;
  topo: string;
  full: string;
}

export interface PlaygroundState {
  text: string;
  analysis: Analysis;
  drawing: Drawing | null;
  stale: boolean;
  waiting: boolean;
  view: ViewOptions;
  /** The bench's `onText`. */
  setText(text: string): void;
  /** The end of the pause. */
  flush(): void;
}

const FILE = marketplace().file;
const INITIAL_VIEW: ViewOptions = { view: "flow", tags: "on", labels: "ctx", sel: null, selSub: null, selDiag: null };

const hasMass = (m: LayoutModel) => m.domains.some((d) => d.subdomains.some((s) => s.contexts.length > 0) || (d.external?.length ?? 0) > 0);

export function createPlaygroundStore(initialText: string = marketplace().text) {
  // per store instance: the memory modelOf reads and updates, and the pause
  const lastType = new Map<string, SubdomainType>();
  let pending: { model: LayoutModel; keys: { topo: string; full: string } } | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const clearPending = () => {
    pending = null;
    clearTimeout(timer);
  };

  return create<PlaygroundState>()((set, get) => {
    const paint = (geo: Geometry, analysis: Analysis): string => renderSvg(geo, analysis.diagnostics, get().view);

    /** Lay out and draw; returns the patch to apply. */
    const relayout = (model: LayoutModel, keys: { topo: string; full: string }, analysis: Analysis): Partial<PlaygroundState> => {
      const geo = layout(model);
      if (Object.keys(geo.tiles).length === 0) return { drawing: null, stale: false, waiting: false };
      // the flag follows the current text: a pending layout can land while the text is broken
      return { drawing: { geo, svg: paint(geo, analysis), topo: keys.topo, full: keys.full }, stale: !analysis.astGenerated, waiting: false };
    };

    const flush = () => {
      if (!pending) {
        set({ waiting: false });
        return;
      }
      const { model, keys } = pending;
      pending = null;
      set(relayout(model, keys, get().analysis));
    };

    const setText = (text: string) => {
      const analysis = analyze(text, FILE, lastType);
      const cur = get().drawing;
      if (!analysis.astGenerated || !analysis.model || !analysis.keys) {
        // no tree: keep the last drawing, mark it stale (there may be none yet)
        set({ text, analysis, stale: cur !== null });
        return;
      }
      const { model, keys } = analysis;
      if (!hasMass(model)) {
        clearPending();
        set({ text, analysis, drawing: null, stale: false, waiting: false });
      } else if (cur && keys.full === cur.full) {
        clearPending();
        set({ text, analysis, stale: false, waiting: false, drawing: { ...cur, svg: paint(cur.geo, analysis) } });
      } else if (cur && keys.topo === cur.topo) {
        clearPending();
        set({ text, analysis, ...relayout(model, keys, analysis) });
      } else if (!cur) {
        clearPending();
        set({ text, analysis, ...relayout(model, keys, analysis) });
      } else {
        // new topology: markers follow the text over the old geometry while the geometry waits
        pending = { model, keys };
        clearTimeout(timer);
        timer = setTimeout(flush, PAUSE_MS);
        set({ text, analysis, stale: false, waiting: true, drawing: { ...cur, svg: paint(cur.geo, analysis) } });
      }
    };

    const first = analyze(initialText, FILE, lastType);
    let drawing: Drawing | null = null;
    const view = { ...INITIAL_VIEW };
    if (first.model && first.keys && hasMass(first.model)) {
      const geo = layout(first.model);
      if (Object.keys(geo.tiles).length > 0) drawing = { geo, svg: renderSvg(geo, first.diagnostics, view), topo: first.keys.topo, full: first.keys.full };
    }
    return { text: initialText, analysis: first, drawing, stale: false, waiting: false, view, setText, flush };
  });
}

export const usePlayground = createPlaygroundStore();
