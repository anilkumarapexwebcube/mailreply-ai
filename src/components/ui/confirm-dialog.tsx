import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  LogOut,
  Unplug,
  RefreshCw,
  LucideIcon,
} from "lucide-react";

type Variant = "danger" | "warning" | "default";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Variant;
  icon?: LucideIcon;
  onConfirm: () => void;
  children?: ReactNode;
}

const variantStyles: Record<
  Variant,
  { icon: string; confirm: string; badge: string }
> = {
  danger: {
    icon: "text-destructive bg-destructive/10",
    confirm:
      "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    badge: "bg-destructive/8 border border-destructive/20",
  },
  warning: {
    icon: "text-amber-600 bg-amber-50",
    confirm: "bg-amber-600 text-white hover:bg-amber-700",
    badge: "bg-amber-50 border border-amber-200",
  },
  default: {
    icon: "text-primary bg-primary/10",
    confirm: "",
    badge: "bg-muted border border-border",
  },
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  icon: Icon = AlertTriangle,
  onConfirm,
}: ConfirmDialogProps) {
  const styles = variantStyles[variant];

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        {/* Overlay */}
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Dialog */}
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-background p-6 shadow-2xl ring-1 ring-border/60 focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] duration-200">
          {/* Icon */}
          <div
            className={`mb-4 grid size-11 place-items-center rounded-xl ${styles.icon}`}
          >
            <Icon className="size-5" />
          </div>

          {/* Title */}
          <AlertDialog.Title className="text-lg font-semibold text-foreground">
            {title}
          </AlertDialog.Title>

          {/* Description */}
          <AlertDialog.Description className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </AlertDialog.Description>

          {/* Actions */}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialog.Cancel asChild>
              <Button variant="outline" className="sm:w-auto w-full">
                {cancelLabel}
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                onClick={onConfirm}
                className={`inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 sm:w-auto w-full cursor-pointer ${styles.confirm || "bg-primary text-primary-foreground hover:bg-primary/90"}`}
              >
                {confirmLabel}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

// Pre-configured dialog variants for common actions
export { LogOut, Unplug, RefreshCw };
