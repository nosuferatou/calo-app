import type { WeightRecord } from "@/types";

/**
 * Orders weight records ascending by the day they were logged, then by creation
 * time, then by id. `loggedAt` alone is not enough: two same-day entries share an
 * identical timestamp, so without a stable tiebreak the "current weight" (the last
 * record) is non-deterministic after a reload and the dashboard tile can show an
 * older same-day value. The id tiebreak keeps the order total and reproducible.
 */
export function compareWeightRecords(a: WeightRecord, b: WeightRecord): number {
  const byLoggedAt = a.loggedAt.localeCompare(b.loggedAt);
  if (byLoggedAt !== 0) return byLoggedAt;
  const byCreatedAt = a.createdAt.localeCompare(b.createdAt);
  if (byCreatedAt !== 0) return byCreatedAt;
  return a.id.localeCompare(b.id);
}

export function sortWeightRecords(records: WeightRecord[]): WeightRecord[] {
  return [...records].sort(compareWeightRecords);
}
