import { Island } from "../../../components/island/Island";
import { usePlayground } from "../../../stores/playground";
import { CreateButton } from "./CreateButton";
import styles from "./EmptyMap.module.css";

/**
 * Where the map would be, while the text has a tree and nothing to draw: the
 * next thing to create. On a syntax error it stays out, and the frozen map and
 * its flag speak.
 */
export function EmptyMap() {
  const ast = usePlayground((s) => s.analysis.ast);
  const drawn = usePlayground((s) => s.drawing !== null);
  if (!ast || drawn) return null;
  const d = ast.domains[0];
  const last = d?.subdomains.at(-1);
  return (
    <Island data-feature="empty-map" className={styles.empty}>
      {d ? (
        <>
          <p className={styles.lead}>
            O domínio <b>{d.title || d.name}</b> ainda não tem o que desenhar.
          </p>
          <p className={styles.sub}>Um subdomínio agrupa contexts, e cada context vira uma peça do mapa.</p>
          <div className={styles.actions}>
            <CreateButton label="Novo subdomínio" target={{ kind: "subdomain", domain: 0 }} variant={last ? "plain" : "primary"}>
              + subdomínio
            </CreateButton>
            {last && (
              <CreateButton label={`Novo context em ${last.name}`} target={{ kind: "context", domain: 0, parent: last.name }} variant="primary">
                + context em {last.name}
              </CreateButton>
            )}
          </div>
        </>
      ) : (
        <>
          <p className={styles.lead}>Este arquivo ainda não tem domínio.</p>
          <p className={styles.sub}>Comece por ele: os subdomínios, os contexts e as relações vêm depois, cada um num formulário.</p>
          <div className={styles.actions}>
            <CreateButton label="Criar domínio" target={{ kind: "domain" }} variant="primary">
              Criar domínio
            </CreateButton>
          </div>
        </>
      )}
    </Island>
  );
}
