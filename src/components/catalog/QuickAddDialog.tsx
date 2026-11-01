"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useDemoData } from "@/components/providers/DemoDataProvider";
import { demoFoods } from "@/data/foods";
import { useI18n } from "@/hooks/use-i18n";
import { formatNumber } from "@/lib/format";
import { categoryLabelKey, searchFoods } from "@/lib/food-search";
import { scaleFoodNutrition } from "@/lib/nutrition";

type QuickAddDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function QuickAddDialog({ open, onOpenChange }: QuickAddDialogProps) {
  const { addToCart } = useDemoData();
  const { locale, t } = useI18n();
  const [query, setQuery] = useState("");
  const foods = searchFoods(demoFoods, query, { limit: 8 });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>{t("catalog.quickAddTitle")}</DialogTitle>
        <DialogDescription>
          {t("catalog.quickAddDescription")}
        </DialogDescription>
      </DialogHeader>

      <div className="relative mt-5">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("catalog.searchPlaceholder")}
          aria-label={t("catalog.searchLabel")}
          className="pl-9"
        />
      </div>

      <ul className="mt-4 max-h-80 divide-y divide-slate-200 overflow-y-auto dark:divide-slate-800">
        {foods.map((food) => {
          const nutrition = scaleFoodNutrition(food, food.defaultGrams);

          return (
            <li
              key={food.id}
              className="flex items-center justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                  {food.name}
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {t(categoryLabelKey(food.category))} ·{" "}
                  {formatNumber(nutrition.calories, locale)} {t("common.kcal")}{" "}
                  · {formatNumber(food.defaultGrams, locale)} {t("common.g")}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => addToCart(food, food.defaultGrams)}
                aria-label={`${t("common.add")} ${food.name}`}
              >
                <Plus className="size-4" aria-hidden="true" />
                {t("common.add")}
              </Button>
            </li>
          );
        })}
      </ul>

      {foods.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
          {t("catalog.noResults")}
        </p>
      ) : null}

      <DialogFooter>
        <Button type="button" onClick={() => onOpenChange(false)}>
          {t("common.done")}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
