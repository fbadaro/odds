import { AlertDialog } from "@base-ui/react/alert-dialog";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import type { ReactNode } from "react";
import { Button } from "../button/Button";
import styles from "./Dialog.module.css";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  /** The live selector of the popup (`data-feature`). */
  feature?: string;
};

/** A modal dialog over the map: a title, an optional line under it, and the body. `Esc` and the backdrop close it. */
export function Dialog({ open, onOpenChange, title, description, children, feature }: Props) {
  return (
    <BaseDialog.Root open={open} onOpenChange={(o) => onOpenChange(o)}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className={styles.backdrop} />
        <BaseDialog.Popup className={styles.popup} data-feature={feature}>
          <BaseDialog.Title className={styles.title}>{title}</BaseDialog.Title>
          {description && <BaseDialog.Description className={styles.desc}>{description}</BaseDialog.Description>}
          {children}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}

/** A button that closes the dialog it is in. */
export function DialogClose({ children }: { children: ReactNode }) {
  return <BaseDialog.Close render={<Button />}>{children}</BaseDialog.Close>;
}

type ConfirmProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirm: string;
  onConfirm: () => void;
};

/** The question before something that cannot be taken back by closing a dialog: cancel, or confirm. */
export function ConfirmDialog({ open, onOpenChange, title, description, confirm, onConfirm }: ConfirmProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={(o) => onOpenChange(o)}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className={styles.backdrop} />
        <AlertDialog.Popup className={`${styles.popup} ${styles.narrow}`} data-feature="confirm-dialog">
          <AlertDialog.Title className={styles.title}>{title}</AlertDialog.Title>
          <AlertDialog.Description className={styles.desc}>{description}</AlertDialog.Description>
          <div className={styles.actions}>
            <AlertDialog.Close render={<Button />}>Cancelar</AlertDialog.Close>
            <Button variant="primary" onClick={onConfirm}>
              {confirm}
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

/** The row of buttons at the foot of a dialog. */
export function DialogActions({ children }: { children: ReactNode }) {
  return <div className={styles.actions}>{children}</div>;
}
