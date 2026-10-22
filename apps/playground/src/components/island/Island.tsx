import type { HTMLAttributes, ReactNode } from "react";
import styles from "./Island.module.css";

type Props = {
  as?: "div" | "section" | "nav" | "aside";
  className?: string | undefined;
  children: ReactNode;
} & HTMLAttributes<HTMLElement>;

/** A casca `.isl` da bancada: superfície flutuante com borda, raio e sombra de ilha. */
export function Island({ as: Tag = "div", className, children, ...rest }: Props) {
  return (
    <Tag {...rest} className={className ? `${styles.island} ${className}` : styles.island}>
      {children}
    </Tag>
  );
}
