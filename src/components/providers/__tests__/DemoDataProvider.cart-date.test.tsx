import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DemoDataProvider,
  useDemoData,
} from "@/components/providers/DemoDataProvider";
import { todayKey, toDateKey } from "@/lib/dates";
import type { Food, FoodEntry } from "@/types";

vi.mock("@/hooks/use-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const PAST_DATE = "2000-01-15";

const testFood: Food = {
  id: "food-p1a",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  name: "P1a Test Food",
  category: "others",
  defaultGrams: 100,
  synonyms: [],
  source: "test",
  calories: 250,
  protein: 10,
  carbohydrates: 20,
  fat: 5,
  fiber: 2,
  sugar: 1,
  saturatedFat: 1,
  sodium: 50,
};

function CartProbe() {
  const { hydrated, entries, setCartDate, addToCart, saveCart } = useDemoData();
  if (!hydrated) return null;
  return (
    <div>
      <output data-testid="entries">{JSON.stringify(entries)}</output>
      <button type="button" onClick={() => setCartDate(PAST_DATE)}>
        set-date
      </button>
      <button type="button" onClick={() => addToCart(testFood, 100)}>
        add
      </button>
      <button type="button" onClick={() => void saveCart()}>
        save
      </button>
    </div>
  );
}

function readEntries(): FoodEntry[] {
  return JSON.parse(screen.getByTestId("entries").textContent ?? "[]") as FoodEntry[];
}

describe("DemoDataProvider cart date persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("logs saved cart entries to the selected cart date, not today", async () => {
    render(
      <DemoDataProvider>
        <CartProbe />
      </DemoDataProvider>,
    );

    await screen.findByTestId("entries");
    expect(todayKey()).not.toBe(PAST_DATE);

    fireEvent.click(screen.getByText("set-date"));
    fireEvent.click(screen.getByText("add"));
    fireEvent.click(screen.getByText("save"));

    await waitFor(() => {
      const saved = readEntries().filter((e) => e.name === testFood.name);
      expect(saved.length).toBeGreaterThan(0);
      for (const entry of saved) {
        expect(toDateKey(new Date(entry.loggedAt))).toBe(PAST_DATE);
      }
    });
  });
});
