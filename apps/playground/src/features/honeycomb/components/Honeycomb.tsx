import { useLayoutEffect, useRef } from "react";
import { SeverityIcon } from "../../../components/icons/SeverityIcon";
import { usePlayground } from "../../../stores/playground";
import styles from "./Honeycomb.module.css";

/**
 * The honeycomb is drawn outside React reconciliation (ADR-0014): React owns the
 * container, the SVG inside it is written as markup only when the string changes.
 */
export function Honeycomb() {
  const svg = usePlayground((s) => s.drawing?.svg ?? null);
  const stale = usePlayground((s) => s.stale);
  const layoutError = usePlayground((s) => s.layoutError);
  const mount = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = mount.current;
    if (!el) return;
    el.innerHTML = svg ?? "";
    el.querySelector("svg")?.setAttribute("preserveAspectRatio", "xMidYMid meet");
  }, [svg]);

  const isStale = svg !== null && stale;

  return (
    <div className={styles.root} data-testid="honeycomb" data-stale={isStale ? "true" : undefined} role="group" aria-label="Mapa de contextos">
      <div ref={mount} className={styles.mount} />
      {svg === null && <p className={styles.empty}>O mapa aparece quando o texto tiver uma árvore.</p>}
      {layoutError !== null && (
        <div className={`${styles.banner} ${styles.flag}`} role="status">
          <SeverityIcon severity="error" />
          <span>
            <b>Diagrama congelado.</b> O layout falhou: {layoutError}
          </span>
        </div>
      )}
      {layoutError === null && isStale && (
        <div className={styles.banner} role="status">
          <SeverityIcon severity="error" />
          <span>Erro de sintaxe — o mapa mostra o último texto válido</span>
        </div>
      )}
    </div>
  );
}
