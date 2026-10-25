import { Button } from "../../../components/button/Button";
import { usePlayground } from "../../../stores/playground";
import styles from "./Actions.module.css";

/* Compartilhar é só o lugar do botão: o formato do link é decisão em aberto (PRD §4). */
const OPEN_DECISION =
  "Compartilhar ainda é só o lugar do botão: o formato do link, com o texto e a versão da linguagem na URL, é decisão em aberto.";

export function ShareButton() {
  const showToast = usePlayground((s) => s.showToast);
  return (
    <Button variant="primary" data-feature="share" className={styles.share} onClick={() => showToast(OPEN_DECISION)}>
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M8 10V2.5M5 5l3-3 3 3M3 8.5V13h10V8.5" />
      </svg>
      <span className={styles.lbl}>Compartilhar</span>
    </Button>
  );
}
