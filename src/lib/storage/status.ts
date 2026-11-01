import { initializeStorage } from "./client";
import type { StorageStatus } from "@/types/storage";

type Listener = () => void;

const SERVER_STATUS: StorageStatus = { available: true, readOnly: false };

export interface StorageStatusStore {
  getSnapshot: () => StorageStatus;
  getServerSnapshot: () => StorageStatus;
  subscribe: (listener: Listener) => () => void;
  refresh: () => StorageStatus;
}

export function createStorageStatusStore(
  check: () => StorageStatus,
  initial: StorageStatus = SERVER_STATUS,
): StorageStatusStore {
  let status = initial;
  const listeners = new Set<Listener>();

  return {
    getSnapshot: () => status,
    getServerSnapshot: () => SERVER_STATUS,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    refresh: () => {
      const next = check();

      if (
        next.available !== status.available ||
        next.readOnly !== status.readOnly
      ) {
        status = next;
        listeners.forEach((listener) => listener());
      }

      return status;
    },
  };
}

export const storageStatusStore = createStorageStatusStore(initializeStorage);
