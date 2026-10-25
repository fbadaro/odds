import { useMemo } from "react";
import { usePlayground } from "../../stores/playground";
import { inspectorDataOf, type InspectorData } from "./lib/inspectorData";

/** The bench's `fic`: the inspector's data from the last text that had a tree (a syntax error keeps it). */
export function useInspectorData(): InspectorData | null {
  const ast = usePlayground((s) => s.ast);
  return useMemo(() => (ast ? inspectorDataOf(ast) : null), [ast]);
}
