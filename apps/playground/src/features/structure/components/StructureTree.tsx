import type { ContextNode, ProgramNode } from "@odds/core";
import type { MouseEvent } from "react";
import { SeverityIcon, type Severity } from "../../../components/icons/SeverityIcon";
import { pairKey } from "../../../lib/selection";
import { usePlayground } from "../../../stores/playground";
import { sevMarks } from "../lib/sevMarks";
import styles from "./StructureTree.module.css";

const TYPES = ["core", "supporting", "generic"];

function Chev({ shut }: { shut: boolean }) {
  return (
    <svg className={shut ? `${styles.chev} ${styles.shut}` : styles.chev} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <path d="M3 4.5l3 3 3-3" />
    </svg>
  );
}

function Sev({ s }: { s: Severity | undefined }) {
  if (!s) return null;
  return (
    <span className={styles.sev}>
      <SeverityIcon severity={s} label={s} />
    </span>
  );
}

/** Chave de React pela posição no texto: nomes repetidos são entrada válida (DUPLICATE_*). */
const at = (n: { span: { start: { line: number; column: number } } }) => `${n.span.start.line}:${n.span.start.column}`;

/** A linha de um contexto na AST; leva à linha dele quando não está no mapa. */
function lineOfContext(ast: ProgramNode, name: string): number {
  for (const d of ast.domains) {
    const all: ContextNode[] = [...d.subdomains.flatMap((s) => s.contexts), ...(d.external?.contexts ?? [])];
    const c = all.find((x) => x.name === name);
    if (c) return c.span.start.line;
  }
  return 1;
}

/** A árvore sai da AST do texto, não do mapa: mostra o que está escrito, inclusive o que o mapa não desenha. */
export function StructureTree({ shut, onToggle }: { shut: ReadonlySet<string>; onToggle: (key: string) => void }) {
  const ast = usePlayground((s) => s.ast);
  const markers = usePlayground((s) => s.markers);
  const selection = usePlayground((s) => s.selection);
  const hover = usePlayground((s) => s.hover);
  const setHover = usePlayground((s) => s.setHover);

  if (!ast) return <div className={styles.empty}>O texto ainda não tem estrutura.</div>;

  const m = sevMarks(markers);
  const onCtx = (n: string) => !!selection && "ctx" in selection && selection.ctx === n;
  const onSub = (k: string) => !!selection && "sub" in selection && selection.sub === k;
  const onRel = (k: string) => !!selection && "rel" in selection && selection.rel === k;

  const click = (ev: MouseEvent<HTMLDivElement>) => {
    const t = ev.target as HTMLElement;
    const tog = t.closest<HTMLElement>("[data-tog]");
    if (tog) return onToggle(tog.dataset.tog!);
    const b = t.closest<HTMLElement>("[data-ctx],[data-sub],[data-rel]");
    const { drawing, select, revealLine } = usePlayground.getState();
    if (!b || !drawing) return;
    const { nav } = drawing;
    if (b.dataset.ctx) {
      if (nav.tiles[b.dataset.ctx]) select({ ctx: b.dataset.ctx }, true);
      else revealLine(lineOfContext(ast, b.dataset.ctx));
    } else if (b.dataset.sub) {
      if (nav.subs[b.dataset.sub]) select({ sub: b.dataset.sub }, true);
    } else if (b.dataset.rel) {
      if (nav.relOf[b.dataset.rel]) select({ rel: b.dataset.rel, from: null }, true);
      else revealLine(Number(b.dataset.line));
    }
  };
  const over = (ev: MouseEvent<HTMLDivElement>) => {
    const key = (ev.target as HTMLElement).closest<HTMLElement>("[data-sub]")?.dataset.sub ?? null;
    if (key !== hover) setHover(key);
  };

  const ctxRow = (c: ContextNode) => (
    <button key={at(c)} type="button" className={`${styles.tw} ${styles.d2}`} data-ctx={c.name} data-on={onCtx(c.name)}>
      <span className={styles.nm}>{c.name}</span>
      <span className={styles.grow} />
      <Sev s={m.ctx[c.name]} />
    </button>
  );

  return (
    <div onClick={click} onPointerOver={over} onPointerLeave={() => hover && setHover(null)}>
      {ast.domains.map((d) => {
        const dk = "d:" + d.name;
        const rels = d.mapping ? d.mapping.relationships : [];
        return (
          <div key={at(d)}>
            <div className={styles.sec}>
              <h5>Domínio</h5>
              <button type="button" className={styles.tw} data-tog={dk}>
                <Chev shut={shut.has(dk)} />
                <span className={`${styles.nm} ${styles.t}`}><b>{d.title || d.name}</b></span>
                <span className={styles.badge}>domain</span>
              </button>
              {!shut.has(dk) && (
                <>
                  {d.subdomains.map((sd) => {
                    const key = d.name + "/" + sd.name;
                    const sk = "s:" + key;
                    const ty = TYPES.includes(sd.subdomainType) ? sd.subdomainType : "";
                    return (
                      <div key={at(sd)} style={{ display: "contents" }}>
                        <button type="button" className={`${styles.tw} ${styles.d1}`} data-sub={key} data-on={onSub(key)}>
                          <span data-tog={sk}><Chev shut={shut.has(sk)} /></span>
                          <span className={styles.nm}>{sd.name}</span>
                          <span className={styles.badge} data-type={ty}>{sd.subdomainType || "?"}</span>
                          {sd.owner && <span className={styles.own}>{sd.owner}</span>}
                          <span className={styles.grow} />
                          <Sev s={m.sub[key]} />
                        </button>
                        {!shut.has(sk) && sd.contexts.map(ctxRow)}
                      </div>
                    );
                  })}
                  {d.external && d.external.contexts.length > 0 && (
                    <>
                      <button type="button" className={`${styles.tw} ${styles.d1}`} data-tog={"e:" + d.name}>
                        <Chev shut={shut.has("e:" + d.name)} />
                        <span className={styles.nm}>external</span>
                      </button>
                      {!shut.has("e:" + d.name) && d.external.contexts.map(ctxRow)}
                    </>
                  )}
                </>
              )}
            </div>
            <div className={styles.sec}>
              <h5>Relações <small>{rels.length}</small></h5>
              {rels.map((r) => {
                const rk = pairKey(r.left, r.right);
                return (
                  <button key={at(r)} type="button" className={styles.tw} data-rel={rk} data-line={r.span.start.line} data-on={onRel(rk)}>
                    <span className={styles.rl}>{r.left} {r.connector} {r.right}</span>
                    <span className={styles.grow} />
                    <Sev s={m.rel[rk]} />
                  </button>
                );
              })}
              {rels.length === 0 && <div className={styles.empty}>Nenhuma relação no mapping.</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
