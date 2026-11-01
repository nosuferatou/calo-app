"use client";

import { AlertTriangle } from "lucide-react";
import { useStorageStatus } from "@/hooks/use-storage-status";
import type { StorageStatus } from "@/types/storage";

export function StorageStatusBannerView({ status }: { status: StorageStatus }) {
  if (!status.readOnly) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6 lg:px-8">
      <div
        role="status"
        aria-live="polite"
        className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100"
      >
        <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <div>
          <p className="font-semibold">Read-only mode</p>
          <p className="mt-1 leading-5">
            Local storage is unavailable in this browser. CALO cannot read or
            save data until it is enabled.
          </p>
        </div>
      </div>
    </div>
  );
}

export function StorageStatusBanner() {
  const status = useStorageStatus();

  return <StorageStatusBannerView status={status} />;
}
