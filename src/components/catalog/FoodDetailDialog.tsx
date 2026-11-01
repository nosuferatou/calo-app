"use client";

import { useState } from "react";
import { Heart, Plus } from "lucide-react";
import { NutritionGrid } from "@/components/food/NutritionGrid";
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
import { useI18n } from "@/hooks/use-i18n";
import { categoryLabelKey } from "@/lib/food-search";
import { formatNumber } from "@/lib/format";
import { scaleFoodNutrition } from "@/lib/nutrition";
import { cn } from "@/lib/utils";
import type { Food } from "@/types";

type FoodDetailDialogProps = {
  food: Food | null;
  onOpenChange: (open: boolean) => void;
};

export function FoodDetailDialog({ food, onOpenChange }: FoodDetailDialogProps) {
  const { addToCart, isFavorite, toggleFavorite } = useDemoData();
  const { locale, t } = useI18n();
  const [grams, setGrams] = useState(food?.defaultGrams ?? 100);

  if (!food) {
    return null;
  }

  const favorite = isFavorite(food.id);
  const per100 = scaleFoodNutrition(food, 100);
  const selected = scaleFoodNutrition(food, grams);
  const safeGrams = Number.isFinite(grams) && grams > 0 ? grams : 0;

  return (
    <Dialog open={Boolean(food)} onOpenChange={onOpenChange}>
      <DialogHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <DialogTitle>{food.name}</DialogTitle>
            <DialogDescription className="flex flex-wrap items-center gap-2">
              <Badge variant="neutral">{t(categoryLabelKey(food.category))}</Badge>
              <span>
                {t("catalog.defaultPortion", {
                  grams: formatNumber(food.defaultGrams, locale),
                })}
              </span>
            </DialogDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => toggleFavorite(food)}
            aria-pressed={favorite}
            aria-label={
              favorite ? t("catalog.removeFavorite") : t("catalog.addFavorite")
            }
          >
            <Heart
              className={cn("size-4", favorite && "fill-current text-red-500")}
              aria-hidden="true"
            />
          </Button>
        </div>
      </DialogHeader>

      <div className="mt-5 flex flex-col gap-4">
        <div>
          <p className="mb-2 text-sm font-medium text-slate-900 dark:text-white">
            {t("catalog.nutritionPer100g")}
          </p>
          <NutritionGrid nutrition={per100} />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="food-detail-grams"
            className="text-sm font-medium text-slate-900 dark:text-white"
          >
            {t("catalog.quantityGrams")}
          </label>
          <div className="flex items-center gap-2">
            <Input
              id="food-detail-grams"
              type="number"
              min="0.1"
              step="0.1"
              inputMode="decimal"
              value={grams}
              onChange={(event) => {
                const value = event.target.valueAsNumber;

                if (Number.isFinite(value)) {
                  setGrams(value);
                }
              }}
              className="max-w-40"
            />
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {t("common.g")}
            </span>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-900 dark:text-white">
            {t("catalog.nutritionForQuantity", {
              grams: formatNumber(safeGrams, locale),
            })}
          </p>
          <NutritionGrid nutrition={selected} />
        </div>

        <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
          <span className="font-medium">{t("catalog.source")}: </span>
          {food.source}
        </p>
      </div>

      <DialogFooter className="flex-row justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
        >
          {t("common.close")}
        </Button>
        <Button
          type="button"
          onClick={() => {
            addToCart(food, safeGrams);
            onOpenChange(false);
          }}
          disabled={safeGrams <= 0}
        >
          <Plus className="size-4" aria-hidden="true" />
          {t("catalog.addToCart")}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
