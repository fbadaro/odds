import { SeverityIcon, type Severity } from "../../../components/icons/SeverityIcon";
import { usePlayground } from "../../../stores/playground";
import styles from "./SeverityCounters.module.css";

const SEVERITIES: readonly Severity[] = ["error", "warning", "info"];

const LABEL: Record<Severity, readonly [string, string]> = {
  error: ["erro", "erros"],
  warning: ["aviso", "avisos"],
  info: ["informação", "informações"],
};

/** "1 erro", "2 erros", "0 avisos": the severity and the number, singular only for exactly one. */
const labelOf = (severity: Severity, n: number) => `${n} ${LABEL[severity][n === 1 ? 0 : 1]}`;

export function SeverityCounters() {
  const counts = usePlayground((s) => s.analysis.counts);
  return (
    <div className={styles.row}>
      {SEVERITIES.map((s) => (
        <span key={s} role="img" aria-label={labelOf(s, counts[s])} className={styles.counter} data-severity={s}>
          <SeverityIcon severity={s} />
          <span className={styles.count}>{counts[s]}</span>
        </span>
      ))}
    </div>
  );
}
