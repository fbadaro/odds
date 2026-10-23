import { useEffect, useRef } from "react";
import { SeverityIcon } from "../../../components/icons/SeverityIcon";
import { usePlayground } from "../../../stores/playground";
import { offsetOf, worstByLine } from "../lib/gutter";
import styles from "./Editor.module.css";

const SEV_CLASS = { error: styles.sevError, warning: styles.sevWarning, info: styles.sevInfo } as const;

export function Editor({ onCaret }: { onCaret: (offset: number) => void }) {
  const text = usePlayground((s) => s.text);
  const setText = usePlayground((s) => s.setText);
  const diagnostics = usePlayground((s) => s.analysis.diagnostics);
  const reveal = usePlayground((s) => s.reveal);
  const ta = useRef<HTMLTextAreaElement>(null);
  const gut = useRef<HTMLDivElement>(null);
  // o último `reveal` já aplicado: um pedido antigo não se repete
  const handled = useRef(0);

  // a cada arquivo carregado (loadModel), e só então: cursor e rolagem no início, como na bancada
  const epoch = usePlayground((s) => s.epoch);
  useEffect(() => {
    const el = ta.current;
    if (el) {
      el.setSelectionRange(0, 0);
      el.scrollTop = 0;
    }
    if (gut.current) gut.current.scrollTop = 0;
    onCaret(0);
  }, [epoch, onCaret]);

  const seq = reveal?.seq ?? 0;
  useEffect(() => {
    const el = ta.current;
    const r = usePlayground.getState().reveal;
    if (!r) handled.current = 0;
    if (!el || !r || r.seq === handled.current) return;
    handled.current = r.seq;
    el.focus();
    el.setSelectionRange(offsetOf(el.value, r.start), offsetOf(el.value, r.end));
    el.scrollTop = Math.max(0, (r.start.line - 6) * 20);
    if (gut.current) gut.current.scrollTop = el.scrollTop;
    onCaret(el.selectionStart);
  }, [seq, onCaret]);

  const worst = worstByLine(diagnostics);
  const lines = text.split("\n").length;
  const caret = () => ta.current && onCaret(ta.current.selectionStart);

  return (
    <div className={styles.ed}>
      <div className={styles.gut} ref={gut} aria-hidden="true">
        {Array.from({ length: lines }, (_, i) => {
          const sev = worst[i + 1];
          return (
            <div key={i} className={sev ? SEV_CLASS[sev] : undefined}>
              {sev && <SeverityIcon severity={sev} />}
              {i + 1}
            </div>
          );
        })}
      </div>
      <textarea
        ref={ta}
        className={styles.editor}
        aria-label="Fonte .odds"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          caret();
        }}
        onScroll={(e) => {
          if (gut.current) gut.current.scrollTop = e.currentTarget.scrollTop;
        }}
        onKeyUp={caret}
        onClick={caret}
        onKeyDown={(e) => {
          const el = e.currentTarget;
          if (e.key === "Escape") {
            el.blur();
            document.querySelector<HTMLElement>('[data-feature="map"]')?.focus();
          } else if (e.key === "Tab") {
            e.preventDefault();
            el.setRangeText("  ", el.selectionStart, el.selectionEnd, "end");
            setText(el.value);
            caret();
          }
        }}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        wrap="off"
      />
    </div>
  );
}
