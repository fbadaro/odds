import { create } from "zustand";
import type { SubdomainType } from "@odds/core";
import { layout, renderSvg } from "@odds/layout";
import type { Geometry, LayoutModel, TargetedDiagnostic, ViewOptions } from "@odds/layout";
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
  /** The message of the last `layout`/`renderSvg` throw; null after every successful draw (the bench's flag). */
  layoutError: string | null;
  view: ViewOptions;
  /** The bench's `onText`. Never throws: a layout failure keeps the old drawing and sets `layoutError`. */
  setText(text: string): void;
  /** The end of the pause. */
  flush(): void;
}

const MARKETPLACE = marketplace();
const FILE = MARKETPLACE.file;
const INITIAL_VIEW: ViewOptions = { view: "flow", tags: "on", labels: "ctx", sel: null, selSub: null, selDiag: null };

const hasMass = (m: LayoutModel) => m.domains.some((d) => d.subdomains.some((s) => s.contexts.length > 0) || (d.external?.length ?? 0) > 0);
const messageOf = (e: unknown) => (e instanceof Error ? e.message : String(e));

type Keys = { topo: string; full: string };
/** A draw either lands or fails with the message; the caller decides what to keep. */
type Drawn = { ok: true; drawing: Drawing | null } | { ok: false; error: string };

export function createPlaygroundStore(initialText: string = MARKETPLACE.text) {
  // per store instance: the memory modelOf reads and updates, and the pause
  const lastType = new Map<string, SubdomainType>();
  let pending: { model: LayoutModel; keys: Keys } | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  // the diagnostics of the last text that had a tree: what a frozen map keeps showing (the bench's lastDiags)
  let lastDiags: TargetedDiagnostic[] = [];

  const clearPending = () => {
    pending = null;
    clearTimeout(timer);
  };

  /** Lay out and draw, guarded as the bench's `relayout` is: a throw becomes a message, never an exception. */
  const draw = (model: LayoutModel, keys: Keys, diags: TargetedDiagnostic[], view: ViewOptions): Drawn => {
    try {
      const geo = layout(model);
      if (Object.keys(geo.tiles).length === 0) return { ok: true, drawing: null };
      return { ok: true, drawing: { geo, svg: renderSvg(geo, diags, view), topo: keys.topo, full: keys.full } };
    } catch (e) {
      return { ok: false, error: messageOf(e) };
    }
  };

  /** New markers over the geometry already drawn; guarded the same way. */
  const repaint = (cur: Drawing, diags: TargetedDiagnostic[], view: ViewOptions): Drawn => {
    try {
      return { ok: true, drawing: { ...cur, svg: renderSvg(cur.geo, diags, view) } };
    } catch (e) {
      return { ok: false, error: messageOf(e) };
    }
  };

  return create<PlaygroundState>()((set, get) => {
    /** The patch of a draw: on failure the previous drawing stays and the flag holds the message. */
    const patchOf = (r: Drawn, extra: Partial<PlaygroundState> = {}): Partial<PlaygroundState> =>
      r.ok ? { drawing: r.drawing, layoutError: null, ...extra } : { layoutError: r.error, waiting: false };

    const flush = () => {
      if (!pending) {
        set({ waiting: false });
        return;
      }
      const { model, keys } = pending;
      pending = null;
      const { analysis, view } = get();
      // the flag follows the current text: a pending layout can land while the text is broken,
      // and then the frozen map keeps the last tree's markers, not the syntax error's
      const r = draw(model, keys, analysis.astGenerated ? analysis.diagnostics : lastDiags, view);
      set(patchOf(r, { stale: r.ok && r.drawing !== null && !analysis.astGenerated, waiting: false }));
    };

    const setText = (text: string) => {
      const analysis = analyze(text, FILE, lastType);
      const { drawing: cur, view } = get();
      if (!analysis.astGenerated || !analysis.model || !analysis.keys) {
        // no tree: keep the last drawing, mark it stale (there may be none yet); the syntax banner takes the flag's place
        set({ text, analysis, stale: cur !== null, layoutError: null });
        return;
      }
      lastDiags = analysis.diagnostics;
      const { model, keys } = analysis;
      const base = { text, analysis, stale: false, waiting: false };
      if (!hasMass(model)) {
        clearPending();
        set({ ...base, drawing: null, layoutError: null });
      } else if (cur && keys.full === cur.full) {
        clearPending();
        set({ ...base, ...patchOf(repaint(cur, analysis.diagnostics, view)) });
      } else if (cur && keys.topo === cur.topo) {
        clearPending();
        set({ ...base, ...patchOf(draw(model, keys, analysis.diagnostics, view)) });
      } else if (!cur) {
        clearPending();
        set({ ...base, ...patchOf(draw(model, keys, analysis.diagnostics, view)) });
      } else {
        // new topology: markers follow the text over the old geometry while the geometry waits
        pending = { model, keys };
        clearTimeout(timer);
        timer = setTimeout(flush, PAUSE_MS);
        set({ ...base, ...patchOf(repaint(cur, analysis.diagnostics, view)), waiting: true });
      }
    };

    const first = analyze(initialText, FILE, lastType);
    const view = { ...INITIAL_VIEW };
    let drawing: Drawing | null = null;
    let layoutError: string | null = null;
    if (first.model && first.keys) {
      lastDiags = first.diagnostics;
      if (hasMass(first.model)) {
        const r = draw(first.model, first.keys, first.diagnostics, view);
        if (r.ok) drawing = r.drawing;
        else layoutError = r.error;
      }
    }
    return { text: initialText, analysis: first, drawing, stale: false, waiting: false, layoutError, view, setText, flush };
  });
}

export const usePlayground = createPlaygroundStore();
