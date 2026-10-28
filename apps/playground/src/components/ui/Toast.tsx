import { useEffect } from "react";
import { Island } from "../island/Island";
import { usePlayground } from "../../stores/playground";
import styles from "./Toast.module.css";

export const TOAST_MS = 4200;

/**
 * O aviso: mostra o `toast` do store e o dispensa 4200 ms depois do
 * último. Sem Base UI: o store já guarda uma só mensagem, e a API de gerente do Toast
 * do Base UI (fila, ids) brigaria com isso.
 */
export function Toast() {
  const toast = usePlayground((s) => s.toast);
  const dismiss = usePlayground((s) => s.dismissToast);
  const seq = toast?.seq;

  useEffect(() => {
    if (seq === undefined) return;
    const id = setTimeout(dismiss, TOAST_MS);
    return () => clearTimeout(id);
  }, [seq, dismiss]);

  return (
    <Island data-feature="toast" role="status" className={styles.toast} hidden={toast === null}>
      {toast?.message}
    </Island>
  );
}
