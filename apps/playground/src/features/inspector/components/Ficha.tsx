import { Button } from "../../../components/button/Button";
import { Island } from "../../../components/island/Island";
import { usePlayground } from "../../../stores/playground";
import { useFicha } from "../useFicha";
import { ContextCard } from "./ContextCard";
import styles from "./Ficha.module.css";
import { RelationCard } from "./RelationCard";
import { SubdomainCard } from "./SubdomainCard";

/**
 * The bench's `#ficha`: the inspector, opposite the panel, only while something is
 * selected. It renders in the same commit as the selection, so the camera's layout
 * effect measures it when the free area changes.
 */
export function Ficha() {
  const selection = usePlayground((s) => s.selection);
  const nav = usePlayground((s) => s.drawing?.nav ?? null);
  const markers = usePlayground((s) => s.markers);
  const select = usePlayground((s) => s.select);
  const f = useFicha();
  if (!f || !nav || !selection) return null;

  const [kind, body] =
    "rel" in selection
      ? ["Relação", <RelationCard rk={selection.rel} from={selection.from} f={f} nav={nav} markers={markers} />]
      : "sub" in selection
        ? ["Subdomínio", <SubdomainCard sub={selection.sub} f={f} nav={nav} />]
        : ["Contexto", <ContextCard id={selection.ctx} f={f} nav={nav} markers={markers} />];

  return (
    <Island as="aside" data-feature="ficha" aria-label="Ficha" className={styles.ficha}>
      <div className={styles.head}>
        <span className={styles.kind} data-kind>{kind}</span>
        <span className={styles.grow} />
        <Button className={styles.close} aria-label="Fechar a ficha" onClick={() => select(null)}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </Button>
      </div>
      <div className={styles.body}>{body}</div>
    </Island>
  );
}
