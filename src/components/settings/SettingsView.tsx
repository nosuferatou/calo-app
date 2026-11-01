"use client";

import { useRef, useState, type ReactNode } from "react";
import { Download, RotateCcw, Upload } from "lucide-react";
import { LanguageToggle } from "@/components/common/LanguageToggle";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { NutritionCalculationSummary } from "@/components/nutrition/NutritionCalculationSummary";
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
import { useStorageStatus } from "@/hooks/use-storage-status";
import { useToast } from "@/hooks/use-toast";
import {
  calculateNutritionTargets,
  validateProfileForEditing,
} from "@/lib/calculations/nutrition-targets";
import { nowIso } from "@/lib/datetime";
import { formatNumber } from "@/lib/format";
import { parseBackup, type BackupSummary } from "@/lib/validation/import";
import type {
  ActivityLevel,
  BiologicalSex,
  FitnessGoal,
  MacroPreference,
  UserProfile,
} from "@/types";

const selectClassName =
  "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-white";

type ProfileForm = {
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
};

function toProfileForm(profile: UserProfile): ProfileForm {
  return {
    displayName: profile.displayName ?? "",
    ageYears: profile.ageYears ? String(profile.ageYears) : "",
    biologicalSex: profile.biologicalSex ?? "",
    heightCm: profile.heightCm ? String(profile.heightCm) : "",
    currentWeightKg: profile.currentWeightKg ? String(profile.currentWeightKg) : "",
    activityLevel: profile.activityLevel ?? "",
    workoutDaysPerWeek: profile.workoutDaysPerWeek
      ? String(profile.workoutDaysPerWeek)
      : profile.workoutDaysPerWeek === 0
        ? "0"
        : "",
    fitnessGoal: profile.fitnessGoal ?? "",
    targetWeightKg: profile.targetWeightKg ? String(profile.targetWeightKg) : "",
    desiredRateKgPerWeek: profile.fitnessGoal === "maintenance"
      ? "0"
      : profile.desiredRateKgPerWeek
        ? String(profile.desiredRateKgPerWeek)
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
  };
}

function parseNumber(value: string): number | undefined {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function profileFromForm(profile: UserProfile, form: ProfileForm): UserProfile {
  const customMacroSplit =
    form.macroPreference === "custom"
      ? {
          proteinPercent:
            parseNumber(form.customProteinPercent) ?? Number.NaN,
          fatPercent: parseNumber(form.customFatPercent) ?? Number.NaN,
          carbPercent: parseNumber(form.customCarbPercent) ?? Number.NaN,
        }
      : undefined;

  return {
    ...profile,
    displayName: form.displayName.trim() || undefined,
    ageYears: parseNumber(form.ageYears),
    biologicalSex: form.biologicalSex || undefined,
    heightCm: parseNumber(form.heightCm),
    currentWeightKg: parseNumber(form.currentWeightKg),
    activityLevel: form.activityLevel || undefined,
    workoutDaysPerWeek: parseNumber(form.workoutDaysPerWeek),
    fitnessGoal: form.fitnessGoal || undefined,
    targetWeightKg: parseNumber(form.targetWeightKg),
    desiredRateKgPerWeek:
      form.fitnessGoal === "maintenance"
        ? 0
        : parseNumber(form.desiredRateKgPerWeek),
    macroPreference: form.macroPreference || undefined,
    customMacroSplit,
  };
}

export function SettingsView() {
  const {
    dataMode,
    exportData,
    importData,
    profile,
    resetDemoData,
    targets,
    updateProfile,
    updateTargets,
  } = useDemoData();
  const { locale, t } = useI18n();
  const { toast } = useToast();
  const storageStatus = useStorageStatus();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<ProfileForm>(() => toProfileForm(profile));
  const [targetForm, setTargetForm] = useState({
    calories: String(targets.calories),
    protein: String(targets.protein),
    carbohydrates: String(targets.carbohydrates),
    fat: String(targets.fat),
  });
  const [importPreview, setImportPreview] = useState<{
    raw: string;
    summary: BackupSummary;
  } | null>(null);
  const [importError, setImportError] = useState(false);
  const [resetStage, setResetStage] = useState<0 | 1 | 2>(0);
  const [profileError, setProfileError] = useState(false);
  const [saving, setSaving] = useState(false);

  const profileSignature = `${profile.id}|${profile.updatedAt}`;
  const [formSignature, setFormSignature] = useState(profileSignature);

  if (profileSignature !== formSignature) {
    setFormSignature(profileSignature);
    setForm(toProfileForm(profile));
  }

  const targetsSignature = `${targets.id}|${targets.updatedAt}`;
  const [targetsFormSignature, setTargetsFormSignature] =
    useState(targetsSignature);

  if (targetsSignature !== targetsFormSignature) {
    setTargetsFormSignature(targetsSignature);
    setTargetForm({
      calories: String(targets.calories),
      protein: String(targets.protein),
      carbohydrates: String(targets.carbohydrates),
      fat: String(targets.fat),
    });
  }

  const calculation = calculateNutritionTargets(profileFromForm(profile, form));

  function updateField<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setProfileError(false);
  }

  function rateOptions(): number[] {
    if (form.fitnessGoal === "weight-loss") return [0.25, 0.5, 0.75];
    if (form.fitnessGoal === "muscle-gain") return [0.25, 0.5];
    if (form.fitnessGoal === "maintenance") return [0];
    return [];
  }

  async function saveProfile() {
    if (saving) return;
    const nextProfile = profileFromForm(profile, form);
    const invalidIssues = validateProfileForEditing(nextProfile);

    if (invalidIssues.length > 0) {
      setProfileError(true);
      toast({ title: t("nutrition.profileValidationError"), variant: "error" });
      return;
    }

    setSaving(true);
    setProfileError(false);
    try {
      const profileSaved = await updateProfile(nextProfile);
      if (profileSaved === false) {
        toast({ title: t("cloud.writeFailed"), variant: "error" });
        return;
      }
      const nextCalculation = calculateNutritionTargets(nextProfile);

      const targetsSaved = nextCalculation.available
        ? await updateTargets({
            ...nextCalculation.targets,
            calculatedAt: nowIso(),
          })
        : await updateTargets({
            calories: targets.calories,
            protein: targets.protein,
            carbohydrates: targets.carbohydrates,
            fat: targets.fat,
            source: "manual",
          });
      if (targetsSaved === false) {
        toast({ title: t("cloud.writeFailed"), variant: "error" });
        return;
      }
      toast({
        title: t(
          nextCalculation.available
            ? "nutrition.profileRecalculated"
            : "settings.profileSaved",
        ),
        variant: "success",
      });
    } finally {
      setSaving(false);
    }
  }

  async function saveTargets() {
    if (saving) return;
    const calories = parseNumber(targetForm.calories);
    const protein = parseNumber(targetForm.protein);
    const carbohydrates = parseNumber(targetForm.carbohydrates);
    const fat = parseNumber(targetForm.fat);

    if (
      calories === undefined ||
      protein === undefined ||
      carbohydrates === undefined ||
      fat === undefined ||
      ![calories, protein, carbohydrates, fat].every(
        (value) => Number.isInteger(value) && value > 0,
      )
    ) {
      toast({ title: t("onboarding.validationWholeTargets"), variant: "error" });
      return;
    }

    setSaving(true);
    try {
      const saved = await updateTargets({
        calories,
        protein,
        carbohydrates,
        fat,
        source: "manual",
      });
      if (saved === false) {
        toast({ title: t("cloud.writeFailed"), variant: "error" });
        return;
      }
      toast({ title: t("settings.targetsSaved"), variant: "success" });
    } finally {
      setSaving(false);
    }
  }

  function handleExport() {
    const raw = exportData();
    const blob = new Blob([raw], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `calo-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast({ title: t("toast.exported"), variant: "success" });
  }

  function handleFile(file: File) {
    setImportError(false);

    const reader = new FileReader();

    reader.onload = () => {
      const raw = String(reader.result ?? "");
      const parsed = parseBackup(raw);

      if (!parsed.ok) {
        setImportPreview(null);
        setImportError(true);
        toast({ title: t("settings.importInvalid"), variant: "error" });
        return;
      }

      setImportPreview({ raw, summary: parsed.summary });
    };

    reader.onerror = () => {
      setImportPreview(null);
      setImportError(true);
      toast({ title: t("settings.importError"), variant: "error" });
    };

    reader.readAsText(file);
  }

  function confirmImport() {
    if (dataMode !== "demo") return;
    if (!importPreview) {
      return;
    }

    const result = importData(importPreview.raw);

    if (result.ok) {
      toast({ title: t("settings.importSuccess"), variant: "success" });
      setImportPreview(null);
    } else {
      toast({ title: t("settings.importInvalid"), variant: "error" });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function confirmReset() {
    if (dataMode !== "demo") return;
    resetDemoData();
    setResetStage(0);
    toast({ title: t("settings.resetSuccess"), variant: "success" });
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            {t("settings.title")}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {t("settings.subtitle")}
          </p>
        </div>
        <SignOutButton className="w-full sm:w-auto md:hidden" />
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
          {t("settings.profileGoals")}
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {t("settings.profileDescription")}
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label={t("settings.displayName")} htmlFor="profile-name">
            <Input
              id="profile-name"
              value={form.displayName}
              onChange={(event) => updateField("displayName", event.target.value)}
              autoComplete="name"
            />
          </Field>

          <Field label={t("settings.age")} htmlFor="profile-age">
            <Input
              id="profile-age"
              type="number"
              min="1"
              inputMode="numeric"
              value={form.ageYears}
              onChange={(event) => updateField("ageYears", event.target.value)}
            />
          </Field>

          <Field label={t("settings.biologicalSex")} htmlFor="profile-sex">
            <select
              id="profile-sex"
              value={form.biologicalSex}
              onChange={(event) =>
                updateField(
                  "biologicalSex",
                  event.target.value as ProfileForm["biologicalSex"],
                )
              }
              className={selectClassName}
            >
              <option value="">{t("onboarding.selectOption")}</option>
              <option value="female">{t("settings.female")}</option>
              <option value="male">{t("settings.male")}</option>
            </select>
          </Field>

          <Field label={t("settings.heightCm")} htmlFor="profile-height">
            <Input
              id="profile-height"
              type="number"
              min="100"
              max="250"
              step="0.1"
              inputMode="decimal"
              value={form.heightCm}
              onChange={(event) => updateField("heightCm", event.target.value)}
            />
          </Field>

          <Field label={t("settings.currentWeightKg")} htmlFor="profile-weight">
            <Input
              id="profile-weight"
              type="number"
              min="30"
              max="300"
              step="0.1"
              inputMode="decimal"
              value={form.currentWeightKg}
              onChange={(event) =>
                updateField("currentWeightKg", event.target.value)
              }
            />
          </Field>

          <Field label={t("settings.activityLevel")} htmlFor="profile-activity">
            <select
              id="profile-activity"
              value={form.activityLevel}
              onChange={(event) =>
                updateField(
                  "activityLevel",
                  event.target.value as ProfileForm["activityLevel"],
                )
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

          <Field label={t("settings.workoutDays")} htmlFor="profile-workout">
            <Input
              id="profile-workout"
              type="number"
              min="0"
              max="7"
              inputMode="numeric"
              value={form.workoutDaysPerWeek}
              onChange={(event) =>
                updateField("workoutDaysPerWeek", event.target.value)
              }
            />
          </Field>

          <Field label={t("settings.fitnessGoal")} htmlFor="profile-goal">
            <select
              id="profile-goal"
              value={form.fitnessGoal}
              onChange={(event) => {
                const goal = event.target.value as ProfileForm["fitnessGoal"];
                updateField("fitnessGoal", goal);
                const options =
                  goal === "weight-loss"
                    ? [0.25, 0.5, 0.75]
                    : goal === "muscle-gain"
                      ? [0.25, 0.5]
                      : goal === "maintenance"
                        ? [0]
                        : [];
                const currentRate = Number(form.desiredRateKgPerWeek);
                updateField(
                  "desiredRateKgPerWeek",
                  form.desiredRateKgPerWeek && options.includes(currentRate)
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
              <option value="maintenance">{t("settings.goal.maintenance")}</option>
              <option value="muscle-gain">{t("settings.goal.muscle-gain")}</option>
            </select>
          </Field>

          <Field label={t("settings.targetWeightKg")} htmlFor="profile-target-weight">
            <Input
              id="profile-target-weight"
              type="number"
              min="30"
              max="300"
              step="0.1"
              inputMode="decimal"
              value={form.targetWeightKg}
              onChange={(event) => updateField("targetWeightKg", event.target.value)}
            />
          </Field>

          <Field label={t("settings.desiredRate")} htmlFor="profile-rate">
            <select
              id="profile-rate"
              value={form.desiredRateKgPerWeek}
              onChange={(event) =>
                updateField("desiredRateKgPerWeek", event.target.value)
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

          <Field label={t("settings.macroPreference")} htmlFor="profile-macro">
            <select
              id="profile-macro"
              value={form.macroPreference}
              onChange={(event) =>
                updateField(
                  "macroPreference",
                  event.target.value as ProfileForm["macroPreference"],
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
                htmlFor="profile-protein-percent"
              >
                <Input
                  id="profile-protein-percent"
                  type="number"
                  min="10"
                  max="35"
                  step="1"
                  inputMode="numeric"
                  value={form.customProteinPercent}
                  onChange={(event) =>
                    updateField("customProteinPercent", event.target.value)
                  }
                />
              </Field>
              <Field
                label={t("nutrition.fatPercent")}
                htmlFor="profile-fat-percent"
              >
                <Input
                  id="profile-fat-percent"
                  type="number"
                  min="20"
                  max="35"
                  step="1"
                  inputMode="numeric"
                  value={form.customFatPercent}
                  onChange={(event) =>
                    updateField("customFatPercent", event.target.value)
                  }
                />
              </Field>
              <Field
                label={t("nutrition.carbohydratePercent")}
                htmlFor="profile-carb-percent"
              >
                <Input
                  id="profile-carb-percent"
                  type="number"
                  min="45"
                  max="65"
                  step="1"
                  inputMode="numeric"
                  value={form.customCarbPercent}
                  onChange={(event) =>
                    updateField("customCarbPercent", event.target.value)
                  }
                />
              </Field>
            </>
          ) : null}
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {dataMode === "demo" ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("settings.profileDemoNote")}
            </p>
          ) : null}
          <Button type="button" onClick={saveProfile} disabled={saving}>
            {saving ? t("common.saving") : t("settings.saveProfile")}
          </Button>
        </div>
        {profileError ? (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
            {t("nutrition.profileValidationError")}
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
          {t("settings.nutritionTargets")}
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {t("settings.targetsDescription")}
        </p>

        <div className="mt-4">
          <NutritionCalculationSummary calculation={calculation} />
        </div>
        <p className="mt-4 text-sm font-medium text-slate-900 dark:text-white">
          {t(
            targets.source === "calculated"
              ? "nutrition.targetSourceCalculated"
              : "nutrition.targetSourceManual",
          )}
        </p>
        {calculation.available && targets.source !== "calculated" ? (
          <div className="mt-3">
            <Button type="button" variant="outline" onClick={saveProfile} disabled={saving}>
              {t("nutrition.saveProfileAndRecalculate")}
            </Button>
          </div>
        ) : null}
        <div className="mt-2 space-y-1 text-sm leading-5 text-slate-600 dark:text-slate-400">
          <p>{t("nutrition.disclaimerEstimate")}</p>
          <p>{t("nutrition.disclaimerGuardrail")}</p>
          <p>{t("nutrition.disclaimerProfessional")}</p>
          <p>{t("nutrition.disclaimerEdits")}</p>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label={t("settings.targetCalories")} htmlFor="target-calories">
            <Input
              id="target-calories"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={targetForm.calories}
              onChange={(event) =>
                setTargetForm((current) => ({
                  ...current,
                  calories: event.target.value,
                }))
              }
            />
          </Field>
          <Field label={t("settings.targetProtein")} htmlFor="target-protein">
            <Input
              id="target-protein"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={targetForm.protein}
              onChange={(event) =>
                setTargetForm((current) => ({
                  ...current,
                  protein: event.target.value,
                }))
              }
            />
          </Field>
          <Field label={t("settings.targetCarbs")} htmlFor="target-carbs">
            <Input
              id="target-carbs"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={targetForm.carbohydrates}
              onChange={(event) =>
                setTargetForm((current) => ({
                  ...current,
                  carbohydrates: event.target.value,
                }))
              }
            />
          </Field>
          <Field label={t("settings.targetFat")} htmlFor="target-fat">
            <Input
              id="target-fat"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={targetForm.fat}
              onChange={(event) =>
                setTargetForm((current) => ({
                  ...current,
                  fat: event.target.value,
                }))
              }
            />
          </Field>
        </div>

        <div className="mt-5 flex justify-end">
          <Button type="button" onClick={saveTargets} disabled={saving}>
            {saving ? t("common.saving") : t("settings.saveTargets")}
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
          {t("settings.appearance")}
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {t("settings.appearanceDescription")}
        </p>
        <div className="mt-4">
          <ThemeToggle />
        </div>

        <h2 className="mt-6 text-base font-semibold tracking-tight text-slate-900 dark:text-white">
          {t("settings.language")}
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {t("settings.languageDescription")}
        </p>
        <div className="mt-4">
          <LanguageToggle />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
          {t("settings.dataManagement")}
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {t(
            dataMode === "cloud"
              ? "cloud.localDataToolsUnavailable"
              : "settings.dataDescription",
          )}
        </p>

        {dataMode === "demo" ? (
        <>
        <div className="mt-5 flex flex-col gap-3">
          <div className="flex flex-col gap-2 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {t("settings.exportJson")}
              </p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {t("settings.exportDescription")}
              </p>
            </div>
            <Button type="button" variant="outline" onClick={handleExport}>
              <Download className="size-4" aria-hidden="true" />
              {t("settings.exportJson")}
            </Button>
          </div>

          <div className="flex flex-col gap-2 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {t("settings.importJson")}
              </p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {t("settings.importDescription")}
              </p>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className="sr-only"
                id="calo-import-file"
                onChange={(event) => {
                  const file = event.target.files?.[0];

                  if (file) {
                    handleFile(file);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="size-4" aria-hidden="true" />
                {t("settings.importJson")}
              </Button>
            </div>
          </div>

          {importError ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {t("settings.importInvalid")}
            </p>
          ) : null}

          {importPreview ? (
            <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-900/60 dark:bg-sky-950/40">
              <p className="text-sm font-medium text-sky-900 dark:text-sky-100">
                {t("settings.importSummary")}
              </p>
              <p className="mt-1 text-sm text-sky-800 dark:text-sky-200">
                {t("settings.importSummaryLine", {
                  entries: importPreview.summary.entries,
                  weights: importPreview.summary.weightRecords,
                  favorites: importPreview.summary.favorites,
                  meals: importPreview.summary.savedMeals,
                })}
              </p>
              <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setImportPreview(null)}
                >
                  {t("common.cancel")}
                </Button>
                <Button type="button" onClick={confirmImport}>
                  {t("settings.importConfirm")}
                </Button>
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-2 rounded-xl border border-red-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-900/60">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {t("settings.resetAll")}
              </p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {t("settings.resetDescription")}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
              onClick={() => setResetStage(1)}
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              {t("settings.resetAll")}
            </Button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Badge variant={storageStatus.readOnly ? "error" : "success"}>
            {t("settings.storage")}
          </Badge>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {storageStatus.readOnly
              ? t("settings.storageReadOnly")
              : t("settings.storageAvailable")}
          </p>
        </div>
        </>
        ) : null}
      </section>

      {dataMode === "demo" ? (
      <Dialog open={resetStage > 0} onOpenChange={(open) => !open && setResetStage(0)}>
        <DialogHeader>
          <DialogTitle>{t("settings.resetConfirmTitle")}</DialogTitle>
          <DialogDescription>
            {t("settings.resetConfirmDescription")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => setResetStage(0)}
          >
            {t("common.cancel")}
          </Button>
          {resetStage === 1 ? (
            <Button type="button" onClick={() => setResetStage(2)}>
              {t("settings.resetStepOne")}
            </Button>
          ) : (
            <Button
              type="button"
              className="bg-red-600 hover:bg-red-700"
              onClick={confirmReset}
            >
              {t("settings.resetStepTwo")}
            </Button>
          )}
        </DialogFooter>
      </Dialog>
      ) : null}
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
