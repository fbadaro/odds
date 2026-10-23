import { Menu as BaseMenu } from "@base-ui/react/menu";
import type { ReactNode } from "react";
import { Button } from "../button/Button";
import styles from "./Menu.module.css";

export interface RadioChoice {
  value: string;
  label: string;
  hint?: string;
}
export interface MenuAction {
  label: string;
  onSelect: () => void;
}

type Props = {
  /** O conteúdo do botão que abre o menu. */
  trigger: ReactNode;
  triggerClassName?: string | undefined;
  radios: RadioChoice[];
  value: string;
  onValueChange: (value: string) => void;
  /** Depois de um separador, as ações. */
  actions?: MenuAction[];
  /** Contra o que o menu se posiciona; sem ele, o botão. */
  anchor?: BaseMenu.Positioner.Props["anchor"];
};

/** O menu da bancada (.menu): um botão, escolhas de rádio com dica, um separador e ações. Fecha ao escolher. */
export function Menu({ trigger, triggerClassName, radios, value, onValueChange, actions = [], anchor }: Props) {
  return (
    <BaseMenu.Root modal={false}>
      <BaseMenu.Trigger render={<Button className={triggerClassName} />}>{trigger}</BaseMenu.Trigger>
      <BaseMenu.Portal>
        <BaseMenu.Positioner anchor={anchor} side="bottom" align="start" sideOffset={8} className={styles.positioner}>
          <BaseMenu.Popup className={styles.menu}>
            <BaseMenu.RadioGroup value={value} onValueChange={(v) => onValueChange(String(v))}>
              {radios.map((r) => (
                <BaseMenu.RadioItem key={r.value} value={r.value} closeOnClick className={styles.item}>
                  {r.label} {r.hint && <small>{r.hint}</small>}
                </BaseMenu.RadioItem>
              ))}
            </BaseMenu.RadioGroup>
            {actions.length > 0 && <BaseMenu.Separator className={styles.sep} />}
            {actions.map((a) => (
              <BaseMenu.Item key={a.label} className={styles.item} onClick={a.onSelect}>
                {a.label}
              </BaseMenu.Item>
            ))}
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}
