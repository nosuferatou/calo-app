"use client";

import { useI18n } from "@/hooks/use-i18n";
import { formatDecimal, formatNumber } from "@/lib/format";
import type { FullNutritionTotals } from "@/lib/nutrition";
import { cn } from "@/lib/utils";

type NutritionGridProps = {
  nutrition: FullNutritionTotals;
  className?: string;
  showExtended?: boolean;
};

export function NutritionGrid({
  nutrition,
  className,
  showExtended = true,
}: NutritionGridProps) {
  const { locale, t } = useI18n();

  const items = [
    {
      label: t("common.calories"),
      value: formatNumber(nutrition.calories, locale),
      unit: t("common.kcal"),
    },
    {
      label: t("common.protein"),
      value: formatDecimal(nutrition.protein, locale),
      unit: t("common.g"),
    },
    {
      label: t("common.carbohydrates"),
      value: formatDecimal(nutrition.carbohydrates, locale),
      unit: t("common.g"),
    },
    {
      label: t("common.fat"),
      value: formatDecimal(nutrition.fat, locale),
      unit: t("common.g"),
    },
    ...(showExtended
      ? [
          {
            label: t("common.fiber"),
            value: formatDecimal(nutrition.fiber, locale),
            unit: t("common.g"),
          },
          {
            label: t("common.sugar"),
            value: formatDecimal(nutrition.sugar, locale),
            unit: t("common.g"),
          },
          {
            label: t("common.saturatedFat"),
            value: formatDecimal(nutrition.saturatedFat, locale),
            unit: t("common.g"),
          },
          {
            label: t("common.sodium"),
            value: formatNumber(nutrition.sodium, locale),
            unit: t("common.mg"),
          },
        ]
      : []),
  ];

  return (
    <dl
      className={cn(
        "grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 sm:grid-cols-4 dark:border-slate-800 dark:bg-slate-800",
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="bg-white p-3 dark:bg-slate-900">
          <dt className="text-xs text-slate-500 dark:text-slate-400">
            {item.label}
          </dt>
          <dd className="mt-1 text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
            {item.value}{" "}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
              {item.unit}
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
