import type { ReactNode } from "react";
import { Island } from "../../../components/island/Island";
import { usePlayground, type PanelName } from "../../../stores/playground";
import styles from "./Rail.module.css";

const SQUARES: { name: PanelName; label: string; icon: ReactNode }[] = [
  { name: "code", label: "Código", icon: <path d="M5.5 4.5L2 8l3.5 3.5M10.5 4.5L14 8l-3.5 3.5" /> },
  {
    name: "tree",
    label: "Estrutura",
    icon: (
      <>
        <rect x="2" y="2" width="5" height="4" rx="1" />
        <rect x="9" y="7" width="5" height="3" rx="1" />
        <rect x="9" y="11.5" width="5" height="3" rx="1" />
        <path d="M4.5 6v7h4.5M4.5 8.5h4.5" />
      </>
    ),
  },
  {
    name: "help",
    label: "Como ler",
    icon: (
      <>
        <circle cx="8" cy="8" r="6" />
        <path d="M6.3 6.2a1.8 1.8 0 113 1.4c-.8.5-1.3.9-1.3 1.9" />
        <circle cx="8" cy="11.6" r=".5" fill="currentColor" />
      </>
    ),
  },
];

/** O trilho da bancada: uma ilha de quadrados, um painel por vez; o mesmo quadrado fecha. */
export function Rail() {
  const openPanel = usePlayground((s) => s.openPanel);
  const togglePanel = usePlayground((s) => s.togglePanel);
  return (
    <Island as="nav" className={styles.rail} data-feature="rail" aria-label="Painéis">
      {SQUARES.map((q) => (
        <button
          key={q.name}
          type="button"
          className={styles.sq}
          aria-pressed={openPanel === q.name}
          title={q.label}
          aria-label={q.label}
          onClick={() => togglePanel(q.name)}
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            {q.icon}
          </svg>
        </button>
      ))}
    </Island>
  );
}
