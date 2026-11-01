"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Pencil,
  Plus,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
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
import {
  addMonths,
  buildMonthGrid,
  formatLongDate,
  formatTime,
  monthLabel,
  todayKey,
} from "@/lib/dates";
import { formatDecimal, formatNumber } from "@/lib/format";
import { groupEntriesIntoSessions, mealLabelKey, MEAL_ORDER } from "@/lib/meals";
import {
  groupEntriesByDate,
  scaleFoodEntry,
  sumFoodEntries,
} from "@/lib/nutrition";
import { cn } from "@/lib/utils";
import type { FoodEntry } from "@/types";

type DeleteTarget =
  | { type: "entry"; entry: FoodEntry }
  | {
      type: "session";
      sessionId: string;
      date: string;
      category: FoodEntry["mealCategory"];
      count: number;
      time: string;
    };

function weekdayLabels(locale: string): string[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(2026, 9, 5 + index);
    return date.toLocaleDateString(locale, { weekday: "short" });
  });
}

export function DiaryView() {
  const {
    copyPreviousDay,
    dataMode,
    deleteEntry,
    deleteSession,
    duplicateEntry,
    duplicateSession,
    entries,
    updateEntry,
  } = useDemoData();
  const { locale, t } = useI18n();
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [monthAnchor, setMonthAnchor] = useState(todayKey());
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<FoodEntry | null>(null);
  const [editGrams, setEditGrams] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [savingMutation, setSavingMutation] = useState(false);

  const grouped = useMemo(() => groupEntriesByDate(entries), [entries]);
  const dayEntries = grouped.get(selectedDate) ?? [];
  const dayTotals = sumFoodEntries(dayEntries);
  const weeks = useMemo(() => buildMonthGrid(monthAnchor), [monthAnchor]);
  const labels = useMemo(() => weekdayLabels(locale), [locale]);

  const monthHasPrevious = monthAnchor > "1970-01-01";
  const monthHasNext = monthAnchor < monthLabelBoundary();

  function selectDate(dateKey: string) {
    setSelectedDate(dateKey);
    setMonthAnchor(dateKey);
    setExpanded({});
    setCopyMessage(null);
  }

  async function handleCopyPrevious() {
    const result = await copyPreviousDay(selectedDate);

    if (!result.ok || !result.sourceDate) {
      setCopyMessage(t("diary.copyPreviousEmpty"));
      return;
    }

    setCopyMessage(
      t("diary.copyPreviousSuccess", {
        count: result.count,
        date: formatLongDate(result.sourceDate, locale),
      }),
    );
  }

  function openEdit(entry: FoodEntry) {
    setEditing(entry);
    setEditGrams(String(entry.grams));
  }

  async function saveEdit() {
    if (!editing || savingMutation) {
      return;
    }

    const grams = Number.parseFloat(editGrams);

    if (!Number.isFinite(grams) || grams <= 0) {
      return;
    }

    const scaled = scaleFoodEntry(editing, grams);
    setSavingMutation(true);
    try {
      const saved = await updateEntry(editing.id, {
        grams: scaled.grams,
        calories: scaled.calories,
        protein: scaled.protein,
        carbohydrates: scaled.carbohydrates,
        fat: scaled.fat,
        fiber: scaled.fiber,
        sugar: scaled.sugar,
        saturatedFat: scaled.saturatedFat,
        sodium: scaled.sodium,
      });
      if (saved !== false) setEditing(null);
    } finally {
      setSavingMutation(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || savingMutation) {
      return;
    }

    setSavingMutation(true);
    try {
      const deleted =
        deleteTarget.type === "entry"
          ? await deleteEntry(deleteTarget.entry.id)
          : await deleteSession(
              deleteTarget.sessionId,
              deleteTarget.date,
              deleteTarget.category,
            );
      if (deleted !== false) setDeleteTarget(null);
    } finally {
      setSavingMutation(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            {t("diary.title")}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {t("diary.subtitle")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/catalog"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            <Plus className="size-4" aria-hidden="true" />
            {t("diary.addFood")}
          </Link>
          <Button type="button" variant="outline" onClick={handleCopyPrevious}>
            <Copy className="size-4" aria-hidden="true" />
            {t("diary.copyPrevious")}
          </Button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <section
          aria-label={t("diary.calendar")}
          className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMonthAnchor(addMonths(monthAnchor, -1))}
              disabled={!monthHasPrevious}
              aria-label={t("diary.previousMonth")}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </Button>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {monthLabel(monthAnchor, locale)}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMonthAnchor(addMonths(monthAnchor, 1))}
              disabled={!monthHasNext}
              aria-label={t("diary.nextMonth")}
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1">
            {labels.map((label) => (
              <div
                key={label}
                className="py-1 text-center text-[11px] font-medium text-slate-500 dark:text-slate-400"
                aria-hidden="true"
              >
                {label}
              </div>
            ))}
            {weeks.flat().map((cell) => {
              const logged = (grouped.get(cell.dateKey) ?? []).length > 0;
              const selected = cell.dateKey === selectedDate;
              const isToday = cell.dateKey === todayKey();

              return (
                <button
                  key={cell.dateKey}
                  type="button"
                  onClick={() => selectDate(cell.dateKey)}
                  aria-pressed={selected}
                  aria-label={`${formatLongDate(cell.dateKey, locale)}${
                    logged ? `, ${t("diary.logged")}` : ""
                  }`}
                  className={cn(
                    "relative flex aspect-square flex-col items-center justify-center rounded-lg text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
                    cell.inMonth
                      ? "text-slate-700 dark:text-slate-300"
                      : "text-slate-300 dark:text-slate-600",
                    selected && "bg-brand-600 text-white dark:text-white",
                    !selected && isToday && "ring-1 ring-brand-500",
                    !selected && "hover:bg-slate-100 dark:hover:bg-slate-800",
                  )}
                >
                  {cell.day}
                  {logged ? (
                    <span
                      className={cn(
                        "mt-0.5 size-1.5 rounded-full",
                        selected ? "bg-white" : "bg-brand-500",
                      )}
                      aria-hidden="true"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-3 border-t border-slate-200 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <span className="inline-flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-brand-500" aria-hidden="true" />
              {t("diary.logged")}
            </span>
            <span>{t("diary.notLogged")}</span>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">
              {t("diary.selectedDate")}
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {formatLongDate(selectedDate, locale)}
            </h2>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge variant={dayEntries.length > 0 ? "success" : "neutral"}>
                {dayEntries.length > 0 ? t("diary.logged") : t("diary.notLogged")}
              </Badge>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {formatNumber(dayTotals.calories, locale)} {t("common.kcal")} ·{" "}
                {formatDecimal(dayTotals.protein, locale)} {t("common.g")}{" "}
                {t("common.protein").toLowerCase()}
              </span>
            </div>
            {copyMessage ? (
              <p
                role="status"
                className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
              >
                {copyMessage}
              </p>
            ) : null}
          </div>

          {dayEntries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
              <UtensilsCrossed
                className="mx-auto size-8 text-slate-400"
                aria-hidden="true"
              />
              <p className="mt-3 text-sm font-medium text-slate-900 dark:text-white">
                {t("diary.noEntriesTitle")}
              </p>
              <p className="mx-auto mt-1 max-w-md text-sm text-slate-600 dark:text-slate-400">
                {t("diary.noEntriesDescription")}
              </p>
              <Link
                href="/catalog"
                className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                {t("diary.addFood")}
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {MEAL_ORDER.map((category) => {
                const categoryEntries = dayEntries.filter(
                  (entry) => entry.mealCategory === category,
                );
                const sessions = groupEntriesIntoSessions(categoryEntries);
                const categoryTotals = sumFoodEntries(categoryEntries);

                return (
                  <div
                    key={category}
                    className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-4 dark:border-slate-800">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                          {t(mealLabelKey(category))}
                        </h3>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {categoryEntries.length > 0
                            ? `${formatNumber(categoryTotals.calories, locale)} ${t("common.kcal")}`
                            : t("diary.noSession")}
                        </p>
                      </div>
                      <Link
                        href="/catalog"
                        className="text-xs font-medium text-brand-700 hover:underline dark:text-brand-400"
                      >
                        {t("diary.addAnotherSession")}
                      </Link>
                    </div>

                    {sessions.length > 0 ? (
                      <div className="divide-y divide-slate-200 dark:divide-slate-800">
                        {sessions.map((session) => {
                          const sessionTotals = sumFoodEntries(session.entries);
                          const time = formatTime(session.loggedAt, locale);

                          return (
                            <div key={session.sessionId} className="p-4">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                                  <Clock className="size-3.5" aria-hidden="true" />
                                  {t("diary.sessionAt", { time })}
                                </p>
                                <div className="flex items-center gap-1">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      duplicateSession(
                                        session.sessionId,
                                        selectedDate,
                                        category,
                                      )
                                    }
                                    aria-label={t("diary.duplicateSession")}
                                  >
                                    <Copy className="size-4" aria-hidden="true" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      setDeleteTarget({
                                        type: "session",
                                        sessionId: session.sessionId,
                                        date: selectedDate,
                                        category,
                                        count: session.entries.length,
                                        time,
                                      })
                                    }
                                    aria-label={t("diary.deleteSession")}
                                  >
                                    <Trash2 className="size-4" aria-hidden="true" />
                                  </Button>
                                </div>
                              </div>

                              <ul className="mt-3 flex flex-col gap-2">
                                {session.entries.map((entry) => {
                                  const isOpen = Boolean(expanded[entry.id]);

                                  return (
                                    <li
                                      key={entry.id}
                                      className="rounded-xl border border-slate-200 dark:border-slate-800"
                                    >
                                      <div className="flex flex-wrap items-center justify-between gap-2 p-3">
                                        <div className="min-w-0">
                                          <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                                            {entry.name}
                                          </p>
                                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                            {formatDecimal(entry.grams, locale)}{" "}
                                            {t("common.g")} ·{" "}
                                            {formatNumber(entry.calories, locale)}{" "}
                                            {t("common.kcal")}
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setExpanded((current) => ({
                                                ...current,
                                                [entry.id]: !current[entry.id],
                                              }))
                                            }
                                            aria-expanded={isOpen}
                                            className="rounded-md px-2 py-1 text-xs font-medium text-brand-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:text-brand-400"
                                          >
                                            {isOpen
                                              ? t("diary.collapse")
                                              : t("diary.expand")}
                                          </button>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openEdit(entry)}
                                            aria-label={`${t("common.edit")} ${entry.name}`}
                                          >
                                            <Pencil
                                              className="size-4"
                                              aria-hidden="true"
                                            />
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => duplicateEntry(entry.id)}
                                            aria-label={`${t("common.duplicate")} ${entry.name}`}
                                          >
                                            <Copy
                                              className="size-4"
                                              aria-hidden="true"
                                            />
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              setDeleteTarget({
                                                type: "entry",
                                                entry,
                                              })
                                            }
                                            aria-label={`${t("common.delete")} ${entry.name}`}
                                          >
                                            <Trash2
                                              className="size-4"
                                              aria-hidden="true"
                                            />
                                          </Button>
                                        </div>
                                      </div>

                                      {isOpen ? (
                                        <dl className="grid grid-cols-2 gap-px border-t border-slate-200 bg-slate-200 sm:grid-cols-4 dark:border-slate-800 dark:bg-slate-800">
                                          {[
                                            {
                                              label: t("common.protein"),
                                              value: formatDecimal(
                                                entry.protein,
                                                locale,
                                              ),
                                              unit: t("common.g"),
                                            },
                                            {
                                              label: t("common.carbohydrates"),
                                              value: formatDecimal(
                                                entry.carbohydrates,
                                                locale,
                                              ),
                                              unit: t("common.g"),
                                            },
                                            {
                                              label: t("common.fat"),
                                              value: formatDecimal(
                                                entry.fat,
                                                locale,
                                              ),
                                              unit: t("common.g"),
                                            },
                                            {
                                              label: t("common.fiber"),
                                              value: formatDecimal(
                                                entry.fiber ?? 0,
                                                locale,
                                              ),
                                              unit: t("common.g"),
                                            },
                                          ].map((item) => (
                                            <div
                                              key={item.label}
                                              className="bg-white p-3 dark:bg-slate-900"
                                            >
                                              <dt className="text-xs text-slate-500 dark:text-slate-400">
                                                {item.label}
                                              </dt>
                                              <dd className="mt-1 text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                                                {item.value} {item.unit}
                                              </dd>
                                            </div>
                                          ))}
                                        </dl>
                                      ) : null}
                                    </li>
                                  );
                                })}
                              </ul>

                              <p className="mt-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400">
                                {t("diary.mealTotal")}:{" "}
                                <span className="text-slate-900 dark:text-white">
                                  {formatNumber(sessionTotals.calories, locale)}{" "}
                                  {t("common.kcal")}
                                </span>
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}

          {dataMode === "demo" ? (
            <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
              {t("diary.demoNote")}
            </p>
          ) : null}
        </section>
      </div>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogHeader>
          <DialogTitle>{t("diary.editQuantityTitle")}</DialogTitle>
          <DialogDescription>
            {t("diary.editQuantityDescription")}
          </DialogDescription>
        </DialogHeader>
        {editing ? (
          <div className="mt-5 flex flex-col gap-2">
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {editing.name}
            </p>
            <label
              htmlFor="diary-edit-grams"
              className="text-sm font-medium text-slate-900 dark:text-white"
            >
              {t("diary.quantityGrams")}
            </label>
            <div className="flex items-center gap-2">
              <Input
                id="diary-edit-grams"
                type="number"
                min="0.1"
                step="0.1"
                inputMode="decimal"
                value={editGrams}
                onChange={(event) => setEditGrams(event.target.value)}
                className="max-w-40"
              />
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {t("common.g")}
              </span>
            </div>
          </div>
        ) : null}
        <DialogFooter className="flex-row justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => setEditing(null)}
          >
            {t("common.cancel")}
          </Button>
          <Button type="button" onClick={saveEdit} disabled={savingMutation}>
            {savingMutation ? t("common.saving") : t("diary.saveChanges")}
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogHeader>
          <DialogTitle>
            {deleteTarget?.type === "session"
              ? t("diary.deleteSessionTitle")
              : t("diary.deleteEntryTitle")}
          </DialogTitle>
          <DialogDescription>
            {deleteTarget?.type === "session"
              ? t("diary.deleteSessionDescription", {
                  count: deleteTarget.count,
                  time: deleteTarget.time,
                })
              : deleteTarget?.type === "entry"
                ? t("diary.deleteEntryDescription", {
                    name: deleteTarget.entry.name,
                    date: formatLongDate(selectedDate, locale),
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
          <Button type="button" onClick={confirmDelete} disabled={savingMutation}>
            {savingMutation ? t("common.saving") : t("diary.deleteConfirm")}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

function monthLabelBoundary(): string {
  const now = new Date();
  return `${now.getFullYear() + 1}-12-31`;
}
