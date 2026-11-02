import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CloudDataProvider } from "@/components/providers/CloudDataProvider";
import { useDemoData } from "@/components/providers/DemoDataProvider";
import { parseDateKey } from "@/lib/dates";
import type { WeightRecord } from "@/types";

const NEW_CREATED_AT = "2026-10-15T09:00:00.000Z";
const DATE = "2026-10-15";

function loggedAtFor(date: string): string {
  const d = parseDateKey(date);
  d.setHours(7, 0, 0, 0);
  return d.toISOString();
}

const existing: WeightRecord = {
  id: "w-old",
  createdAt: "2026-10-15T08:00:00.000Z",
  updatedAt: "2026-10-15T08:00:00.000Z",
  weight: 62,
  loggedAt: loggedAtFor(DATE),
};

vi.mock("@/lib/repositories/client", () => ({
  createBrowserRepositories: () => ({
    profiles: { get: async () => null },
    nutritionTargets: { get: async () => null },
    mealSessions: { list: async () => [] },
    foodEntries: { list: async () => [] },
    customFoods: { list: async () => [] },
    favorites: { list: async () => [] },
    savedMeals: { list: async () => [] },
    weightRecords: {
      list: async () => [existing],
      create: async (input: { id: string; weight: number; loggedAt: string }) => ({
        id: input.id,
        createdAt: NEW_CREATED_AT,
        updatedAt: NEW_CREATED_AT,
        weight: input.weight,
        loggedAt: input.loggedAt,
      }),
    },
    mealCartDraft: { get: async () => null },
    accountPreferences: { get: async () => null },
    searchHistory: { get: async () => [] },
  }),
}));

vi.mock("@/hooks/use-i18n", () => ({
  useI18n: () => ({ locale: "en", t: (key: string) => key }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/onboarding",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

function WeightProbe() {
  const { hydrated, weightRecords, addWeight } = useDemoData();
  if (!hydrated) return null;
  return (
    <div>
      <output data-testid="weights">{JSON.stringify(weightRecords)}</output>
      <button type="button" onClick={() => void addWeight(61.4, DATE)}>
        add-weight
      </button>
    </div>
  );
}

function readWeights(): WeightRecord[] {
  return JSON.parse(screen.getByTestId("weights").textContent ?? "[]") as WeightRecord[];
}

describe("CloudDataProvider addWeight refresh", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("makes a new same-day record the latest immediately after saving", async () => {
    render(
      <CloudDataProvider userId="user-a" onSessionExpired={vi.fn()}>
        <WeightProbe />
      </CloudDataProvider>,
    );

    await screen.findByTestId("weights");
    expect(readWeights()).toHaveLength(1);

    fireEvent.click(screen.getByText("add-weight"));

    await waitFor(() => {
      const weights = readWeights();
      expect(weights).toHaveLength(2);
      const latest = weights[weights.length - 1];
      expect(latest.weight).toBe(61.4);
      expect(latest.createdAt).toBe(NEW_CREATED_AT);
    });
  });
});
