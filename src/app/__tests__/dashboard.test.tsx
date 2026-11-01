import type { ReactNode } from "react";
import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { ToastProvider } from "@/components/common/ToastProvider";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { DemoDataProvider } from "@/components/providers/DemoDataProvider";
import { mockFoodEntries, mockNutritionTargets } from "@/data/mock";
import { sumFoodEntries } from "@/lib/nutrition";
import { writeStorage } from "@/lib/storage/client";
import { STORAGE_KEYS } from "@/lib/storage/keys";

const totals = sumFoodEntries(mockFoodEntries);
const expectedCalories = Math.round(totals.calories);
const expectedRemaining = Math.round(
  mockNutritionTargets.calories - totals.calories,
);

async function renderDashboard() {
  await act(async () => {
    render(
      <ToastProvider>
        <DemoDataProvider>
          <DashboardView />
        </DemoDataProvider>
      </ToastProvider>,
    );
  });
}

describe("Dashboard view", () => {
  beforeEach(() => {
    writeStorage(STORAGE_KEYS.settings, {
      theme: "system",
      language: "en",
    });
  });

  it("renders the daily calorie overview sections", async () => {
    await renderDashboard();

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Daily calories")).toBeInTheDocument();
    expect(screen.getByText("Macros")).toBeInTheDocument();
    expect(screen.getByText("Meals")).toBeInTheDocument();
    expect(screen.getByText("Recent activity")).toBeInTheDocument();
    expect(screen.getByText("Current weight")).toBeInTheDocument();
  });

  it("exposes the consumed calories through the progressbar roles", async () => {
    await renderDashboard();

    const progressBars = screen.getAllByRole("progressbar");

    expect(progressBars).toHaveLength(4);
    expect(progressBars[0]).toHaveAttribute(
      "aria-valuenow",
      String(expectedCalories),
    );
    expect(progressBars[0]).toHaveAttribute(
      "aria-valuemax",
      String(mockNutritionTargets.calories),
    );
  });

  it("renders the remaining and target calorie figures", async () => {
    await renderDashboard();

    expect(screen.getByText("Remaining")).toBeInTheDocument();
    expect(screen.getByText("Target")).toBeInTheDocument();
    expect(
      screen.getByText(expectedRemaining.toLocaleString("en-US")),
    ).toBeInTheDocument();
  });
});
