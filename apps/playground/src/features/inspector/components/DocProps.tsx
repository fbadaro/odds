import type { ReactNode } from "react";
import type { DocInfo } from "../lib/ficha";
import styles from "./DocProps.module.css";

function Prop({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className={styles.prop}>
      <span className={styles.pk}>{k}</span>
      {children}
    </div>
  );
}

/** Whether a context documents anything (the bench's `docHtml` returning ""). */
export const hasDoc = (d: Partial<DocInfo>) =>
  !!(d.description || d.responsibilities || d.type || d.maturity || d.team || d.technology);

/** The bench's `docHtml`: a context's properties, in its fixed order. Documentation, never a rule's trigger. */
export function DocProps({ d }: { d: Partial<DocInfo> }) {
  return (
    <>
      {d.description && <Prop k="description"><span className={styles.pv}>{d.description}</span></Prop>}
      {d.responsibilities && (
        <Prop k="responsibilities">
          <ul className={styles.rlist}>
            {d.responsibilities.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </Prop>
      )}
      {d.type && <Prop k="type"><span className={`${styles.pv} ${styles.lit}`}>{d.type}</span></Prop>}
      {d.maturity && <Prop k="maturity"><span className={styles.mat}>{d.maturity}</span></Prop>}
      {d.team && <Prop k="team"><span className={styles.pv}>{d.team}</span></Prop>}
      {d.technology && <Prop k="technology"><span className={styles.pv}>{d.technology}</span></Prop>}
    </>
  );
}

/** A subdomain's prose property (description, owner), in the same look. */
export function SubProp({ k, v }: { k: string; v: string }) {
  return <Prop k={k}><span className={styles.pv}>{v}</span></Prop>;
}
