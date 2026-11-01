import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database";
import {
  createRepositories,
  RepositoryError,
} from "@/lib/repositories";

const currentUserId = "11111111-1111-4111-8111-111111111111";

function createMockClient(options?: {
  claims?: { sub: string } | null;
  claimsError?: { code: string } | null;
  response?: { data: unknown; error: { code: string } | null };
}) {
  let response = options?.response ?? { data: null, error: null };
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    in: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    maybeSingle: vi.fn(),
    single: vi.fn(),
  };
  [
    query.select,
    query.eq,
    query.order,
    query.in,
    query.insert,
    query.update,
    query.upsert,
    query.delete,
  ].forEach((method) => method.mockReturnValue(query));
  query.maybeSingle.mockImplementation(() => Promise.resolve(response));
  query.single.mockImplementation(() => Promise.resolve(response));
  Object.assign(query, {
    then: (
      resolve: (value: typeof response) => unknown,
      reject?: (reason: unknown) => unknown,
    ) => Promise.resolve(response).then(resolve, reject),
  });

  const getClaims = vi.fn().mockResolvedValue({
    data: options?.claims ? { claims: options.claims } : { claims: null },
    error: options?.claimsError ?? null,
  });
  const client = {
    auth: { getClaims },
    from: vi.fn(() => query),
  } as unknown as SupabaseClient<Database>;

  return {
    client,
    getClaims,
    query,
    setResponse(next: typeof response) {
      response = next;
    },
  };
}

describe("authenticated Supabase repositories", () => {
  it("derives owner filters from verified claims and returns empty singleton data safely", async () => {
    const { client, query } = createMockClient({
      claims: { sub: currentUserId },
    });
    const repositories = createRepositories(client);

    await expect(repositories.profiles.get()).resolves.toBeNull();
    expect(query.eq).toHaveBeenCalledWith("user_id", currentUserId);
  });

  it("does not issue database requests when claims are expired or unavailable", async () => {
    const { client } = createMockClient({
      claimsError: { code: "session_expired" },
    });
    const repositories = createRepositories(client);

    await expect(repositories.weightRecords.list()).rejects.toMatchObject({
      code: "unauthenticated",
    });
    expect(client.from).not.toHaveBeenCalled();
  });

  it("rejects operations when verified claims no longer match the provider account", async () => {
    const { client } = createMockClient({
      claims: { sub: currentUserId },
    });
    const repositories = createRepositories(client, "22222222-2222-4222-8222-222222222222");

    await expect(repositories.weightRecords.list()).rejects.toMatchObject({
      code: "unauthenticated",
    });
    expect(client.from).not.toHaveBeenCalled();
  });

  it("uses the verified claim as owner on writes and keeps list empty states empty", async () => {
    const row: Tables<"food_entries"> = {
      user_id: currentUserId,
      id: "entry-1",
      session_id: null,
      log_date: "2026-11-02",
      meal_category: "lunch",
      food_id: "rice-1",
      name: "Rice",
      grams: 100,
      serving_label: null,
      logged_at: "2026-11-02T05:30:00.000+00:00",
      calories: 130,
      protein: 2.7,
      carbohydrates: 28,
      fat: 0.3,
      fiber: null,
      sugar: null,
      saturated_fat: null,
      sodium: null,
      created_at: "2026-11-02T05:30:00.000Z",
      updated_at: "2026-11-02T05:30:00.000Z",
    };
    const { client, query, setResponse } = createMockClient({
      claims: { sub: currentUserId },
    });
    const repositories = createRepositories(client);

    await expect(repositories.foodEntries.list()).resolves.toEqual([]);
    setResponse({ data: row, error: null });
    await repositories.foodEntries.create({
      id: row.id,
      foodId: row.food_id,
      name: row.name,
      grams: row.grams,
      logDate: row.log_date,
      mealCategory: "lunch",
      loggedAt: row.logged_at,
      calories: row.calories,
      protein: row.protein,
      carbohydrates: row.carbohydrates,
      fat: row.fat,
    });

    expect(query.insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: currentUserId, id: "entry-1" }),
    );
  });

  it("rejects invalid write data before contacting the database", async () => {
    const { client, query } = createMockClient({
      claims: { sub: currentUserId },
    });
    const repositories = createRepositories(client);

    await expect(
      repositories.nutritionTargets.save({
        calories: -1,
        protein: 90,
        carbohydrates: 200,
        fat: 50,
      }),
    ).rejects.toBeInstanceOf(RepositoryError);
    expect(query.upsert).not.toHaveBeenCalled();
  });

  it("returns a safe database error with the database error code", async () => {
    const { client } = createMockClient({
      claims: { sub: currentUserId },
      response: { data: null, error: { code: "XX000" } },
    });
    const repositories = createRepositories(client);

    await expect(repositories.profiles.get()).rejects.toMatchObject({
      code: "database",
      databaseCode: "XX000",
    });
  });

  it("saves a meal cart draft with its timestamps and food snapshot", async () => {
    const timestamp = "2026-11-02T05:30:00.000+00:00";
    const food = {
      id: "rice-1",
      createdAt: timestamp,
      updatedAt: timestamp,
      name: "Rice",
      category: "rice-grains" as const,
      defaultGrams: 100,
      calories: 130,
      protein: 2.7,
      carbohydrates: 28,
      fat: 0.3,
      fiber: 0.4,
      sugar: 0.1,
      saturatedFat: 0.1,
      sodium: 1,
      synonyms: [],
      source: "Local test catalog",
    };
    const row: Tables<"meal_cart_drafts"> = {
      user_id: currentUserId,
      id: "meal-cart-draft",
      log_date: "2026-11-02",
      meal_category: "lunch",
      items: [{ food, grams: 123.45 }],
      created_at: timestamp,
      updated_at: timestamp,
    };
    const { client, query } = createMockClient({
      claims: { sub: currentUserId },
      response: { data: row, error: null },
    });
    const repositories = createRepositories(client);

    await expect(repositories.mealCartDraft.save({
      id: row.id,
      createdAt: timestamp,
      updatedAt: timestamp,
      date: row.log_date,
      mealCategory: "lunch",
      items: [{ food, grams: 123.45 }],
    })).resolves.toMatchObject({
      id: row.id,
      date: row.log_date,
      mealCategory: "lunch",
      items: [{ food: { id: food.id }, grams: 123.45 }],
    });
    expect(query.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: currentUserId,
        id: row.id,
        log_date: row.log_date,
        meal_category: "lunch",
      }),
      { onConflict: "user_id" },
    );
  });

  it("uses the verified owner for updates and deletes", async () => {
    const updatedEntry: Tables<"food_entries"> = {
      user_id: currentUserId,
      id: "entry-1",
      session_id: null,
      log_date: "2026-11-02",
      meal_category: "lunch",
      food_id: "rice-1",
      name: "Rice",
      grams: 100,
      serving_label: null,
      logged_at: "2026-11-02T05:30:00.000Z",
      calories: 130,
      protein: 2.7,
      carbohydrates: 28,
      fat: 0.3,
      fiber: null,
      sugar: null,
      saturated_fat: null,
      sodium: null,
      created_at: "2026-11-02T05:30:00.000Z",
      updated_at: "2026-11-02T05:30:00.000Z",
    };
    const { client, query, setResponse } = createMockClient({
      claims: { sub: currentUserId },
      response: { data: updatedEntry, error: null },
    });
    const repositories = createRepositories(client);

    await repositories.foodEntries.update("entry-1", { grams: 100.5 });
    expect(query.eq).toHaveBeenCalledWith("user_id", currentUserId);
    expect(query.update).toHaveBeenCalledWith(
      expect.objectContaining({ grams: 100.5 }),
    );

    query.select.mockReturnValueOnce(query);
    setResponse({ data: [{ id: "favorite-1" }], error: null });
    await repositories.favorites.delete("favorite-1");
    expect(query.delete).toHaveBeenCalled();
  });

  it("scopes custom food writes to the verified owner and marks them as custom", async () => {
    const row: Tables<"custom_foods"> = {
      user_id: currentUserId,
      id: "custom-food-1",
      name: "Homemade soup",
      category: "others",
      default_grams: 250,
      calories: 130,
      protein: 2.7,
      carbohydrates: 28,
      fat: 0.3,
      fiber: 0.4,
      sugar: 0.1,
      saturated_fat: 0.1,
      sodium: 1,
      synonyms: [],
      source: "User-entered values",
      created_at: "2026-11-01T10:00:00.000Z",
      updated_at: "2026-11-01T10:00:00.000Z",
    };
    const { client, query, setResponse } = createMockClient({
      claims: { sub: currentUserId },
      response: { data: row, error: null },
    });
    const repositories = createRepositories(client);

    const created = await repositories.customFoods.create({
      id: row.id,
      name: row.name,
      category: "others",
      defaultGrams: row.default_grams,
      calories: row.calories,
      protein: row.protein,
      carbohydrates: row.carbohydrates,
      fat: row.fat,
      fiber: row.fiber,
      sugar: row.sugar,
      saturatedFat: row.saturated_fat,
      sodium: row.sodium,
      synonyms: [],
      source: row.source,
    });

    expect(created).toMatchObject({ id: row.id, isCustom: true });
    expect(query.insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: currentUserId, id: row.id }),
    );

    setResponse({ data: row, error: null });
    await repositories.customFoods.update(row.id, { name: "Updated soup" });

    expect(query.update).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Updated soup" }),
    );
    expect(query.eq).toHaveBeenCalledWith("user_id", currentUserId);
    expect(query.eq).toHaveBeenCalledWith("id", row.id);

    setResponse({ data: null, error: null });
    await expect(
      repositories.customFoods.update("custom-food-other-owner", {
        name: "Not mine",
      }),
    ).resolves.toBeNull();
  });
});
