import { usePlayground } from "../../../stores/playground";
import styles from "./Editor.module.css";

export function Editor() {
  const text = usePlayground((s) => s.text);
  const setText = usePlayground((s) => s.setText);
  return (
    <textarea
      className={styles.editor}
      aria-label="Texto .odds"
      value={text}
      onChange={(e) => setText(e.target.value)}
      spellCheck={false}
      autoCapitalize="off"
      autoCorrect="off"
      autoComplete="off"
      wrap="off"
    />
  );
}
