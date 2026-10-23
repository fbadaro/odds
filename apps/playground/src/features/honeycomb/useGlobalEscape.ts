import { useEffect } from "react";
import { usePlayground } from "../../stores/playground";

/**
 * O Esc da bancada, no documento: limpa a seleção (ou, numa relação vinda de um
 * contexto, volta a ele) de qualquer lugar, menos do editor, onde só sai dele. Com um
 * menu aberto, o Esc é do menu. Montado uma vez, no App.
 */
export function useGlobalEscape(): void {
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key !== "Escape" || ev.defaultPrevented) return;
      if (ev.target instanceof HTMLTextAreaElement) return;
      if (document.querySelector('[role="menu"]:not([hidden])')) return;
      usePlayground.getState().escape();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
}
