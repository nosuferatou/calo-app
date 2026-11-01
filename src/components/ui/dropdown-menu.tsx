"use client";

import { useEffect, useRef, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface DropdownMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  children: ReactNode;
}

export function DropdownMenu({
  open,
  onOpenChange,
  trigger,
  children,
}: DropdownMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        onOpenChange(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open) {
    return <>{trigger}</>;
  }

  return (
    <div ref={containerRef} className="relative">
      {trigger}
      <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-800 dark:bg-slate-900">
        {children}
      </div>
    </div>
  );
}

export function DropdownMenuItem({
  className,
  ...props
}: ComponentProps<"button">) {
  return (
    <button
      className={cn(
        "block w-full rounded-md px-3 py-2 text-left text-sm text-slate-900 transition-colors hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800",
        className,
      )}
      {...props}
    />
  );
}
