"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Pencil, Plus, Scale, Trash2 } from "lucide-react";
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
import { formatShortDate, lastDateKeys, toDateKey, todayKey } from "@/lib/dates";
import { formatDecimal, formatNumber, formatSigned } from "@/lib/format";
import {
  averageDailyNutrition,
  groupEntriesByDate,
  sumFoodEntries,
} from "@/lib/nutrition";
import { cn } from "@/lib/utils";
import type { WeightRecord } from "@/types";

type Period = 7 | 30;

type WeightTarget = WeightRecord | "new";

export function AnalyticsView() {
  const { addWeight, deleteWeight, entries, updateWeight, weightRecords } =
    useDemoData();
  const { locale, t } = useI18n();
  const [period, setPeriod] = useState<Period>(7);
  const [weightTarget, setWeightTarget] = useState<WeightTarget | null>(null);
  const [weightValue, setWeightValue] = useState("");
  const [weightDate, setWeightDate] = useState(todayKey());
  const [deleteTarget, setDeleteTarget] = useState<WeightRecord | null>(null);
  const [savingWeight, setSavingWeight] = useState(false);

  const dateKeys = useMemo(() => lastDateKeys(period), [period]);
  const grouped = useMemo(() => groupEntriesByDate(entries), [entries]);

  const averages = useMemo(
    () => averageDailyNutrition(entries, dateKeys),
    [dateKeys, entries],
  );

  const calorieData = useMemo(
    () =>
      dateKeys.map((dateKey) => {
        const dayEntries = grouped.get(dateKey);

        return {
          date: formatShortDate(dateKey, locale),
          calories: dayEntries ? Math.round(sumFoodEntries(dayEntries).calories) : null,
          protein: dayEntries ? sumFoodEntries(dayEntries).protein : null,
          carbohydrates: dayEntries
            ? sumFoodEntries(dayEntries).carbohydrates
            : null,
          fat: dayEntries ? sumFoodEntries(dayEntries).fat : null,
        };
      }),
    [dateKeys, grouped, locale],
  );

  const periodWeights = useMemo(() => {
    const start = dateKeys[0] ?? todayKey();

    return weightRecords.filter((record) => {
      const dateKey = toDateKey(new Date(record.loggedAt));
      return dateKey >= start && dateKey <= todayKey();
    });
  }, [dateKeys, weightRecords]);

  const weightData = useMemo(
    () =>
      periodWeights.map((record) => ({
        date: formatShortDate(toDateKey(new Date(record.loggedAt)), locale),
        weight: record.weight,
      })),
    [locale, periodWeights],
  );

  const latestWeight = weightRecords[weightRecords.length - 1];
  const firstWeight = weightRecords[0];
  const totalChange =
    latestWeight && firstWeight ? latestWeight.weight - firstWeight.weight : 0;

  function openWeight(target: WeightTarget) {
    setWeightTarget(target);

    if (target === "new") {
      setWeightValue("");
      setWeightDate(todayKey());
      return;
    }

    setWeightValue(String(target.weight));
    setWeightDate(toDateKey(new Date(target.loggedAt)));
  }

  async function saveWeight() {
    if (savingWeight) return;
    const value = Number.parseFloat(weightValue);

    if (!Number.isFinite(value) || value <= 0) {
      return;
    }

    setSavingWeight(true);
    try {
      const saved =
        weightTarget === "new"
          ? await addWeight(value, weightDate)
          : weightTarget
            ? await updateWeight(weightTarget.id, value, weightDate)
            : false;
      if (saved !== false) setWeightTarget(null);
    } finally {
      setSavingWeight(false);
    }
  }

  const hasNutritionData = averages.loggedDays > 0;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            {t("analytics.title")}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {t("analytics.subtitle")}
          </p>
        </div>
        <div
          className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900"
          role="group"
          aria-label={t("analytics.periodLabel")}
        >
          {([7, 30] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setPeriod(value)}
              aria-pressed={period === value}
              className={cn(
                "min-h-9 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
                period === value
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                  : "text-slate-500 dark:text-slate-400",
              )}
            >
              {value === 7 ? t("analytics.period7") : t("analytics.period30")}
            </button>
          ))}
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: t("analytics.averageCalories"),
            value: `${formatNumber(averages.totals.calories, locale)} ${t("common.kcal")}`,
          },
          {
            label: t("analytics.averageProtein"),
            value: `${formatDecimal(averages.totals.protein, locale)} ${t("common.g")}`,
          },
          {
            label: t("analytics.averageCarbs"),
            value: `${formatDecimal(averages.totals.carbohydrates, locale)} ${t("common.g")}`,
          },
          {
            label: t("analytics.averageFat"),
            value: `${formatDecimal(averages.totals.fat, locale)} ${t("common.g")}`,
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {item.label}
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-white">
              {item.value}
            </p>
          </div>
        ))}
      </section>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        {t("analytics.loggedDays", {
          logged: averages.loggedDays,
          period: averages.periodDays,
        })}{" "}
        · {t("analytics.averageNote")}
      </p>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
            {t("analytics.calorieTrend")}
          </h2>
          <Badge variant="info">{t("analytics.caloriesAxis")}</Badge>
        </div>
        {hasNutritionData ? (
          <div
            className="mt-4 h-64 w-full"
            role="img"
            aria-label={t("analytics.calorieTrend")}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={calorieData} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#64748b" />
                <YAxis tick={{ fontSize: 11 }} stroke="#64748b" />
                <Tooltip
                  formatter={(value) =>
                    value === null || value === undefined
                      ? t("common.notLogged")
                      : `${formatNumber(Number(value), locale)} ${t("common.kcal")}`
                  }
                />
                <Line
                  type="monotone"
                  dataKey="calories"
                  stroke="#0284c7"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyChart
            title={t("analytics.noNutritionData")}
            description={t("analytics.noNutritionDataDescription")}
          />
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
            {t("analytics.macroTrend")}
          </h2>
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="neutral">{t("common.protein")}</Badge>
            <Badge variant="neutral">{t("common.carbohydrates")}</Badge>
            <Badge variant="neutral">{t("common.fat")}</Badge>
          </div>
        </div>
        {hasNutritionData ? (
          <div
            className="mt-4 h-64 w-full"
            role="img"
            aria-label={t("analytics.macroTrend")}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={calorieData} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#64748b" />
                <YAxis tick={{ fontSize: 11 }} stroke="#64748b" />
                <Tooltip
                  formatter={(value) =>
                    `${formatDecimal(Number(value), locale)} ${t("common.g")}`
                  }
                />
                <Line type="monotone" dataKey="protein" stroke="#0284c7" strokeWidth={2} dot={false} connectNulls={false} />
                <Line type="monotone" dataKey="carbohydrates" stroke="#16a34a" strokeWidth={2} dot={false} connectNulls={false} />
                <Line type="monotone" dataKey="fat" stroke="#d97706" strokeWidth={2} dot={false} connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyChart
            title={t("analytics.noNutritionData")}
            description={t("analytics.noNutritionDataDescription")}
          />
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight text-slate-900 dark:text-white">
            <Scale className="size-5 text-brand-600" aria-hidden="true" />
            {t("analytics.weightTracking")}
          </h2>
          <Button type="button" size="sm" onClick={() => openWeight("new")}>
            <Plus className="size-4" aria-hidden="true" />
            {t("analytics.addWeight")}
          </Button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("analytics.latest")}
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-slate-900 dark:text-white">
              {latestWeight
                ? `${formatDecimal(latestWeight.weight, locale)} ${t("common.kg")}`
                : t("common.noData")}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("analytics.change")}
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-slate-900 dark:text-white">
              {latestWeight && firstWeight
                ? `${formatSigned(totalChange, locale)} ${t("common.kg")}`
                : t("common.noData")}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("analytics.history")}
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-slate-900 dark:text-white">
              {weightRecords.length}
            </p>
          </div>
        </div>

        {weightData.length > 0 ? (
          <div
            className="mt-4 h-56 w-full"
            role="img"
            aria-label={t("analytics.weightTrend")}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightData} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#64748b" />
                <YAxis
                  domain={["dataMin - 1", "dataMax + 1"]}
                  tick={{ fontSize: 11 }}
                  stroke="#64748b"
                />
                <Tooltip
                  formatter={(value) =>
                    `${formatDecimal(Number(value), locale)} ${t("common.kg")}`
                  }
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#0284c7"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyChart
            title={t("analytics.weightHistoryEmpty")}
            description={t("analytics.noWeightDataDescription")}
          />
        )}

        <ul className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
          {[...weightRecords]
            .sort((a, b) => b.loggedAt.localeCompare(a.loggedAt))
            .map((record) => (
              <li
                key={record.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2"
              >
                <div>
                  <p className="text-sm font-medium tabular-nums text-slate-900 dark:text-white">
                    {formatDecimal(record.weight, locale)} {t("common.kg")}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatShortDate(toDateKey(new Date(record.loggedAt)), locale)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openWeight(record)}
                    aria-label={t("analytics.editWeight")}
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteTarget(record)}
                    aria-label={t("analytics.deleteWeight")}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </li>
            ))}
        </ul>
      </section>

      <Dialog
        open={Boolean(weightTarget)}
        onOpenChange={(open) => !open && setWeightTarget(null)}
      >
        <DialogHeader>
          <DialogTitle>
            {weightTarget === "new"
              ? t("analytics.addWeight")
              : t("analytics.editWeight")}
          </DialogTitle>
          <DialogDescription>{t("analytics.weightTracking")}</DialogDescription>
        </DialogHeader>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="weight-value"
              className="text-sm font-medium text-slate-900 dark:text-white"
            >
              {t("analytics.weightKg")}
            </label>
            <Input
              id="weight-value"
              type="number"
              min="1"
              step="0.1"
              inputMode="decimal"
              value={weightValue}
              onChange={(event) => setWeightValue(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="weight-date"
              className="text-sm font-medium text-slate-900 dark:text-white"
            >
              {t("analytics.weightDate")}
            </label>
            <Input
              id="weight-date"
              type="date"
              value={weightDate}
              max={todayKey()}
              onChange={(event) => {
                if (event.target.value) {
                  setWeightDate(event.target.value);
                }
              }}
            />
          </div>
        </div>
        <DialogFooter className="flex-row justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => setWeightTarget(null)}
          >
            {t("common.cancel")}
          </Button>
          <Button type="button" onClick={saveWeight} disabled={savingWeight}>
            {savingWeight ? t("common.saving") : t("common.save")}
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogHeader>
          <DialogTitle>{t("analytics.deleteWeightTitle")}</DialogTitle>
          <DialogDescription>
            {deleteTarget
              ? t("analytics.deleteWeightDescription", {
                  date: formatShortDate(
                    toDateKey(new Date(deleteTarget.loggedAt)),
                    locale,
                  ),
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
            disabled={savingWeight}
            onClick={async () => {
              if (!deleteTarget || savingWeight) return;
              setSavingWeight(true);
              try {
                const deleted = await deleteWeight(deleteTarget.id);
                if (deleted !== false) setDeleteTarget(null);
              } finally {
                setSavingWeight(false);
              }
            }}
          >
            {savingWeight ? t("common.saving") : t("common.delete")}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

function EmptyChart({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
      <p className="text-sm font-medium text-slate-900 dark:text-white">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-600 dark:text-slate-400">
        {description}
      </p>
    </div>
  );
}
