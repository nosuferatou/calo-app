import { describe, expect, it } from "vitest";
import { compareWeightRecords, sortWeightRecords } from "@/lib/weights";
import type { WeightRecord } from "@/types";

function record(
  id: string,
  loggedAt: string,
  createdAt: string,
  weight: number,
): WeightRecord {
  return { id, createdAt, updatedAt: createdAt, loggedAt, weight };
}

describe("compareWeightRecords", () => {
  it("orders by logged day first", () => {
    const earlier = record("a", "2026-10-14T07:00:00.000Z", "2026-10-14T07:00:00.000Z", 70);
    const later = record("b", "2026-10-15T07:00:00.000Z", "2026-10-15T07:00:00.000Z", 69);
    expect(compareWeightRecords(earlier, later)).toBeLessThan(0);
  });

  it("breaks same-day ties by createdAt", () => {
    const first = record("a", "2026-10-15T07:00:00.000Z", "2026-10-15T08:00:00.000Z", 62);
    const second = record("b", "2026-10-15T07:00:00.000Z", "2026-10-15T09:00:00.000Z", 61.4);
    expect(compareWeightRecords(first, second)).toBeLessThan(0);
  });

  it("falls back to id when logged and created timestamps match", () => {
    const a = record("aaa", "2026-10-15T07:00:00.000Z", "2026-10-15T07:00:00.000Z", 60);
    const b = record("bbb", "2026-10-15T07:00:00.000Z", "2026-10-15T07:00:00.000Z", 61);
    expect(compareWeightRecords(a, b)).toBeLessThan(0);
  });
});

describe("sortWeightRecords", () => {
  it("does not mutate the input array", () => {
    const input = [
      record("b", "2026-10-15T07:00:00.000Z", "2026-10-15T09:00:00.000Z", 61.4),
      record("a", "2026-10-15T07:00:00.000Z", "2026-10-15T08:00:00.000Z", 62),
    ];
    const snapshot = [...input];
    sortWeightRecords(input);
    expect(input).toEqual(snapshot);
  });

  it("places the newest same-day record last regardless of input order", () => {
    const newest = record("b", "2026-10-15T07:00:00.000Z", "2026-10-15T09:00:00.000Z", 61.4);
    const older = record("a", "2026-10-15T07:00:00.000Z", "2026-10-15T08:00:00.000Z", 62);
    const sorted = sortWeightRecords([newest, older]);
    expect(sorted[sorted.length - 1]).toBe(newest);
  });
});
