import { useMemo } from "react";
import { usePlayground } from "../../stores/playground";
import { fichaOf, type Ficha } from "./lib/ficha";

/** The bench's `fic`: the ficha of the last text that had a tree (a syntax error keeps it). */
export function useFicha(): Ficha | null {
  const ast = usePlayground((s) => s.ast);
  return useMemo(() => (ast ? fichaOf(ast) : null), [ast]);
}
