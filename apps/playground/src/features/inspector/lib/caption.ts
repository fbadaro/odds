import type { Nav } from "@odds/layout";
import type { Selection } from "../../../lib/selection";
import { relLabel, type InspectorData } from "./inspectorData";

const plural = (k: number, one: string, many: string) => `${k} ${k === 1 ? one : many}`;

/** The three caption lines at the end of the bench's `paintSel`. */
export function captionOf(nav: Nav, sel: Selection, f: InspectorData | null): { name: string; rest: string } | null {
  if (!sel) return null;
  if ("ctx" in sel) {
    const k = nav.near[sel.ctx]?.length ?? 0;
    return { name: sel.ctx, rest: ` · ${plural(k, "vizinho", "vizinhos")} · clique numa linha para ver só ela · Esc limpa` };
  }
  if ("sub" in sel) {
    const s = nav.subs[sel.sub];
    const k = s?.ids.length ?? 0;
    return { name: s?.title ?? sel.sub, rest: ` · subdomínio · ${plural(k, "contexto", "contextos")} · Esc limpa` };
  }
  return { name: relLabel(sel.rel, f), rest: " · relação" + (sel.from ? ` de ${sel.from} · Esc volta para o contexto` : " · Esc limpa") };
}
