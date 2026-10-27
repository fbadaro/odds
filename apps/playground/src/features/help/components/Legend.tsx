import { usePlayground } from "../../../stores/playground";
import { legendOf } from "../lib/legend";
import styles from "./Legend.module.css";

/** A legenda sai do mapa atual (`nav`), não de um texto fixo. */
export function Legend() {
  const nav = usePlayground((s) => s.drawing?.nav);
  if (!nav) return <div className={styles.leg} id="legend" />;
  const { types, external } = legendOf(nav);
  return (
    <div className={styles.leg} id="legend">
      {types.map(({ type, count }) => (
        <div className={styles.row} key={type}>
          <span className={`${styles.sw} ${styles[type]}`} />
          <span>
            <b>{type}</b> · {count} subdomínio{count === 1 ? "" : "s"}
          </span>
        </div>
      ))}
      {external > 0 && (
        <div className={styles.row}>
          <span className={`${styles.sw} ${styles.external}`} />
          <span>
            <b>external</b> · {external} · fora da água territorial
          </span>
        </div>
      )}
      <div className={`${styles.row} ${styles.sep}`}>
        <svg width="54" height="14" viewBox="0 0 54 14">
          <path d="M4 7 H44" stroke="rgb(var(--c-edge))" strokeWidth="1.6" />
          <path d="M50 7 L41 11.4 L41 2.6 Z" fill="rgb(var(--c-edge))" />
        </svg>
        <span>
          A seta aponta para o <b>downstream</b>.
        </span>
      </div>
      <div className={styles.row}>
        <svg width="54" height="14" viewBox="0 0 54 14">
          <path d="M4 7 H50" stroke="rgb(var(--c-edge-lit))" strokeWidth="2" strokeDasharray="7 5" />
        </svg>
        <span>
          Relação <b>acesa</b>: tracejado correndo do upstream para o downstream.
        </span>
      </div>
      <div className={styles.row}>
        <svg width="54" height="14" viewBox="0 0 54 14">
          <path d="M4 7 H50" stroke="rgb(var(--c-error))" strokeWidth="1.8" strokeDasharray="6 4" />
        </svg>
        <span>
          Relação <b>inválida</b>: tracejado vermelho e parado.
        </span>
      </div>
      <div className={styles.row}>
        <svg width="54" height="20" viewBox="0 0 54 20">
          <path d="M2 2 L14 2 L20 10 L14 18 L2 18" fill="none" stroke="rgb(var(--c-ink-mute))" strokeWidth="1.2" />
          <rect x="22" y="3" width="30" height="14" rx="6" fill="rgb(var(--c-surface))" stroke="rgb(var(--c-edge) / .75)" />
          <text x="37" y="10.5" fontSize="8.5" fill="rgb(var(--c-ink))" textAnchor="middle" dominantBaseline="central">
            ACL
          </text>
        </svg>
        <span>
          A tag fica <b>encostada no lado</b> da peça a que pertence.
        </span>
      </div>
    </div>
  );
}
