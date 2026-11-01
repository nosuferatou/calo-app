"use client";

import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ToastViewport } from "@/components/ui/toast";
import {
  ToastContext,
  type ToastInput,
  type ToastItem,
} from "@/hooks/use-toast";

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback((input: ToastInput) => {
    const id = `${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    const nextToast: ToastItem = {
      ...input,
      id,
      variant: input.variant ?? "info",
    };

    setToasts((current) => [...current, nextToast].slice(-4));
    return id;
  }, []);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}
