import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CloudDataProvider } from "@/components/providers/CloudDataProvider";
import { useDemoData } from "@/components/providers/DemoDataProvider";
import type { Food } from "@/types";

const mocks = vi.hoisted(() => ({
  toast: vi.fn(),
}));

const testFood: Food = {
  id: "food-p1c",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  name: "P1c Test Food",
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

vi.mock("@/hooks/use-i18n", () => ({
  useI18n: () => ({ locale: "en", t: (key: string) => key }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/onboarding",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/lib/repositories/client", async () => {
  const { RepositoryError } = await import("@/lib/repositories");
  return {
    createBrowserRepositories: () => ({
      profiles: { get: async () => null },
      nutritionTargets: { get: async () => null },
      mealSessions: {
        list: async () => [],
        createMany: async (rows: { id: string; date: string; mealCategory: string }[]) =>
          rows.map((row) => ({
            ...row,
            createdAt: "2026-10-15T07:00:00.000Z",
            updatedAt: "2026-10-15T07:00:00.000Z",
          })),
        delete: async () => false,
      },
      foodEntries: {
        list: async () => [],
        createMany: async () => {
          throw new RepositoryError("database", "insert failed");
        },
      },
      customFoods: { list: async () => [] },
      favorites: { list: async () => [] },
      savedMeals: {
        list: async () => [],
        create: async () => {
          throw new RepositoryError("partial-write", "items failed");
        },
      },
      weightRecords: { list: async () => [] },
      mealCartDraft: { get: async () => null, save: async () => true },
      accountPreferences: { get: async () => null },
      searchHistory: { get: async () => [] },
    }),
  };
});

function Probe() {
  const { hydrated, cartItems, addToCart, saveCart, saveCartAsMeal } = useDemoData();
  if (!hydrated) return null;
  return (
    <div>
      <output data-testid="cart-count">{cartItems.length}</output>
      <button type="button" onClick={() => void addToCart(testFood, 100)}>
        add-to-cart
      </button>
      <button type="button" onClick={() => void saveCart()}>
        save-cart
      </button>
      <button type="button" onClick={() => void saveCartAsMeal("My meal")}>
        save-as-meal
      </button>
    </div>
  );
}

function renderProvider() {
  return render(
    <CloudDataProvider userId="user-a" onSessionExpired={vi.fn()}>
      <Probe />
    </CloudDataProvider>,
  );
}

async function seedCart() {
  await screen.findByTestId("cart-count");
  fireEvent.click(screen.getByText("add-to-cart"));
  await waitFor(() => {
    expect(screen.getByTestId("cart-count").textContent).toBe("1");
  });
}

function toastTitles(): string[] {
  return mocks.toast.mock.calls.map((call) => (call[0] as { title: string }).title);
}

describe("CloudDataProvider mutation error toasts", () => {
  beforeEach(() => {
    mocks.toast.mockClear();
  });

  it("reports a rolled-back diary write with the diary-specific message", async () => {
    renderProvider();
    await seedCart();

    fireEvent.click(screen.getByText("save-cart"));

    await waitFor(() => {
      expect(toastTitles()).toContain("cloud.partialDiaryEntry");
    });
    expect(toastTitles()).not.toContain("cloud.partialSavedMeal");
  });

  it("reports a partial saved-meal write with the saved-meal message", async () => {
    renderProvider();
    await seedCart();

    fireEvent.click(screen.getByText("save-as-meal"));

    await waitFor(() => {
      expect(toastTitles()).toContain("cloud.partialSavedMeal");
    });
    expect(toastTitles()).not.toContain("cloud.partialDiaryEntry");
  });
});
