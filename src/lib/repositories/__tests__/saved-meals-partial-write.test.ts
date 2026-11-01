import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { demoFoods } from "@/data/foods";
import { createRepositories, RepositoryError } from "@/lib/repositories";

const ownerId = "11111111-1111-4111-8111-111111111111";
const timestamp = "2026-11-01T08:00:00.000Z";

type Row = Record<string, unknown>;

function createClient(itemResult: { data: unknown[] | null; error: { code: string } | null }) {
  const parentRow: Row = {
    id: "saved-meal-1",
    user_id: ownerId,
    name: "Nasi uduk breakfast",
    created_at: timestamp,
    updated_at: timestamp,
  };
  const calls: string[] = [];

  const savedMealsTable = {
    insert: () => ({
      select: () => ({
        single: () => Promise.resolve({ data: parentRow, error: null }),
      }),
    }),
    delete: () => {
      calls.push("saved_meals.delete");
      const tail: {
        eq: () => typeof tail;
        then: (resolve: (value: { data: null; error: null }) => unknown) => void;
      } = {
        eq: () => tail,
        then: (resolve) => resolve({ data: null, error: null }),
      };
      return tail;
    },
  };

  const savedMealItemsTable = {
    insert: () => ({
      select: () => Promise.resolve(itemResult),
    }),
  };

  const client = {
    auth: {
      getClaims: vi.fn().mockResolvedValue({
        data: { claims: { sub: ownerId } },
        error: null,
      }),
    },
    from: vi.fn((table: string) =>
      table === "saved_meals" ? savedMealsTable : savedMealItemsTable,
    ),
  } as unknown as SupabaseClient<Database>;

  return { client, calls };
}

const meal = {
  id: "saved-meal-1",
  createdAt: timestamp,
  updatedAt: timestamp,
  name: "Nasi uduk breakfast",
  items: [
    { food: demoFoods[0], grams: 150 },
    { food: demoFoods[1], grams: 200 },
  ],
};

describe("savedMeals.create partial-write handling", () => {
  it("removes the parent row when the item insert fails", async () => {
    const { client, calls } = createClient({
      data: null,
      error: { code: "23503" },
    });
    const repositories = createRepositories(client);

    await expect(repositories.savedMeals.create(meal)).rejects.toMatchObject({
      code: "partial-write",
    });
    expect(calls).toContain("saved_meals.delete");
  });

  it("removes the parent row when not all items are confirmed", async () => {
    const { client, calls } = createClient({ data: [], error: null });
    const repositories = createRepositories(client);

    const error = await repositories.savedMeals
      .create(meal)
      .then(() => null, (caught: unknown) => caught);

    expect(error).toBeInstanceOf(RepositoryError);
    expect(calls).toContain("saved_meals.delete");
  });
});
