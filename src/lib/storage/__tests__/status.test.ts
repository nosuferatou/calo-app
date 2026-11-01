import { describe, expect, it, vi } from "vitest";
import { createStorageStatusStore } from "@/lib/storage/status";
import type { StorageStatus } from "@/types/storage";

const available: StorageStatus = { available: true, readOnly: false };
const readOnly: StorageStatus = { available: false, readOnly: true };

describe("storage status store", () => {
  it("starts from the server snapshot", () => {
    const store = createStorageStatusStore(() => readOnly);

    expect(store.getSnapshot()).toEqual(available);
    expect(store.getServerSnapshot()).toEqual(available);
  });

  it("notifies subscribers when availability changes", () => {
    let current = available;
    const store = createStorageStatusStore(() => current);
    const listener = vi.fn();

    store.subscribe(listener);
    current = readOnly;

    expect(store.refresh()).toEqual(readOnly);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot()).toEqual(readOnly);
  });

  it("does not notify when the status is unchanged", () => {
    const store = createStorageStatusStore(() => available);
    const listener = vi.fn();

    store.subscribe(listener);
    store.refresh();

    expect(listener).not.toHaveBeenCalled();
  });

  it("stops notifying after unsubscribe", () => {
    let current = available;
    const store = createStorageStatusStore(() => current);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    unsubscribe();
    current = readOnly;
    store.refresh();

    expect(listener).not.toHaveBeenCalled();
  });
});
