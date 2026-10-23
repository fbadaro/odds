import type { Nav } from "@odds/layout";
import { usePlayground } from "../../../stores/playground";
import type { Ficha } from "../lib/ficha";
import card from "./Card.module.css";
import styles from "./SubdomainCard.module.css";
import { SubProp } from "./DocProps";
import { LineLink } from "./Links";

const plural = (k: number, one: string, many: string) => `${k} ${k === 1 ? one : many}`;

/** The bench's subdomain panel: type and title, description and owner, the derived tally and its contexts. */
export function SubdomainCard({ sub, f, nav }: { sub: string; f: Ficha; nav: Nav }) {
  const select = usePlayground((s) => s.select);
  const s = nav.subs[sub];
  if (!s) return null;
  const ids = s.ids, key = sub.split("/")[1]!, sd = f.sub[sub];
  let inside = 0, crossing = 0;
  const deg: Record<string, number> = {};
  for (const r of Object.values(f.rels)) {
    const a = ids.includes(r.l), b = ids.includes(r.r);
    if (a && b) inside++;
    else if (a || b) crossing++;
    deg[r.l] = (deg[r.l] ?? 0) + 1;
    deg[r.r] = (deg[r.r] ?? 0) + 1;
  }
  return (
    <div>
      <div className={card.kind}>subdomain</div>
      <h4 className={card.name}>{key}</h4>
      <div className={card.meta}>
        <b>{s.type}</b>
        {sd?.title && sd.title !== key && <> · <span className={card.pv}>{sd.title}</span></>}
        <br />
        {f.dom}
        {sd?.line ? <> · <LineLink line={sd.line} /></> : null}
      </div>
      {sd?.description && <SubProp k="description" v={sd.description} />}
      {sd?.owner && <SubProp k="owner" v={sd.owner} />}
      <div className={card.sect} data-sect>Derivado</div>
      <div className={styles.tally} data-tally>
        <span>{plural(ids.length, "contexto", "contextos")}</span>
        <span>{plural(inside, "interna", "internas")}</span>
        <span>{crossing} {crossing === 1 ? "atravessa" : "atravessam"} a fronteira</span>
      </div>
      <div className={card.sect} data-sect>Contextos</div>
      {ids.map((id) => (
        <button key={id} type="button" className={styles.ctxrow} data-ctxrow={id} onClick={() => select({ ctx: id }, true)}>
          <span className={styles.nm}>{id}</span>
          <span className={styles.cnt}>{deg[id] ?? 0} rel.</span>
        </button>
      ))}
    </div>
  );
}
