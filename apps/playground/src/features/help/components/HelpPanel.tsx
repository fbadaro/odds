import { usePlayground } from "../../../stores/playground";
import { PanelIsland } from "../../panels/components/PanelIsland";
import { Legend } from "./Legend";
import styles from "./HelpPanel.module.css";

/** O painel de ajuda: só existe no DOM enquanto aberto. */
export function HelpPanel() {
  const open = usePlayground((s) => s.openPanel === "help");
  if (!open) return null;
  return (
    <PanelIsland data-feature="panel-help" title="Como ler">
      <div className={styles.help}>
        <Legend />
        <div className={styles.keys}>
          <b>roda ou pinça</b>
          <span>aproxima e afasta</span>
          <b>arrastar</b>
          <span>move o mapa</span>
          <b>peça</b>
          <span>acende as relações do contexto</span>
          <b>linha</b>
          <span>uma relação só</span>
          <b>território</b>
          <span>foca o subdomínio</span>
          <b>
            <kbd className={styles.kbd}>Esc</kbd>
          </b>
          <span>limpa a seleção</span>
          <b>
            <kbd className={styles.kbd}>0</kbd>
          </b>
          <span>mapa inteiro</span>
        </div>
      </div>
    </PanelIsland>
  );
}
