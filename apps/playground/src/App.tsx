import { Toast } from "./components/ui/Toast";
import { TooltipProvider } from "./components/ui/Tooltip";
import { DiagnosticsDock } from "./features/diagnostics/components/DiagnosticsDock";
import { CodePanel } from "./features/editor/components/CodePanel";
import { HelpPanel } from "./features/help/components/HelpPanel";
import { Inspector } from "./features/inspector/components/Inspector";
import { SelectionCaption } from "./features/inspector/components/SelectionCaption";
import { StructurePanel } from "./features/structure/components/StructurePanel";
import { Rail } from "./features/panels/components/Rail";
import { FrozenFlag } from "./features/honeycomb/components/FrozenFlag";
import { Honeycomb } from "./features/honeycomb/components/Honeycomb";
import { WaitIndicator } from "./features/honeycomb/components/WaitIndicator";
import { ZoomControls } from "./features/honeycomb/components/ZoomControls";
import { Actions } from "./features/topbar/components/Actions";
import { FileMenu } from "./features/topbar/components/FileMenu";
import { ViewSwitch } from "./features/topbar/components/ViewSwitch";
import { useGlobalEscape } from "./features/honeycomb/useGlobalEscape";
import styles from "./App.module.css";

export function App() {
  useGlobalEscape();
  return (
    <TooltipProvider>
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
        <Inspector />
        <FrozenFlag />
        <SelectionCaption />
        <WaitIndicator />
        <DiagnosticsDock />
        <ZoomControls />
        <Toast />
      </div>
    </TooltipProvider>
  );
}
