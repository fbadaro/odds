import { useRef, useState } from "react";
import { ConfirmDialog } from "../../../components/ui/Dialog";
import { Island } from "../../../components/island/Island";
import { Menu } from "../../../components/ui/Menu";
import { MODELS, type ModelKey } from "../../../lib/models";
import { usePlayground } from "../../../stores/playground";
import styles from "./FileMenu.module.css";

const RADIOS = (Object.keys(MODELS) as ModelKey[]).map((k) => ({ value: k, label: MODELS[k].file, hint: MODELS[k].hint }));

/** A ilha do arquivo: a palavra, o arquivo aberto e o menu que troca de modelo. */
export function FileMenu() {
  const modelKey = usePlayground((s) => s.modelKey);
  const loadModel = usePlayground((s) => s.loadModel);
  const resetText = usePlayground((s) => s.resetText);
  const newDesign = usePlayground((s) => s.newDesign);
  const [confirm, setConfirm] = useState(false);
  // o menu abre sob a ilha inteira (top 70px, left 20px), não sob o botão
  const island = useRef<HTMLElement>(null);
  return (
    <Island ref={island} data-feature="file-menu" className={styles.file}>
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
        actions={[
          { label: "novo design", onSelect: () => setConfirm(true) },
          { label: "restaurar o texto inicial", onSelect: resetText },
        ]}
        anchor={island}
      />
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Começar um design novo?"
        description="O texto atual sai inteiro do editor, e o formulário do domínio abre. Um Ctrl+Z no editor traz o texto de volta."
        confirm="Começar do zero"
        onConfirm={() => {
          setConfirm(false);
          newDesign();
        }}
      />
    </Island>
  );
}
