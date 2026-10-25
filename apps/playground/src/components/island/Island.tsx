import type { HTMLAttributes, ReactNode, Ref } from "react";
import styles from "./Island.module.css";

type Props = {
  as?: "div" | "section" | "nav" | "aside";
  className?: string | undefined;
  children: ReactNode;
  ref?: Ref<HTMLElement> | undefined;
} & HTMLAttributes<HTMLElement>;

/** A casca `.isl` da bancada: superfície flutuante com borda, raio e sombra de ilha. */
export function Island({ as: Tag = "div", className, children, ref, ...rest }: Props) {
  return (
    // o ref vale para qualquer um dos quatro elementos; o TS só não une as quatro assinaturas
    <Tag {...rest} ref={ref as Ref<HTMLDivElement>} className={className ? `${styles.island} ${className}` : styles.island}>
      {children}
    </Tag>
  );
}
