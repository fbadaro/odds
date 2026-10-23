import type { Nav, TargetedDiagnostic } from "@odds/layout";
import { FORMS, TAGS } from "../lib/glossary";
import { relLabel, type DocInfo, type Ficha } from "../lib/ficha";
import card from "./Card.module.css";
import styles from "./RelationCard.module.css";
import { DocProps, hasDoc } from "./DocProps";
import { CtxLink, LineLink, SubLink, Tags } from "./Links";
import { Verdict } from "./Verdict";

type Home = [string | null, Nav["subs"][string] | null];
const homeOf = (nav: Nav, id: string): Home => {
  const k = nav.ctxSub[id];
  return k && nav.subs[k] ? [k, nav.subs[k]] : [null, null];
};
const nameOf = (key: string) => key.split("/")[1];

/** The bench's `sideHtml`: one end of the relation, its role, its tags read from the glossary, and its documentation. */
function Side({ id, role, tags, f, nav }: { id: string; role: string; tags: string[]; f: Ficha; nav: Nav }) {
  const d: Partial<DocInfo> = f.ctx[id] ?? {}, [home, hs] = homeOf(nav, id), type = hs ? hs.type : "external";
  return (
    <div className={styles.side} data-side={id} data-type={type}>
      <div className={styles.head}>
        <span className={styles.role}>{role}</span>
        <CtxLink id={id} className={styles.who} />
      </div>
      {d.title && <div className={card.title}>{d.title}</div>}
      <div className={styles.meta}>{home ? <><SubLink sub={home} plain /> · {type}</> : "fora do domínio"}</div>
      {tags.length ? (
        tags.map((t, i) => {
          const T = TAGS[t] ?? [t, ""];
          return (
            <div key={i} className={styles.tagrow}>
              <span className={styles.chip}>{t}</span>
              <span><b>{T[0]}</b> · {T[1]}</span>
            </div>
          );
        })
      ) : (
        <div className={card.nofill}>Nenhuma tag declarada deste lado.</div>
      )}
      {hasDoc(d) ? <div className={styles.doc}><DocProps d={d} /></div> : <div className={card.nofill}>Sem documentação declarada.</div>}
    </div>
  );
}

/** The bench's `relPanel`: the way back, the form, the source line, verdict, boundary, both sides and the fence. */
export function RelationCard({ rk, from, f, nav, markers }: { rk: string; from: string | null; f: Ficha; nav: Nav; markers: TargetedDiagnostic[] }) {
  const r = f.rels[rk];
  if (!r) return <div className={styles.empty}>A relação <code>{rk}</code> não está mais no texto.</div>;
  const form = FORMS[r.c], [subL, sL] = homeOf(nav, r.l), [subR, sR] = homeOf(nav, r.r);
  const dir = r.c === "-->" || r.c === "<--", upLeft = r.c === "-->";
  const verdict = markers.filter((d) => "rk" in d.target && d.target.rk === rk);
  const mutual = r.c === "<->" ? "par" : "lado";
  const sides: [string, string, string[]][] = dir
    ? upLeft ? [[r.l, "upstream", r.lt], [r.r, "downstream", r.rt]] : [[r.r, "upstream", r.rt], [r.l, "downstream", r.lt]]
    : [[r.l, mutual, r.lt], [r.r, mutual, r.rt]];
  return (
    <div>
      {from && <CtxLink id={from} className={styles.back}>← contrato de {from}</CtxLink>}
      <div className={card.kind}>relationship</div>
      <h4 className={card.name}>{relLabel(rk, f)}</h4>
      <div className={card.meta}><b>{form[0]}</b> · {form[1]}</div>
      <div className={styles.relsrc} data-relsrc>
        {r.l} {r.lt.length > 0 && <><Tags tags={r.lt} />{" "}</>}
        {r.c}
        {r.rt.length > 0 && <>{" "}<Tags tags={r.rt} /></>} {r.r}
        <span className={styles.src}><LineLink line={r.line} /></span>
      </div>
      <div className={card.sect} data-sect>Veredito</div>
      {verdict.length ? verdict.map((d, i) => <Verdict key={i} d={d} />) : <div className={card.nofill}>Nenhum diagnóstico nesta relação.</div>}
      <div className={card.sect} data-sect>Fronteira</div>
      <div className={card.nofill}>
        {subL && subL === subR ? (
          <>Dentro de <b>{nameOf(subL)}</b>.</>
        ) : !sL || !sR || !subL || !subR ? (
          <>Com um sistema <b>externo</b>, fora do domínio: o contrato do outro lado não é seu.</>
        ) : (
          <>Atravessa a fronteira: <b>{nameOf(subL)}</b> ({sL.type}) e <b>{nameOf(subR)}</b> ({sR.type}).</>
        )}
      </div>
      <div className={card.sect} data-sect>Os dois lados</div>
      {sides.map(([id, role, tags]) => <Side key={id} id={id} role={role} tags={tags} f={f} nav={nav} />)}
      <div className={card.fence} data-fence>
        A <b>tag</b> é o contrato que o validador confere. A <b>documentação</b> é contexto para quem lê, e nenhuma regra a julga.
      </div>
    </div>
  );
}
