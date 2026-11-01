"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import {
  Bookmark,
  Copy,
  Pencil,
  Plus,
  ShoppingBasket,
  Trash2,
  Utensils,
} from "lucide-react";
import { CustomFoodDialog } from "@/components/collection/CustomFoodDialog";
import { useDemoData } from "@/components/providers/DemoDataProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { demoFoods } from "@/data/foods";
import { useI18n } from "@/hooks/use-i18n";
import { categoryLabelKey } from "@/lib/food-search";
import { formatDecimal, formatNumber } from "@/lib/format";
import { scaleFoodNutrition } from "@/lib/nutrition";
import { cn } from "@/lib/utils";
import type { CustomFood, SavedMeal } from "@/types";

type Tab = "favorites" | "meals" | "custom";

export function CollectionView() {
  const {
    addToCart,
    dataMode,
    deleteSavedMeal,
    duplicateSavedMeal,
    favorites,
    customFoods,
    loadSavedMeal,
    savedMeals,
    toggleFavorite,
  } = useDemoData();
  const { locale, t } = useI18n();
  const [tab, setTab] = useState<Tab>("favorites");
  const [query, setQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<SavedMeal | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<CustomFood | null>(null);

  async function confirmDelete() {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      if (await deleteSavedMeal(deleteTarget.id) !== false) {
        setDeleteTarget(null);
      }
    } finally {
      setDeleting(false);
    }
  }

  const favoriteFoods = useMemo(() => {
    const byId = new Map(
      [...demoFoods, ...customFoods].map((food) => [food.id, food]),
    );

    return favorites
      .map((favorite) => byId.get(favorite.foodId))
      .filter((food): food is (typeof demoFoods)[number] => Boolean(food))
      .filter((food) =>
        food.name.toLowerCase().includes(query.trim().toLowerCase()),
      );
  }, [customFoods, favorites, query]);

  const filteredMeals = useMemo(
    () =>
      savedMeals.filter((meal) =>
        meal.name.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [query, savedMeals],
  );

  const filteredCustomFoods = useMemo(
    () =>
      customFoods.filter((food) =>
        food.name.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [customFoods, query],
  );

  function openCreateFood() {
    setEditingFood(null);
    setEditorOpen(true);
  }

  function openEditFood(food: CustomFood) {
    setEditingFood(food);
    setEditorOpen(true);
  }

  const searchPlaceholder =
    tab === "favorites"
      ? t("collection.searchFavorites")
      : tab === "custom"
        ? t("customFood.search")
        : t("collection.searchMeals");

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
          {t("collection.title")}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {t("collection.subtitle")}
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="flex w-full max-w-full overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-1 sm:w-auto dark:border-slate-800 dark:bg-slate-900"
          role="tablist"
          aria-label={t("collection.title")}
        >
          {(
            [
              { value: "favorites", label: t("collection.favoritesTab") },
              { value: "meals", label: t("collection.savedMealsTab") },
              { value: "custom", label: t("customFood.tab") },
            ] as const
          ).map((item) => (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={tab === item.value}
              onClick={() => {
                setTab(item.value);
                setQuery("");
              }}
              className={cn(
                "min-h-9 shrink-0 whitespace-nowrap rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
                tab === item.value
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                  : "text-slate-500 dark:text-slate-400",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="sm:w-64"
          />
          {tab === "custom" ? (
            <Button type="button" onClick={openCreateFood}>
              <Plus className="size-4" aria-hidden="true" />
              {t("customFood.create")}
            </Button>
          ) : null}
        </div>
      </div>

      {tab === "favorites" ? (
        favoriteFoods.length === 0 ? (
          <EmptyState
            title={t("collection.noFavorites")}
            description={t("collection.noFavoritesDescription")}
            action={
              <Link
                href="/catalog"
                className="inline-flex h-10 items-center justify-center rounded-md bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                {t("collection.browseCatalog")}
              </Link>
            }
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {favoriteFoods.map((food) => {
              const nutrition = scaleFoodNutrition(food, food.defaultGrams);

              return (
                <li
                  key={food.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                        {food.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {t(categoryLabelKey(food.category))}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => toggleFavorite(food)}
                      aria-label={t("collection.removeFavorite")}
                    >
                      <Bookmark
                        className="size-4 fill-current text-brand-600"
                        aria-hidden="true"
                      />
                    </Button>
                  </div>
                  <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">
                    {formatNumber(nutrition.calories, locale)} {t("common.kcal")}{" "}
                    · {formatNumber(food.defaultGrams, locale)} {t("common.g")}
                  </p>
                  <Button
                    type="button"
                    className="mt-3 w-full"
                    onClick={() => addToCart(food, food.defaultGrams)}
                  >
                    <ShoppingBasket className="size-4" aria-hidden="true" />
                    {t("collection.addToCart")}
                  </Button>
                </li>
              );
            })}
          </ul>
        )
      ) : tab === "custom" ? (
        filteredCustomFoods.length === 0 ? (
          query.trim() ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {t("customFood.emptySearch")}
              </p>
            </div>
          ) : (
            <EmptyState
              icon={
                <Utensils
                  className="mx-auto size-8 text-slate-400"
                  aria-hidden="true"
                />
              }
              title={t("customFood.emptyTitle")}
              description={t("customFood.emptyDescription")}
              action={
                <Button type="button" onClick={openCreateFood}>
                  <Plus className="size-4" aria-hidden="true" />
                  {t("customFood.create")}
                </Button>
              }
            />
          )
        ) : (
          <>
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredCustomFoods.map((food) => (
                <li
                  key={food.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                        {food.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {t(categoryLabelKey(food.category))}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openEditFood(food)}
                      aria-label={`${t("customFood.edit")}: ${food.name}`}
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                  <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">
                    {t("customFood.per100", {
                      calories: formatNumber(food.calories, locale),
                    })}{" "}
                    ·{" "}
                    {t("customFood.defaultPortionShort", {
                      grams: formatNumber(food.defaultGrams, locale),
                    })}
                  </p>
                  <Button
                    type="button"
                    className="mt-3 w-full"
                    onClick={() => addToCart(food, food.defaultGrams)}
                  >
                    <ShoppingBasket className="size-4" aria-hidden="true" />
                    {t("collection.addToCart")}
                  </Button>
                </li>
              ))}
            </ul>
            <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
              {dataMode === "cloud"
                ? t("customFood.cloudNote")
                : t("customFood.demoNote")}
            </p>
          </>
        )
      ) : filteredMeals.length === 0 ? (
        <EmptyState
          title={t("collection.noSavedMeals")}
          description={t("collection.noSavedMealsDescription")}
          action={
            <Link
              href="/catalog"
              className="inline-flex h-10 items-center justify-center rounded-md bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              {t("collection.browseCatalog")}
            </Link>
          }
        />
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {filteredMeals.map((meal) => {
            const totals = meal.items.reduce(
              (accumulator, item) => {
                const nutrition = scaleFoodNutrition(item.food, item.grams);

                return {
                  calories: accumulator.calories + nutrition.calories,
                  protein: accumulator.protein + nutrition.protein,
                };
              },
              { calories: 0, protein: 0 },
            );

            return (
              <li
                key={meal.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {meal.name}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge variant="neutral">
                        {t("collection.mealItems", { count: meal.items.length })}
                      </Badge>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {formatNumber(totals.calories, locale)} {t("common.kcal")}{" "}
                        · {formatDecimal(totals.protein, locale)} {t("common.g")}{" "}
                        {t("common.protein").toLowerCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => duplicateSavedMeal(meal.id)}
                      aria-label={t("common.duplicate")}
                    >
                      <Copy className="size-4" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteTarget(meal)}
                      aria-label={t("common.delete")}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>

                <ul className="mt-3 divide-y divide-slate-200 text-xs dark:divide-slate-800">
                  {meal.items.map((item) => (
                    <li
                      key={`${meal.id}-${item.food.id}`}
                      className="flex items-center justify-between py-1.5"
                    >
                      <span className="text-slate-700 dark:text-slate-300">
                        {item.food.name}
                      </span>
                      <span className="tabular-nums text-slate-500 dark:text-slate-400">
                        {formatNumber(item.grams, locale)} {t("common.g")}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  type="button"
                  className="mt-4 w-full"
                  onClick={() => loadSavedMeal(meal.id)}
                >
                  <ShoppingBasket className="size-4" aria-hidden="true" />
                  {t("collection.loadIntoCart")}
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      {editorOpen ? (
        <CustomFoodDialog
          key={editingFood?.id ?? "new"}
          open
          food={editingFood}
          onOpenChange={(open) => {
            setEditorOpen(open);
            if (!open) setEditingFood(null);
          }}
        />
      ) : null}

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogHeader>
          <DialogTitle>{t("collection.deleteMealTitle")}</DialogTitle>
          <DialogDescription>
            {deleteTarget
              ? t("collection.deleteMealDescription", {
                  name: deleteTarget.name,
                })
              : ""}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => setDeleteTarget(null)}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            onClick={confirmDelete}
            disabled={deleting}
          >
            {deleting ? t("common.saving") : t("common.delete")}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
      {icon ?? (
        <Bookmark className="mx-auto size-8 text-slate-400" aria-hidden="true" />
      )}
      <p className="mt-3 text-sm font-medium text-slate-900 dark:text-white">
        {title}
      </p>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-600 dark:text-slate-400">
        {description}
      </p>
      <div className="mt-5 flex justify-center">{action}</div>
    </div>
  );
}
