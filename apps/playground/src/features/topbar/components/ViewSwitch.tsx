import { Island } from "../../../components/island/Island";
import { ToggleGroup } from "../../../components/ui/ToggleGroup";
import { usePlayground } from "../../../stores/playground";
import styles from "./ViewSwitch.module.css";

const ITEMS = [
  { value: "flow" as const, label: "Fluxo" },
  { value: "contain" as const, label: "Contenção" },
];

/** A ilha da vista da bancada (.i-view): fluxo ou contenção. */
export function ViewSwitch() {
  const view = usePlayground((s) => s.view.view);
  const setView = usePlayground((s) => s.setView);
  return (
    <Island data-feature="view-switch" className={styles.view}>
      <ToggleGroup value={view} onValueChange={setView} items={ITEMS} className={styles.group} aria-label="Vista" />
    </Island>
  );
}
