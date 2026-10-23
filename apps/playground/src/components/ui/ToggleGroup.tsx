import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup as BaseToggleGroup } from "@base-ui/react/toggle-group";
import type { HTMLAttributes } from "react";
import { Button } from "../button/Button";
import styles from "./ToggleGroup.module.css";

type Props<V extends string> = {
  value: V;
  onValueChange: (value: V) => void;
  items: { value: V; label: string }[];
} & Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue">;

/** A escolha única da bancada (.i-view): o selecionado fica em aria-pressed, e apertar de novo não o solta. */
export function ToggleGroup<V extends string>({ value, onValueChange, items, className, ...rest }: Props<V>) {
  return (
    <BaseToggleGroup<V>
      {...rest}
      className={className}
      value={[value]}
      onValueChange={(next) => {
        const picked = next[0];
        if (picked !== undefined) onValueChange(picked);
      }}
    >
      {items.map((it) => (
        <Toggle key={it.value} value={it.value} render={<Button className={styles.item} />}>
          {it.label}
        </Toggle>
      ))}
    </BaseToggleGroup>
  );
}
