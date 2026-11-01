"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useDemoData } from "@/components/providers/DemoDataProvider";
import { NutritionCalculationSummary } from "@/components/nutrition/NutritionCalculationSummary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useI18n } from "@/hooks/use-i18n";
import { useToast } from "@/hooks/use-toast";
import {
  calculateNutritionTargets,
  suggestActivityLevel,
} from "@/lib/calculations/nutrition-targets";
import { nowIso } from "@/lib/datetime";
import { formatNumber } from "@/lib/format";
import type { TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type {
  ActivityLevel,
  BiologicalSex,
  FitnessGoal,
  MacroPreference,
  UserProfile,
} from "@/types";

const selectClassName =
  "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-white";

const activityLabelKeys: Record<ActivityLevel, TranslationKey> = {
  sedentary: "settings.activity.sedentary",
  light: "settings.activity.light",
  moderate: "settings.activity.moderate",
  "very-active": "settings.activity.very-active",
  "extra-active": "settings.activity.extra-active",
};

const goalLabelKeys: Record<FitnessGoal, TranslationKey> = {
  "weight-loss": "settings.goal.weight-loss",
  maintenance: "settings.goal.maintenance",
  "muscle-gain": "settings.goal.muscle-gain",
};

const STEPS = ["profile", "activity", "goal", "targets", "review"] as const;
type Step = (typeof STEPS)[number];

type FormState = {
  displayName: string;
  ageYears: string;
  biologicalSex: BiologicalSex | "";
  heightCm: string;
  currentWeightKg: string;
  activityLevel: ActivityLevel | "";
  workoutDaysPerWeek: string;
  fitnessGoal: FitnessGoal | "";
  targetWeightKg: string;
  desiredRateKgPerWeek: string;
  macroPreference: MacroPreference | "";
  customProteinPercent: string;
  customFatPercent: string;
  customCarbPercent: string;
  calories: string;
  protein: string;
  carbohydrates: string;
  fat: string;
};

export function OnboardingView() {
  const { dataMode, profile, targets, updateProfile, updateTargets } = useDemoData();
  const { locale, t } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    displayName: profile.displayName ?? "",
    ageYears: profile.ageYears ? String(profile.ageYears) : "",
    biologicalSex: profile.biologicalSex ?? "",
    heightCm: profile.heightCm ? String(profile.heightCm) : "",
    currentWeightKg: profile.currentWeightKg
      ? String(profile.currentWeightKg)
      : "",
    activityLevel: profile.activityLevel ?? "",
    workoutDaysPerWeek: profile.workoutDaysPerWeek
      ? String(profile.workoutDaysPerWeek)
      : profile.workoutDaysPerWeek === 0
        ? "0"
        : "",
    fitnessGoal: profile.fitnessGoal ?? "",
    targetWeightKg: profile.targetWeightKg ? String(profile.targetWeightKg) : "",
    desiredRateKgPerWeek: profile.desiredRateKgPerWeek
      ? String(
          profile.fitnessGoal === "maintenance"
            ? 0
            : profile.desiredRateKgPerWeek,
        )
      : profile.fitnessGoal === "maintenance"
        ? "0"
        : "",
    macroPreference: profile.macroPreference ?? "",
    customProteinPercent: profile.customMacroSplit
      ? String(profile.customMacroSplit.proteinPercent)
      : "",
    customFatPercent: profile.customMacroSplit
      ? String(profile.customMacroSplit.fatPercent)
      : "",
    customCarbPercent: profile.customMacroSplit
      ? String(profile.customMacroSplit.carbPercent)
      : "",
    calories: String(targets.calories),
    protein: String(targets.protein),
    carbohydrates: String(targets.carbohydrates),
    fat: String(targets.fat),
  });
  const [activityWasSelected, setActivityWasSelected] = useState(
    Boolean(profile.activityLevel),
  );
  const [targetSource, setTargetSource] = useState<"calculated" | "manual">(
    "calculated",
  );

  const step = STEPS[stepIndex];
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setError(null);
  }

  function numberValue(key: keyof FormState): number | undefined {
    const parsed = Number.parseFloat(form[key]);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  function profileFromForm(): UserProfile {
    const customMacroSplit =
      form.macroPreference === "custom"
        ? {
            proteinPercent: numberValue("customProteinPercent") ?? Number.NaN,
            fatPercent: numberValue("customFatPercent") ?? Number.NaN,
            carbPercent: numberValue("customCarbPercent") ?? Number.NaN,
          }
        : undefined;

    return {
      ...profile,
      displayName: form.displayName.trim() || undefined,
      ageYears: numberValue("ageYears"),
      biologicalSex: form.biologicalSex || undefined,
      heightCm: numberValue("heightCm"),
      currentWeightKg: numberValue("currentWeightKg"),
      activityLevel: form.activityLevel || undefined,
      workoutDaysPerWeek: numberValue("workoutDaysPerWeek"),
      fitnessGoal: form.fitnessGoal || undefined,
      targetWeightKg: numberValue("targetWeightKg"),
      desiredRateKgPerWeek:
        form.fitnessGoal === "maintenance"
          ? 0
          : numberValue("desiredRateKgPerWeek"),
      macroPreference: form.macroPreference || undefined,
      customMacroSplit,
    };
  }

  const calculation = calculateNutritionTargets(profileFromForm());
  const isUsingCalculation =
    calculation.available && targetSource === "calculated";

  function rateOptions(): number[] {
    if (form.fitnessGoal === "weight-loss") return [0.25, 0.5, 0.75];
    if (form.fitnessGoal === "muscle-gain") return [0.25, 0.5];
    if (form.fitnessGoal === "maintenance") return [0];
    return [];
  }

  function validateStep(current: Step): string | null {
    if (current === "profile") {
      const age = numberValue("ageYears");
      const height = numberValue("heightCm");
      const weight = numberValue("currentWeightKg");

      if (age === undefined || !Number.isInteger(age) || age < 1) {
        return t("onboarding.validationAgeNumber");
      }

      if (height === undefined || height < 100 || height > 250) {
        return t("onboarding.validationHeight");
      }

      if (weight === undefined || weight < 30 || weight > 300) {
        return t("onboarding.validationWeight");
      }
    }

    if (current === "activity") {
      const workoutDays = numberValue("workoutDaysPerWeek");

      if (!form.activityLevel) {
        return t("onboarding.selectOption");
      }

      if (
        workoutDays === undefined ||
        !Number.isInteger(workoutDays) ||
        workoutDays < 0 ||
        workoutDays > 7
      ) {
        return t("onboarding.validationWorkoutDays");
      }
    }

    if (current === "goal") {
      if (!form.fitnessGoal) {
        return t("onboarding.selectOption");
      }

      const targetWeight = numberValue("targetWeightKg");
      const currentWeight = numberValue("currentWeightKg");

      if (targetWeight === undefined || targetWeight < 30 || targetWeight > 300) {
        return t("onboarding.validationTargetWeight");
      }

      if (
        targetWeight !== undefined &&
        currentWeight !== undefined &&
        form.fitnessGoal === "weight-loss" &&
        targetWeight >= currentWeight
      ) {
        return t("onboarding.validationGoalDirection");
      }

      const rate = numberValue("desiredRateKgPerWeek");

      if (
        (form.fitnessGoal === "weight-loss" &&
          ![0.25, 0.5, 0.75].includes(rate ?? Number.NaN)) ||
        (form.fitnessGoal === "muscle-gain" &&
          ![0.25, 0.5].includes(rate ?? Number.NaN))
      ) {
        return t("onboarding.validationRate");
      }

      if (!form.macroPreference) {
        return t("onboarding.selectOption");
      }

      if (
        form.macroPreference === "custom" &&
        !calculation.available &&
        calculation.issues.includes("custom-split-invalid")
      ) {
        return t("onboarding.validationCustomSplit");
      }

      if (
        targetWeight !== undefined &&
        currentWeight !== undefined &&
        form.fitnessGoal === "muscle-gain" &&
        targetWeight <= currentWeight
      ) {
        return t("onboarding.validationGoalDirection");
      }
    }

    if (current === "targets") {
      const values = ["calories", "protein", "carbohydrates", "fat"] as const;

      if (
        values.some((key) => {
          const value = numberValue(key);
          return value === undefined || !Number.isInteger(value) || value <= 0;
        })
      ) {
        return t("onboarding.validationWholeTargets");
      }
    }

    return null;
  }

  function next() {
    const validationError = validateStep(step);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    if (
      step === "goal" &&
      calculation.available &&
      targetSource === "calculated"
    ) {
      setForm((current) => ({
        ...current,
        calories: String(calculation.targets.calories),
        protein: String(calculation.targets.protein),
        carbohydrates: String(calculation.targets.carbohydrates),
        fat: String(calculation.targets.fat),
      }));
    }
    setStepIndex((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function back() {
    setError(null);
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  async function finish() {
    if (saving) return;
    setSaving(true);
    try {
      const savedProfile = await updateProfile(profileFromForm());
      if (savedProfile === false) return;

      if (calculation.available && targetSource === "calculated") {
        const savedTargets = await updateTargets({
          ...calculation.targets,
          calculatedAt: nowIso(),
        });
        if (savedTargets === false) return;
      } else {
        const savedTargets = await updateTargets({
          calories: numberValue("calories") ?? targets.calories,
          protein: numberValue("protein") ?? targets.protein,
          carbohydrates: numberValue("carbohydrates") ?? targets.carbohydrates,
          fat: numberValue("fat") ?? targets.fat,
          source: "manual",
        });
        if (savedTargets === false) return;
      }
      toast({ title: t("onboarding.complete"), variant: "success" });
      router.push("/");
    } finally {
      setSaving(false);
    }
  }

  const stepLabels: Record<Step, string> = {
    profile: t("onboarding.step.profile"),
    activity: t("onboarding.step.activity"),
    goal: t("onboarding.step.goal"),
    targets: t("onboarding.step.targets"),
    review: t("onboarding.step.review"),
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
          {t("onboarding.title")}
        </h1>
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
          {t("onboarding.subtitle")}
        </p>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {t("onboarding.stepOf", {
                current: stepIndex + 1,
                total: STEPS.length,
              })}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {stepLabels[step]}
            </p>
          </div>
          <Progress value={progress} tone="neutral" />
          <ol className="flex flex-wrap gap-2" aria-label={t("onboarding.title")}>
            {STEPS.map((item, index) => (
              <li
                key={item}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium",
                  index === stepIndex
                    ? "bg-brand-600 text-white"
                    : index < stepIndex
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
                )}
              >
                {stepLabels[item]}
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-6 flex flex-col gap-4">
          {step === "profile" ? (
            <>
              <Field label={t("settings.displayName")} htmlFor="onboarding-name">
                <Input
                  id="onboarding-name"
                  value={form.displayName}
                  onChange={(event) => setField("displayName", event.target.value)}
                  autoComplete="name"
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("onboarding.age")} htmlFor="onboarding-age">
                  <Input
                    id="onboarding-age"
                    type="number"
                    min="1"
                    inputMode="numeric"
                    value={form.ageYears}
                    onChange={(event) => setField("ageYears", event.target.value)}
                  />
                </Field>
                <Field
                  label={t("onboarding.biologicalSex")}
                  htmlFor="onboarding-sex"
                >
                  <select
                    id="onboarding-sex"
                    value={form.biologicalSex}
                    onChange={(event) =>
                      setField(
                        "biologicalSex",
                        event.target.value as FormState["biologicalSex"],
                      )
                    }
                    className={selectClassName}
                  >
                    <option value="">{t("onboarding.selectOption")}</option>
                    <option value="female">{t("settings.female")}</option>
                    <option value="male">{t("settings.male")}</option>
                  </select>
                </Field>
                <Field
                  label={t("onboarding.heightCm")}
                  htmlFor="onboarding-height"
                >
                  <Input
                    id="onboarding-height"
                    type="number"
                    min="100"
                    max="250"
                    step="0.1"
                    inputMode="decimal"
                    value={form.heightCm}
                    onChange={(event) => setField("heightCm", event.target.value)}
                  />
                </Field>
                <Field
                  label={t("onboarding.currentWeightKg")}
                  htmlFor="onboarding-weight"
                >
                  <Input
                    id="onboarding-weight"
                    type="number"
                    min="30"
                    max="300"
                    step="0.1"
                    inputMode="decimal"
                    value={form.currentWeightKg}
                    onChange={(event) =>
                      setField("currentWeightKg", event.target.value)
                    }
                  />
                </Field>
              </div>
            </>
          ) : null}

          {step === "activity" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={t("onboarding.activityLevel")}
                htmlFor="onboarding-activity"
              >
                <select
                  id="onboarding-activity"
                  value={form.activityLevel}
                  onChange={(event) =>
                    {
                      setActivityWasSelected(true);
                      setField(
                        "activityLevel",
                        event.target.value as FormState["activityLevel"],
                      );
                    }
                  }
                  className={selectClassName}
                >
                  <option value="">{t("onboarding.selectOption")}</option>
                  <option value="sedentary">{t("settings.activity.sedentary")}</option>
                  <option value="light">{t("settings.activity.light")}</option>
                  <option value="moderate">{t("settings.activity.moderate")}</option>
                  <option value="very-active">
                    {t("settings.activity.very-active")}
                  </option>
                  <option value="extra-active">
                    {t("settings.activity.extra-active")}
                  </option>
                </select>
              </Field>
              <Field
                label={t("onboarding.workoutDays")}
                htmlFor="onboarding-workout"
              >
                <Input
                  id="onboarding-workout"
                  type="number"
                  min="0"
                  max="7"
                  inputMode="numeric"
                  value={form.workoutDaysPerWeek}
                  onChange={(event) => {
                    setField("workoutDaysPerWeek", event.target.value);
                    const suggestion = suggestActivityLevel(
                      Number(event.target.value),
                    );

                    if (!activityWasSelected && suggestion) {
                      setField("activityLevel", suggestion);
                    }
                  }}
                />
              </Field>
              {suggestActivityLevel(numberValue("workoutDaysPerWeek") ?? -1) ? (
                <p className="text-sm leading-5 text-slate-600 dark:text-slate-400 sm:col-span-2">
                  {t("onboarding.activitySuggestion", {
                    activity: t(
                      activityLabelKeys[
                        suggestActivityLevel(
                          numberValue("workoutDaysPerWeek") ?? -1,
                        ) as ActivityLevel
                      ],
                    ),
                  })}
                </p>
              ) : null}
            </div>
          ) : null}

          {step === "goal" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={t("onboarding.fitnessGoal")}
                htmlFor="onboarding-goal"
              >
                <select
                  id="onboarding-goal"
                  value={form.fitnessGoal}
                  onChange={(event) => {
                    const goal = event.target.value as FormState["fitnessGoal"];
                    setField("fitnessGoal", goal);
                    const options =
                      goal === "weight-loss"
                        ? [0.25, 0.5, 0.75]
                        : goal === "muscle-gain"
                          ? [0.25, 0.5]
                          : goal === "maintenance"
                            ? [0]
                            : [];
                    const currentRate = Number(form.desiredRateKgPerWeek);
                    setField(
                      "desiredRateKgPerWeek",
                      options.includes(currentRate)
                        ? form.desiredRateKgPerWeek
                        : goal === "maintenance"
                          ? "0"
                          : goal === "weight-loss"
                            ? "0.5"
                            : goal === "muscle-gain"
                              ? "0.25"
                              : "",
                    );
                  }}
                  className={selectClassName}
                >
                  <option value="">{t("onboarding.selectOption")}</option>
                  <option value="weight-loss">{t("settings.goal.weight-loss")}</option>
                  <option value="maintenance">
                    {t("settings.goal.maintenance")}
                  </option>
                  <option value="muscle-gain">
                    {t("settings.goal.muscle-gain")}
                  </option>
                </select>
              </Field>
              <Field
                label={t("onboarding.targetWeightKg")}
                htmlFor="onboarding-target-weight"
              >
                <Input
                  id="onboarding-target-weight"
                  type="number"
                  min="30"
                  max="300"
                  step="0.1"
                  inputMode="decimal"
                  value={form.targetWeightKg}
                  onChange={(event) =>
                    setField("targetWeightKg", event.target.value)
                  }
                />
              </Field>
              <Field
                label={t("onboarding.desiredRate")}
                htmlFor="onboarding-rate"
              >
                <select
                  id="onboarding-rate"
                  value={form.desiredRateKgPerWeek}
                  onChange={(event) =>
                    setField("desiredRateKgPerWeek", event.target.value)
                  }
                  className={selectClassName}
                >
                  <option value="">{t("onboarding.selectOption")}</option>
                  {rateOptions().map((rate) => (
                    <option key={rate} value={rate}>
                      {formatNumber(rate, locale, 2)} {t("onboarding.kgPerWeek")}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label={t("onboarding.macroPreference")}
                htmlFor="onboarding-macro"
              >
                <select
                  id="onboarding-macro"
                  value={form.macroPreference}
                  onChange={(event) =>
                    setField(
                      "macroPreference",
                      event.target.value as FormState["macroPreference"],
                    )
                  }
                  className={selectClassName}
                >
                  <option value="">{t("onboarding.selectOption")}</option>
                  <option value="balanced">{t("settings.macro.balanced")}</option>
                  <option value="higher-protein">
                    {t("settings.macro.higher-protein")}
                  </option>
                  <option value="custom">{t("settings.macro.custom")}</option>
                </select>
              </Field>
              {form.macroPreference === "custom" ? (
                <>
                  <Field
                    label={t("nutrition.proteinPercent")}
                    htmlFor="onboarding-protein-percent"
                  >
                    <Input
                      id="onboarding-protein-percent"
                      type="number"
                      min="10"
                      max="35"
                      step="1"
                      inputMode="numeric"
                      value={form.customProteinPercent}
                      onChange={(event) =>
                        setField("customProteinPercent", event.target.value)
                      }
                    />
                  </Field>
                  <Field
                    label={t("nutrition.fatPercent")}
                    htmlFor="onboarding-fat-percent"
                  >
                    <Input
                      id="onboarding-fat-percent"
                      type="number"
                      min="20"
                      max="35"
                      step="1"
                      inputMode="numeric"
                      value={form.customFatPercent}
                      onChange={(event) =>
                        setField("customFatPercent", event.target.value)
                      }
                    />
                  </Field>
                  <Field
                    label={t("nutrition.carbohydratePercent")}
                    htmlFor="onboarding-carb-percent"
                  >
                    <Input
                      id="onboarding-carb-percent"
                      type="number"
                      min="45"
                      max="65"
                      step="1"
                      inputMode="numeric"
                      value={form.customCarbPercent}
                      onChange={(event) =>
                        setField("customCarbPercent", event.target.value)
                      }
                    />
                  </Field>
                </>
              ) : null}
            </div>
          ) : null}

          {step === "targets" ? (
            <>
              <NutritionCalculationSummary calculation={calculation} />
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {t(
                  isUsingCalculation
                    ? "nutrition.targetSourceCalculated"
                    : "nutrition.targetSourceManual",
                )}
              </p>
              {calculation.available && !isUsingCalculation ? (
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setTargetSource("calculated");
                      setForm((current) => ({
                        ...current,
                        calories: String(calculation.targets.calories),
                        protein: String(calculation.targets.protein),
                        carbohydrates: String(
                          calculation.targets.carbohydrates,
                        ),
                        fat: String(calculation.targets.fat),
                      }));
                    }}
                  >
                    {t("nutrition.useCalculation")}
                  </Button>
                </div>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label={t("settings.targetCalories")}
                  htmlFor="onboarding-calories"
                >
                  <Input
                    id="onboarding-calories"
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    value={form.calories}
                    onChange={(event) => {
                      setTargetSource("manual");
                      setField("calories", event.target.value);
                    }}
                  />
                </Field>
                <Field
                  label={t("settings.targetProtein")}
                  htmlFor="onboarding-protein"
                >
                  <Input
                    id="onboarding-protein"
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    value={form.protein}
                    onChange={(event) => {
                      setTargetSource("manual");
                      setField("protein", event.target.value);
                    }}
                  />
                </Field>
                <Field
                  label={t("settings.targetCarbs")}
                  htmlFor="onboarding-carbs"
                >
                  <Input
                    id="onboarding-carbs"
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    value={form.carbohydrates}
                    onChange={(event) => {
                      setTargetSource("manual");
                      setField("carbohydrates", event.target.value)
                    }}
                  />
                </Field>
                <Field label={t("settings.targetFat")} htmlFor="onboarding-fat">
                  <Input
                    id="onboarding-fat"
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    value={form.fat}
                    onChange={(event) => {
                      setTargetSource("manual");
                      setField("fat", event.target.value);
                    }}
                  />
                </Field>
              </div>
              <div className="space-y-1 text-sm leading-5 text-slate-600 dark:text-slate-400">
                <p>{t("nutrition.disclaimerEstimate")}</p>
                <p>{t("nutrition.disclaimerGuardrail")}</p>
                <p>{t("nutrition.disclaimerProfessional")}</p>
                <p>{t("nutrition.disclaimerEdits")}</p>
              </div>
            </>
          ) : null}

          {step === "review" ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {t("onboarding.reviewDescription")}
              </p>
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {t("onboarding.profileSummary")}
                </h2>
                <dl className="mt-2 grid gap-1.5 text-sm sm:grid-cols-2">
                  <SummaryRow
                    label={t("settings.displayName")}
                    value={form.displayName || t("onboarding.notSet")}
                  />
                  <SummaryRow
                    label={t("onboarding.age")}
                    value={
                      form.ageYears
                        ? `${formatNumber(Number(form.ageYears), locale)}`
                        : t("onboarding.notSet")
                    }
                  />
                  <SummaryRow
                    label={t("onboarding.biologicalSex")}
                    value={
                      form.biologicalSex
                        ? t(
                            form.biologicalSex === "female"
                              ? "settings.female"
                              : "settings.male",
                          )
                        : t("onboarding.notSet")
                    }
                  />
                  <SummaryRow
                    label={t("onboarding.heightCm")}
                    value={
                      form.heightCm
                        ? `${formatNumber(Number(form.heightCm), locale)} ${t("common.cm")}`
                        : t("onboarding.notSet")
                    }
                  />
                  <SummaryRow
                    label={t("onboarding.currentWeightKg")}
                    value={
                      form.currentWeightKg
                        ? `${formatNumber(Number(form.currentWeightKg), locale)} ${t("common.kg")}`
                        : t("onboarding.notSet")
                    }
                  />
                  <SummaryRow
                    label={t("onboarding.activityLevel")}
                    value={
                      form.activityLevel
                        ? t(activityLabelKeys[form.activityLevel])
                        : t("onboarding.notSet")
                    }
                  />
                  <SummaryRow
                    label={t("onboarding.fitnessGoal")}
                    value={
                      form.fitnessGoal
                        ? t(goalLabelKeys[form.fitnessGoal])
                        : t("onboarding.notSet")
                    }
                  />
                  <SummaryRow
                    label={t("onboarding.targetWeightKg")}
                    value={
                      form.targetWeightKg
                        ? `${formatNumber(Number(form.targetWeightKg), locale)} ${t("common.kg")}`
                        : t("onboarding.notSet")
                    }
                  />
                  <SummaryRow
                    label={t("onboarding.desiredRate")}
                    value={
                      form.desiredRateKgPerWeek
                        ? `${formatNumber(Number(form.desiredRateKgPerWeek), locale, 2)} ${t("onboarding.kgPerWeek")}`
                        : t("onboarding.notSet")
                    }
                  />
                  <SummaryRow
                    label={t("onboarding.macroPreference")}
                    value={
                      form.macroPreference
                        ? t(`settings.macro.${form.macroPreference}`)
                        : t("onboarding.notSet")
                    }
                  />
                </dl>
              </div>
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {t("onboarding.targetsSummary")}
                </h2>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  {t(
                    isUsingCalculation
                      ? "nutrition.targetSourceCalculated"
                      : "nutrition.targetSourceManual",
                  )}
                </p>
                <dl className="mt-2 grid gap-1.5 text-sm sm:grid-cols-2">
                  <SummaryRow
                    label={t("settings.targetCalories")}
                    value={`${formatNumber(Number(form.calories), locale)} ${t("common.kcal")}`}
                  />
                  <SummaryRow
                    label={t("settings.targetProtein")}
                    value={`${formatNumber(Number(form.protein), locale)} ${t("common.g")}`}
                  />
                  <SummaryRow
                    label={t("settings.targetCarbs")}
                    value={`${formatNumber(Number(form.carbohydrates), locale)} ${t("common.g")}`}
                  />
                  <SummaryRow
                    label={t("settings.targetFat")}
                    value={`${formatNumber(Number(form.fat), locale)} ${t("common.g")}`}
                  />
                </dl>
              </div>
              <NutritionCalculationSummary calculation={calculation} />
              <div className="space-y-1 text-sm leading-5 text-slate-600 dark:text-slate-400">
                <p>{t("nutrition.disclaimerEstimate")}</p>
                <p>{t("nutrition.disclaimerGuardrail")}</p>
                <p>{t("nutrition.disclaimerProfessional")}</p>
                <p>{t("nutrition.disclaimerEdits")}</p>
              </div>
            </div>
          ) : null}
        </div>

        {error ? (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/")}
          >
            {t("onboarding.skipForNow")}
          </Button>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={back}
              disabled={stepIndex === 0}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
              {t("onboarding.back")}
            </Button>
            {step === "review" ? (
              <Button type="button" onClick={finish} disabled={saving}>
                <Check className="size-4" aria-hidden="true" />
                {saving ? t("common.saving") : t("onboarding.finish")}
              </Button>
            ) : (
              <Button type="button" onClick={next}>
                {t("onboarding.next")}
                <ChevronRight className="size-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
        {t(
          dataMode === "cloud"
            ? "onboarding.cloudNote"
            : "onboarding.demoNote",
        )}
      </p>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium text-slate-900 dark:text-white"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="text-right font-medium text-slate-900 dark:text-white">
        {value}
      </dd>
    </div>
  );
}
