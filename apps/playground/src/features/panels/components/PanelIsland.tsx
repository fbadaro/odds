import type { ReactNode } from "react";
import { Button } from "../../../components/button/Button";
import { Island } from "../../../components/island/Island";
import { usePlayground } from "../../../stores/playground";
import styles from "./PanelIsland.module.css";

type Props = {
  // literal em cada painel: a varredura de paridade (ADR-0020) lê o TSX
  "data-feature": "panel-code" | "panel-tree" | "panel-help";
  title: string;
  /** O painel que fica montado fechado (o de código) se esconde em vez de sair. */
  hidden?: boolean;
  sub?: ReactNode;
  foot?: ReactNode;
  bodyClassName?: string;
  children: ReactNode;
};

/** O `.i-panel` da bancada: cabeçalho (título, sub, espaço, fechar), corpo e rodapé opcional. */
export function PanelIsland({ "data-feature": feature, hidden, title, sub, foot, bodyClassName, children }: Props) {
  const closePanel = usePlayground((s) => s.closePanel);
  return (
    <Island as="section" data-feature={feature} hidden={hidden} className={styles.panel!} aria-label={title}>
      <div className={styles.head}>
        <span className={styles.title}>{title}</span>
        {sub !== undefined && <span className={styles.sub}>{sub}</span>}
        <span className={styles.grow} />
        <Button className={styles.close} aria-label="Fechar" onClick={closePanel}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </Button>
      </div>
      <div className={bodyClassName ? `${styles.body} ${bodyClassName}` : styles.body}>{children}</div>
      {foot !== undefined && <div className={styles.foot}>{foot}</div>}
    </Island>
  );
}
