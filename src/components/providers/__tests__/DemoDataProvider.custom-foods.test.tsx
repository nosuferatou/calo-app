import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DemoDataProvider,
  useDemoData,
} from "@/components/providers/DemoDataProvider";
import { CUSTOM_FOOD_SOURCE } from "@/lib/custom-foods";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import type { CustomFood, CustomFoodInput, CustomFoodsData } from "@/types";

vi.mock("@/hooks/use-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const input: CustomFoodInput = {
  name: "Homemade soup",
  category: "others",
  defaultGrams: 250,
  calories: 130,
  protein: 2.7,
  carbohydrates: 28,
  fat: 0.3,
  fiber: 0.4,
  sugar: 0.1,
  saturatedFat: 0.1,
  sodium: 1,
};

function readStoredCustomFoods(): CustomFood[] {
  const raw = localStorage.getItem(STORAGE_KEYS.customFoods);
  if (!raw) throw new Error("custom food storage was not written");
  const envelope = JSON.parse(raw) as {
    version: number;
    data: CustomFoodsData;
  };
  return envelope.data.foods;
}

function CustomFoodProbe() {
  const {
    customFoods,
    createCustomFood,
    hydrated,
    resetDemoData,
    updateCustomFood,
  } = useDemoData();

  if (!hydrated) return null;

  return (
    <div>
      <output data-testid="count">{customFoods.length}</output>
      <output data-testid="foods">{JSON.stringify(customFoods)}</output>
      <button type="button" onClick={() => void createCustomFood(input)}>
        create
      </button>
      <button
        type="button"
        onClick={() => {
          const first = customFoods[0];
          if (first) {
            void updateCustomFood(first.id, {
              ...input,
              name: "Updated soup",
              calories: 140,
            });
          }
        }}
      >
        update
      </button>
      <button type="button" onClick={resetDemoData}>
        reset
      </button>
    </div>
  );
}

describe("DemoDataProvider custom foods", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("loads stored custom foods during hydration", async () => {
    const stored: CustomFood = {
      id: "custom-food-stored",
      createdAt: "2026-11-01T10:00:00.000Z",
      updatedAt: "2026-11-01T10:00:00.000Z",
      ...input,
      synonyms: [],
      source: CUSTOM_FOOD_SOURCE,
      isCustom: true,
    };
    localStorage.setItem(
      STORAGE_KEYS.customFoods,
      JSON.stringify({
        version: 1,
        data: { foods: [stored] },
      }),
    );

    render(
      <DemoDataProvider>
        <CustomFoodProbe />
      </DemoDataProvider>,
    );

    await screen.findByTestId("count");
    expect(screen.getByTestId("count").textContent).toBe("1");
  });

  it("persists a created custom food with its ownership metadata", async () => {
    render(
      <DemoDataProvider>
        <CustomFoodProbe />
      </DemoDataProvider>,
    );

    await screen.findByTestId("count");
    fireEvent.click(screen.getByRole("button", { name: "create" }));

    await waitFor(() =>
      expect(screen.getByTestId("count").textContent).toBe("1"),
    );

    const stored = readStoredCustomFoods();
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      ...input,
      synonyms: [],
      source: CUSTOM_FOOD_SOURCE,
      isCustom: true,
    });
    expect(stored[0].id).toMatch(/^custom-food-/);
    expect(stored[0].createdAt).toEqual(expect.any(String));
    expect(stored[0].updatedAt).toBe(stored[0].createdAt);
  });

  it("updates a custom food in place and keeps its creation timestamp", async () => {
    render(
      <DemoDataProvider>
        <CustomFoodProbe />
      </DemoDataProvider>,
    );

    await screen.findByTestId("count");
    fireEvent.click(screen.getByRole("button", { name: "create" }));
    await waitFor(() =>
      expect(screen.getByTestId("count").textContent).toBe("1"),
    );
    const created = readStoredCustomFoods()[0];

    fireEvent.click(screen.getByRole("button", { name: "update" }));

    await waitFor(() => {
      const foods = JSON.parse(
        screen.getByTestId("foods").textContent ?? "[]",
      ) as CustomFood[];
      expect(foods[0]?.name).toBe("Updated soup");
    });

    const stored = readStoredCustomFoods();
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      id: created.id,
      createdAt: created.createdAt,
      name: "Updated soup",
      calories: 140,
    });
  });

  it("clears custom foods when demo data is reset", async () => {
    render(
      <DemoDataProvider>
        <CustomFoodProbe />
      </DemoDataProvider>,
    );

    await screen.findByTestId("count");
    fireEvent.click(screen.getByRole("button", { name: "create" }));
    await waitFor(() =>
      expect(screen.getByTestId("count").textContent).toBe("1"),
    );

    fireEvent.click(screen.getByRole("button", { name: "reset" }));

    await waitFor(() =>
      expect(screen.getByTestId("count").textContent).toBe("0"),
    );
    expect(localStorage.getItem(STORAGE_KEYS.customFoods)).toBeNull();
  });
});
