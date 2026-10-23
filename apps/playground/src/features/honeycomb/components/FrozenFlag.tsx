import { Island } from "../../../components/island/Island";
import { SeverityIcon } from "../../../components/icons/SeverityIcon";
import { usePlayground, type PlaygroundState } from "../../../stores/playground";
import styles from "./FrozenFlag.module.css";

/** The bench's showFlag: the last one written wins. A layout failure is cleared by every new text,
 *  so one present over a syntax error came after it (a pending layout that landed and failed). */
const messageOf = (s: PlaygroundState): string => {
  if (s.layoutError !== null) return `O layout falhou: ${s.layoutError}`;
  const d = s.analysis.astGenerated ? undefined : s.analysis.diagnostics[0];
  return d ? `Erro de sintaxe em L${d.span.start.line}:${d.span.start.column}; o mapa mostra o último texto válido.` : "";
};

/** The bench's `#flag`: over the map, outside it; in the DOM always, hidden while the map is fresh. */
export function FrozenFlag() {
  const msg = usePlayground(messageOf);
  return (
    <Island data-feature="frozen-flag" role="status" className={styles.flag} hidden={!msg}>
      <SeverityIcon severity="error" />
      <span>
        <b>Diagrama congelado.</b> <span>{msg}</span>
      </span>
    </Island>
  );
}
