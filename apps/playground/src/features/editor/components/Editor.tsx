import { useEffect, useLayoutEffect, useRef } from "react";
import { SeverityIcon } from "../../../components/icons/SeverityIcon";
import { usePlayground } from "../../../stores/playground";
import { offsetOf, worstByLine } from "../lib/gutter";
import styles from "./Editor.module.css";

const SEV_CLASS = { error: styles.sevError, warning: styles.sevWarning, info: styles.sevInfo } as const;
/** How long the lines a form wrote stay highlighted. */
export const FRESH_MS = 1600;
const LINE = 20;
const PAD = 12;

/**
 * Makes `from`–`to` become `text` the way typing would: through `insertText`
 * (or `delete`), the textarea keeps it in its own undo history, one Ctrl+Z per
 * edit (ADR-0026). Where the browser has no `execCommand` (jsdom), the range is
 * replaced directly, and the caller passes the value on. True when the native path ran.
 */
function typeInto(el: HTMLTextAreaElement, from: number, to: number, text: string): boolean {
  el.setSelectionRange(from, to);
  const exec = (document as Partial<Pick<Document, "execCommand">>).execCommand;
  const native = typeof exec === "function" && (text === "" ? exec.call(document, "delete") : exec.call(document, "insertText", false, text));
  if (!native) el.setRangeText(text, from, to, "end");
  return native;
}

export function Editor({ onCaret }: { onCaret: (offset: number) => void }) {
  const text = usePlayground((s) => s.text);
  const setText = usePlayground((s) => s.setText);
  const diagnostics = usePlayground((s) => s.analysis.diagnostics);
  const reveal = usePlayground((s) => s.reveal);
  const ta = useRef<HTMLTextAreaElement>(null);
  const gut = useRef<HTMLDivElement>(null);
  // o último `reveal` já aplicado: um pedido antigo não se repete
  const handled = useRef(0);

  // a cada arquivo carregado (loadModel), e só então: cursor e rolagem no início
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
    el.scrollTop = Math.max(0, (r.start.line - r.lead) * 20);
    if (gut.current) gut.current.scrollTop = el.scrollTop;
    onCaret(el.selectionStart);
  }, [seq, onCaret]);

  // a form's edit: applied once, against the text it was planned on, then its lines shine for a moment
  const edit = usePlayground((s) => s.edit);
  const applied = useRef(0);
  const band = useRef<HTMLDivElement>(null);
  const placeBand = () => {
    const el = ta.current;
    const b = band.current;
    const lines = usePlayground.getState().edit?.lines;
    if (!el || !b || !lines) return;
    b.style.top = `${PAD + (lines[0] - 1) * LINE - el.scrollTop}px`;
    b.style.height = `${(lines[1] - lines[0] + 1) * LINE}px`;
  };
  const editSeq = edit?.seq ?? 0;
  useLayoutEffect(() => {
    const el = ta.current;
    const e = usePlayground.getState().edit;
    if (!el || !e || e.seq === applied.current) return;
    applied.current = e.seq;
    const { settleEdit } = usePlayground.getState();
    let frame = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let tries = 0;
    const apply = () => {
      if (el.value !== e.base) return settleEdit(e.seq);
      const back = document.activeElement;
      el.focus();
      // the form's dialog, still closing, keeps the focus trapped inside it: the edit waits for it to
      // let go, because insertText acts only on the focused field, and the fallback has no undo
      if (document.activeElement !== el && tries++ < 30) {
        frame = requestAnimationFrame(apply);
        return;
      }

      // the native path fires `input`, and onChange takes the text to the store
      if (!typeInto(el, e.from, e.to, e.text)) setText(el.value);
      if (back instanceof HTMLElement && back !== el && back !== document.body) back.focus();
      else el.blur();
      onCaret(el.selectionStart);
      if (!e.lines) return;
      el.scrollTop = Math.max(0, (e.lines[0] - 1 - 4) * LINE);
      if (gut.current) gut.current.scrollTop = el.scrollTop;
      placeBand();
      timer = setTimeout(() => settleEdit(e.seq), FRESH_MS);
    };
    // never inside the event that committed the form (the Enter of its field): an editing command nested
    // in another field's key event is left out of the browser's undo history
    const start = setTimeout(apply, 0);
    return () => {
      clearTimeout(start);
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [editSeq, setText, onCaret]);
  const fresh = edit?.lines ?? null;

  const worst = worstByLine(diagnostics);
  const lines = text.split("\n").length;
  const caret = () => ta.current && onCaret(ta.current.selectionStart);

  return (
    <div className={styles.ed}>
      <div className={styles.gut} ref={gut} aria-hidden="true">
        {Array.from({ length: lines }, (_, i) => {
          const sev = worst[i + 1];
          return (
            <div key={i} className={sev ? SEV_CLASS[sev] : undefined} data-line={i + 1} data-fresh={fresh && i + 1 >= fresh[0] && i + 1 <= fresh[1] ? "" : undefined}>
              {sev && <SeverityIcon severity={sev} />}
              {i + 1}
            </div>
          );
        })}
      </div>
      <div className={styles.code}>
      {fresh && <div ref={band} className={styles.band} aria-hidden="true" />}
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
          placeBand();
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
    </div>
  );
}
