import { Island } from "../../../components/island/Island";
import { Menu } from "../../../components/ui/Menu";
import { MODELS, type ModelKey } from "../../../lib/models";
import { usePlayground } from "../../../stores/playground";
import styles from "./FileMenu.module.css";

const RADIOS = (Object.keys(MODELS) as ModelKey[]).map((k) => ({ value: k, label: MODELS[k].file, hint: MODELS[k].hint }));

/** A ilha do arquivo da bancada (.i-file): a palavra, o arquivo aberto e o menu que troca de modelo. */
export function FileMenu() {
  const modelKey = usePlayground((s) => s.modelKey);
  const loadModel = usePlayground((s) => s.loadModel);
  const resetText = usePlayground((s) => s.resetText);
  return (
    <Island data-feature="file-menu" className={styles.file}>
      <span className={styles.word}>odds</span>
      <Menu
        triggerClassName={styles.trigger}
        trigger={
          <>
            <span className={styles.name}>{MODELS[modelKey].file}</span>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 6l4 4 4-4" /></svg>
          </>
        }
        radios={RADIOS}
        value={modelKey}
        onValueChange={(k) => loadModel(k as ModelKey)}
        actions={[{ label: "restaurar o texto inicial", onSelect: resetText }]}
      />
    </Island>
  );
}
