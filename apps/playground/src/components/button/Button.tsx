import { forwardRef, type ButtonHTMLAttributes } from "react";
import styles from "./Button.module.css";

type Props = { variant?: "plain" | "primary" } & ButtonHTMLAttributes<HTMLButtonElement>;

/** O botão das ilhas (e a variante `primary`): 30px, só ícone ou ícone com rótulo. */
export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "plain", className, type = "button", ...rest },
  ref,
) {
  const own = variant === "primary" ? `${styles.btn} ${styles.primary}` : styles.btn;
  return <button {...rest} ref={ref} type={type} className={className ? `${own} ${className}` : own} />;
});
