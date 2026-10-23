import { Island } from "./components/island/Island";
import { SeverityCounters } from "./features/diagnostics/components/SeverityCounters";
import { Editor } from "./features/editor/components/Editor";
import { Honeycomb } from "./features/honeycomb/components/Honeycomb";
import { ZoomControls } from "./features/honeycomb/components/ZoomControls";
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
      <Island as="aside" className={styles.code}>
        <Editor />
      </Island>
      <Island className={styles.dock}>
        <SeverityCounters />
      </Island>
      <ZoomControls />
    </div>
  );
}
