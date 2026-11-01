import { Select as BaseSelect } from "@base-ui/react/select";
import styles from "./Select.module.css";

export interface SelectItem {
  value: string;
  label: string;
  /** A muted word after the label (where the item lives). */
  hint?: string;
}

type Props = {
  label: string;
  value: string | null;
  onValueChange: (value: string) => void;
  items: SelectItem[];
  placeholder: string;
};

/** One choice from a list, with a visible label; the popup lists every item. */
export function Select({ label, value, onValueChange, items, placeholder }: Props) {
  const byValue = Object.fromEntries(items.map((i) => [i.value, i.label]));
  return (
    <div className={styles.field}>
      <BaseSelect.Root value={value} onValueChange={(v) => v !== null && onValueChange(String(v))} items={byValue}>
        <BaseSelect.Label className={styles.label}>{label}</BaseSelect.Label>
        <BaseSelect.Trigger className={styles.trigger}>
          <BaseSelect.Value className={styles.value} placeholder={placeholder} />
          <BaseSelect.Icon className={styles.icon}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M4 6l4 4 4-4" />
            </svg>
          </BaseSelect.Icon>
        </BaseSelect.Trigger>
        <BaseSelect.Portal>
          <BaseSelect.Positioner className={styles.positioner} sideOffset={4} alignItemWithTrigger={false}>
            <BaseSelect.Popup className={styles.popup}>
              <BaseSelect.List>
                {items.map((i) => (
                  <BaseSelect.Item key={i.value} value={i.value} className={styles.item}>
                    <BaseSelect.ItemText>{i.label}</BaseSelect.ItemText>
                    {i.hint && <small>{i.hint}</small>}
                  </BaseSelect.Item>
                ))}
              </BaseSelect.List>
            </BaseSelect.Popup>
          </BaseSelect.Positioner>
        </BaseSelect.Portal>
      </BaseSelect.Root>
    </div>
  );
}
