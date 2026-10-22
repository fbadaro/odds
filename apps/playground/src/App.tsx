import { SeverityCounters } from "./features/diagnostics/components/SeverityCounters";
import { Editor } from "./features/editor/components/Editor";
import { Honeycomb } from "./features/honeycomb/components/Honeycomb";
import styles from "./App.module.css";

export function App() {
  return (
    <div className={styles.shell}>
      <aside className={styles.editor}>
        <Editor />
      </aside>
      <main className={styles.main}>
        <Honeycomb />
      </main>
      <footer className={styles.footer}>
        <SeverityCounters />
      </footer>
    </div>
  );
}
