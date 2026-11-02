"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Calculator,
  Check,
  ShoppingBasket,
  Trash2,
  X,
} from "lucide-react";
import { NutritionGrid } from "@/components/food/NutritionGrid";
import { useDemoData } from "@/components/providers/DemoDataProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useHydrated } from "@/hooks/use-hydrated";
import { useI18n } from "@/hooks/use-i18n";
import { formatLongDate, todayKey } from "@/lib/dates";
import { formatDecimal, formatNumber } from "@/lib/format";
import { MEAL_ORDER, mealLabelKey } from "@/lib/meals";
import { scaleFoodNutrition } from "@/lib/nutrition";
import { cn } from "@/lib/utils";
import type { MealCategory } from "@/types";

const selectClassName =
  "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-white";

export function MealCartDrawer() {
  const {
    cartItems,
    cartCategory,
    cartDate,
    cartOpen,
    closeCart,
    clearCart,
    dataMode,
    removeFromCart,
    saveCart,
    saveCartAsMeal,
    setCartCategory,
    setCartDate,
    updateCartGrams,
  } = useDemoData();
  const { locale, t } = useI18n();
  const hydrated = useHydrated();
  const today = hydrated ? todayKey() : undefined;
  const [showSummary, setShowSummary] = useState(false);
  const [confirmingSave, setConfirmingSave] = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [mealName, setMealName] = useState("");
  const [nameError, setNameError] = useState(false);
  const [saving, setSaving] = useState(false);

  const cartSignature = `${cartCategory}|${cartDate}|${cartItems
    .map((item) => `${item.food.id}:${item.grams}`)
    .join(",")}`;
  const [lastSignature, setLastSignature] = useState(cartSignature);

  if (cartSignature !== lastSignature) {
    setLastSignature(cartSignature);
    setShowSummary(false);
    setConfirmingSave(false);
    setConfirmingClear(false);
    setNameError(false);
  }

  const totals = useMemo(
    () =>
      cartItems.reduce(
        (accumulator, item) => {
          const nutrition = scaleFoodNutrition(item.food, item.grams);

          return {
            calories: accumulator.calories + nutrition.calories,
            protein: accumulator.protein + nutrition.protein,
            carbohydrates:
              accumulator.carbohydrates + nutrition.carbohydrates,
            fat: accumulator.fat + nutrition.fat,
            fiber: accumulator.fiber + nutrition.fiber,
            sugar: accumulator.sugar + nutrition.sugar,
            saturatedFat: accumulator.saturatedFat + nutrition.saturatedFat,
            sodium: accumulator.sodium + nutrition.sodium,
          };
        },
        {
          calories: 0,
          protein: 0,
          carbohydrates: 0,
          fat: 0,
          fiber: 0,
          sugar: 0,
          saturatedFat: 0,
          sodium: 0,
        },
      ),
    [cartItems],
  );

  const itemCount = cartItems.length;

  async function handleSaveMeal() {
    if (saving) return;
    if (!mealName.trim()) {
      setNameError(true);
      return;
    }

    setSaving(true);
    try {
      if (await saveCartAsMeal(mealName)) {
        setMealName("");
        setNameError(false);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmSave() {
    if (saving) return;
    setSaving(true);
    try {
      const result = await saveCart();
      if (result.ok) setConfirmingSave(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={cartOpen}
      onOpenChange={closeCart}
      className="inset-x-0 bottom-0 top-auto max-h-[88dvh] w-full max-w-none translate-x-0 translate-y-0 overflow-y-auto overscroll-contain rounded-t-2xl rounded-b-none p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:inset-y-0 sm:right-0 sm:left-auto sm:top-0 sm:bottom-0 sm:h-full sm:max-h-none sm:max-w-md sm:rounded-none sm:rounded-l-2xl sm:p-6 sm:pb-6"
    >
        <DialogHeader className="flex-row items-start justify-between gap-4">
          <div className="space-y-1.5">
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBasket className="size-5" aria-hidden="true" />
              {t("cart.title")}
              {itemCount > 0 ? (
                <Badge variant="info">
                  {t("cart.itemCount", { count: itemCount })}
                </Badge>
              ) : null}
            </DialogTitle>
            <DialogDescription>{t("cart.description")}</DialogDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={closeCart}
            aria-label={t("common.close")}
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </DialogHeader>

        {itemCount === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
            <ShoppingBasket
              className="mx-auto size-8 text-slate-400"
              aria-hidden="true"
            />
            <p className="mt-3 text-sm font-medium text-slate-900 dark:text-white">
              {t("cart.empty")}
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {t("cart.emptyDescription")}
            </p>
            <Link
              href="/catalog"
              onClick={closeCart}
              className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              {t("cart.browse")}
            </Link>
          </div>
        ) : (
          <div className="mt-5 flex flex-col gap-5">
            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
              {cartItems.map((item) => {
                const nutrition = scaleFoodNutrition(item.food, item.grams);

                return (
                  <li key={item.food.id} className="py-4 first:pt-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                          {item.food.name}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {formatNumber(nutrition.calories, locale)}{" "}
                          {t("common.kcal")} ·{" "}
                          {formatDecimal(nutrition.protein, locale)}{" "}
                          {t("common.g")} {t("common.protein").toLowerCase()}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeFromCart(item.food.id)}
                        aria-label={t("cart.removeLabel", {
                          name: item.food.name,
                        })}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <label
                        htmlFor={`cart-grams-${item.food.id}`}
                        className="text-xs font-medium text-slate-600 dark:text-slate-400"
                      >
                        {t("cart.grams")}
                      </label>
                      <Input
                        id={`cart-grams-${item.food.id}`}
                        type="number"
                        min="0.1"
                        step="1"
                        inputMode="decimal"
                        value={item.grams}
                        onChange={(event) => {
                          const value = event.target.valueAsNumber;

                          if (Number.isFinite(value)) {
                            updateCartGrams(item.food.id, value);
                          }
                        }}
                        aria-label={t("cart.quantityLabel", {
                          name: item.food.name,
                        })}
                        className="h-9 w-24"
                      />
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {t("common.g")}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="cart-meal-category"
                  className="text-sm font-medium text-slate-900 dark:text-white"
                >
                  {t("cart.mealCategory")}
                </label>
                <select
                  id="cart-meal-category"
                  value={cartCategory}
                  onChange={(event) =>
                    setCartCategory(event.target.value as MealCategory)
                  }
                  className={selectClassName}
                >
                  {MEAL_ORDER.map((category) => (
                    <option key={category} value={category}>
                      {t(mealLabelKey(category))}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="cart-date"
                  className="text-sm font-medium text-slate-900 dark:text-white"
                >
                  {t("cart.date")}
                </label>
                <Input
                  id="cart-date"
                  type="date"
                  value={cartDate}
                  max={today}
                  onChange={(event) => {
                    if (event.target.value) {
                      setCartDate(event.target.value);
                    }
                  }}
                />
              </div>
            </div>
            <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
              {t("cart.dateHelp")}
            </p>

            {showSummary ? (
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {t("cart.total")}
                  </p>
                  <Badge variant="success">
                    <Check className="mr-1 size-3" aria-hidden="true" />
                    {formatNumber(totals.calories, locale)} {t("common.kcal")}
                  </Badge>
                </div>
                <NutritionGrid
                  nutrition={totals}
                  showExtended={false}
                  className="mt-3"
                />

                <div className="mt-4 flex flex-col gap-2">
                  {confirmingSave ? (
                    <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {t("cart.saveConfirmTitle")}
                      </p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        {t("cart.saveConfirmDescription", {
                          count: itemCount,
                          date: formatLongDate(cartDate, locale),
                        })}
                      </p>
                      <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirmingSave(false)}
                        >
                          {t("common.cancel")}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleConfirmSave}
                          disabled={saving}
                        >
                          {saving ? t("common.saving") : t("common.confirm")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => setConfirmingSave(true)}
                    >
                      {t("cart.saveMeal")}
                    </Button>
                  )}

                  <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                    <label
                      htmlFor="cart-meal-name"
                      className="text-sm font-medium text-slate-900 dark:text-white"
                    >
                      {t("cart.saveAsMeal")}
                    </label>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {t("cart.saveAsMealDescription")}
                    </p>
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                      <Input
                        id="cart-meal-name"
                        value={mealName}
                        onChange={(event) => {
                          setMealName(event.target.value);
                          setNameError(false);
                        }}
                        placeholder={t("cart.mealName")}
                        aria-invalid={nameError}
                        aria-describedby={
                          nameError ? "cart-meal-name-error" : undefined
                        }
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSaveMeal}
                        disabled={saving}
                      >
                        {saving ? t("common.saving") : t("common.save")}
                      </Button>
                    </div>
                    {nameError ? (
                      <p
                        id="cart-meal-name-error"
                        className="mt-1 text-xs text-red-600 dark:text-red-400"
                      >
                        {t("cart.nameRequired")}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                onClick={() => setShowSummary(true)}
                className="w-full"
              >
                <Calculator className="size-4" aria-hidden="true" />
                {t("cart.calculate")}
              </Button>
            )}

            {confirmingClear ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-900/60 dark:bg-red-950/40">
                <p className="text-sm font-medium text-red-900 dark:text-red-100">
                  {t("cart.clearConfirmTitle")}
                </p>
                <p className="mt-1 text-sm text-red-800 dark:text-red-200">
                  {t("cart.clearConfirmDescription")}
                </p>
                <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmingClear(false)}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className={cn(
                      "border-red-300 text-red-700 hover:bg-red-100 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950",
                    )}
                    onClick={() => {
                      clearCart();
                      setConfirmingClear(false);
                    }}
                  >
                    {t("cart.clear")}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmingClear(true)}
                className="w-full"
              >
                {t("cart.clear")}
              </Button>
            )}

            {dataMode === "demo" ? (
              <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                {t("common.demoNotice")}
              </p>
            ) : null}
          </div>
        )}
    </Dialog>
  );
}
