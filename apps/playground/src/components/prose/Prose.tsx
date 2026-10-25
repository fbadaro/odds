import type { Diagnostic } from "@odds/core";
import { renderMessage } from "@odds/messages";
import type { ReactNode } from "react";
import styles from "./Prose.module.css";

/** The data a sentence quotes, between backticks in MESSAGES.md (the bench's regex). */
const QUOTED = /`([^`]+)`/g;

/** A sentence from `@odds/messages`, with the quoted data in mono: mono is data, sans is prose. Built in React, never as markup. */
export function Prose({ d }: { d: Pick<Diagnostic, "code" | "data"> }) {
  const text = renderMessage(d.code, d.data, "pt"); // the bench's sentence(d, "pt")
  const out: ReactNode[] = [];
  let at = 0;
  for (const m of text.matchAll(QUOTED)) {
    out.push(text.slice(at, m.index));
    out.push(
      <code key={m.index} className={styles.code}>
        {m[1]}
      </code>,
    );
    at = m.index + m[0].length;
  }
  out.push(text.slice(at));
  return <>{out}</>;
}
