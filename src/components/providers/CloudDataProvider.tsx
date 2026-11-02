"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { AccountPreferencesContext } from "@/components/providers/AccountPreferencesContext";
import {
  DemoDataContext,
  type DemoDataContextValue,
} from "@/components/providers/DemoDataProvider";
import { useI18n } from "@/hooks/use-i18n";
import { useToast } from "@/hooks/use-toast";
import { createBrowserRepositories } from "@/lib/repositories/client";
import { RepositoryError, type Repositories } from "@/lib/repositories";
import { CUSTOM_FOOD_SOURCE } from "@/lib/custom-foods";
import { nowIso } from "@/lib/datetime";
import { parseDateKey, todayKey, toDateKey } from "@/lib/dates";
import { groupEntriesByDate, scaleFoodNutrition } from "@/lib/nutrition";
import { sortWeightRecords } from "@/lib/weights";
import { groupEntriesIntoSessions, suggestMealCategory } from "@/lib/meals";
import type {
  CustomFood,
  CustomFoodInput,
  FavoriteFood,
  Food,
  FoodEntry,
  MealCartItem,
  MealCategory,
  MealSession,
  NutritionTargets,
  SavedMeal,
  UserProfile,
  WeightRecord,
} from "@/types";

type CloudDataProviderProps = {
  userId: string;
  onSessionExpired: () => void;
  children: ReactNode;
};

const EMPTY_TIME = "1970-01-01T00:00:00.000Z";

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function emptyProfile(userId: string): UserProfile {
  return {
    id: userId,
    createdAt: EMPTY_TIME,
    updatedAt: EMPTY_TIME,
  };
}

function emptyTargets(userId: string): NutritionTargets {
  return {
    id: userId,
    createdAt: EMPTY_TIME,
    updatedAt: EMPTY_TIME,
    calories: 0,
    protein: 0,
    carbohydrates: 0,
    fat: 0,
    source: "manual",
  };
}

function isProfileComplete(profile: UserProfile): boolean {
  return (
    profile.ageYears !== undefined &&
    profile.biologicalSex !== undefined &&
    profile.heightCm !== undefined &&
    profile.currentWeightKg !== undefined &&
    profile.activityLevel !== undefined &&
    profile.workoutDaysPerWeek !== undefined &&
    profile.fitnessGoal !== undefined &&
    profile.targetWeightKg !== undefined &&
    profile.desiredRateKgPerWeek !== undefined &&
    profile.macroPreference !== undefined
  );
}

function storedDate(entry: FoodEntry): string {
  return entry.logDate ?? toDateKey(new Date(entry.loggedAt));
}

function sessionDateKey(entry: FoodEntry): string {
  const date = parseDateKey(storedDate(entry));
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}`;
}

function sessionIdentity(entry: FoodEntry): string {
  return entry.sessionId ?? sessionDateKey(entry);
}

function profilePatchFrom(
  profile: Partial<UserProfile>,
): Partial<UserProfile> {
  return {
    displayName: profile.displayName,
    ageYears: profile.ageYears,
    biologicalSex: profile.biologicalSex,
    heightCm: profile.heightCm,
    currentWeightKg: profile.currentWeightKg,
    activityLevel: profile.activityLevel,
    workoutDaysPerWeek: profile.workoutDaysPerWeek,
    fitnessGoal: profile.fitnessGoal,
    targetWeightKg: profile.targetWeightKg,
    desiredRateKgPerWeek: profile.desiredRateKgPerWeek,
    macroPreference: profile.macroPreference,
    customMacroSplit: profile.customMacroSplit,
  };
}

function targetValues(
  current: NutritionTargets,
  patch: Partial<NutritionTargets>,
): Omit<NutritionTargets, "id" | "createdAt" | "updatedAt"> {
  const source = patch.source ?? current.source ?? "manual";
  return {
    calories: patch.calories ?? current.calories,
    protein: patch.protein ?? current.protein,
    carbohydrates: patch.carbohydrates ?? current.carbohydrates,
    fat: patch.fat ?? current.fat,
    source,
    bmr: source === "manual" ? undefined : patch.bmr ?? current.bmr,
    tdee: source === "manual" ? undefined : patch.tdee ?? current.tdee,
    activityPal:
      source === "manual"
        ? undefined
        : patch.activityPal ?? current.activityPal,
    formulaVersion:
      source === "manual"
        ? undefined
        : patch.formulaVersion ?? current.formulaVersion,
    calculatedAt:
      source === "manual"
        ? undefined
        : patch.calculatedAt ?? current.calculatedAt,
    requestedDeficitKcal:
      source === "manual"
        ? undefined
        : patch.requestedDeficitKcal ?? current.requestedDeficitKcal,
    actualDeficitKcal:
      source === "manual"
        ? undefined
        : patch.actualDeficitKcal ?? current.actualDeficitKcal,
    calorieGuardrailKcal:
      source === "manual"
        ? undefined
        : patch.calorieGuardrailKcal ?? current.calorieGuardrailKcal,
  };
}

function fullEntry(
  entry: FoodEntry,
  logDate = storedDate(entry),
): Omit<FoodEntry, "createdAt" | "updatedAt"> & { logDate: string } {
  const { createdAt, updatedAt, ...values } = entry;
  void createdAt;
  void updatedAt;
  return { ...values, logDate };
}

function accountKey(
  date: string,
  category: MealCategory,
  sessionId: string,
): string {
  return `${date}|${category}|${sessionId}`;
}

function LoadingPanel({ label }: { label: string }) {
  return (
    <main
      className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-medium text-slate-900 dark:text-white">
          {label}
        </p>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="h-full w-1/3 rounded-full bg-brand-600" />
        </div>
      </div>
    </main>
  );
}

export function CloudDataProvider({
  userId,
  onSessionExpired,
  children,
}: CloudDataProviderProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const pathname = usePathname();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);
  const repositoriesRef = useRef<Repositories | null>(null);
  const draftQueueRef = useRef<Promise<void>>(Promise.resolve());

  const [profile, setProfile] = useState<UserProfile>(() => emptyProfile(userId));
  const [profileExists, setProfileExists] = useState(false);
  const [targets, setTargets] = useState<NutritionTargets>(() => emptyTargets(userId));
  const [sessions, setSessions] = useState<MealSession[]>([]);
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [customFoods, setCustomFoods] = useState<CustomFood[]>([]);
  const [weightRecords, setWeightRecords] = useState<WeightRecord[]>([]);
  const [favorites, setFavorites] = useState<FavoriteFood[]>([]);
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [catalogViewMode, setCatalogViewModeState] = useState<"grid" | "list">("grid");
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [language, setLanguage] = useState<"en" | "id">("id");
  const [cartItems, setCartItems] = useState<MealCartItem[]>([]);
  const [cartCategory, setCartCategoryState] = useState<MealCategory>(
    suggestMealCategory(),
  );
  const [cartDate, setCartDateState] = useState(todayKey());
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const repositories = createBrowserRepositories(userId);
        repositoriesRef.current = repositories;
        const [
          nextProfile,
          nextTargets,
          nextSessions,
          nextEntries,
          nextCustomFoods,
          nextFavorites,
          nextSavedMeals,
          nextWeights,
          nextDraft,
          preferences,
          queries,
        ] = await Promise.all([
          repositories.profiles.get(),
          repositories.nutritionTargets.get(),
          repositories.mealSessions.list(),
          repositories.foodEntries.list(),
          repositories.customFoods.list(),
          repositories.favorites.list(),
          repositories.savedMeals.list(),
          repositories.weightRecords.list(),
          repositories.mealCartDraft.get(),
          repositories.accountPreferences.get(),
          repositories.searchHistory.get(),
        ]);
        if (!active) return;
        setProfile(nextProfile ?? emptyProfile(userId));
        setProfileExists(nextProfile !== null);
        setTargets(nextTargets ?? emptyTargets(userId));
        setSessions(nextSessions);
        setEntries(nextEntries);
        setCustomFoods(nextCustomFoods);
        setFavorites(nextFavorites);
        setSavedMeals(nextSavedMeals);
        setWeightRecords(nextWeights);
        setSearchHistory(queries);
        if (preferences) {
          setTheme(preferences.theme);
          setLanguage(preferences.language);
          setCatalogViewModeState(preferences.catalogViewMode ?? "grid");
        }
        if (nextDraft) {
          setCartItems(nextDraft.items);
          setCartCategoryState(nextDraft.mealCategory);
          setCartDateState(nextDraft.date);
        }
        setHydrated(true);
      } catch (error) {
        if (!active) return;
        if (error instanceof RepositoryError && error.code === "unauthenticated") {
          onSessionExpired();
          return;
        }
        setLoadError(true);
      }
    }

    void load();
    return () => {
      active = false;
      repositoriesRef.current = null;
    };
  }, [onSessionExpired, retry, userId]);

  const reportMutationError = useCallback(
    (error: unknown) => {
      if (error instanceof RepositoryError && error.code === "unauthenticated") {
        onSessionExpired();
        return;
      }
      const message =
        error instanceof RepositoryError && error.code === "partial-diary-write"
          ? t("cloud.partialDiaryEntry")
          : error instanceof RepositoryError && error.code === "partial-write"
            ? t("cloud.partialSavedMeal")
            : t("cloud.writeFailed");
      toast({ title: message, variant: "error" });
    },
    [onSessionExpired, t, toast],
  );

  const perform = useCallback(
    async <T,>(operation: () => Promise<T>, fallback: T): Promise<T> => {
      try {
        return await operation();
      } catch (error) {
        reportMutationError(error);
        return fallback;
      }
    },
    [reportMutationError],
  );

  const persistDraft = useCallback(
    (
      items: MealCartItem[],
      mealCategory: MealCategory,
      date: string,
    ): Promise<boolean> => {
      const repository = repositoriesRef.current;
      if (!repository) return Promise.resolve(false);
      const now = nowIso();
      const draft = {
        id: "meal-cart-draft",
        createdAt: now,
        updatedAt: now,
        items,
        mealCategory,
        date,
      };
      return new Promise((resolve) => {
        draftQueueRef.current = draftQueueRef.current.then(async () => {
          try {
            await repository.mealCartDraft.save(draft);
            resolve(true);
          } catch (error) {
            reportMutationError(error);
            resolve(false);
          }
        });
      });
    },
    [reportMutationError],
  );

  const insertEntries = useCallback(
    async (newEntries: FoodEntry[]) => {
      const repository = repositoriesRef.current;
      if (!repository) throw new RepositoryError("unauthenticated", "Sign-in is required.");
      const rows = newEntries.map((entry) => fullEntry(entry));
      const knownSessions = new Set(
        sessions.map((session) =>
          accountKey(session.date, session.mealCategory, session.id),
        ),
      );
      const needed = new Map<string, Pick<MealSession, "id" | "date" | "mealCategory">>();
      for (const entry of rows) {
        if (!entry.sessionId) continue;
        const key = accountKey(entry.logDate, entry.mealCategory, entry.sessionId);
        if (!knownSessions.has(key)) {
          needed.set(key, {
            id: entry.sessionId,
            date: entry.logDate,
            mealCategory: entry.mealCategory,
          });
        }
      }
      const createdSessions =
        needed.size > 0
          ? await repository.mealSessions.createMany([...needed.values()])
          : [];
      try {
        const createdEntries = await repository.foodEntries.createMany(rows);
        setSessions((current) => [...current, ...createdSessions]);
        setEntries((current) => [...current, ...createdEntries]);
        return createdEntries;
      } catch (error) {
        if (createdSessions.length > 0) {
          // Roll the just-created sessions back so a failed entry insert cannot
          // leave empty sessions in the diary; the partial write is still
          // reported to the user.
          await Promise.all(
            createdSessions.map((session) =>
              repository.mealSessions
                .delete(session.id, session.date, session.mealCategory)
                .catch(() => false),
            ),
          );
          throw new RepositoryError(
            "partial-diary-write",
            "Meal sessions were created, but food entries could not be saved.",
          );
        }
        throw error;
      }
    },
    [sessions],
  );

  const saveTheme = useCallback(
    async (nextTheme: "light" | "dark" | "system") => {
      const repository = repositoriesRef.current;
      if (!repository) return;
      const saved = await perform(
        () =>
          repository.accountPreferences.save({
            theme: nextTheme,
            language,
            catalogViewMode,
          }),
        null,
      );
      if (saved) setTheme(saved.theme);
    },
    [catalogViewMode, language, perform],
  );

  const saveLanguage = useCallback(
    async (nextLanguage: "en" | "id") => {
      const repository = repositoriesRef.current;
      if (!repository) return;
      const saved = await perform(
        () =>
          repository.accountPreferences.save({
            theme,
            language: nextLanguage,
            catalogViewMode,
          }),
        null,
      );
      if (saved) setLanguage(saved.language);
    },
    [catalogViewMode, perform, theme],
  );

  const accountPreferences = useMemo(
    () => ({
      mode: "cloud" as const,
      theme,
      language,
      saveTheme,
      saveLanguage,
    }),
    [language, saveLanguage, saveTheme, theme],
  );

  useEffect(() => {
    if (!hydrated || isProfileComplete(profile) || pathname === "/onboarding") return;
    router.replace("/onboarding");
  }, [hydrated, pathname, profile, router]);

  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  const addToCart = useCallback(
    async (food: Food, grams: number) => {
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
      const saved = await persistDraft(nextItems, nextCategory, cartDate);
      if (saved) {
        toast({
          title: t("catalog.addedToCart", { name: food.name }),
          variant: "success",
        });
      }
      return saved;
    },
    [cartCategory, cartDate, cartItems, persistDraft, t, toast],
  );

  const updateCartGrams = useCallback(
    (foodIdValue: string, grams: number) => {
      const safeGrams = Number.isFinite(grams) && grams > 0 ? grams : 0;
      const nextItems =
        safeGrams <= 0
          ? cartItems.filter((item) => item.food.id !== foodIdValue)
          : cartItems.map((item) =>
              item.food.id === foodIdValue ? { ...item, grams: safeGrams } : item,
            );
      setCartItems(nextItems);
      void persistDraft(nextItems, cartCategory, cartDate);
    },
    [cartCategory, cartDate, cartItems, persistDraft],
  );

  const removeFromCart = useCallback(
    async (foodIdValue: string) => {
      const nextItems = cartItems.filter((item) => item.food.id !== foodIdValue);
      setCartItems(nextItems);
      const saved = await persistDraft(nextItems, cartCategory, cartDate);
      if (saved) toast({ title: t("cart.removeSuccess"), variant: "success" });
      return saved;
    },
    [cartCategory, cartDate, cartItems, persistDraft, t, toast],
  );

  const clearCart = useCallback(() => {
    setCartItems([]);
    void persistDraft([], cartCategory, cartDate);
  }, [cartCategory, cartDate, persistDraft]);

  const setCartCategory = useCallback(
    (next: MealCategory) => {
      setCartCategoryState(next);
      void persistDraft(cartItems, next, cartDate);
    },
    [cartDate, cartItems, persistDraft],
  );

  const setCartDate = useCallback(
    (next: string) => {
      setCartDateState(next);
      void persistDraft(cartItems, cartCategory, next);
    },
    [cartCategory, cartItems, persistDraft],
  );

  const saveCart = useCallback(async () => {
    if (cartItems.length === 0) return { ok: false, count: 0 };
    const date = cartDate;
    const sessionId = createId(`session-${date}`);
    const createdAt = nowIso();
    const nextEntries = cartItems.map((item, index) => {
      const nutrition = scaleFoodNutrition(item.food, item.grams);
      const loggedAtDate = parseDateKey(date);
      const now = new Date();
      loggedAtDate.setHours(now.getHours(), now.getMinutes(), index % 60, 0);
      return {
        id: createId("entry"),
        createdAt,
        updatedAt: createdAt,
        foodId: item.food.id,
        name: item.food.name,
        grams: item.grams,
        logDate: date,
        mealCategory: cartCategory,
        loggedAt: loggedAtDate.toISOString(),
        sessionId,
        ...nutrition,
      } satisfies FoodEntry;
    });
    // Clear the stored draft before inserting, so a failed cleanup write cannot
    // leave already-saved items behind for a later reload to log a second time.
    if (!(await persistDraft([], cartCategory, cartDate))) {
      toast({ title: t("cloud.writeFailed"), variant: "error" });
      return { ok: false, count: 0 };
    }
    const result = await perform(
      () => insertEntries(nextEntries),
      null,
    );
    if (!result) {
      // Entries were not written: put the draft back so the cart stays recoverable.
      await persistDraft(cartItems, cartCategory, cartDate);
      return { ok: false, count: 0 };
    }
    setCartItems([]);
    setCartOpen(false);
    toast({ title: t("cart.saveSuccess"), variant: "success" });
    return { ok: true, count: result.length };
  }, [
    cartCategory,
    cartDate,
    cartItems,
    insertEntries,
    perform,
    persistDraft,
    t,
    toast,
  ]);

  const saveCartAsMeal = useCallback(
    async (name: string) => {
      if (!name.trim() || cartItems.length === 0) return false;
      const meal: SavedMeal = {
        id: createId("saved-meal"),
        createdAt: nowIso(),
        updatedAt: nowIso(),
        name: name.trim(),
        items: cartItems.map((item) => ({ food: item.food, grams: item.grams })),
      };
      const repository = repositoriesRef.current;
      if (!repository) return false;
      try {
        const saved = await repository.savedMeals.create(meal);
        setSavedMeals((current) => [...current, saved]);
        toast({
          title: t("cart.savedMealSuccess", { name: saved.name }),
          variant: "success",
        });
        return true;
      } catch (error) {
        if (error instanceof RepositoryError && error.code === "partial-write") {
          const currentMeals = await perform(() => repository.savedMeals.list(), null);
          if (currentMeals) setSavedMeals(currentMeals);
        }
        reportMutationError(error);
        return false;
      }
    },
    [cartItems, perform, reportMutationError, t, toast],
  );

  const updateProfile = useCallback(
    async (patch: Partial<UserProfile>) => {
      const repository = repositoriesRef.current;
      if (!repository) return false;
      if (!profileExists) {
        toast({ title: t("cloud.profileMissing"), variant: "error" });
        return false;
      }
      const saved = await perform(
        () => repository.profiles.update(profilePatchFrom(patch)),
        null,
      );
      if (!saved) return false;
      setProfile(saved);
      return true;
    },
    [perform, profileExists, t, toast],
  );

  const updateTargets = useCallback(
    async (patch: Partial<NutritionTargets>) => {
      const repository = repositoriesRef.current;
      if (!repository) return false;
      const saved = await perform(
        () => repository.nutritionTargets.save(targetValues(targets, patch)),
        null,
      );
      if (!saved) return false;
      setTargets(saved);
      return true;
    },
    [perform, targets],
  );

  const addEntries = useCallback(
    async (newEntries: FoodEntry[]) =>
      (await perform(() => insertEntries(newEntries), null)) !== null,
    [insertEntries, perform],
  );

  const updateEntry = useCallback(
    async (id: string, patch: Partial<FoodEntry>) => {
      const repository = repositoriesRef.current;
      if (!repository) return false;
      const existing = entries.find((entry) => entry.id === id);
      if (!existing) return false;
      const updated = await perform(
        () => repository.foodEntries.update(id, patch),
        null,
      );
      if (!updated) return false;
      setEntries((current) =>
        current.map((entry) => (entry.id === id ? updated : entry)),
      );
      return true;
    },
    [entries, perform],
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      const repository = repositoriesRef.current;
      if (!repository) return false;
      const deleted = await perform(() => repository.foodEntries.delete(id), false);
      if (!deleted) return false;
      setEntries((current) => current.filter((entry) => entry.id !== id));
      toast({ title: t("diary.deleteSuccess"), variant: "success" });
      return true;
    },
    [perform, t, toast],
  );

  const duplicateEntry = useCallback(
    async (id: string) => {
      const entry = entries.find((candidate) => candidate.id === id);
      if (!entry) return false;
      const createdAt = nowIso();
      const duplicate = {
        ...entry,
        id: createId("entry"),
        createdAt,
        updatedAt: createdAt,
      };
      const inserted = await perform(() => insertEntries([duplicate]), null);
      if (!inserted) return false;
      toast({ title: t("diary.duplicateSuccess"), variant: "success" });
      return true;
    },
    [entries, insertEntries, perform, t, toast],
  );

  const deleteSession = useCallback(
    async (sessionId: string, date: string, category: MealCategory) => {
      const group = groupEntriesIntoSessions(
        entries.filter(
          (entry) =>
            storedDate(entry) === date && entry.mealCategory === category,
        ),
      ).find(
        (candidate) => candidate.sessionId === sessionId,
      );
      if (!group || group.entries.length === 0) return false;
      const first = group.entries[0];
      const matching = entries.filter(
        (entry) =>
          storedDate(entry) === date &&
          entry.mealCategory === category &&
          sessionIdentity(entry) === sessionId,
      );
      const repository = repositoriesRef.current;
      if (!repository) return false;
      const deleted =
        first.sessionId === sessionId
          ? await perform(
              () => repository.mealSessions.delete(sessionId, date, category),
              false,
            )
          : (await perform(
              () =>
                repository.foodEntries.deleteMany(
                  matching.map((entry) => entry.id),
                ),
              0,
            )) === matching.length;
      if (!deleted) return false;
      setEntries((current) =>
        current.filter((entry) => !matching.some((item) => item.id === entry.id)),
      );
      setSessions((current) =>
        current.filter(
          (session) =>
            accountKey(session.date, session.mealCategory, session.id) !==
            accountKey(date, category, sessionId),
        ),
      );
      toast({ title: t("diary.sessionDeleteSuccess"), variant: "success" });
      return true;
    },
    [entries, perform, t, toast],
  );

  const duplicateSession = useCallback(
    async (sessionId: string, date: string, category: MealCategory) => {
      const group = groupEntriesIntoSessions(
        entries.filter(
          (entry) =>
            storedDate(entry) === date && entry.mealCategory === category,
        ),
      ).find(
        (candidate) => candidate.sessionId === sessionId,
      );
      if (!group || group.entries.length === 0) return false;
      const nextSessionId = createId(`session-${todayKey()}`);
      const createdAt = nowIso();
      const duplicates = group.entries.map((entry) => ({
        ...entry,
        id: createId("entry"),
        sessionId: nextSessionId,
        createdAt,
        updatedAt: createdAt,
      }));
      const inserted = await perform(() => insertEntries(duplicates), null);
      if (!inserted) return false;
      toast({ title: t("diary.sessionDuplicateSuccess"), variant: "success" });
      return true;
    },
    [entries, insertEntries, perform, t, toast],
  );

  const copyPreviousDay = useCallback(
    async (date: string) => {
      const grouped = groupEntriesByDate(entries);
      const previousDate = [...grouped.keys()]
        .filter((key) => key < date)
        .sort((a, b) => b.localeCompare(a))[0];
      if (!previousDate) return { ok: false, count: 0 };
      const sourceEntries = grouped.get(previousDate) ?? [];
      const sessionMap = new Map<string, string>();
      const createdAt = nowIso();
      const copied = sourceEntries.map((entry) => {
        const sourceSession = entry.sessionId ?? sessionIdentity(entry);
        let nextSession = sessionMap.get(sourceSession);
        if (!nextSession) {
          nextSession = createId(`session-${date}-${entry.mealCategory}`);
          sessionMap.set(sourceSession, nextSession);
        }
        const targetDate = parseDateKey(date);
        const sourceDate = new Date(entry.loggedAt);
        targetDate.setHours(
          sourceDate.getHours(),
          sourceDate.getMinutes(),
          sourceDate.getSeconds(),
          0,
        );
        return {
          ...entry,
          id: createId("entry"),
          logDate: date,
          sessionId: nextSession,
          loggedAt: targetDate.toISOString(),
          createdAt,
          updatedAt: createdAt,
        };
      });
      const inserted = await perform(() => insertEntries(copied), null);
      if (!inserted) return { ok: false, count: 0 };
      return { ok: true, count: inserted.length, sourceDate: previousDate };
    },
    [entries, insertEntries, perform],
  );

  const toggleFavorite = useCallback(
    async (food: Food) => {
      const repository = repositoriesRef.current;
      if (!repository) return false;
      const existing = favorites.find((favorite) => favorite.foodId === food.id);
      if (existing) {
        const deleted = await perform(
          () => repository.favorites.delete(existing.id),
          false,
        );
        if (!deleted) return false;
        setFavorites((current) =>
          current.filter((favorite) => favorite.id !== existing.id),
        );
        toast({
          title: t("catalog.favoriteRemoved", { name: food.name }),
          variant: "success",
        });
        return true;
      }
      const favorite = await perform(
        () =>
          repository.favorites.create({
            id: createId("favorite"),
            foodId: food.id,
            source: "isCustom" in food && food.isCustom ? "custom" : "catalog",
          }),
        null,
      );
      if (!favorite) return false;
      setFavorites((current) => [...current, favorite]);
      toast({
        title: t("catalog.favoriteAdded", { name: food.name }),
        variant: "success",
      });
      return true;
    },
    [favorites, perform, t, toast],
  );

  const isFavorite = useCallback(
    (foodIdValue: string) =>
      favorites.some((favorite) => favorite.foodId === foodIdValue),
    [favorites],
  );

  const saveMeal = useCallback(
    async (name: string, items: MealCartItem[]) => {
      if (!name.trim() || items.length === 0) return false;
      const meal: SavedMeal = {
        id: createId("saved-meal"),
        createdAt: nowIso(),
        updatedAt: nowIso(),
        name: name.trim(),
        items: items.map((item) => ({ food: item.food, grams: item.grams })),
      };
      const repository = repositoriesRef.current;
      if (!repository) return false;
      try {
        const saved = await repository.savedMeals.create(meal);
        setSavedMeals((current) => [...current, saved]);
        toast({
          title: t("cart.savedMealSuccess", { name: saved.name }),
          variant: "success",
        });
        return true;
      } catch (error) {
        if (error instanceof RepositoryError && error.code === "partial-write") {
          const currentMeals = await perform(() => repository.savedMeals.list(), null);
          if (currentMeals) setSavedMeals(currentMeals);
        }
        reportMutationError(error);
        return false;
      }
    },
    [perform, reportMutationError, t, toast],
  );

  const deleteSavedMeal = useCallback(
    async (id: string) => {
      const repository = repositoriesRef.current;
      if (!repository) return false;
      const deleted = await perform(() => repository.savedMeals.delete(id), false);
      if (!deleted) return false;
      setSavedMeals((current) => current.filter((meal) => meal.id !== id));
      toast({ title: t("collection.savedMealDeleted"), variant: "success" });
      return true;
    },
    [perform, t, toast],
  );

  const duplicateSavedMeal = useCallback(
    async (id: string) => {
      const original = savedMeals.find((meal) => meal.id === id);
      const repository = repositoriesRef.current;
      if (!original || !repository) return false;
      const copy: SavedMeal = {
        ...original,
        id: createId("saved-meal"),
        name: `${original.name} · copy`,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      try {
        const saved = await repository.savedMeals.create(copy);
        setSavedMeals((current) => [...current, saved]);
        toast({ title: t("collection.savedMealDuplicated"), variant: "success" });
        return true;
      } catch (error) {
        if (error instanceof RepositoryError && error.code === "partial-write") {
          const currentMeals = await perform(() => repository.savedMeals.list(), null);
          if (currentMeals) setSavedMeals(currentMeals);
        }
        reportMutationError(error);
        return false;
      }
    },
    [perform, reportMutationError, savedMeals, t, toast],
  );

  const loadSavedMeal = useCallback(
    async (id: string) => {
      const meal = savedMeals.find((candidate) => candidate.id === id);
      if (!meal) return false;
      const nextItems = meal.items.map((item) => ({
        food: item.food,
        grams: item.grams,
      }));
      const nextCategory =
        cartItems.length === 0 ? suggestMealCategory() : cartCategory;
      setCartItems(nextItems);
      setCartCategoryState(nextCategory);
      setCartOpen(true);
      const saved = await persistDraft(nextItems, nextCategory, cartDate);
      if (saved) {
        toast({
          title: t("collection.loadedIntoCart", { name: meal.name }),
          variant: "success",
        });
      }
      return saved;
    },
    [
      cartCategory,
      cartDate,
      cartItems.length,
      persistDraft,
      savedMeals,
      t,
      toast,
    ],
  );

  const addWeight = useCallback(
    async (weight: number, date: string) => {
      const repository = repositoriesRef.current;
      if (!repository) return false;
      const loggedAt = parseDateKey(date);
      loggedAt.setHours(7, 0, 0, 0);
      const saved = await perform(
        () =>
          repository.weightRecords.create({
            id: createId("weight"),
            weight,
            loggedAt: loggedAt.toISOString(),
          }),
        null,
      );
      if (!saved) return false;
      setWeightRecords((current) => sortWeightRecords([...current, saved]));
      toast({ title: t("analytics.weightSaved"), variant: "success" });
      return true;
    },
    [perform, t, toast],
  );

  const updateWeight = useCallback(
    async (id: string, weight: number, date: string) => {
      const repository = repositoriesRef.current;
      if (!repository) return false;
      const loggedAt = parseDateKey(date);
      loggedAt.setHours(7, 0, 0, 0);
      const saved = await perform(
        () =>
          repository.weightRecords.update(id, {
            weight,
            loggedAt: loggedAt.toISOString(),
          }),
        null,
      );
      if (!saved) return false;
      setWeightRecords((current) =>
        sortWeightRecords(
          current.map((record) => (record.id === id ? saved : record)),
        ),
      );
      toast({ title: t("analytics.weightUpdated"), variant: "success" });
      return true;
    },
    [perform, t, toast],
  );

  const deleteWeight = useCallback(
    async (id: string) => {
      const repository = repositoriesRef.current;
      if (!repository) return false;
      const deleted = await perform(
        () => repository.weightRecords.delete(id),
        false,
      );
      if (!deleted) return false;
      setWeightRecords((current) =>
        current.filter((record) => record.id !== id),
      );
      toast({ title: t("analytics.weightDeleted"), variant: "success" });
      return true;
    },
    [perform, t, toast],
  );

  const saveSearchHistory = useCallback(
    async (queries: string[]) => {
      const repository = repositoriesRef.current;
      if (!repository) return false;
      const saved = await perform(
        () => repository.searchHistory.save(queries),
        null,
      );
      if (!saved) return false;
      setSearchHistory(saved);
      return true;
    },
    [perform],
  );

  const createCustomFood = useCallback(
    async (input: CustomFoodInput) => {
      const repository = repositoriesRef.current;
      if (!repository) return false;
      const saved = await perform(
        () =>
          repository.customFoods.create({
            ...input,
            id: createId("custom-food"),
            synonyms: [],
            source: CUSTOM_FOOD_SOURCE,
          }),
        null,
      );
      if (!saved) return false;
      setCustomFoods((current) =>
        [...current, saved].sort((a, b) => a.name.localeCompare(b.name)),
      );
      toast({
        title: t("customFood.created", { name: saved.name }),
        variant: "success",
      });
      return true;
    },
    [perform, t, toast],
  );

  const updateCustomFood = useCallback(
    async (id: string, input: CustomFoodInput) => {
      const repository = repositoriesRef.current;
      if (!repository) return false;
      const saved = await perform(
        () => repository.customFoods.update(id, input),
        null,
      );
      if (!saved) return false;
      setCustomFoods((current) =>
        current
          .map((food) => (food.id === id ? saved : food))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
      toast({
        title: t("customFood.updated", { name: saved.name }),
        variant: "success",
      });
      return true;
    },
    [perform, t, toast],
  );

  const setCloudCatalogViewMode = useCallback(
    async (mode: "grid" | "list") => {
      const repository = repositoriesRef.current;
      if (!repository) return;
      const saved = await perform(
        () =>
          repository.accountPreferences.save({
            theme,
            language,
            catalogViewMode: mode,
          }),
        null,
      );
      if (saved) setCatalogViewModeState(saved.catalogViewMode ?? "grid");
    },
    [language, perform, theme],
  );

  const value = useMemo<DemoDataContextValue>(
    () => ({
      hydrated,
      dataMode: "cloud",
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
      setCatalogViewMode: setCloudCatalogViewMode,
      exportData: () => "",
      importData: () => ({ ok: false }),
      resetDemoData: () => undefined,
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
      customFoods,
      deleteEntry,
      deleteSavedMeal,
      deleteSession,
      deleteWeight,
      duplicateEntry,
      duplicateSavedMeal,
      duplicateSession,
      entries,
      favorites,
      hydrated,
      isFavorite,
      loadSavedMeal,
      openCart,
      profile,
      removeFromCart,
      saveCart,
      saveCartAsMeal,
      saveMeal,
      saveSearchHistory,
      savedMeals,
      searchHistory,
      sessions,
      setCartCategory,
      setCartDate,
      setCloudCatalogViewMode,
      toggleFavorite,
      targets,
      updateCartGrams,
      updateEntry,
      updateProfile,
      updateTargets,
      updateCustomFood,
      updateWeight,
      weightRecords,
    ],
  );

  if (loadError) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <section
          className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
          role="alert"
        >
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
            {t("error.title")}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {t("cloud.loadFailed")}
          </p>
          <button
            type="button"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            onClick={() => {
              setLoadError(false);
              setRetry((current) => current + 1);
            }}
          >
            {t("cloud.retry")}
          </button>
        </section>
      </main>
    );
  }

  if (!hydrated) return <LoadingPanel label={t("cloud.loadingData")} />;

  return (
    <AccountPreferencesContext.Provider value={accountPreferences}>
      <DemoDataContext.Provider value={value}>{children}</DemoDataContext.Provider>
    </AccountPreferencesContext.Provider>
  );
}
