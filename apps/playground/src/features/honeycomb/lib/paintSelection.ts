import type { Nav } from "@odds/layout";
import type { Selection } from "../../../lib/selection";

const each = <T extends Element>(list: NodeListOf<T>, fn: (el: T) => void) => list.forEach(fn);

/** O `paintSel` da bancada, só as classes: a legenda e a árvore ficam com quem as desenha. */
export function paintSelection(svg: SVGSVGElement, nav: Nav, sel: Selection, hover: string | null): void {
  const rk = sel && "rel" in sel ? sel.rel : null;
  const from = sel && "rel" in sel ? sel.from : null;
  const cid = sel && "ctx" in sel ? sel.ctx : null;
  const sk = sel && "sub" in sel ? sel.sub : null;
  const base = cid ?? from;
  const near: Record<string, 1> = {}, inSub: Record<string, 1> = {}, ends: Record<string, 1> = {}, homes: Record<string, 1> = {};
  if (base) {
    near[base] = 1;
    (nav.near[base] ?? []).forEach((x) => { near[x] = 1; });
  }
  const relation = rk ? nav.relOf[rk] : undefined;
  if (relation) { ends[relation[1]] = 1; ends[relation[2]] = 1; }
  if (sk) (nav.subs[sk]?.ids ?? []).forEach((id) => { inSub[id] = 1; });
  const faded = (c: string) => (base ? !near[c] : rk ? !ends[c] : sk ? !inSub[c] : false);
  const isOn = (c: string) => c === cid || !!ends[c];
  const hotSub = (k: string | null) => (k !== null && k === sk) || k === hover;
  if (cid && nav.ctxSub[cid]) homes[nav.ctxSub[cid]] = 1;
  Object.keys(ends).forEach((c) => { const h = nav.ctxSub[c]; if (h) homes[h] = 1; });

  each(svg.querySelectorAll("g.node"), (g) => {
    const c = g.getAttribute("data-ctx") ?? "";
    g.classList.toggle("on", isOn(c));
    g.classList.toggle("fade", faded(c));
    g.classList.toggle("subhot", hotSub(g.getAttribute("data-sub")));
  });
  each(svg.querySelectorAll("text.cnm"), (t) => {
    const c = t.textContent ?? "";
    t.classList.toggle("on", isOn(c));
    t.classList.toggle("fade", faded(c));
  });
  each(svg.querySelectorAll("g.sub"), (g) => {
    const key = g.getAttribute("data-sub") ?? "";
    g.classList.toggle("hot", hotSub(key) || !!homes[key]);
    g.classList.toggle("on", key === sk || !!homes[key]);
  });
  each(svg.querySelectorAll("g.sublab"), (g) => {
    const key = g.getAttribute("data-sub") ?? "";
    g.classList.toggle("subhot", hotSub(key) || !!homes[key]);
  });
  each(svg.querySelectorAll("g.rel"), (g) => {
    const k = g.getAttribute("data-rk") ?? "", r = nav.relOf[k];
    if (!r) return;
    const touches = base ? r[1] === base || r[2] === base : false;
    const mute = !!rk && k !== rk && touches;
    const lit = rk ? k === rk || mute : touches;
    g.classList.toggle("lit", lit);
    g.classList.toggle("focus", !!rk && k === rk);
    g.classList.toggle("mute", mute);
    g.classList.toggle("fade", !!sel && !lit && !mute);
  });
  svg.classList.toggle("sel-on", !!sel);
}
