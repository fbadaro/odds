import styles from "./SeverityIcon.module.css";

export type Severity = "error" | "warning" | "info";

type Props = {
  severity: Severity;
  /** Names the icon for assistive tech (the bench's tree and inspector); without it, the icon is decoration beside a text that says it. */
  label?: string;
};

/**
 * The bench's `sevIcon`: a filled glyph in the functional color, the mark cut out in the
 * surface color — circled X, triangle with !, circled i. The same glyph the map draws.
 * 1em square: the caller sizes it.
 */
export function SeverityIcon({ severity, label }: Props) {
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true };
  return (
    <svg data-icon={severity} viewBox="-8 -8 16 16" width="1em" height="1em" {...a11y}>
      {severity === "error" && (
        <g className={styles.error}>
          <circle className={styles.bg} r="6.5" />
          <path className={styles.fg} d="M-2.7 -2.7L2.7 2.7M2.7 -2.7L-2.7 2.7" />
        </g>
      )}
      {severity === "warning" && (
        <g className={styles.warning}>
          <path className={styles.bg} d="M0 -6.5L7 5.5L-7 5.5Z" />
          <path className={styles.fg} d="M0 -2L0 1.3" />
          <circle className={styles.dot} cx="0" cy="3.4" r="0.9" />
        </g>
      )}
      {severity === "info" && (
        <g className={styles.info}>
          <circle className={styles.bg} r="6.5" />
          <circle className={styles.dot} cx="0" cy="-2.7" r="0.9" />
          <path className={styles.fg} d="M0 -0.3L0 3.2" />
        </g>
      )}
    </svg>
  );
}
