import type { StateCreator } from "zustand";
import type { ProgramNode, SubdomainType } from "@odds/core";
import { layout, navOf, renderSvg } from "@odds/layout";
import type { Geometry, LayoutModel, Nav, TargetedDiagnostic, ViewOptions } from "@odds/layout";
import { analyze, type Analysis } from "../../lib/analyze";
import { MODELS, type ModelKey } from "../../lib/models";
import { aliveSelection, type Box, type Selection } from "../../lib/selection";
import type { PlaygroundState } from "../playground";

/** How long a new topology waits before the geometry moves (the bench's PAUSE_MS). */
export const PAUSE_MS = 300;

export interface Drawing {
  geo: Geometry;
  svg: string;
  topo: string;
  full: string;
  nav: Nav;
  /** The viewBox renderSvg wrote in the flow view (the bench renews nav.fit only there, or when there is none yet). */
  fit: Box;
  /** The tiles before, only when this drawing is the end of a pause with a new topology (the bench's FLIP); null otherwise. */
  prevTiles: Geometry["tiles"] | null;
}

export interface DocumentSlice {
  modelKey: ModelKey;
  text: string;
  analysis: Analysis;
  /** The last tree that existed: a syntax error keeps it. */
  ast: ProgramNode | null;
  /** The diagnostics of the last text that had a tree: what a frozen map keeps showing (the bench's lastDiags). */
  markers: TargetedDiagnostic[];
  drawing: Drawing | null;
  stale: boolean;
  waiting: boolean;
  /** The message of the last `layout`/`renderSvg` throw; null after every successful draw (the bench's flag). */
  layoutError: string | null;
  view: ViewOptions;
  /** Bumped by each file load: the camera goes back to automatic. */
  epoch: number;
  /** The bench's `onText`. Never throws: a layout failure keeps the old drawing and sets `layoutError`. */
  setText(text: string): void;
  /** The end of the pause. */
  flush(): void;
  loadModel(k: ModelKey): void;
  /** The file menu's "restaurar o texto inicial": the current model, loaded again. */
  resetText(): void;
  setView(v: ViewOptions["view"]): void;
}

const INITIAL_VIEW: ViewOptions = { view: "flow", tags: "on", labels: "ctx", sel: null, selSub: null, selDiag: null };

const hasMass = (m: LayoutModel) => m.domains.some((d) => d.subdomains.some((s) => s.contexts.length > 0) || (d.external?.length ?? 0) > 0);
const messageOf = (e: unknown) => (e instanceof Error ? e.message : String(e));
const boxOf = (geo: Geometry): Box => [...geo.viewBox!];

type Keys = { topo: string; full: string };
/** A draw either lands or fails with the message; the caller decides what to keep. */
type Drawn = { ok: true; drawing: Drawing | null } | { ok: false; error: string };

/** Lay out and draw, guarded as the bench's `relayout` is: a throw becomes a message, never an exception. */
function draw(model: LayoutModel, keys: Keys, diags: TargetedDiagnostic[], view: ViewOptions, prevTiles: Drawing["prevTiles"]): Drawn {
  try {
    const geo = layout(model);
    if (Object.keys(geo.tiles).length === 0) return { ok: true, drawing: null };
    const svg = renderSvg(geo, diags, view); // writes geo.viewBox
    return { ok: true, drawing: { geo, svg, topo: keys.topo, full: keys.full, nav: navOf(geo), fit: boxOf(geo), prevTiles } };
  } catch (e) {
    return { ok: false, error: messageOf(e) };
  }
}

/** The geometry already drawn, painted again (new markers or another view); guarded the same way. */
function repaint(cur: Drawing, diags: TargetedDiagnostic[], view: ViewOptions): Drawn {
  try {
    const svg = renderSvg(cur.geo, diags, view);
    return { ok: true, drawing: { ...cur, svg, fit: view.view === "flow" ? boxOf(cur.geo) : cur.fit, prevTiles: null } };
  } catch (e) {
    return { ok: false, error: messageOf(e) };
  }
}

export function createDocumentSlice(initialText: string): StateCreator<PlaygroundState, [], [], DocumentSlice> {
  return (set, get) => {
    // per store instance: the memory modelOf reads and updates, and the pause
    const lastType = new Map<string, SubdomainType>();
    let pending: { model: LayoutModel; keys: Keys } | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const clearPending = () => {
      pending = null;
      clearTimeout(timer);
    };

    /** The patch of a draw: on failure the previous drawing stays and the flag holds the message.
     *  Every new drawing prunes the selection to what is still on the map. */
    const patchOf = (r: Drawn, sel: Selection, extra: Partial<PlaygroundState> = {}): Partial<PlaygroundState> =>
      r.ok
        ? { drawing: r.drawing, layoutError: null, selection: r.drawing ? aliveSelection(sel, r.drawing.nav) : null, ...extra }
        : { layoutError: r.error };

    /** What a new text does to the state, given the drawing and selection it lands on. */
    const textPatch = (text: string, file: string, cur: Drawing | null, sel: Selection): Partial<PlaygroundState> => {
      const analysis = analyze(text, file, lastType);
      const { view } = get();
      if (!analysis.astGenerated || !analysis.model || !analysis.keys) {
        // no tree: keep the last drawing, ast and markers, mark it stale (there may be none yet); the flag now speaks of the syntax error
        return { text, analysis, stale: cur !== null, layoutError: null };
      }
      const { model, keys, diagnostics } = analysis;
      const base = { text, analysis, ast: analysis.ast, markers: diagnostics, stale: false, waiting: false };
      if (!hasMass(model)) {
        clearPending();
        return { ...base, drawing: null, selection: null, layoutError: null };
      }
      if (cur && keys.full === cur.full) {
        clearPending();
        return { ...base, ...patchOf(repaint(cur, diagnostics, view), sel) };
      }
      if (!cur || keys.topo === cur.topo) {
        clearPending();
        return { ...base, ...patchOf(draw(model, keys, diagnostics, view, null), sel) };
      }
      // new topology: markers follow the text over the old geometry while the geometry waits
      pending = { model, keys };
      clearTimeout(timer);
      timer = setTimeout(flush, PAUSE_MS);
      return { ...base, ...patchOf(repaint(cur, diagnostics, view), sel), waiting: true };
    };

    const flush = () => {
      if (!pending) {
        set({ waiting: false });
        return;
      }
      const { model, keys } = pending;
      pending = null;
      const { analysis, view, markers, drawing: cur, selection } = get();
      // the markers are the last tree's: a pending layout can land while the text is broken,
      // and then the frozen map keeps them, not the syntax error's
      const prev = cur && keys.topo !== cur.topo ? cur.geo.tiles : null;
      const r = draw(model, keys, markers, view, prev);
      set({ waiting: false, ...patchOf(r, selection, { stale: r.ok && r.drawing !== null && !analysis.astGenerated }) });
    };

    const setText = (text: string) => {
      const { drawing, selection, modelKey } = get();
      set(textPatch(text, MODELS[modelKey].file, drawing, selection));
    };

    // the bench's loadModel: nothing of the previous file survives, not even its pending layout
    const loadModel = (k: ModelKey) => {
      clearPending();
      lastType.clear();
      const reset = { modelKey: k, drawing: null, ast: null, markers: [], stale: false, waiting: false, layoutError: null, selection: null, hover: null };
      set((s) => ({ ...reset, epoch: s.epoch + 1, ...textPatch(MODELS[k].text, MODELS[k].file, null, null) }));
    };

    const setView = (v: ViewOptions["view"]) => {
      const { drawing, markers, view: was, selection } = get();
      const view = { ...was, view: v };
      set({ view, ...(drawing ? patchOf(repaint(drawing, markers, view), selection) : {}) });
    };

    // the first text: built here because set() is not usable before the store exists
    const first = analyze(initialText, MODELS.m50.file, lastType);
    const view = { ...INITIAL_VIEW };
    let drawing: Drawing | null = null;
    let layoutError: string | null = null;
    if (first.model && first.keys && hasMass(first.model)) {
      const r = draw(first.model, first.keys, first.diagnostics, view, null);
      if (r.ok) drawing = r.drawing;
      else layoutError = r.error;
    }
    return {
      modelKey: "m50",
      text: initialText,
      analysis: first,
      ast: first.ast,
      markers: first.astGenerated ? first.diagnostics : [],
      drawing,
      stale: false,
      waiting: false,
      layoutError,
      view,
      epoch: 0,
      setText,
      flush,
      loadModel,
      resetText: () => loadModel(get().modelKey),
      setView,
    };
  };
}
