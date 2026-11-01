import { Field as BaseField } from "@base-ui/react/field";
import type { ReactNode } from "react";
import styles from "./Field.module.css";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Shown under the field, and marks it invalid. */
  error?: string | null | undefined;
  /** A line about what goes here. */
  hint?: ReactNode;
  /** One entry per line (a list). */
  multiline?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  /** A code-like value (an identifier): monospace. */
  code?: boolean;
};

/** A labelled text field, with its hint and its error read by assistive technology. */
export function Field({ label, value, onChange, error, hint, multiline = false, placeholder, autoFocus, code = false }: Props) {
  const cls = code ? `${styles.control} ${styles.code}` : styles.control;
  return (
    <BaseField.Root invalid={!!error} className={styles.field}>
      <BaseField.Label className={styles.label}>{label}</BaseField.Label>
      <BaseField.Control
        className={cls}
        value={value}
        onValueChange={(v) => onChange(String(v))}
        placeholder={placeholder}
        autoFocus={autoFocus}
        spellCheck={false}
        autoComplete="off"
        render={multiline ? <textarea rows={3} /> : undefined}
      />
      {hint && <BaseField.Description className={styles.hint}>{hint}</BaseField.Description>}
      {error && (
        <BaseField.Error className={styles.error} match>
          {error}
        </BaseField.Error>
      )}
    </BaseField.Root>
  );
}

/** A label over something that is not a text field (a group of choices). */
export function FieldGroup({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className={styles.field} role="group" aria-label={label}>
      <span className={styles.label}>{label}</span>
      {children}
      {hint && <span className={styles.hint}>{hint}</span>}
    </div>
  );
}
