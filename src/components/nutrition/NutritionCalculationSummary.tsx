"use client";

import { useI18n } from "@/hooks/use-i18n";
import { formatDecimal, formatNumber } from "@/lib/format";
import type {
  CalculationIssue,
  CalculationWarning,
  NutritionCalculation,
} from "@/lib/calculations/nutrition-targets";
import type { TranslationKey } from "@/lib/i18n";

const issueKeys: Record<CalculationIssue, TranslationKey> = {
  "age-out-of-range": "nutrition.issue.age",
  "sex-required": "nutrition.issue.sex",
  "height-out-of-range": "nutrition.issue.height",
  "weight-out-of-range": "nutrition.issue.weight",
  "activity-required": "nutrition.issue.activity",
  "workout-days-out-of-range": "nutrition.issue.workoutDays",
  "goal-required": "nutrition.issue.goal",
  "target-weight-out-of-range": "nutrition.issue.targetWeight",
  "goal-direction-invalid": "nutrition.issue.goalDirection",
  "loss-rate-invalid": "nutrition.issue.lossRate",
  "gain-rate-invalid": "nutrition.issue.gainRate",
  "macro-preference-required": "nutrition.issue.macroPreference",
  "custom-split-invalid": "nutrition.issue.customSplit",
  "low-current-bmi-weight-loss": "nutrition.issue.lowCurrentBmi",
};

const warningKeys: Record<
  Exclude<
    CalculationWarning,
    | "target-bmi-below-range"
    | "deficit-limited-by-cap"
    | "deficit-limited-by-calorie-guardrail"
    | "tdee-at-or-below-calorie-guardrail"
    | "protein-clamped-to-amdr"
    | "rounding-difference"
    | "muscle-gain-limitations"
  >,
  TranslationKey
> = {
  "age-outside-study-range": "nutrition.warning.age",
  "maintenance-target-differs": "nutrition.warning.maintenanceTarget",
  "carbohydrate-outside-amdr": "nutrition.warning.carbohydrate",
};

export function NutritionCalculationSummary({
  calculation,
}: {
  calculation: NutritionCalculation;
}) {
  const { locale, t } = useI18n();

  function warningText(warning: CalculationWarning): string | null {
    if (warning === "muscle-gain-limitations") {
      return t("nutrition.warning.muscleGain");
    }

    if (warning === "protein-clamped-to-amdr") {
      return t("nutrition.warning.proteinClamp");
    }

    if (warning === "target-bmi-below-range") {
      const targetBmi = calculation.available
        ? calculation.details.targetBmi
        : calculation.targetBmi;

      return targetBmi === undefined
        ? null
        : t("nutrition.warning.targetBmi", {
            bmi: formatDecimal(targetBmi, locale),
          });
    }

    if (!calculation.available) {
      if (
        warning === "age-outside-study-range" ||
        warning === "maintenance-target-differs"
      ) {
        return t(warningKeys[warning]);
      }

      return null;
    }

    if (warning === "deficit-limited-by-cap") {
      return t("nutrition.warning.deficitCap", {
        requested: formatNumber(
          calculation.details.requestedDeficitKcal ?? 0,
          locale,
        ),
        actual: formatNumber(
          calculation.details.actualDeficitKcal ?? 0,
          locale,
        ),
      });
    }

    if (warning === "deficit-limited-by-calorie-guardrail") {
      return t("nutrition.warning.deficitReduced", {
        requested: formatNumber(
          calculation.details.requestedDeficitKcal ?? 0,
          locale,
        ),
        actual: formatNumber(
          calculation.details.actualDeficitKcal ?? 0,
          locale,
        ),
        guardrail: formatNumber(
          calculation.details.calorieGuardrailKcal ?? 0,
          locale,
        ),
      });
    }

    if (warning === "tdee-at-or-below-calorie-guardrail") {
      return t("nutrition.warning.noDeficit", {
        guardrail: formatNumber(
          calculation.details.calorieGuardrailKcal ?? 0,
          locale,
        ),
      });
    }

    if (warning === "rounding-difference") {
      return t("nutrition.warning.rounding", {
        difference: formatNumber(
          calculation.details.roundingDifferenceKcal,
          locale,
        ),
      });
    }

    return t(warningKeys[warning]);
  }

  return (
    <section
      className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
      aria-live="polite"
    >
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
        {calculation.available
          ? t("nutrition.calculationAvailable")
          : t("nutrition.manualFallback")}
      </h3>

      {calculation.available ? (
        <>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <SummaryItem
              label={t("nutrition.bmr")}
              value={`${formatDecimal(calculation.targets.bmr, locale)} ${t("common.kcal")}`}
            />
            <SummaryItem
              label={t("nutrition.tdee")}
              value={`${formatDecimal(calculation.targets.tdee, locale)} ${t("common.kcal")}`}
            />
            <SummaryItem
              label={t("nutrition.activityPal")}
              value={formatDecimal(calculation.targets.activityPal, locale)}
            />
            <SummaryItem
              label={t("nutrition.bmi")}
              value={formatDecimal(calculation.details.bmi, locale)}
            />
            <SummaryItem
              label={t("nutrition.targetBmi")}
              value={formatDecimal(calculation.details.targetBmi, locale)}
            />
            <SummaryItem
              label={t("nutrition.proteinPerKg")}
              value={`${formatDecimal(calculation.details.proteinPerKg, locale)} ${t("common.g")}/kg`}
            />
            <SummaryItem
              label={t("nutrition.proteinPercent")}
              value={`${formatDecimal(calculation.details.proteinPercent, locale)}%`}
            />
            <SummaryItem
              label={t("nutrition.carbohydratePercent")}
              value={`${formatDecimal(calculation.details.carbohydratePercent, locale)}%`}
            />
            <SummaryItem
              label={t("nutrition.fatPercent")}
              value={`${formatDecimal(calculation.details.fatPercent, locale)}%`}
            />
          </dl>
          <p className="mt-3 text-xs leading-5 text-slate-600 dark:text-slate-400">
            {t("nutrition.workoutFrequencyNote")}
          </p>
        </>
      ) : (
        <>
          <p className="mt-2 text-sm leading-5 text-slate-600 dark:text-slate-400">
            {t("nutrition.manualFallbackDescription")}
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-700 dark:text-slate-300">
            {calculation.issues.map((issue) => (
              <li key={issue}>{t(issueKeys[issue])}</li>
            ))}
          </ul>
        </>
      )}

      {calculation.warnings.length > 0 ? (
        <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-amber-900 dark:text-amber-100">
          {calculation.warnings.map((warning) => {
            const text = warningText(warning);
            return text ? <li key={warning}>{text}</li> : null;
          })}
        </ul>
      ) : null}
    </section>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-slate-600 dark:text-slate-400">{label}</dt>
      <dd className="text-right font-medium tabular-nums text-slate-900 dark:text-white">
        {value}
      </dd>
    </div>
  );
}
