import { Island } from "../../../components/island/Island";
import { usePlayground } from "../../../stores/playground";
import { captionOf } from "../lib/caption";
import { useFicha } from "../useFicha";
import styles from "./SelectionCaption.module.css";

/** The bench's `#selCap`: what is selected, in one short line; hidden over a frozen map, as `.pg-map.frozen ~ .i-cap` is. */
export function SelectionCaption() {
  const selection = usePlayground((s) => s.selection);
  const nav = usePlayground((s) => s.drawing?.nav ?? null);
  const stale = usePlayground((s) => s.stale);
  const f = useFicha();
  const cap = nav && !stale ? captionOf(nav, selection, f) : null;
  if (!cap) return null;
  return (
    <Island data-feature="selection-caption" aria-live="polite" className={styles.cap}>
      <b>{cap.name}</b>
      {cap.rest}
    </Island>
  );
}
