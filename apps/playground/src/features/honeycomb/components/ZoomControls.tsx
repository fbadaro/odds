import { Button } from "../../../components/button/Button";
import { Island } from "../../../components/island/Island";
import { Tooltip } from "../../../components/ui/Tooltip";
import { usePlayground } from "../../../stores/playground";
import styles from "./ZoomControls.module.css";

/** A ilha de zoom: afastar, a porcentagem, aproximar e o mapa inteiro. */
export function ZoomControls() {
  const zoomPct = usePlayground((s) => s.zoomPct);
  const commandCamera = usePlayground((s) => s.commandCamera);
  return (
    <Island data-feature="zoom-controls" className={styles.zoom}>
      <Button aria-label="Afastar" onClick={() => commandCamera("out")}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M3.5 8h9" /></svg>
      </Button>
      <span className={styles.pct}>{zoomPct}%</span>
      <Button aria-label="Aproximar" onClick={() => commandCamera("in")}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M3.5 8h9M8 3.5v9" /></svg>
      </Button>
      <span className={styles.vsep} />
      <Tooltip label="Mapa inteiro (0)">
        <Button aria-label="Mapa inteiro" onClick={() => commandCamera("fit")}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M2.5 6V2.5H6M10 2.5h3.5V6M13.5 10v3.5H10M6 13.5H2.5V10" /></svg>
        </Button>
      </Tooltip>
    </Island>
  );
}
