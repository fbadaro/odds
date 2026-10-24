import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup as BaseToggleGroup } from "@base-ui/react/toggle-group";
import type { HTMLAttributes, ReactNode } from "react";
import { Button } from "../button/Button";
import { Tooltip } from "./Tooltip";
import styles from "./ToggleGroup.module.css";

type Item<V extends string> = {
  value: V;
  /** O nome do botão. Com `content`, vira o `aria-label`; sem ele, é o texto. */
  label: string;
  /** O que o botão mostra no lugar do rótulo, um ícone. */
  content?: ReactNode;
  /** A dica da bancada, quando ela tem uma. */
  hint?: string;
};

type Common<V extends string> = {
  items: Item<V>[];
  itemClassName?: string | undefined;
  /** As setas andam entre os botões nesta direção. */
  orientation?: "horizontal" | "vertical";
} & Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue">;

type Props<V extends string> = Common<V> &
  (
    | { allowEmpty?: false; value: V; onValueChange: (value: V) => void }
    | { allowEmpty: true; value: V | null; onValueChange: (value: V | null) => void }
  );

/**
 * A escolha única da bancada: o selecionado fica em `aria-pressed` e as setas andam entre
 * os botões. Sem `allowEmpty` (a `.i-view`), apertar de novo não o solta; com ele (o
 * trilho), o mesmo botão solta, e não fica nenhum.
 */
export function ToggleGroup<V extends string>(props: Props<V>) {
  const { items, itemClassName, orientation, allowEmpty, value, onValueChange, className, ...rest } = props;
  const item = itemClassName ? `${styles.item} ${itemClassName}` : styles.item;
  return (
    <BaseToggleGroup<V>
      {...rest}
      className={className}
      orientation={orientation}
      value={value === null ? [] : [value]}
      onValueChange={(next) => {
        const picked = next[0];
        if (picked !== undefined) onValueChange(picked);
        else if (allowEmpty) (onValueChange as (v: V | null) => void)(null);
      }}
    >
      {items.map((it) => {
        const toggle = (
          <Toggle
            key={it.value}
            value={it.value}
            aria-label={it.content === undefined ? undefined : it.label}
            render={<Button className={item} />}
          >
            {it.content ?? it.label}
          </Toggle>
        );
        return it.hint ? (
          // num grupo vertical (o trilho), a dica abre ao lado, sem cobrir o vizinho
          <Tooltip key={it.value} label={it.hint} side={orientation === "vertical" ? "right" : "bottom"}>
            {toggle}
          </Tooltip>
        ) : (
          toggle
        );
      })}
    </BaseToggleGroup>
  );
}
