import type { TargetedDiagnostic } from "@odds/layout";
import { SeverityIcon } from "../../../components/icons/SeverityIcon";
import { Prose } from "../../../components/prose/Prose";
import styles from "./DiagnosticRow.module.css";

/** The bench's `.drow`: icon, code chip, sentence and `L:C`, one button that leads to the target and the text. */
export function DiagnosticRow({ d, onClick }: { d: TargetedDiagnostic; onClick: () => void }) {
  return (
    <button type="button" className={styles.row} data-code={d.code} onClick={onClick}>
      <SeverityIcon severity={d.severity} />
      <span className={`${styles.code} ${styles[d.severity]}`}>{d.code}</span>
      <span className={styles.msg}>
        <Prose d={d} />
      </span>
      <span className={styles.sp}>
        L{d.span.start.line}:{d.span.start.column}
      </span>
    </button>
  );
}
