import { Toggle as BaseToggle } from "@base-ui/react/toggle";
import type { ButtonHTMLAttributes } from "react";
import { Tooltip } from "./Tooltip";

type Props = {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  /** A dica, quando há uma. */
  hint?: string | undefined;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "value" | "defaultValue">;

/**
 * Um botão que liga e desliga: o estado sai em `aria-pressed` e `[data-pressed]`. Sem o
 * `Button` próprio por baixo, porque quem usa (os contadores do rodapé) tem forma própria.
 */
export function Toggle({ pressed, onPressedChange, hint, ...rest }: Props) {
  const toggle = <BaseToggle {...rest} pressed={pressed} onPressedChange={(p) => onPressedChange(p)} />;
  return hint ? <Tooltip label={hint}>{toggle}</Tooltip> : toggle;
}
