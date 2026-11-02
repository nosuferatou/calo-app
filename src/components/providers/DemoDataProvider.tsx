"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  mockDiaryEntries,
  mockFavorites,
  mockNutritionTargets,
  mockSavedMeals,
  mockUserProfile,
  mockWeightRecords,
} from "@/data/mock";
import { nowIso } from "@/lib/datetime";
import { parseDateKey, todayKey, toDateKey } from "@/lib/dates";
import { CUSTOM_FOOD_SOURCE } from "@/lib/custom-foods";
import { useI18n } from "@/hooks/use-i18n";
import { useToast } from "@/hooks/use-toast";
import { notifyLanguageChange } from "@/lib/language";
import { groupEntriesIntoSessions, suggestMealCategory } from "@/lib/meals";
import { groupEntriesByDate } from "@/lib/nutrition";
import { scaleFoodNutrition } from "@/lib/nutrition";
import { notifyThemeChange } from "@/lib/theme";
import { sortWeightRecords } from "@/lib/weights";
import {
  readStorage,
  resetAllStorage,
  writeStorage,
} from "@/lib/storage/client";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import type {
  FavoriteFood,
  Food,
  FoodEntry,
  CustomFood,
  CustomFoodInput,
  MealCartItem,
  MealCategory,
  MealSession,
  NutritionTargets,
  SavedMeal,
  UserProfile,
  WeightRecord,
} from "@/types";
import { parseBackup, type BackupSummary } from "@/lib/validation/import";

interface SaveCartResult {
  ok: boolean;
  count: number;
}

interface ImportResult {
  ok: boolean;
  summary?: BackupSummary;
}

interface CopyDayResult {
  ok: boolean;
  count: number;
  sourceDate?: string;
}

export interface DemoDataContextValue {
  hydrated: boolean;
  dataMode: "demo" | "cloud";
  profile: UserProfile;
  targets: NutritionTargets;
  sessions: MealSession[];
  entries: FoodEntry[];
  customFoods: CustomFood[];
  weightRecords: WeightRecord[];
  favorites: FavoriteFood[];
  savedMeals: SavedMeal[];
  searchHistory: string[];
  catalogViewMode: "grid" | "list";
  cartItems: MealCartItem[];
  cartCategory: MealCategory;
  cartDate: string;
  cartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (food: Food, grams: number) => void;
  updateCartGrams: (foodId: string, grams: number) => void;
  removeFromCart: (foodId: string) => void;
  clearCart: () => void;
  setCartCategory: (category: MealCategory) => void;
  setCartDate: (date: string) => void;
  saveCart: () => SaveCartResult | Promise<SaveCartResult>;
  saveCartAsMeal: (name: string) => boolean | Promise<boolean>;
  updateProfile: (patch: Partial<UserProfile>) => void | Promise<boolean>;
  updateTargets: (patch: Partial<NutritionTargets>) => void | Promise<boolean>;
  addEntries: (nextEntries: FoodEntry[]) => void | Promise<boolean>;
  updateEntry: (id: string, patch: Partial<FoodEntry>) => void | Promise<boolean>;
  deleteEntry: (id: string) => void | Promise<boolean>;
  duplicateEntry: (id: string) => void | Promise<boolean>;
  deleteSession: (
    sessionId: string,
    date: string,
    category: MealCategory,
  ) => void | Promise<boolean>;
  duplicateSession: (
    sessionId: string,
    date: string,
    category: MealCategory,
  ) => void | Promise<boolean>;
  copyPreviousDay: (date: string) => CopyDayResult | Promise<CopyDayResult>;
  toggleFavorite: (food: Food) => void | Promise<boolean>;
  isFavorite: (foodId: string) => boolean;
  saveMeal: (name: string, items: MealCartItem[]) => boolean | Promise<boolean>;
  deleteSavedMeal: (id: string) => void | Promise<boolean>;
  duplicateSavedMeal: (id: string) => void | Promise<boolean>;
  loadSavedMeal: (id: string) => void | Promise<boolean>;
  addWeight: (weight: number, date: string) => void | Promise<boolean>;
  updateWeight: (id: string, weight: number, date: string) => void | Promise<boolean>;
  deleteWeight: (id: string) => void | Promise<boolean>;
  saveSearchHistory: (queries: string[]) => void | Promise<boolean>;
  createCustomFood: (input: CustomFoodInput) => boolean | Promise<boolean>;
  updateCustomFood: (
    id: string,
    input: CustomFoodInput,
  ) => boolean | Promise<boolean>;
  setCatalogViewMode: (mode: "grid" | "list") => void | Promise<void>;
  exportData: () => string;
  importData: (raw: string) => ImportResult;
  resetDemoData: () => void;
}

export const DemoDataContext = createContext<DemoDataContextValue | null>(null);

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function sortWeights(records: WeightRecord[]): WeightRecord[] {
  return sortWeightRecords(records);
}

function sortCustomFoods(foods: CustomFood[]): CustomFood[] {
  return [...foods].sort((a, b) => a.name.localeCompare(b.name));
}

function weightIso(dateKey: string): string {
  const date = parseDateKey(dateKey);
  date.setHours(7, 0, 0, 0);
  return date.toISOString();
}

function entryIso(dateKey: string, index: number): string {
  const date = parseDateKey(dateKey);
  const now = new Date();
  date.setHours(now.getHours(), now.getMinutes(), index % 60, 0);
  return date.toISOString();
}

export function DemoDataProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { toast } = useToast();

  const [hydrated, setHydrated] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(mockUserProfile);
  const [targets, setTargets] = useState<NutritionTargets>(mockNutritionTargets);
  const [sessions] = useState<MealSession[]>([]);
  const [entries, setEntries] = useState<FoodEntry[]>(mockDiaryEntries);
  const [customFoods, setCustomFoods] = useState<CustomFood[]>([]);
  const [weightRecords, setWeightRecords] =
    useState<WeightRecord[]>(sortWeights(mockWeightRecords));
  const [favorites, setFavorites] = useState<FavoriteFood[]>(mockFavorites);
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>(mockSavedMeals);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [catalogViewMode, setCatalogViewModeState] = useState<"grid" | "list">("grid");
  const [cartItems, setCartItems] = useState<MealCartItem[]>([]);
  const [cartCategory, setCartCategoryState] = useState<MealCategory>("breakfast");
  const [cartDate, setCartDateState] = useState<string>("");
  const [cartOpen, setCartOpen] = useState(false);

  // Hydration reads an external system (localStorage) once on mount, then
  // replaces the demo seed with the user's stored data. This is the intended
  // use of an effect, so the compiler's set-state-in-effect rule is disabled
  // for this block only.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const profileResult = readStorage(STORAGE_KEYS.profile);

    if (profileResult.status === "ok") {
      setProfile(profileResult.data);
    } else if (profileResult.status === "missing") {
      writeStorage(STORAGE_KEYS.profile, mockUserProfile);
    }

    const targetsResult = readStorage(STORAGE_KEYS.targets);

    if (targetsResult.status === "ok") {
      setTargets(targetsResult.data);
    } else if (targetsResult.status === "missing") {
      writeStorage(STORAGE_KEYS.targets, mockNutritionTargets);
    }

    const diaryResult = readStorage(STORAGE_KEYS.foodDiary);

    if (diaryResult.status === "ok" && Array.isArray(diaryResult.data.entries)) {
      setEntries(diaryResult.data.entries);
    } else if (diaryResult.status === "missing") {
      writeStorage(STORAGE_KEYS.foodDiary, { entries: mockDiaryEntries });
    }

    const weightResult = readStorage(STORAGE_KEYS.weightRecords);

    if (weightResult.status === "ok" && Array.isArray(weightResult.data.records)) {
      setWeightRecords(sortWeights(weightResult.data.records));
    } else if (weightResult.status === "missing") {
      writeStorage(STORAGE_KEYS.weightRecords, { records: mockWeightRecords });
    }

    const collectionsResult = readStorage(STORAGE_KEYS.collections);

    if (collectionsResult.status === "ok") {
      if (Array.isArray(collectionsResult.data.favoriteFoods)) {
        setFavorites(collectionsResult.data.favoriteFoods);
      }

      const searchHistoryResult = readStorage(STORAGE_KEYS.searchHistory);
      if (searchHistoryResult.status === "ok") {
        setSearchHistory(searchHistoryResult.data.queries);
      }

      const appResult = readStorage(STORAGE_KEYS.app);
      if (appResult.status === "ok" && appResult.data.catalogViewMode === "list") {
        setCatalogViewModeState("list");
      }

      if (Array.isArray(collectionsResult.data.savedMeals)) {
        setSavedMeals(collectionsResult.data.savedMeals);
      }
    } else if (collectionsResult.status === "missing") {
      writeStorage(STORAGE_KEYS.collections, {
        favoriteFoods: mockFavorites,
        savedMeals: mockSavedMeals,
      });
    }

    const customFoodsResult = readStorage(STORAGE_KEYS.customFoods);
    if (customFoodsResult.status === "ok") {
      setCustomFoods(customFoodsResult.data.foods);
    }

    const cartResult = readStorage(STORAGE_KEYS.mealCartDraft);

    if (cartResult.status === "ok") {
      if (Array.isArray(cartResult.data.items)) {
        setCartItems(cartResult.data.items);
      }

      if (cartResult.data.mealCategory) {
        setCartCategoryState(cartResult.data.mealCategory);
      }

      if (cartResult.data.date) {
        setCartDateState(cartResult.data.date);
      } else {
        setCartDateState(todayKey());
      }

      if (!cartResult.data.mealCategory) {
        setCartCategoryState(suggestMealCategory());
      }
    } else {
      setCartCategoryState(suggestMealCategory());
      setCartDateState(todayKey());
    }

    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const persistCart = useCallback(
    (items: MealCartItem[], category: MealCategory, date: string) => {
      writeStorage(STORAGE_KEYS.mealCartDraft, {
        id: "meal-cart-draft",
        createdAt: nowIso(),
        updatedAt: nowIso(),
        items,
        mealCategory: category,
        date,
      });
    },
    [],
  );

  const persistEntries = useCallback((nextEntries: FoodEntry[]) => {
    setEntries(nextEntries);
    writeStorage(STORAGE_KEYS.foodDiary, { entries: nextEntries });
  }, []);

  const persistFavorites = useCallback(
    (nextFavorites: FavoriteFood[], nextMeals: SavedMeal[]) => {
      setFavorites(nextFavorites);
      setSavedMeals(nextMeals);
      writeStorage(STORAGE_KEYS.collections, {
        favoriteFoods: nextFavorites,
        savedMeals: nextMeals,
      });
    },
    [],
  );

  const persistWeights = useCallback((records: WeightRecord[]) => {
    const sorted = sortWeights(records);
    setWeightRecords(sorted);
    writeStorage(STORAGE_KEYS.weightRecords, { records: sorted });
  }, []);

  const persistCustomFoods = useCallback((nextFoods: CustomFood[]) => {
    const sorted = sortCustomFoods(nextFoods);
    setCustomFoods(sorted);
    writeStorage(STORAGE_KEYS.customFoods, { foods: sorted });
  }, []);

  const saveSearchHistory = useCallback((queries: string[]) => {
    setSearchHistory(queries);
    writeStorage(STORAGE_KEYS.searchHistory, { queries });
  }, []);

  const createCustomFood = useCallback(
    (input: CustomFoodInput): boolean => {
      const createdAt = nowIso();
      const food: CustomFood = {
        ...input,
        id: createId("custom-food"),
        createdAt,
        updatedAt: createdAt,
        synonyms: [],
        source: CUSTOM_FOOD_SOURCE,
        isCustom: true,
      };

      persistCustomFoods([...customFoods, food]);
      toast({
        title: t("customFood.created", { name: food.name }),
        variant: "success",
      });
      return true;
    },
    [customFoods, persistCustomFoods, t, toast],
  );

  const updateCustomFood = useCallback(
    (id: string, input: CustomFoodInput): boolean => {
      if (!customFoods.some((food) => food.id === id)) {
        return false;
      }

      persistCustomFoods(
        customFoods.map((food) =>
          food.id === id
            ? { ...food, ...input, updatedAt: nowIso() }
            : food,
        ),
      );
      toast({
        title: t("customFood.updated", { name: input.name }),
        variant: "success",
      });
      return true;
    },
    [customFoods, persistCustomFoods, t, toast],
  );

  const setCatalogViewMode = useCallback((mode: "grid" | "list") => {
    setCatalogViewModeState(mode);
    const current = readStorage(STORAGE_KEYS.app);
    const appData = current.status === "ok" ? current.data : {};
    writeStorage(STORAGE_KEYS.app, { ...appData, catalogViewMode: mode });
  }, []);

  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  const addToCart = useCallback(
    (food: Food, grams: number) => {
      const safeGrams = Number.isFinite(grams) && grams > 0 ? grams : food.defaultGrams;
      const existing = cartItems.find((item) => item.food.id === food.id);
      const nextItems = existing
        ? cartItems.map((item) =>
            item.food.id === food.id
              ? { ...item, grams: item.grams + safeGrams }
              : item,
          )
        : [...cartItems, { food, grams: safeGrams }];

      const nextCategory =
        cartItems.length === 0 ? suggestMealCategory() : cartCategory;

      setCartItems(nextItems);
      setCartCategoryState(nextCategory);
      persistCart(nextItems, nextCategory, cartDate);
      toast({
        title: t("catalog.addedToCart", { name: food.name }),
        variant: "success",
      });
    },
    [cartCategory, cartDate, cartItems, persistCart, t, toast],
  );

  const updateCartGrams = useCallback(
    (foodId: string, grams: number) => {
      const safeGrams = Number.isFinite(grams) && grams > 0 ? grams : 0;

      if (safeGrams <= 0) {
        const nextItems = cartItems.filter((item) => item.food.id !== foodId);
        setCartItems(nextItems);
        persistCart(nextItems, cartCategory, cartDate);
        return;
      }

      const nextItems = cartItems.map((item) =>
        item.food.id === foodId ? { ...item, grams: safeGrams } : item,
      );
      setCartItems(nextItems);
      persistCart(nextItems, cartCategory, cartDate);
    },
    [cartCategory, cartDate, cartItems, persistCart],
  );

  const removeFromCart = useCallback(
    (foodId: string) => {
      const nextItems = cartItems.filter((item) => item.food.id !== foodId);
      setCartItems(nextItems);
      persistCart(nextItems, cartCategory, cartDate);
      toast({ title: t("cart.removeSuccess"), variant: "success" });
    },
    [cartCategory, cartDate, cartItems, persistCart, t, toast],
  );

  const clearCart = useCallback(() => {
    setCartItems([]);
    persistCart([], cartCategory, cartDate);
  }, [cartCategory, cartDate, persistCart]);

  const setCartCategory = useCallback(
    (category: MealCategory) => {
      setCartCategoryState(category);
      persistCart(cartItems, category, cartDate);
    },
    [cartDate, cartItems, persistCart],
  );

  const setCartDate = useCallback(
    (date: string) => {
      setCartDateState(date);
      persistCart(cartItems, cartCategory, date);
    },
    [cartCategory, cartItems, persistCart],
  );

  const saveCart = useCallback((): SaveCartResult => {
    if (cartItems.length === 0) {
      return { ok: false, count: 0 };
    }

    const sessionId = createId(`session-${cartDate}`);
    const createdAt = nowIso();
    const nextEntries = cartItems.map((item, index) => {
      const nutrition = scaleFoodNutrition(item.food, item.grams);

      return {
        id: createId("entry"),
        createdAt,
        updatedAt: createdAt,
        foodId: item.food.id,
        name: item.food.name,
        grams: item.grams,
        mealCategory: cartCategory,
        loggedAt: entryIso(cartDate, index),
        sessionId,
        ...nutrition,
      } satisfies FoodEntry;
    });

    persistEntries([...entries, ...nextEntries]);
    setCartItems([]);
    persistCart([], cartCategory, cartDate);
    setCartOpen(false);
    toast({ title: t("cart.saveSuccess"), variant: "success" });

    return { ok: true, count: nextEntries.length };
  }, [
    cartCategory,
    cartDate,
    cartItems,
    entries,
    persistCart,
    persistEntries,
    t,
    toast,
  ]);

  const saveCartAsMeal = useCallback(
    (name: string): boolean => {
      if (!name.trim() || cartItems.length === 0) {
        return false;
      }

      const meal: SavedMeal = {
        id: createId("saved-meal"),
        createdAt: nowIso(),
        updatedAt: nowIso(),
        name: name.trim(),
        items: cartItems.map((item) => ({ food: item.food, grams: item.grams })),
      };

      persistFavorites(favorites, [...savedMeals, meal]);
      toast({
        title: t("cart.savedMealSuccess", { name: meal.name }),
        variant: "success",
      });
      return true;
    },
    [cartItems, favorites, persistFavorites, savedMeals, t, toast],
  );

  const updateProfile = useCallback((patch: Partial<UserProfile>) => {
    setProfile((current) => {
      const next = { ...current, ...patch, updatedAt: nowIso() };
      writeStorage(STORAGE_KEYS.profile, next);
      return next;
    });
  }, []);

  const updateTargets = useCallback((patch: Partial<NutritionTargets>) => {
    setTargets((current) => {
      const source = patch.source ?? "manual";
      const next = {
        ...current,
        ...patch,
        source,
        updatedAt: nowIso(),
      };

      if (source === "manual") {
        next.bmr = undefined;
        next.tdee = undefined;
        next.activityPal = undefined;
        next.formulaVersion = undefined;
        next.calculatedAt = undefined;
        next.requestedDeficitKcal = undefined;
        next.actualDeficitKcal = undefined;
        next.calorieGuardrailKcal = undefined;
      }

      writeStorage(STORAGE_KEYS.targets, next);
      return next;
    });
  }, []);

  const addEntries = useCallback(
    (nextEntries: FoodEntry[]) => {
      persistEntries([...entries, ...nextEntries]);
    },
    [entries, persistEntries],
  );

  const updateEntry = useCallback(
    (id: string, patch: Partial<FoodEntry>) => {
      persistEntries(
        entries.map((entry) =>
          entry.id === id
            ? { ...entry, ...patch, updatedAt: nowIso() }
            : entry,
        ),
      );
    },
    [entries, persistEntries],
  );

  const deleteEntry = useCallback(
    (id: string) => {
      persistEntries(entries.filter((entry) => entry.id !== id));
      toast({ title: t("diary.deleteSuccess"), variant: "success" });
    },
    [entries, persistEntries, t, toast],
  );

  const duplicateEntry = useCallback(
    (id: string) => {
      const entry = entries.find((candidate) => candidate.id === id);

      if (!entry) {
        return;
      }

      persistEntries([
        ...entries,
        {
          ...entry,
          id: createId("entry"),
          createdAt: nowIso(),
          updatedAt: nowIso(),
        },
      ]);
      toast({ title: t("diary.duplicateSuccess"), variant: "success" });
    },
    [entries, persistEntries, t, toast],
  );

  const deleteSession = useCallback(
    (sessionId: string, date: string, category: MealCategory) => {
      const sessionEntries = groupEntriesIntoSessions(
        entries.filter(
          (entry) =>
            (entry.logDate ?? toDateKey(new Date(entry.loggedAt))) === date &&
            entry.mealCategory === category,
        ),
      ).find((session) => session.sessionId === sessionId)?.entries;
      if (!sessionEntries?.length) return;
      const sessionEntryIds = new Set(sessionEntries.map((entry) => entry.id));
      persistEntries(entries.filter((entry) => !sessionEntryIds.has(entry.id)));
      toast({ title: t("diary.sessionDeleteSuccess"), variant: "success" });
    },
    [entries, persistEntries, t, toast],
  );

  const duplicateSession = useCallback(
    (sessionId: string, date: string, category: MealCategory) => {
      const sessionEntries = groupEntriesIntoSessions(
        entries.filter(
          (entry) =>
            (entry.logDate ?? toDateKey(new Date(entry.loggedAt))) === date &&
            entry.mealCategory === category,
        ),
      ).find((session) => session.sessionId === sessionId)?.entries ?? [];

      if (sessionEntries.length === 0) {
        return;
      }

      const nextSessionId = createId(`session-${todayKey()}`);

      persistEntries([
        ...entries,
        ...sessionEntries.map((entry) => ({
          ...entry,
          id: createId("entry"),
          sessionId: nextSessionId,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        })),
      ]);
      toast({ title: t("diary.sessionDuplicateSuccess"), variant: "success" });
    },
    [entries, persistEntries, t, toast],
  );

  const copyPreviousDay = useCallback(
    (date: string): CopyDayResult => {
      const grouped = groupEntriesByDate(entries);
      const previousDate = [...grouped.keys()]
        .filter((key) => key < date)
        .sort((a, b) => b.localeCompare(a))[0];

      if (!previousDate) {
        return { ok: false, count: 0 };
      }

      const sourceEntries = grouped.get(previousDate) ?? [];
      const sessionMap = new Map<string, string>();
      const createdAt = nowIso();

      const copied = sourceEntries.map((entry) => {
        const sourceSession = entry.sessionId ?? entry.id;
        const mappedSession =
          sessionMap.get(sourceSession) ??
          createId(`session-${date}-${entry.mealCategory}`);
        sessionMap.set(sourceSession, mappedSession);

        const sourceDate = new Date(entry.loggedAt);
        const targetDate = parseDateKey(date);
        targetDate.setHours(
          sourceDate.getHours(),
          sourceDate.getMinutes(),
          sourceDate.getSeconds(),
          0,
        );

        return {
          ...entry,
          id: createId("entry"),
          sessionId: mappedSession,
          loggedAt: targetDate.toISOString(),
          createdAt,
          updatedAt: createdAt,
        };
      });

      persistEntries([...entries, ...copied]);

      return {
        ok: true,
        count: copied.length,
        sourceDate: previousDate,
      };
    },
    [entries, persistEntries],
  );

  const toggleFavorite = useCallback(
    (food: Food) => {
      const existing = favorites.find((favorite) => favorite.foodId === food.id);

      if (existing) {
        persistFavorites(
          favorites.filter((favorite) => favorite.foodId !== food.id),
          savedMeals,
        );
        toast({
          title: t("catalog.favoriteRemoved", { name: food.name }),
          variant: "success",
        });
        return;
      }

      persistFavorites(
        [
          ...favorites,
          {
            id: createId("favorite"),
            createdAt: nowIso(),
            updatedAt: nowIso(),
            foodId: food.id,
          },
        ],
        savedMeals,
      );
      toast({
        title: t("catalog.favoriteAdded", { name: food.name }),
        variant: "success",
      });
    },
    [favorites, persistFavorites, savedMeals, t, toast],
  );

  const isFavorite = useCallback(
    (foodId: string) => favorites.some((favorite) => favorite.foodId === foodId),
    [favorites],
  );

  const saveMeal = useCallback(
    (name: string, items: MealCartItem[]): boolean => {
      if (!name.trim() || items.length === 0) {
        return false;
      }

      const meal: SavedMeal = {
        id: createId("saved-meal"),
        createdAt: nowIso(),
        updatedAt: nowIso(),
        name: name.trim(),
        items: items.map((item) => ({ food: item.food, grams: item.grams })),
      };

      persistFavorites(favorites, [...savedMeals, meal]);
      toast({
        title: t("cart.savedMealSuccess", { name: meal.name }),
        variant: "success",
      });
      return true;
    },
    [favorites, persistFavorites, savedMeals, t, toast],
  );

  const deleteSavedMeal = useCallback(
    (id: string) => {
      persistFavorites(
        favorites,
        savedMeals.filter((meal) => meal.id !== id),
      );
      toast({ title: t("collection.savedMealDeleted"), variant: "success" });
    },
    [favorites, persistFavorites, savedMeals, t, toast],
  );

  const duplicateSavedMeal = useCallback(
    (id: string) => {
      const meal = savedMeals.find((candidate) => candidate.id === id);

      if (!meal) {
        return;
      }

      persistFavorites(favorites, [
        ...savedMeals,
        {
          ...meal,
          id: createId("saved-meal"),
          name: `${meal.name} · copy`,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        },
      ]);
      toast({
        title: t("collection.savedMealDuplicated"),
        variant: "success",
      });
    },
    [favorites, persistFavorites, savedMeals, t, toast],
  );

  const loadSavedMeal = useCallback(
    (id: string) => {
      const meal = savedMeals.find((candidate) => candidate.id === id);

      if (!meal) {
        return;
      }

      const nextItems = meal.items.map((item) => ({
        food: item.food,
        grams: item.grams,
      }));
      const nextCategory =
        cartItems.length === 0 ? suggestMealCategory() : cartCategory;

      setCartItems(nextItems);
      setCartCategoryState(nextCategory);
      persistCart(nextItems, nextCategory, cartDate);
      setCartOpen(true);
      toast({
        title: t("collection.loadedIntoCart", { name: meal.name }),
        variant: "success",
      });
    },
    [
      cartCategory,
      cartDate,
      cartItems.length,
      persistCart,
      savedMeals,
      t,
      toast,
    ],
  );

  const addWeight = useCallback(
    (weight: number, date: string) => {
      const createdAt = nowIso();
      const next: WeightRecord = {
        id: createId("weight"),
        createdAt,
        updatedAt: createdAt,
        weight,
        loggedAt: weightIso(date),
      };

      persistWeights([...weightRecords, next]);
      toast({ title: t("analytics.weightSaved"), variant: "success" });
    },
    [persistWeights, t, toast, weightRecords],
  );

  const updateWeight = useCallback(
    (id: string, weight: number, date: string) => {
      persistWeights(
        weightRecords.map((record) =>
          record.id === id
            ? {
                ...record,
                weight,
                loggedAt: weightIso(date),
                updatedAt: nowIso(),
              }
            : record,
        ),
      );
      toast({ title: t("analytics.weightUpdated"), variant: "success" });
    },
    [persistWeights, t, toast, weightRecords],
  );

  const deleteWeight = useCallback(
    (id: string) => {
      persistWeights(weightRecords.filter((record) => record.id !== id));
      toast({ title: t("analytics.weightDeleted"), variant: "success" });
    },
    [persistWeights, t, toast, weightRecords],
  );

  const exportData = useCallback(() => {
    return JSON.stringify(
      {
        app: "CALO",
        version: 1,
        exportedAt: nowIso(),
        profile,
        targets,
        entries,
        weightRecords,
        favorites,
        savedMeals,
      },
      null,
      2,
    );
  }, [entries, favorites, profile, savedMeals, targets, weightRecords]);

  const importData = useCallback(
    (raw: string): ImportResult => {
      const result = parseBackup(raw);

      if (!result.ok) {
        return { ok: false };
      }

      const { backup, summary } = result;

      setProfile(backup.profile as UserProfile);
      setTargets(backup.targets as NutritionTargets);
      setEntries(backup.entries as FoodEntry[]);
      setWeightRecords(sortWeights(backup.weightRecords as WeightRecord[]));
      setFavorites(backup.favorites as FavoriteFood[]);
      setSavedMeals(backup.savedMeals as SavedMeal[]);

      writeStorage(STORAGE_KEYS.profile, backup.profile as UserProfile);
      writeStorage(STORAGE_KEYS.targets, backup.targets as NutritionTargets);
      writeStorage(STORAGE_KEYS.foodDiary, {
        entries: backup.entries as FoodEntry[],
      });
      writeStorage(STORAGE_KEYS.weightRecords, {
        records: backup.weightRecords as WeightRecord[],
      });
      writeStorage(STORAGE_KEYS.collections, {
        favoriteFoods: backup.favorites as FavoriteFood[],
        savedMeals: backup.savedMeals as SavedMeal[],
      });

      return { ok: true, summary };
    },
    [],
  );

  const resetDemoData = useCallback(() => {
    resetAllStorage({ confirmed: true });

    setProfile(mockUserProfile);
    setTargets(mockNutritionTargets);
    setEntries(mockDiaryEntries);
    setWeightRecords(sortWeights(mockWeightRecords));
    setFavorites(mockFavorites);
    setSavedMeals(mockSavedMeals);
    setCustomFoods([]);
    setCartItems([]);
    setCartCategoryState(suggestMealCategory());
    setCartDateState(todayKey());

    writeStorage(STORAGE_KEYS.profile, mockUserProfile);
    writeStorage(STORAGE_KEYS.targets, mockNutritionTargets);
    writeStorage(STORAGE_KEYS.foodDiary, { entries: mockDiaryEntries });
    writeStorage(STORAGE_KEYS.weightRecords, { records: mockWeightRecords });
    writeStorage(STORAGE_KEYS.collections, {
      favoriteFoods: mockFavorites,
      savedMeals: mockSavedMeals,
    });

    notifyLanguageChange();
    notifyThemeChange();
  }, []);

  const value = useMemo<DemoDataContextValue>(
    () => ({
      hydrated,
      dataMode: "demo",
      profile,
      targets,
      sessions,
      entries,
      customFoods,
      weightRecords,
      favorites,
      savedMeals,
      searchHistory,
      catalogViewMode,
      cartItems,
      cartCategory,
      cartDate,
      cartOpen,
      openCart,
      closeCart,
      addToCart,
      updateCartGrams,
      removeFromCart,
      clearCart,
      setCartCategory,
      setCartDate,
      saveCart,
      saveCartAsMeal,
      updateProfile,
      updateTargets,
      addEntries,
      updateEntry,
      deleteEntry,
      duplicateEntry,
      deleteSession,
      duplicateSession,
      copyPreviousDay,
      toggleFavorite,
      isFavorite,
      saveMeal,
      deleteSavedMeal,
      duplicateSavedMeal,
      loadSavedMeal,
      addWeight,
      updateWeight,
      deleteWeight,
      saveSearchHistory,
      createCustomFood,
      updateCustomFood,
      setCatalogViewMode,
      exportData,
      importData,
      resetDemoData,
    }),
    [
      addEntries,
      addToCart,
      addWeight,
      cartCategory,
      cartDate,
      cartItems,
      cartOpen,
      catalogViewMode,
      clearCart,
      closeCart,
      copyPreviousDay,
      createCustomFood,
      deleteEntry,
      deleteSavedMeal,
      deleteSession,
      deleteWeight,
      duplicateEntry,
      duplicateSavedMeal,
      duplicateSession,
      entries,
      exportData,
      favorites,
      hydrated,
      importData,
      isFavorite,
      loadSavedMeal,
      openCart,
      profile,
      customFoods,
      searchHistory,
      sessions,
      saveSearchHistory,
      setCatalogViewMode,
      removeFromCart,
      resetDemoData,
      saveCart,
      saveCartAsMeal,
      saveMeal,
      savedMeals,
      setCartCategory,
      setCartDate,
      targets,
      toggleFavorite,
      updateCartGrams,
      updateEntry,
      updateProfile,
      updateTargets,
      updateCustomFood,
      updateWeight,
      weightRecords,
    ],
  );

  return (
    <DemoDataContext.Provider value={value}>
      {children}
    </DemoDataContext.Provider>
  );
}

export function useDemoData(): DemoDataContextValue {
  const context = useContext(DemoDataContext);

  if (!context) {
    throw new Error("useDemoData must be used within DemoDataProvider");
  }

  return context;
}
