import { useState } from "react";
import { usePlayground } from "../../../stores/playground";
import { PanelIsland } from "../../panels/components/PanelIsland";
import { StructureTree } from "./StructureTree";

/** O painel de estrutura: só existe no DOM enquanto aberto; o recolhido de cada nó vive aqui e sobrevive à digitação. */
export function StructurePanel() {
  const open = usePlayground((s) => s.openPanel === "tree");
  const [shut, setShut] = useState<ReadonlySet<string>>(() => new Set());
  if (!open) return null;
  const toggle = (key: string) =>
    setShut((prev) => {
      const next = new Set(prev);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  return (
    <PanelIsland data-feature="panel-tree" title="Estrutura" foot="clicar enquadra no mapa · o mesmo quadrado fecha o painel">
      <StructureTree shut={shut} onToggle={toggle} />
    </PanelIsland>
  );
}
