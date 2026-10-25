import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import type { ComponentProps, ReactNode } from "react";
import { Button } from "../button/Button";

type RootProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string | undefined;
  children: ReactNode;
};

function Root({ open, onOpenChange, className, children }: RootProps) {
  return (
    <BaseCollapsible.Root open={open} onOpenChange={(o) => onOpenChange(o)} className={className}>
      {children}
    </BaseCollapsible.Root>
  );
}

/** O botão que abre e recolhe: o nosso `Button`, com `aria-expanded` e `aria-controls` vindos do Base UI. */
function Trigger({ children, ...rest }: ComponentProps<typeof Button>) {
  return <BaseCollapsible.Trigger render={<Button {...rest} />}>{children}</BaseCollapsible.Trigger>;
}

/** A área que recolhe. Fechada, sai do DOM. */
function Panel({ className, children }: { className?: string | undefined; children: ReactNode }) {
  return <BaseCollapsible.Panel className={className}>{children}</BaseCollapsible.Panel>;
}

/** Uma área que abre e recolhe, com o gatilho em qualquer lugar dentro da raiz. */
export const Collapsible = { Root, Trigger, Panel };
