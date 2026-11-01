"use client";

import { useEffect, useSyncExternalStore } from "react";
import { storageStatusStore } from "@/lib/storage/status";
import type { StorageStatus } from "@/types/storage";

export function useStorageStatus(): StorageStatus {
  const status = useSyncExternalStore(
    storageStatusStore.subscribe,
    storageStatusStore.getSnapshot,
    storageStatusStore.getServerSnapshot,
  );

  useEffect(() => {
    storageStatusStore.refresh();

    const handleStorage = () => storageStatusStore.refresh();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        storageStatusStore.refresh();
      }
    };

    window.addEventListener("storage", handleStorage);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return status;
}
