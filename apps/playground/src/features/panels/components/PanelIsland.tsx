import type { ReactNode } from "react";
import { Button } from "../../../components/button/Button";
import { Island } from "../../../components/island/Island";
import { usePlayground } from "../../../stores/playground";
import styles from "./PanelIsland.module.css";

type Props = {
  feature: "panel-code" | "panel-tree" | "panel-help";
  title: string;
  sub?: ReactNode;
  foot?: ReactNode;
  bodyClassName?: string;
  children: ReactNode;
};

type Shell = (p: { className: string; "aria-label": string; children: ReactNode }) => ReactNode;

// A varredura de paridade (ADR-0020) lê o literal no TSX; só o painel portado o declara.
const SHELL: Record<Props["feature"], Shell> = {
  "panel-code": (p) => <Island as="section" data-feature="panel-code" {...p} />,
  // Tasks 9 e 10: troque a linha pelo literal quando o painel for portado (some do PENDING junto)
  "panel-tree": (p) => <Island as="section" {...{ "data-feature": "panel-tree" }} {...p} />,
  "panel-help": (p) => <Island as="section" {...{ "data-feature": "panel-help" }} {...p} />,
};

/** O `.i-panel` da bancada: cabeçalho (título, sub, espaço, fechar), corpo e rodapé opcional. */
export function PanelIsland({ feature, title, sub, foot, bodyClassName, children }: Props) {
  const closePanel = usePlayground((s) => s.closePanel);
  return SHELL[feature]({
    className: styles.panel!,
    "aria-label": title,
    children: (
      <>
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
      </>
    ),
  });
}
