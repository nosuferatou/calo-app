import { describe, expect, it } from "vitest";
import {
  isIsoDateTime,
  nowIso,
  toIsoDateTime,
} from "@/lib/datetime";

describe("datetime helpers", () => {
  it("formats the current time as a UTC ISO string", () => {
    expect(isIsoDateTime(nowIso())).toBe(true);
  });

  it("converts dates, timestamps, and strings", () => {
    const date = new Date("2026-10-31T10:00:00.000Z");

    expect(toIsoDateTime(date)).toBe("2026-10-31T10:00:00.000Z");
    expect(toIsoDateTime(date.getTime())).toBe("2026-10-31T10:00:00.000Z");
    expect(toIsoDateTime("2026-10-31T10:00:00.000Z")).toBe(
      "2026-10-31T10:00:00.000Z",
    );
  });

  it("rejects invalid dates", () => {
    expect(() => toIsoDateTime("not-a-date")).toThrow(RangeError);
  });

  it("recognizes only canonical ISO strings", () => {
    expect(isIsoDateTime("2026-10-31T10:00:00.000Z")).toBe(true);
    expect(isIsoDateTime("2026-10-31T10:00:00Z")).toBe(false);
    expect(isIsoDateTime("2026-10-31")).toBe(false);
    expect(isIsoDateTime("nope")).toBe(false);
  });
});
