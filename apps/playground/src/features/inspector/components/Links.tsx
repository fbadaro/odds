import type { ReactNode } from "react";
import { MODELS } from "../../../lib/models";
import { usePlayground } from "../../../stores/playground";
import styles from "./Card.module.css";

/** The bench's `lineBtn`: the file and the line, which the editor reveals. */
export function LineLink({ line, children }: { line: number; children?: ReactNode }) {
  const file = usePlayground((s) => MODELS[s.modelKey].file);
  const revealLine = usePlayground((s) => s.revealLine);
  return (
    <button type="button" className={styles.lnk} onClick={() => revealLine(line)}>
      {children ?? `${file} · L${line}`}
    </button>
  );
}

/** `data-go`: a context, selected and framed; it reads as its name unless told otherwise. */
export function CtxLink({ id, plain = false, className, children }: { id: string; plain?: boolean; className?: string | undefined; children?: ReactNode }) {
  const select = usePlayground((s) => s.select);
  const cls = [styles.golink, plain && styles.plain, className].filter(Boolean).join(" ");
  return (
    <button type="button" className={cls} onClick={() => select({ ctx: id }, true)}>
      {children ?? id}
    </button>
  );
}

/** `data-gosub`: a subdomain (`"Domain/Sub"`), selected and framed; it reads as its own name. */
export function SubLink({ sub, plain = false }: { sub: string; plain?: boolean }) {
  const select = usePlayground((s) => s.select);
  return (
    <button type="button" className={plain ? `${styles.golink} ${styles.plain}` : styles.golink} onClick={() => select({ sub }, true)}>
      {sub.split("/")[1]}
    </button>
  );
}

/** The tags of one side as the source writes them: `[A, B]`. */
export function Tags({ tags }: { tags: string[] }) {
  return tags.length ? <span className={styles.tg}>[{tags.join(", ")}]</span> : null;
}
