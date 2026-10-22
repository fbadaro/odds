import { Island } from "./components/island/Island";
import { SeverityCounters } from "./features/diagnostics/components/SeverityCounters";
import { Editor } from "./features/editor/components/Editor";
import { Honeycomb } from "./features/honeycomb/components/Honeycomb";
import styles from "./App.module.css";

export function App() {
  return (
    <div className={styles.shell}>
      <main className={styles.map}>
        <Honeycomb />
      </main>
      <Island as="aside" className={styles.code}>
        <Editor />
      </Island>
      <Island className={styles.dock}>
        <SeverityCounters />
      </Island>
    </div>
  );
}
