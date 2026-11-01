import type { StateCreator } from "zustand";
import { planInsertion, type CreateRequest } from "../../features/create/lib/insertion";
import { pairKey, type Selection } from "../../lib/selection";
import type { PlaygroundState } from "../playground";

/** Which form is open: what is created, under which parent. A relationship may come with its first side. */
export type CreateTarget =
  | { kind: "domain" }
  | { kind: "subdomain"; domain: number }
  | { kind: "context"; domain: number; parent: string | null }
  | { kind: "relationship"; domain: number; left?: string };

/**
 * A change for the editor to make, so that it lands in the textarea's own undo
 * history (ADR-0026): `from`–`to` of `base` becomes `text`. An insertion has
 * `from === to`; "new design" replaces everything.
 */
export interface Edit {
  base: string;
  from: number;
  to: number;
  text: string;
  /** The lines to highlight in the new text; null when there is nothing to show. */
  lines: [number, number] | null;
  seq: number;
}

export const applyEdit = (source: string, e: Edit): string => source.slice(0, e.from) + e.text + source.slice(e.to);

export interface CreateSlice {
  creating: CreateTarget | null;
  edit: Edit | null;
  /** What becomes selected when the drawing of the new text lands; dropped if that drawing does not show it. */
  wantSelect: Selection;
  openCreate(target: CreateTarget): void;
  closeCreate(): void;
  /** Plans the insertion on the current tree and hands it to the editor. Without a tree (a pure SYNTAX_ERROR), nothing. */
  commitCreate(req: CreateRequest): void;
  /** The one command that replaces the whole file; the caller has asked for confirmation. */
  newDesign(): void;
  /** The editor is done showing the edit's lines (or did not apply it): the highlight goes. */
  settleEdit(seq: number): void;
}

function selectionOf(req: CreateRequest, domainName: string): Selection {
  switch (req.kind) {
    case "context":
      return { ctx: req.fields.name.trim() };
    case "subdomain":
      return { sub: domainName + "/" + req.fields.name.trim() };
    case "relationship":
      return { rel: pairKey(req.fields.left, req.fields.right), from: null };
    case "domain":
      return null;
  }
}

export const createCreateSlice: StateCreator<PlaygroundState, [], [], CreateSlice> = (set, get) => ({
  creating: null,
  edit: null,
  wantSelect: null,
  openCreate: (creating) => set({ creating }),
  closeCreate: () => set({ creating: null }),
  commitCreate: (req) => {
    const { text, analysis, edit } = get();
    if (!analysis.astGenerated || !analysis.ast) return;
    const ins = planInsertion(text, analysis.ast, req);
    const domainName = req.kind === "domain" ? "" : (analysis.ast.domains[req.domain]?.name ?? "");
    set({
      creating: null,
      openPanel: "code",
      wantSelect: selectionOf(req, domainName),
      edit: { base: text, from: ins.offset, to: ins.offset, text: ins.text, lines: ins.lines, seq: (edit?.seq ?? 0) + 1 },
    });
  },
  newDesign: () => {
    const { text, edit } = get();
    set({ creating: { kind: "domain" }, wantSelect: null, edit: { base: text, from: 0, to: text.length, text: "", lines: null, seq: (edit?.seq ?? 0) + 1 } });
  },
  settleEdit: (seq) => {
    const { edit } = get();
    if (edit && edit.seq === seq && edit.lines) set({ edit: { ...edit, lines: null } });
  },
});
