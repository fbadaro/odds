import { useState } from "react";
import { MODELS } from "../../../lib/models";
import { usePlayground } from "../../../stores/playground";
import { PanelIsland } from "../../panels/components/PanelIsland";
import { caretLabel } from "../lib/gutter";
import styles from "./CodePanel.module.css";
import { Editor } from "./Editor";

/** O painel de código da bancada: só existe no DOM enquanto aberto. */
export function CodePanel() {
  const open = usePlayground((s) => s.openPanel === "code");
  const text = usePlayground((s) => s.text);
  const file = usePlayground((s) => MODELS[s.modelKey].file);
  const [caret, setCaret] = useState(0);
  if (!open) return null;
  return (
    <PanelIsland feature="panel-code" title="Código" sub={caretLabel(file, text, caret)} bodyClassName={styles.body!}>
      <Editor onCaret={setCaret} />
    </PanelIsland>
  );
}
