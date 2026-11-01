import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MODELS } from "../src/lib/models";
import { applyEdit } from "../src/stores/slices/create";
import { PAUSE_MS, createPlaygroundStore } from "../src/stores/playground";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const SALES = MODELS.m17.text;

describe("the create slice", () => {
  it("opens and closes the form for a target", () => {
    const s = createPlaygroundStore(SALES);
    s.getState().openCreate({ kind: "context", domain: 0, parent: "Sales" });
    expect(s.getState().creating).toEqual({ kind: "context", domain: 0, parent: "Sales" });
    s.getState().closeCreate();
    expect(s.getState().creating).toBeNull();
  });

  it("commits as an edit for the editor to apply: the form closes and the code panel opens", () => {
    const s = createPlaygroundStore(SALES);
    s.getState().openCreate({ kind: "context", domain: 0, parent: "Sales" });
    s.getState().commitCreate({ kind: "context", domain: 0, parent: "Sales", fields: { name: "Promo" } });
    const { edit, creating, openPanel, text } = s.getState();
    expect(creating).toBeNull();
    expect(openPanel).toBe("code");
    expect(edit).not.toBeNull();
    expect(edit!.base).toBe(SALES);
    expect(edit!.from).toBe(edit!.to);
    expect(text).toBe(SALES); // the editor writes it, as one undo step
    expect(applyEdit(SALES, edit!)).toContain("    context Promo\n  }\n\n  subdomain core Discovery");
  });

  it("each commit is a new request", () => {
    const s = createPlaygroundStore(SALES);
    s.getState().commitCreate({ kind: "context", domain: 0, parent: "Sales", fields: { name: "A" } });
    const first = s.getState().edit!.seq;
    s.getState().commitCreate({ kind: "context", domain: 0, parent: "Sales", fields: { name: "B" } });
    expect(s.getState().edit!.seq).toBe(first + 1);
  });

  it("does nothing on a pure syntax error: there is no tree to insert into", () => {
    const s = createPlaygroundStore(SALES);
    s.getState().setText(SALES + "}}}");
    s.getState().commitCreate({ kind: "context", domain: 0, parent: "Sales", fields: { name: "Promo" } });
    expect(s.getState().edit).toBeNull();
  });

  it("selects the new context once the map draws it, framed, and not before", () => {
    const s = createPlaygroundStore(SALES);
    s.getState().commitCreate({ kind: "context", domain: 0, parent: "Sales", fields: { name: "Promo" } });
    const frame = s.getState().frameSeq;
    s.getState().setText(applyEdit(SALES, s.getState().edit!));
    // a new topology waits for the pause, and the old geometry has no Promo yet
    expect(s.getState().waiting).toBe(true);
    expect(s.getState().selection).toBeNull();
    vi.advanceTimersByTime(PAUSE_MS);
    expect(s.getState().selection).toEqual({ ctx: "Promo" });
    expect(s.getState().frameSeq).toBe(frame + 1);
    expect(s.getState().wantSelect).toBeNull();
  });

  it("selects a new relationship by its pair", () => {
    const s = createPlaygroundStore(SALES);
    s.getState().commitCreate({ kind: "relationship", domain: 0, fields: { left: "Cart", connector: "-x-", right: "Search", leftTags: [], rightTags: [] } });
    s.getState().setText(applyEdit(SALES, s.getState().edit!));
    vi.advanceTimersByTime(PAUSE_MS);
    expect(s.getState().selection).toEqual({ rel: "Cart|Search", from: null });
  });

  it("selects a new subdomain by its key, even while it has no context", () => {
    const s = createPlaygroundStore(SALES);
    s.getState().commitCreate({ kind: "subdomain", domain: 0, fields: { type: "generic", name: "Empty" } });
    s.getState().setText(applyEdit(SALES, s.getState().edit!));
    vi.advanceTimersByTime(PAUSE_MS);
    expect(s.getState().selection).toEqual({ sub: "ECommercePlatform/Empty" });
  });

  it("forgets what the drawing of the current text does not show (the insertion undone at once)", () => {
    const s = createPlaygroundStore(SALES);
    s.getState().commitCreate({ kind: "context", domain: 0, parent: "Sales", fields: { name: "Promo" } });
    s.getState().setText(applyEdit(SALES, s.getState().edit!));
    s.getState().setText(SALES);
    vi.advanceTimersByTime(PAUSE_MS);
    expect(s.getState().selection).toBeNull();
    expect(s.getState().wantSelect).toBeNull();
  });

  it("new design: the whole text goes, as one edit, and the domain form opens", () => {
    const s = createPlaygroundStore(SALES);
    s.getState().newDesign();
    const { edit, creating } = s.getState();
    expect(edit).toMatchObject({ from: 0, to: SALES.length, text: "" });
    expect(creating).toEqual({ kind: "domain" });
  });
});
