"use client";

import { useState, type FormEvent } from "react";
import { TriangleAlert } from "lucide-react";
import { useDemoData } from "@/components/providers/DemoDataProvider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogActionBar,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/hooks/use-i18n";
import {
  CUSTOM_FOOD_NUTRITION_FIELDS,
  customFoodToForm,
  emptyCustomFoodForm,
  validateCustomFoodForm,
  type CustomFoodFieldError,
  type CustomFoodFormField,
  type CustomFoodFormValues,
  type CustomFoodNutritionField,
  type CustomFoodWarning,
  type CustomFoodWarningCode,
} from "@/lib/custom-foods";
import { FOOD_CATEGORIES, categoryLabelKey } from "@/lib/food-search";
import type { TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { CustomFood } from "@/types";

const FIELD_ERROR_KEYS: Record<CustomFoodFieldError, TranslationKey> = {
  required: "customFood.error.required",
  "not-a-number": "customFood.error.not-a-number",
  negative: "customFood.error.negative",
  positive: "customFood.error.positive",
  "too-long": "customFood.error.too-long",
  "invalid-category": "customFood.error.invalid-category",
};

const WARNING_KEYS: Record<CustomFoodWarningCode, TranslationKey> = {
  "energy-mismatch": "customFood.warning.energy-mismatch",
  "energy-too-high": "customFood.warning.energy-too-high",
  "macro-too-high": "customFood.warning.macro-too-high",
  "fiber-and-sugar": "customFood.warning.fiber-and-sugar",
  "saturated-fat": "customFood.warning.saturated-fat",
  "sodium-high": "customFood.warning.sodium-high",
};

const NUTRITION_LABELS: Record<
  CustomFoodNutritionField,
  { labelKey: TranslationKey; unitKey?: TranslationKey }
> = {
  calories: { labelKey: "customFood.calories" },
  protein: { labelKey: "common.protein", unitKey: "common.g" },
  carbohydrates: { labelKey: "common.carbohydrates", unitKey: "common.g" },
  fat: { labelKey: "common.fat", unitKey: "common.g" },
  fiber: { labelKey: "common.fiber", unitKey: "common.g" },
  sugar: { labelKey: "common.sugar", unitKey: "common.g" },
  saturatedFat: { labelKey: "common.saturatedFat", unitKey: "common.g" },
  sodium: { labelKey: "customFood.sodium" },
};

type CustomFoodDialogProps = {
  open: boolean;
  food: CustomFood | null;
  onOpenChange: (open: boolean) => void;
};

export function CustomFoodDialog({
  open,
  food,
  onOpenChange,
}: CustomFoodDialogProps) {
  const { createCustomFood, updateCustomFood } = useDemoData();
  const { t } = useI18n();
  const editing = food !== null;
  const [form, setForm] = useState<CustomFoodFormValues>(() =>
    food ? customFoodToForm(food) : emptyCustomFoodForm(),
  );
  const [errors, setErrors] = useState<
    Partial<Record<CustomFoodFormField, CustomFoodFieldError>>
  >({});
  const [warnings, setWarnings] = useState<CustomFoodWarning[]>([]);
  const [showWarnings, setShowWarnings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  function updateField(field: CustomFoodFormField, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!(field in current)) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    setShowWarnings(false);
    setSaveFailed(false);
  }

  function fieldError(field: CustomFoodFormField): string | null {
    const code = errors[field];
    return code ? t(FIELD_ERROR_KEYS[code]) : null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    const result = validateCustomFoodForm(form);
    setErrors(result.errors);

    if (!result.values) {
      setShowWarnings(false);
      return;
    }

    if (result.warnings.length > 0 && !showWarnings) {
      setWarnings(result.warnings);
      setShowWarnings(true);
      return;
    }

    setSaving(true);
    setSaveFailed(false);
    try {
      const targetId = food?.id;
      const saved =
        editing && targetId
          ? await updateCustomFood(targetId, result.values)
          : await createCustomFood(result.values);

      if (!saved) {
        setSaveFailed(true);
        return;
      }

      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <form onSubmit={handleSubmit} noValidate>
        <DialogHeader>
          <DialogTitle>
            {editing
              ? t("customFood.formTitleEdit", { name: food.name })
              : t("customFood.formTitleCreate")}
          </DialogTitle>
          <DialogDescription>{t("customFood.formDescription")}</DialogDescription>
        </DialogHeader>

        <div className="mt-5 flex flex-col gap-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label
                htmlFor="custom-food-name"
                className="text-sm font-medium text-slate-900 dark:text-white"
              >
                {t("customFood.name")}
              </label>
              <Input
                id="custom-food-name"
                name="name"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder={t("customFood.namePlaceholder")}
                maxLength={120}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "custom-food-name-error" : undefined}
                className="mt-1.5"
              />
              <FieldError field="name" error={fieldError("name")} />
            </div>

            <div>
              <label
                htmlFor="custom-food-category"
                className="text-sm font-medium text-slate-900 dark:text-white"
              >
                {t("common.category")}
              </label>
              <select
                id="custom-food-category"
                name="category"
                value={form.category}
                onChange={(event) => {
                  updateField("category", event.target.value);
                }}
                aria-invalid={Boolean(errors.category)}
                aria-describedby={
                  errors.category ? "custom-food-category-error" : undefined
                }
                className={cn(
                  "mt-1.5 flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-white",
                  errors.category && "border-red-500 dark:border-red-500",
                )}
              >
                {FOOD_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {t(categoryLabelKey(category))}
                  </option>
                ))}
              </select>
              <FieldError field="category" error={fieldError("category")} />
            </div>

            <div>
              <label
                htmlFor="custom-food-default-grams"
                className="text-sm font-medium text-slate-900 dark:text-white"
              >
                {t("customFood.defaultPortion")}
              </label>
              <Input
                id="custom-food-default-grams"
                name="defaultGrams"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={form.defaultGrams}
                onChange={(event) => {
                  updateField("defaultGrams", event.target.value);
                }}
                aria-invalid={Boolean(errors.defaultGrams)}
                aria-describedby={
                  errors.defaultGrams
                    ? "custom-food-default-grams-error"
                    : undefined
                }
                className={cn(
                  "mt-1.5",
                  errors.defaultGrams && "border-red-500 dark:border-red-500",
                )}
              />
              <FieldError
                field="defaultGrams"
                error={fieldError("defaultGrams")}
              />
            </div>
          </div>

          <fieldset className="border-t border-slate-200 pt-4 dark:border-slate-800">
            <legend className="sr-only">{t("customFood.nutritionHeading")}</legend>
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {t("customFood.nutritionHeading")}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">
              {t("customFood.nutritionHelp")}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-3">
              {CUSTOM_FOOD_NUTRITION_FIELDS.map((field) => {
                const labels = NUTRITION_LABELS[field];
                const error = fieldError(field);
                const inputId = `custom-food-${field}`;

                return (
                  <div key={field}>
                    <label
                      htmlFor={inputId}
                      className="text-sm font-medium text-slate-900 dark:text-white"
                    >
                      {t(labels.labelKey)}
                      {labels.unitKey ? ` (${t(labels.unitKey)})` : ""}
                    </label>
                    <Input
                      id={inputId}
                      name={field}
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="any"
                      value={form[field]}
                      onChange={(event) => {
                        updateField(field, event.target.value);
                      }}
                      aria-invalid={Boolean(errors[field])}
                      aria-describedby={error ? `${inputId}-error` : undefined}
                      className={cn(
                        "mt-1.5 tabular-nums",
                        error && "border-red-500 dark:border-red-500",
                      )}
                    />
                    <FieldError
                      field={field}
                      error={error}
                      inputId={inputId}
                    />
                  </div>
                );
              })}
            </div>
          </fieldset>

          {showWarnings && warnings.length > 0 ? (
            <div
              role="alert"
              className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
            >
              <p className="flex items-center gap-2 text-sm font-medium">
                <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
                {t("customFood.warningTitle")}
              </p>
              <p className="mt-1 text-xs leading-5">
                {t("customFood.warningDescription")}
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5">
                {warnings.map((warning) => (
                  <li key={warning.code}>
                    {t(
                      WARNING_KEYS[warning.code],
                      warning.values as Record<string, string | number> | undefined,
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {saveFailed ? (
            <p
              role="alert"
              className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
            >
              {t("customFood.saveFailed")}
            </p>
          ) : null}
        </div>

        <DialogActionBar className="flex-row justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={saving}>
            {saving
              ? t("common.saving")
              : showWarnings
                ? t("customFood.warningConfirm")
                : editing
                  ? t("customFood.saveEdit")
                  : t("customFood.saveCreate")}
          </Button>
        </DialogActionBar>
      </form>
    </Dialog>
  );
}

function FieldError({
  field,
  error,
  inputId = `custom-food-${field}`,
}: {
  field: CustomFoodFormField;
  error: string | null;
  inputId?: string;
}) {
  if (!error) return null;

  return (
    <p
      id={`${inputId}-error`}
      className="mt-1 text-xs text-red-600 dark:text-red-400"
    >
      {error}
    </p>
  );
}
