import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  buildMonthGrid,
  formatShortDate,
  isValidDateKey,
  lastDateKeys,
  monthLabel,
  parseDateKey,
  toDateKey,
} from "@/lib/dates";

describe("date keys", () => {
  it("formats a local date as a date key", () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("rejects impossible dates", () => {
    expect(isValidDateKey("2026-02-29")).toBe(false);
    expect(isValidDateKey("2024-02-29")).toBe(true);
    expect(isValidDateKey("31-10-2026")).toBe(false);
  });

  it("adds days across month boundaries", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("clamps month changes to the last valid day", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2026-03-31", -1)).toBe("2026-02-28");
  });

  it("builds a Monday-first grid containing the whole month", () => {
    const weeks = buildMonthGrid("2026-10-15");
    const cells = weeks.flat();

    expect(weeks[0][0].dateKey).toBe("2026-09-28");
    expect(cells.some((cell) => cell.dateKey === "2026-10-01")).toBe(true);
    expect(cells.some((cell) => cell.dateKey === "2026-10-31")).toBe(true);
    expect(cells.filter((cell) => cell.inMonth)).toHaveLength(31);
  });

  it("returns consecutive date keys ending today", () => {
    expect(lastDateKeys(3, "2026-10-31")).toEqual([
      "2026-10-29",
      "2026-10-30",
      "2026-10-31",
    ]);
  });

  it("formats dates with the requested locale", () => {
    expect(monthLabel("2026-10-15", "en-US")).toBe("October 2026");
    expect(monthLabel("2026-10-15", "id-ID")).toContain("Oktober");
    expect(formatShortDate("2026-10-05", "en-US")).toBe("Oct 5");
  });

  it("throws for invalid date keys", () => {
    expect(() => parseDateKey("2026-13-01")).toThrow(RangeError);
  });
});
