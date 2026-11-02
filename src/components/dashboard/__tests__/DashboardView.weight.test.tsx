import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardView } from "@/components/dashboard/DashboardView";
import type { WeightRecord } from "@/types";

const mocks = vi.hoisted(() => ({
  weightRecords: [] as WeightRecord[],
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/catalog/QuickAddDialog", () => ({
  QuickAddDialog: () => null,
}));

vi.mock("@/hooks/use-i18n", () => ({
  useI18n: () => ({ locale: "en", t: (key: string) => key }),
}));

vi.mock("@/components/providers/DemoDataProvider", () => ({
  useDemoData: () => ({
    entries: [],
    profile: { displayName: "" },
    targets: { calories: 2000, protein: 150, carbohydrates: 200, fat: 70 },
    weightRecords: mocks.weightRecords,
  }),
}));

function record(
  id: string,
  loggedAt: string,
  createdAt: string,
  weight: number,
): WeightRecord {
  return { id, createdAt, updatedAt: createdAt, loggedAt, weight };
}

describe("DashboardView current weight tile", () => {
  beforeEach(() => {
    mocks.weightRecords = [];
  });

  it("shows the newest same-day record even when it is not last in the array", () => {
    // Both records share the same logged day/time; the newest is distinguished by
    // createdAt. It is placed first so a naive "last array element" read would show
    // the stale 62.0 instead of the correct 61.4.
    mocks.weightRecords = [
      record("w-new", "2026-10-15T07:00:00.000Z", "2026-10-15T09:00:00.000Z", 61.4),
      record("w-old", "2026-10-15T07:00:00.000Z", "2026-10-15T08:00:00.000Z", 62),
    ];

    render(<DashboardView />);

    expect(screen.getByText("dashboard.currentWeight")).toBeInTheDocument();
    expect(screen.getByText(/61\.4/)).toBeInTheDocument();
    expect(screen.queryByText(/62\.0/)).not.toBeInTheDocument();
  });
});
