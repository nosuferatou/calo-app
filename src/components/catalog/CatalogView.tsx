"use client";

import { useCallback, useMemo, useState } from "react";
import { Clock, Grid2X2, Heart, List, Search, X } from "lucide-react";
import { FoodDetailDialog } from "@/components/catalog/FoodDetailDialog";
import { useDemoData } from "@/components/providers/DemoDataProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { demoFoods } from "@/data/foods";
import { useI18n } from "@/hooks/use-i18n";
import { FOOD_CATEGORIES, categoryLabelKey, searchFoods } from "@/lib/food-search";
import { formatDecimal, formatNumber } from "@/lib/format";
import { scaleFoodNutrition } from "@/lib/nutrition";
import { cn } from "@/lib/utils";
import type { Food, FoodCategory } from "@/types";

export function CatalogView() {
  const {
    catalogViewMode,
    customFoods,
    hydrated,
    isFavorite,
    searchHistory,
    saveSearchHistory,
    setCatalogViewMode,
    toggleFavorite,
  } = useDemoData();
  const { locale, t } = useI18n();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FoodCategory | "all">("all");
  const [recentOverride, setRecentOverride] = useState<string[] | null>(null);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);

  const recentSearches = useMemo(
    () => recentOverride ?? (hydrated ? searchHistory.slice(0, 6) : []),
    [hydrated, recentOverride, searchHistory],
  );
  const viewMode = hydrated ? catalogViewMode : "grid";
  const foods = useMemo(
    () => [...demoFoods, ...customFoods],
    [customFoods],
  );

  const results = useMemo(
    () => searchFoods(foods, query, { category }),
    [category, foods, query],
  );

  const rememberSearch = useCallback(
    (value: string) => {
      const trimmed = value.trim();

      if (!trimmed) {
        return;
      }

      const next = [
        trimmed,
        ...recentSearches.filter(
          (item) => item.toLowerCase() !== trimmed.toLowerCase(),
        ),
      ].slice(0, 6);
      setRecentOverride(next);
      void saveSearchHistory(next);
    },
    [recentSearches, saveSearchHistory],
  );

  const clearRecentSearches = useCallback(() => {
    setRecentOverride([]);
    void saveSearchHistory([]);
  }, [saveSearchHistory]);

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
          {t("catalog.title")}
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
          {t("catalog.subtitle")}
        </p>
      </header>

      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                rememberSearch(query);
              }
            }}
            placeholder={t("catalog.searchPlaceholder")}
            aria-label={t("catalog.searchLabel")}
            className="pl-9"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label={t("common.clear")}
              className="absolute top-1/2 right-2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        {recentSearches.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              <Clock className="size-3.5" aria-hidden="true" />
              {t("catalog.recentSearches")}
            </span>
            {recentSearches.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setQuery(item)}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {item}
              </button>
            ))}
            <button
              type="button"
              onClick={clearRecentSearches}
              className="text-xs font-medium text-slate-500 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:text-slate-400"
            >
              {t("catalog.clearRecent")}
            </button>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2" role="group" aria-label={t("catalog.categories")}>
          <button
            type="button"
            onClick={() => setCategory("all")}
            aria-pressed={category === "all"}
            className={cn(
              "min-h-9 rounded-full px-3 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
              category === "all"
                ? "bg-brand-600 text-white"
                : "border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800",
            )}
          >
            {t("catalog.allCategories")}
          </button>
          {FOOD_CATEGORIES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              aria-pressed={category === item}
              className={cn(
                "min-h-9 rounded-full px-3 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
                category === item
                  ? "bg-brand-600 text-white"
                  : "border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800",
              )}
            >
              {t(categoryLabelKey(item))}
            </button>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {t("catalog.resultsCount", {
            count: formatNumber(results.length, locale),
          })}
        </p>
        <div
          className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900"
          role="group"
          aria-label={t("catalog.viewGrid")}
        >
          <button
            type="button"
            onClick={() => setCatalogViewMode("grid")}
            aria-pressed={viewMode === "grid"}
            aria-label={t("catalog.viewGrid")}
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
              viewMode === "grid"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-500 dark:text-slate-400",
            )}
          >
            <Grid2X2 className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setCatalogViewMode("list")}
            aria-pressed={viewMode === "list"}
            aria-label={t("catalog.viewList")}
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
              viewMode === "list"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-500 dark:text-slate-400",
            )}
          >
            <List className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            {t("catalog.noResults")}
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {t("catalog.noResultsDescription")}
          </p>
        </div>
      ) : (
        <ul
          className={cn(
            "grid gap-3",
            viewMode === "grid"
              ? "sm:grid-cols-2 xl:grid-cols-3"
              : "grid-cols-1",
          )}
        >
          {results.map((food) => {
            const nutrition = scaleFoodNutrition(food, food.defaultGrams);
            const favorite = isFavorite(food.id);

            return (
              <li
                key={food.id}
                className="group rounded-2xl border border-slate-200 bg-white transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
              >
                <div className="flex h-full flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => {
                          rememberSearch(query);
                          setSelectedFood(food);
                        }}
                        className="text-left text-sm font-semibold text-slate-900 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:text-white"
                      >
                        {food.name}
                      </button>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {t(categoryLabelKey(food.category))}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleFavorite(food)}
                      aria-pressed={favorite}
                      aria-label={
                        favorite
                          ? t("catalog.removeFavorite")
                          : t("catalog.addFavorite")
                      }
                      className="text-slate-400 transition-colors hover:text-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                    >
                      <Heart
                        className={cn(
                          "size-4",
                          favorite && "fill-current text-red-500",
                        )}
                        aria-hidden="true"
                      />
                    </button>
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-3">
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      <p className="font-medium text-slate-900 dark:text-white">
                        {formatNumber(nutrition.calories, locale)}{" "}
                        {t("common.kcal")}
                      </p>
                      <p className="mt-0.5">
                        {formatNumber(food.defaultGrams, locale)} {t("common.g")}{" "}
                        · {formatDecimal(nutrition.protein, locale)}{" "}
                        {t("common.g")} {t("common.protein").toLowerCase()}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedFood(food)}
                    >
                      {t("common.open")}
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
        {t("catalog.demoSource")}
      </p>

      <FoodDetailDialog
        key={selectedFood?.id ?? "none"}
        food={selectedFood}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedFood(null);
          }
        }}
      />
    </div>
  );
}
