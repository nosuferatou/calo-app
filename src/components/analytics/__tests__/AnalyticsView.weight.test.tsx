import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AnalyticsView } from "@/components/analytics/AnalyticsView";
import type { WeightRecord } from "@/types";

const mocks = vi.hoisted(() => ({
  addWeight: vi.fn(),
  updateWeight: vi.fn(),
  deleteWeight: vi.fn(),
  weightRecords: [] as WeightRecord[],
}));

vi.mock("recharts", () => ({
  CartesianGrid: () => null,
  Line: () => null,
  LineChart: () => null,
  ResponsiveContainer: () => null,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

vi.mock("@/hooks/use-i18n", () => ({
  useI18n: () => ({ locale: "en", t: (key: string) => key }),
}));

vi.mock("@/components/providers/DemoDataProvider", () => ({
  useDemoData: () => ({
    entries: [],
    addWeight: mocks.addWeight,
    updateWeight: mocks.updateWeight,
    deleteWeight: mocks.deleteWeight,
    weightRecords: mocks.weightRecords,
  }),
}));

function renderAnalytics() {
  render(<AnalyticsView />);
  fireEvent.click(screen.getByRole("button", { name: "analytics.addWeight" }));
}

describe("Analytics weight dialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.weightRecords = [];
    mocks.addWeight.mockResolvedValue(true);
    mocks.updateWeight.mockResolvedValue(true);
    mocks.deleteWeight.mockResolvedValue(true);
  });

  it("keeps focus in the weight input while typing several digits", () => {
    renderAnalytics();

    const input = screen.getByLabelText("analytics.weightKg");
    input.focus();

    fireEvent.change(input, { target: { value: "6" } });
    fireEvent.change(input, { target: { value: "68" } });
    fireEvent.change(input, { target: { value: "68.5" } });

    expect(document.activeElement).toBe(input);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(input).toHaveValue(68.5);
  });

  it("saves through the provider and closes the dialog on success", async () => {
    renderAnalytics();

    fireEvent.change(screen.getByLabelText("analytics.weightKg"), {
      target: { value: "68.5" },
    });
    fireEvent.click(screen.getByRole("button", { name: "common.save" }));

    await waitFor(() => {
      expect(mocks.addWeight).toHaveBeenCalledWith(68.5, expect.any(String));
    });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  it("shows a visible error for invalid weight without calling the provider", () => {
    renderAnalytics();

    fireEvent.change(screen.getByLabelText("analytics.weightKg"), {
      target: { value: "-2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "common.save" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "analytics.weightInvalid",
    );
    expect(mocks.addWeight).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("keeps the dialog open when the persistence call fails", async () => {
    mocks.addWeight.mockResolvedValue(false);
    renderAnalytics();

    fireEvent.change(screen.getByLabelText("analytics.weightKg"), {
      target: { value: "70" },
    });
    fireEvent.click(screen.getByRole("button", { name: "common.save" }));

    await waitFor(() => {
      expect(mocks.addWeight).toHaveBeenCalled();
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
