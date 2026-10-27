import { Island } from "../../../components/island/Island";
import { ExportButton } from "./ExportButton";
import { ShareButton } from "./ShareButton";
import { ThemeToggle } from "./ThemeToggle";
import styles from "./Actions.module.css";

/** A ilha do canto direito: compartilhar, exportar, tema. */
export function Actions() {
  return (
    <Island className={styles.act}>
      <ShareButton />
      <ExportButton />
      <ThemeToggle />
    </Island>
  );
}
