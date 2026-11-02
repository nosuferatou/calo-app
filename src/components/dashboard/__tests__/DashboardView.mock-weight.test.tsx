import type { ReactNode } from "react";
import { useState } from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardView } from "@/components/dashboard/DashboardView";
import {
  DemoDataProvider,
  useDemoData,
} from "@/components/providers/DemoDataProvider";
import { todayKey } from "@/lib/dates";
import { sortWeightRecords } from "@/lib/weights";
import type { WeightRecord } from "@/types";

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

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

// A weight that does not collide with any seeded mock value (80.2 … 78.6).
const NEW_WEIGHT = 70.5;

function weightCard(): HTMLElement {
  const title = screen.getByText("dashboard.currentWeight");
  const card = title.closest(".rounded-2xl");
  if (!card) throw new Error("current-weight card not found");
  return card as HTMLElement;
}

function Harness() {
  const { addWeight, weightRecords } = useDemoData();
  // Bumping the key remounts DashboardView while the provider stays mounted,
  // which is exactly what an SPA navigation away from /dashboard and back does.
  const [navKey, setNavKey] = useState(0);
  const ordered = sortWeightRecords(weightRecords);
  const current = ordered[ordered.length - 1];

  return (
    <div>
      <output data-testid="records">{JSON.stringify(weightRecords)}</output>
      <output data-testid="current">{current ? String(current.weight) : "none"}</output>
      <button type="button" onClick={() => addWeight(NEW_WEIGHT, todayKey())}>
        add-today
      </button>
      <button type="button" onClick={() => setNavKey((key) => key + 1)}>
        navigate
      </button>
      <DashboardView key={navKey} />
    </div>
  );
}

function readRecords(): WeightRecord[] {
  return JSON.parse(screen.getByTestId("records").textContent ?? "[]") as WeightRecord[];
}

describe("DashboardView current weight with seeded mock records", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("makes a same-local-date entry the current weight, and keeps it after SPA navigation", async () => {
    render(
      <DemoDataProvider>
        <Harness />
      </DemoDataProvider>,
    );

    // Baseline: the newest seeded mock record (today, 78.6) is the current weight.
    await waitFor(() => expect(screen.getByTestId("current").textContent).toBe("78.6"));
    expect(within(weightCard()).getByText(/78\.6/)).toBeInTheDocument();

    fireEvent.click(screen.getByText("add-today"));

    // The newly entered record shares the mock record's local date, so loggedAt is
    // identical and the later createdAt is what makes it the current weight. Before
    // the mock-timestamp fix the seeded record's fixed UTC 07:00 sorted after the
    // app-generated local 07:00, so the tile stayed on 78.6.
    await waitFor(() =>
      expect(screen.getByTestId("current").textContent).toBe(String(NEW_WEIGHT)),
    );

    const records = readRecords();
    const todays = records.filter((record) => record.weight === NEW_WEIGHT);
    expect(todays).toHaveLength(1);
    const seededToday = records.find((record) => record.id === "weight-mock-006");
    expect(seededToday).toBeDefined();
    expect(todays[0].loggedAt).toBe(seededToday!.loggedAt);
    expect(
      new Date(todays[0].createdAt).getTime() >
        new Date(seededToday!.createdAt).getTime(),
    ).toBe(true);

    // The dashboard tile itself reflects the new current weight.
    expect(within(weightCard()).getByText(/70\.5/)).toBeInTheDocument();

    // Simulate SPA navigation away and back: DashboardView remounts, provider state
    // persists, and the current weight must remain the newly entered value.
    fireEvent.click(screen.getByText("navigate"));

    await waitFor(() =>
      expect(screen.getByTestId("current").textContent).toBe(String(NEW_WEIGHT)),
    );
    expect(within(weightCard()).getByText(/70\.5/)).toBeInTheDocument();
  });
});
