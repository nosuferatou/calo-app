"use client";

import { useEffect, useRef, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/utils";
export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  className?: string;
}

export function Dialog({ open, onOpenChange, children, className }: DialogProps) {
  if (!open) {
    return null;
  }

  return (
    <DialogContent open={open} onOpenChange={onOpenChange} className={className}>
      {children}
    </DialogContent>
  );
}

type DialogContentProps = ComponentProps<"div"> & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DialogContent({
  open,
  onOpenChange,
  className,
  children,
  ...props
}: DialogContentProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const onOpenChangeRef = useRef(onOpenChange);

  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  }, [onOpenChange]);

  useEffect(() => {
    if (!open) {
      return;
    }

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChangeRef.current(false);
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) {
        return;
      }

      const panel = panelRef.current;
      const focusable = panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocusedRef.current?.focus?.();
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={cn(
          "absolute left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1.5", className)} {...props} />;
}

export function DialogTitle({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "text-lg font-semibold tracking-tight text-slate-900 dark:text-white",
        className,
      )}
      {...props}
    />
  );
}

export function DialogDescription({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("text-sm text-slate-600 dark:text-slate-400", className)}
      {...props}
    />
  );
}

export function DialogFooter({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mt-6 flex flex-col-reverse gap-2", className)} {...props} />;
}

/**
 * Primary dialog actions pinned to the bottom of the scrolling panel so they
 * stay reachable on phone viewports. Must be the last child of a Dialog whose
 * panel keeps the default p-6 padding (the negative margins bleed it edge to
 * edge); the extra bottom padding clears the iOS home indicator.
 */
export function DialogActionBar({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "-mx-6 -mb-6 sticky bottom-0 mt-6 flex flex-col-reverse gap-2 border-t border-slate-200 bg-white px-6 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] dark:border-slate-800 dark:bg-slate-900",
        className,
      )}
      {...props}
    />
  );
}
