import type { TargetedDiagnostic } from "@odds/layout";
import { SeverityIcon } from "../../../components/icons/SeverityIcon";
import { Prose } from "../../../components/prose/Prose";
import { LineLink } from "./Links";
import styles from "./Verdict.module.css";

/** The bench's `vd`: one diagnostic, with its icon, its sentence, its code and the `L:C` that reveals it. */
export function Verdict({ d }: { d: TargetedDiagnostic }) {
  const { line, column } = d.span.start;
  return (
    <div className={styles.vd} data-verdict={d.code}>
      <span className={styles.icon}>
        <SeverityIcon severity={d.severity} label={d.severity} />
      </span>
      <span>
        <Prose d={d} />
        <span className={styles.c}>
          {d.code} · <LineLink line={line}>L{line}:{column}</LineLink>
        </span>
      </span>
    </div>
  );
}
