import { Island } from "../../../components/island/Island";
import { usePlayground } from "../../../stores/playground";
import styles from "./WaitIndicator.module.css";

/** The bench's `#wait`: a new topology waits for the pause, and this says so. Always in the DOM; `on` shows it. */
export function WaitIndicator() {
  const waiting = usePlayground((s) => s.waiting);
  return (
    <Island data-feature="wait-indicator" className={waiting ? `${styles.wait} ${styles.on}` : styles.wait}>
      <span className={styles.dot} />
      topologia mudou · o mapa redesenha na pausa
    </Island>
  );
}
