import type { ReactNode } from "react";
import { Button } from "../../../components/button/Button";
import { Tooltip } from "../../../components/ui/Tooltip";
import { usePlayground, type CreateTarget } from "../../../stores/playground";
import { blockedReason } from "../lib/blocked";

type Props = {
  /** The accessible name: what the button creates, and where. */
  label: string;
  target: CreateTarget;
  className?: string | undefined;
  variant?: "plain" | "primary";
  children: ReactNode;
};

/**
 * A button that opens a creation form. On a syntax error it stays in place,
 * `aria-disabled` and not `disabled`, so the hint that says why still opens.
 */
export function CreateButton({ label, target, className, variant = "plain", children }: Props) {
  const blocked = usePlayground((s) => blockedReason(s.analysis));
  const openCreate = usePlayground((s) => s.openCreate);
  return (
    <Tooltip label={blocked ?? label} side="right">
      <Button
        className={className}
        variant={variant}
        aria-label={label}
        aria-disabled={blocked ? true : undefined}
        data-create={target.kind}
        onClick={() => !blocked && openCreate(target)}
      >
        {children}
      </Button>
    </Tooltip>
  );
}
