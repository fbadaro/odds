import { Toast } from "./components/ui/Toast";
import { Island } from "./components/island/Island";
import { SeverityCounters } from "./features/diagnostics/components/SeverityCounters";
import { CodePanel } from "./features/editor/components/CodePanel";
import { HelpPanel } from "./features/help/components/HelpPanel";
import { Ficha } from "./features/inspector/components/Ficha";
import { SelectionCaption } from "./features/inspector/components/SelectionCaption";
import { StructurePanel } from "./features/structure/components/StructurePanel";
import { Rail } from "./features/panels/components/Rail";
import { Honeycomb } from "./features/honeycomb/components/Honeycomb";
import { ZoomControls } from "./features/honeycomb/components/ZoomControls";
import { Actions } from "./features/topbar/components/Actions";
import { FileMenu } from "./features/topbar/components/FileMenu";
import { ViewSwitch } from "./features/topbar/components/ViewSwitch";
import { useGlobalEscape } from "./features/honeycomb/useGlobalEscape";
import styles from "./App.module.css";

export function App() {
  useGlobalEscape();
  return (
    <div className={styles.shell}>
      {/* o mapa é o palco em tela inteira (honeycomb.css); as ilhas flutuam por cima */}
      <main>
        <Honeycomb />
      </main>
      <FileMenu />
      <ViewSwitch />
      <Actions />
      <Rail />
      <CodePanel />
      <StructurePanel />
      <HelpPanel />
      <Ficha />
      <SelectionCaption />
      <Island className={styles.dock}>
        <SeverityCounters />
      </Island>
      <ZoomControls />
      <Toast />
    </div>
  );
}
