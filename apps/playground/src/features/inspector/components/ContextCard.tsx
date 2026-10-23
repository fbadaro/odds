import type { Nav, TargetedDiagnostic } from "@odds/layout";
import { usePlayground } from "../../../stores/playground";
import { roleText, type DocInfo, type Ficha } from "../lib/ficha";
import card from "./Card.module.css";
import styles from "./ContextCard.module.css";
import { DocProps, hasDoc } from "./DocProps";
import { CtxLink, LineLink, SubLink, Tags } from "./Links";
import { Verdict } from "./Verdict";

/** What touches a context: its tile, one of its ports, or a relation it is an end of. */
const touches = (d: TargetedDiagnostic, id: string) =>
  ("ctx" in d.target && d.target.ctx === id) || ("rk" in d.target && d.target.rk.split("|").includes(id));

/** The bench's context panel: title, home, verdict, contract, properties and the fence. */
export function ContextCard({ id, f, nav, markers }: { id: string; f: Ficha; nav: Nav; markers: TargetedDiagnostic[] }) {
  const clickRelation = usePlayground((s) => s.clickRelation);
  const home = nav.ctxSub[id], hs = home ? nav.subs[home] : undefined, cd: Partial<DocInfo> = f.ctx[id] ?? {};
  const mine = Object.values(f.rels).filter((r) => r.l === id || r.r === id).sort((a, b) => a.line - b.line);
  const verdict = markers.filter((d) => touches(d, id));
  return (
    <div>
      <div className={card.kind}>context</div>
      <h4 className={card.name}>{id}</h4>
      {cd.title && <div className={`${card.title} ${card.big}`}>{cd.title}</div>}
      <div className={card.meta}>
        {home && hs ? <><SubLink sub={home} /> · {hs.type}</> : "fora do domínio"}
        <br />
        {f.dom}
        {cd.line ? <> · <LineLink line={cd.line} /></> : null}
      </div>
      {verdict.length > 0 && (
        <>
          <div className={card.sect} data-sect>Veredito</div>
          {verdict.map((d, i) => <Verdict key={i} d={d} />)}
        </>
      )}
      <div className={card.sect} data-sect>Contrato</div>
      {mine.length ? (
        mine.map((r) => (
          <div key={r.rk} className={styles.rel} data-rel={r.rk}>
            <CtxLink id={r.l} plain />{" "}
            {r.lt.length > 0 && <><Tags tags={r.lt} />{" "}</>}
            {r.c}
            {r.rt.length > 0 && <>{" "}<Tags tags={r.rt} /></>}{" "}
            <CtxLink id={r.r} plain />
            <button type="button" className={styles.relgo} data-gorel={r.rk} onClick={() => clickRelation(r.rk)}>
              {roleText(r, id)} ›
            </button>
          </div>
        ))
      ) : (
        <div className={card.none}>Nenhuma relação no mapping.</div>
      )}
      <div className={card.sect} data-sect>Propriedades</div>
      {hasDoc(cd) ? <DocProps d={cd} /> : <div className={card.nofill}>Nenhuma propriedade declarada.</div>}
      <div className={card.fence} data-fence>
        Propriedade é <b>documentação</b>, tag é <b>contrato</b>. Nenhuma propriedade alimenta o gatilho de uma regra.
      </div>
    </div>
  );
}
