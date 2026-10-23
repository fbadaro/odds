import type { SourceSpan } from "@odds/core";
import type { TargetedDiagnostic } from "@odds/layout";
import { useLayoutEffect, useRef } from "react";
import { Button } from "../../../components/button/Button";
import { Island } from "../../../components/island/Island";
import { SeverityIcon, type Severity } from "../../../components/icons/SeverityIcon";
import { targetSelection } from "../../../lib/selection";
import { usePlayground, type PanelName } from "../../../stores/playground";
import { DiagnosticRow } from "./DiagnosticRow";
import styles from "./DiagnosticsDock.module.css";

const SEVERITIES: readonly Severity[] = ["error", "warning", "info"];
const PLURAL: Record<Severity, string> = { error: "erros", warning: "avisos", info: "infos" };

const same = (a: SourceSpan, b: SourceSpan) =>
  a.start.line === b.start.line && a.start.column === b.start.column && a.end.line === b.end.line && a.end.column === b.end.column;

/** The diagnostic leads to both places: to its target on the map, when it has one there, and to its stretch of text. */
function go(d: TargetedDiagnostic) {
  const { markers, drawing, select, revealInEditor } = usePlayground.getState();
  // the current list may be a syntax error's; the targets are the last tree's (the bench's lastDiags)
  const t = markers.find((x) => same(x.span, d.span) && x.code === d.code);
  const sel = t && drawing ? targetSelection(t.target, drawing.nav) : null;
  if (sel) select(sel, true);
  revealInEditor(d.span.start, d.span.end);
}

/** The bench's layoutDock: centred in the free space between the open panel (or the rail) and the zoom. */
function layoutDock(dock: HTMLElement, panel: PanelName | null) {
  const w = window.innerWidth;
  if (w <= 760) {
    dock.style.removeProperty("--dl");
    dock.style.removeProperty("--dr");
    return;
  }
  const left = (panel && document.querySelector(`[data-feature="panel-${panel}"]`)) || document.querySelector('[data-feature="rail"]');
  const zoom = document.querySelector('[data-feature="zoom-controls"]');
  if (!left || !zoom) return;
  dock.style.setProperty("--dl", left.getBoundingClientRect().right + 16 + "px");
  dock.style.setProperty("--dr", w - zoom.getBoundingClientRect().left + 16 + "px");
}

/**
 * The bench's diagnostics footer (`diagPanel`): a fixed place, never behind a toggle. The
 * header with the counters is always in sight; only the list collapses. The counters filter;
 * three rows in sight, and "ver os N" opens the rest.
 */
export function DiagnosticsDock() {
  const diagnostics = usePlayground((s) => s.analysis.diagnostics);
  const counts = usePlayground((s) => s.analysis.counts);
  const filters = usePlayground((s) => s.filters);
  const listOpen = usePlayground((s) => s.listOpen);
  const allOpen = usePlayground((s) => s.allOpen);
  const openPanel = usePlayground((s) => s.openPanel);
  const hasFicha = usePlayground((s) => s.selection !== null);
  const toggleFilter = usePlayground((s) => s.toggleFilter);
  const setListOpen = usePlayground((s) => s.setListOpen);
  const toggleAll = usePlayground((s) => s.toggleAll);
  const dock = useRef<HTMLDivElement>(null);

  // after the panels of the same commit are in the DOM; again on every resize, and whenever
  // the free area changes (the bench's safeChanged: a panel, or the ficha opening or closing)
  useLayoutEffect(() => {
    const place = () => layoutDock(dock.current!, openPanel);
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [openPanel, hasFicha]);

  const n = diagnostics.length;
  const shown = diagnostics.filter((d) => filters[d.severity]);
  const rows = allOpen ? shown : shown.slice(0, 3);

  return (
    <div ref={dock} data-feature="diagnostics-dock" className={styles.dock}>
      <Island as="section" aria-label="Diagnósticos" className={styles.diag}>
        <div className={styles.head}>
          <div className={styles.counts}>
            {SEVERITIES.map((s) => (
              <button
                key={s}
                type="button"
                className={`${styles.cnt} ${styles[s]}`}
                aria-pressed={filters[s]}
                title={`${filters[s] ? "esconder" : "mostrar"} ${PLURAL[s]}`}
                onClick={() => toggleFilter(s)}
              >
                <SeverityIcon severity={s} />
                {counts[s]}
              </button>
            ))}
          </div>
          <span className={styles.sum}>{n ? `${n} diagnóstico${n === 1 ? "" : "s"}` : "nenhum diagnóstico · o modelo é coerente"}</span>
          <Button
            className={styles.toggle}
            aria-expanded={listOpen}
            aria-label={listOpen ? "Recolher a lista" : "Abrir a lista"}
            onClick={() => setListOpen(!listOpen)}
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className={listOpen ? undefined : styles.shut}>
              <path d="M4 10l4-4 4 4" />
            </svg>
          </Button>
        </div>
        {listOpen && n > 0 && (
          <div className={styles.list}>
            {rows.length ? (
              rows.map((d, i) => <DiagnosticRow key={i} d={d} onClick={() => go(d)} />)
            ) : (
              <div className={styles.empty}>Os filtros escondem todos os diagnósticos.</div>
            )}
            {shown.length > 3 && (
              <button type="button" className={styles.more} onClick={toggleAll}>
                {allOpen ? "mostrar só os três primeiros" : `ver os ${shown.length} diagnósticos`}
              </button>
            )}
          </div>
        )}
      </Island>
    </div>
  );
}
