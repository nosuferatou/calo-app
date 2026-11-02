"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Flame, Plus, Scale, UtensilsCrossed } from "lucide-react";
import { QuickAddDialog } from "@/components/catalog/QuickAddDialog";
import { useDemoData } from "@/components/providers/DemoDataProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useI18n } from "@/hooks/use-i18n";
import { formatLongDate, todayKey } from "@/lib/dates";
import { formatDecimal, formatNumber, formatSigned } from "@/lib/format";
import { mealLabelKey, MEAL_ORDER } from "@/lib/meals";
import { getCalorieStatus, groupEntriesByDate, sumFoodEntries } from "@/lib/nutrition";
import { sortWeightRecords } from "@/lib/weights";
import type { TranslationKey } from "@/lib/i18n";

const statusLabelKeys: Record<string, TranslationKey> = {
  "not-logged": "status.notLogged",
  under: "status.under",
  on: "status.on",
  over: "status.over",
};

function greetingKey(hour: number): TranslationKey {
  if (hour < 5) {
    return "dashboard.greetingNight";
  }

  if (hour < 12) {
    return "dashboard.greetingMorning";
  }

  if (hour < 18) {
    return "dashboard.greetingAfternoon";
  }

  return "dashboard.greetingEvening";
}

export function DashboardView() {
  const { entries, profile, targets, weightRecords } = useDemoData();
  const { locale, t } = useI18n();
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const today = todayKey();

  const todayEntries = useMemo(
    () => groupEntriesByDate(entries).get(today) ?? [],
    [entries, today],
  );

  const totals = sumFoodEntries(todayEntries);
  const status = getCalorieStatus(totals.calories, targets.calories);
  const remaining = Math.max(targets.calories - totals.calories, 0);
  const isNotLogged = todayEntries.length === 0;

  const recentEntries = [...todayEntries]
    .sort((a, b) => b.loggedAt.localeCompare(a.loggedAt))
    .slice(0, 5);

  const orderedWeights = useMemo(
    () => sortWeightRecords(weightRecords),
    [weightRecords],
  );
  const latestWeight = orderedWeights[orderedWeights.length - 1];
  const previousWeight = orderedWeights[orderedWeights.length - 2];
  const weightChange =
    latestWeight && previousWeight ? latestWeight.weight - previousWeight.weight : 0;

  const remainingMessage =
    remaining > 500
      ? t("dashboard.remainingMessage", {
          count: formatNumber(remaining, locale),
        })
      : t("dashboard.closeMessage");

  const calorieKpis: { label: TranslationKey; value: number }[] = [
    { label: "common.consumed", value: totals.calories },
    { label: "common.remaining", value: remaining },
    { label: "common.target", value: targets.calories },
  ];

  const macros: { label: TranslationKey; value: number; target: number }[] = [
    { label: "common.protein", value: totals.protein, target: targets.protein },
    {
      label: "common.carbohydrates",
      value: totals.carbohydrates,
      target: targets.carbohydrates,
    },
    { label: "common.fat", value: totals.fat, target: targets.fat },
  ];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            {t("dashboard.title")}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {t("dashboard.subtitle")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/catalog"
            className="inline-flex h-10 items-center justify-center rounded-md bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            {t("common.addFood")}
          </Link>
          <Button
            type="button"
            variant="outline"
            onClick={() => setQuickAddOpen(true)}
          >
            <Plus className="size-4" aria-hidden="true" />
            {t("common.quickAdd")}
          </Button>
          <Link
            href="/diary"
            className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
          >
            {t("dashboard.viewDiary")}
          </Link>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          {t(greetingKey(new Date().getHours()))}
          {profile.displayName ? `, ${profile.displayName}` : ""}
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {formatLongDate(today, locale)}
        </p>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          {isNotLogged ? t("dashboard.nothingLogged") : remainingMessage}
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="size-5 text-brand-600" aria-hidden="true" />
              {t("dashboard.dailyCalories")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <Badge variant={status.tone === "neutral" ? "neutral" : status.tone}>
              {t(statusLabelKeys[status.key])}
            </Badge>

            {isNotLogged ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400">
                {t("dashboard.nothingLogged")}
              </div>
            ) : (
              <>
                <Progress
                  value={totals.calories}
                  max={targets.calories}
                  tone={status.tone}
                />
                <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="divide-y divide-slate-200 dark:divide-slate-800">
                    {calorieKpis.map((kpi) => (
                      <div
                        key={kpi.label}
                        className="flex items-baseline justify-between px-4 py-4"
                      >
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {t(kpi.label)}
                        </span>
                        <span className="text-2xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-white">
                          {formatNumber(kpi.value, locale)}{" "}
                          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            {t("common.kcal")}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.macros")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {macros.map((macro) => (
              <div key={macro.label} className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {t(macro.label)}
                  </p>
                  <p className="text-sm tabular-nums text-slate-600 dark:text-slate-400">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {formatDecimal(macro.value, locale)}
                    </span>{" "}
                    / {formatNumber(macro.target, locale)} {t("common.g")}
                  </p>
                </div>
                <Progress value={macro.value} max={macro.target} tone="neutral" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UtensilsCrossed className="size-5 text-brand-600" aria-hidden="true" />
            {t("dashboard.meals")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-slate-200 dark:divide-slate-800">
          {MEAL_ORDER.map((category) => {
            const categoryEntries = todayEntries.filter(
              (entry) => entry.mealCategory === category,
            );
            const calories = sumFoodEntries(categoryEntries).calories;

            return (
              <div key={category} className="flex items-center justify-between py-3">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {t(mealLabelKey(category))}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {categoryEntries.length}{" "}
                    {categoryEntries.length === 1
                      ? t("common.entry")
                      : t("common.entries")}
                  </p>
                </div>
                <p className="text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                  {formatNumber(calories, locale)} {t("common.kcal")}
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.recentActivity")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col">
            {recentEntries.length === 0 ? (
              <p className="py-3 text-sm text-slate-600 dark:text-slate-400">
                {t("dashboard.noRecent")}
              </p>
            ) : (
              recentEntries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between py-2">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {entry.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t(mealLabelKey(entry.mealCategory))}
                    </p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                    {formatNumber(entry.calories, locale)} {t("common.kcal")}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="size-5 text-brand-600" aria-hidden="true" />
              {t("dashboard.currentWeight")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {latestWeight ? (
              <>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {t("analytics.latest")}
                  </span>
                  <span className="text-2xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-white">
                    {formatDecimal(latestWeight.weight, locale)} {t("common.kg")}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {t("common.change")}
                  </span>
                  <span className="text-sm font-medium tabular-nums text-slate-900 dark:text-white">
                    {formatSigned(weightChange, locale)} {t("common.kg")}
                  </span>
                </div>
                <Link
                  href="/analytics"
                  className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline dark:text-brand-400"
                >
                  {t("analytics.weightTrend")}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </>
            ) : (
              <p className="py-3 text-sm text-slate-600 dark:text-slate-400">
                {t("dashboard.noWeight")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <QuickAddDialog open={quickAddOpen} onOpenChange={setQuickAddOpen} />
    </div>
  );
}
