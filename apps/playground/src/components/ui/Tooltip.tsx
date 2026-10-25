import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import type { ReactElement, ReactNode } from "react";
import styles from "./Tooltip.module.css";

type Props = {
  /** O texto da dica, o mesmo da bancada. Não substitui o `aria-label` do gatilho. */
  label: string;
  /** O gatilho: o nosso `Button`, ou a parte de outro wrapper (um `Toggle`). */
  children: ReactElement;
  /** De que lado do gatilho a dica abre; sem espaço, o Base UI a vira para o outro. */
  side?: "top" | "right" | "bottom" | "left";
};

/** A dica da bancada (o `title` dos botões): abre ao passar o mouse ou focar pelo teclado, e o `Esc` a fecha. */
export function Tooltip({ label, children, side = "bottom" }: Props) {
  return (
    <BaseTooltip.Root>
      <BaseTooltip.Trigger render={children} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner side={side} sideOffset={8} className={styles.positioner}>
          <BaseTooltip.Popup className={styles.tip}>{label}</BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}

/** Uma vez no App: depois da primeira dica, as vizinhas abrem sem esperar. */
export function TooltipProvider({ delay, children }: { delay?: number; children: ReactNode }) {
  return <BaseTooltip.Provider delay={delay}>{children}</BaseTooltip.Provider>;
}
