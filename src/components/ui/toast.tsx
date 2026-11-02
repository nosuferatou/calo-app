"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
} from "react";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToastItem, ToastVariant } from "@/hooks/use-toast";

const DEFAULT_DURATION_MS = 5000;

const variantStyles: Record<ToastVariant, string> = {
  info: "border-slate-200 dark:border-slate-700",
  success: "border-emerald-200 dark:border-emerald-900",
  error: "border-red-200 dark:border-red-900",
};

const variantIcons = {
  info: Info,
  success: CircleCheck,
  error: CircleAlert,
};

const variantLabels: Record<ToastVariant, string> = {
  info: "Information",
  success: "Success",
  error: "Error",
};

function announcementFor(toast: ToastItem | undefined): string {
  if (!toast) {
    return "";
  }

  return toast.description
    ? `${toast.title}. ${toast.description}`
    : toast.title;
}

function ToastAnnouncer({ toasts }: { toasts: ToastItem[] }) {
  const latestPolite = [...toasts]
    .reverse()
    .find((toast) => toast.variant !== "error");
  const latestAssertive = [...toasts]
    .reverse()
    .find((toast) => toast.variant === "error");

  return (
    <>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcementFor(latestPolite)}
      </div>
      <div className="sr-only" aria-live="assertive" aria-atomic="true">
        {announcementFor(latestAssertive)}
      </div>
    </>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const duration =
    toast.durationMs ?? (toast.variant === "error" ? 0 : DEFAULT_DURATION_MS);
  const remainingRef = useRef(duration);
  const startedAtRef = useRef<number | null>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const paused = hovered || focused;

  useEffect(() => {
    if (duration <= 0 || paused) {
      return;
    }

    startedAtRef.current = Date.now();
    const timer = window.setTimeout(
      () => onDismiss(toast.id),
      Math.max(remainingRef.current, 0),
    );

    return () => {
      window.clearTimeout(timer);

      if (startedAtRef.current !== null) {
        remainingRef.current = Math.max(
          remainingRef.current - (Date.now() - startedAtRef.current),
          0,
        );
        startedAtRef.current = null;
      }
    };
  }, [duration, onDismiss, paused, toast.id]);

  const handleBlur = useCallback((event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setFocused(false);
    }
  }, []);

  const Icon = variantIcons[toast.variant];

  return (
    <div
      role="group"
      aria-label="Notification"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={handleBlur}
      className={cn(
        "pointer-events-auto flex w-full items-start gap-3 rounded-lg border bg-white p-4 shadow-lg dark:bg-slate-900",
        variantStyles[toast.variant],
      )}
    >
      <Icon
        className="mt-0.5 size-5 shrink-0 text-slate-500 dark:text-slate-400"
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          {toast.title}
        </p>
        {toast.description ? (
          <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">
            {toast.description}
          </p>
        ) : null}
        <span className="sr-only">{variantLabels[toast.variant]}</span>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="flex size-11 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white dark:active:bg-slate-700"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  return (
    <>
      <ToastAnnouncer toasts={toasts} />
      {toasts.length > 0 ? (
        <div className="pointer-events-none fixed inset-x-4 bottom-[calc(8.5rem+env(safe-area-inset-bottom))] z-50 flex flex-col items-end gap-2 md:inset-x-auto md:right-6 md:bottom-6 md:w-96">
          {toasts.map((toast) => (
            <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
          ))}
        </div>
      ) : null}
    </>
  );
}
