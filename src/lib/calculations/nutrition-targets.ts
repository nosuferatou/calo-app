import type {
  ActivityLevel,
  BiologicalSex,
  CustomMacroSplit,
  FitnessGoal,
  MacroPreference,
  NutritionTargets,
  UserProfile,
} from "@/types";

export const ACTIVITY_PAL: Record<ActivityLevel, number> = {
  sedentary: 1.4,
  light: 1.5,
  moderate: 1.7,
  "very-active": 1.85,
  "extra-active": 2,
};

const WEIGHT_LOSS_RATES = [0.25, 0.5, 0.75] as const;
const MUSCLE_GAIN_RATES = [0.25, 0.5] as const;
const MAX_WEIGHT_LOSS_DEFICIT_KCAL = 750;
const FEMALE_WEIGHT_LOSS_GUARDRAIL_KCAL = 1200;
const MALE_WEIGHT_LOSS_GUARDRAIL_KCAL = 1500;

export type CalculationIssue =
  | "age-out-of-range"
  | "sex-required"
  | "height-out-of-range"
  | "weight-out-of-range"
  | "activity-required"
  | "workout-days-out-of-range"
  | "goal-required"
  | "target-weight-out-of-range"
  | "goal-direction-invalid"
  | "loss-rate-invalid"
  | "gain-rate-invalid"
  | "macro-preference-required"
  | "custom-split-invalid"
  | "low-current-bmi-weight-loss";

export type CalculationWarning =
  | "age-outside-study-range"
  | "target-bmi-below-range"
  | "maintenance-target-differs"
  | "deficit-limited-by-cap"
  | "deficit-limited-by-calorie-guardrail"
  | "tdee-at-or-below-calorie-guardrail"
  | "protein-clamped-to-amdr"
  | "carbohydrate-outside-amdr"
  | "muscle-gain-limitations"
  | "rounding-difference";

export interface CalculatedTargets
  extends Omit<
    NutritionTargets,
    "id" | "createdAt" | "updatedAt" | "calculatedAt"
  > {
  source: "calculated";
  bmr: number;
  tdee: number;
  activityPal: number;
  formulaVersion: 1;
}

export interface NutritionCalculationDetails {
  bmi: number;
  targetBmi: number;
  proteinPerKg: number;
  proteinPercent: number;
  carbohydratePercent: number;
  fatPercent: number;
  roundingDifferenceKcal: number;
  requestedDeficitKcal?: number;
  actualDeficitKcal?: number;
  calorieGuardrailKcal?: number;
}

export type NutritionCalculation =
  | {
      available: false;
      issues: CalculationIssue[];
      warnings: CalculationWarning[];
      bmi?: number;
      targetBmi?: number;
    }
  | {
      available: true;
      issues: [];
      warnings: CalculationWarning[];
      targets: CalculatedTargets;
      details: NutritionCalculationDetails;
    };

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function roundHalfUp(value: number): number {
  return Math.floor(value + 0.5);
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function bmi(weightKg: number | undefined, heightCm: number | undefined) {
  if (
    !isFiniteNumber(weightKg) ||
    weightKg <= 0 ||
    !isFiniteNumber(heightCm) ||
    heightCm <= 0
  ) {
    return undefined;
  }

  return weightKg / (heightCm / 100) ** 2;
}

function isBiologicalSex(value: unknown): value is BiologicalSex {
  return value === "female" || value === "male";
}

function isActivityLevel(value: unknown): value is ActivityLevel {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(ACTIVITY_PAL, value)
  );
}

function isFitnessGoal(value: unknown): value is FitnessGoal {
  return (
    value === "weight-loss" ||
    value === "maintenance" ||
    value === "muscle-gain"
  );
}

function isMacroPreference(value: unknown): value is MacroPreference {
  return (
    value === "balanced" ||
    value === "higher-protein" ||
    value === "custom"
  );
}

function isValidCustomSplit(
  split: CustomMacroSplit | undefined,
): split is CustomMacroSplit {
  if (!split) {
    return false;
  }

  const { proteinPercent, fatPercent, carbPercent } = split;

  return (
    proteinPercent >= 10 &&
    proteinPercent <= 35 &&
    fatPercent >= 20 &&
    fatPercent <= 35 &&
    carbPercent >= 45 &&
    carbPercent <= 65 &&
    Math.abs(proteinPercent + fatPercent + carbPercent - 100) < 1e-9
  );
}

export function suggestActivityLevel(
  workoutDaysPerWeek: number,
): ActivityLevel | undefined {
  if (
    !Number.isInteger(workoutDaysPerWeek) ||
    workoutDaysPerWeek < 0 ||
    workoutDaysPerWeek > 7
  ) {
    return undefined;
  }

  if (workoutDaysPerWeek === 0) return "sedentary";
  if (workoutDaysPerWeek <= 2) return "light";
  if (workoutDaysPerWeek <= 4) return "moderate";
  if (workoutDaysPerWeek <= 6) return "very-active";
  return "extra-active";
}

function validateProfile(profile: UserProfile): {
  issues: CalculationIssue[];
  warnings: CalculationWarning[];
  bmi?: number;
  targetBmi?: number;
} {
  const issues: CalculationIssue[] = [];
  const warnings: CalculationWarning[] = [];
  const currentBmi = bmi(profile.currentWeightKg, profile.heightCm);
  const targetBmi = bmi(profile.targetWeightKg, profile.heightCm);

  if (
    !isFiniteNumber(profile.ageYears) ||
    !Number.isInteger(profile.ageYears) ||
    profile.ageYears < 18 ||
    profile.ageYears > 80
  ) {
    issues.push("age-out-of-range");
  } else if (profile.ageYears === 18 || profile.ageYears >= 79) {
    warnings.push("age-outside-study-range");
  }

  if (!isBiologicalSex(profile.biologicalSex)) {
    issues.push("sex-required");
  }

  if (
    !isFiniteNumber(profile.heightCm) ||
    profile.heightCm < 100 ||
    profile.heightCm > 250
  ) {
    issues.push("height-out-of-range");
  }

  if (
    !isFiniteNumber(profile.currentWeightKg) ||
    profile.currentWeightKg < 30 ||
    profile.currentWeightKg > 300
  ) {
    issues.push("weight-out-of-range");
  }

  if (!isActivityLevel(profile.activityLevel)) {
    issues.push("activity-required");
  }

  if (
    !isFiniteNumber(profile.workoutDaysPerWeek) ||
    !Number.isInteger(profile.workoutDaysPerWeek) ||
    profile.workoutDaysPerWeek < 0 ||
    profile.workoutDaysPerWeek > 7
  ) {
    issues.push("workout-days-out-of-range");
  }

  if (!isFitnessGoal(profile.fitnessGoal)) {
    issues.push("goal-required");
  }

  if (
    !isFiniteNumber(profile.targetWeightKg) ||
    profile.targetWeightKg < 30 ||
    profile.targetWeightKg > 300
  ) {
    issues.push("target-weight-out-of-range");
  }

  if (
    isFiniteNumber(profile.targetWeightKg) &&
    isFiniteNumber(profile.currentWeightKg) &&
    ((profile.fitnessGoal === "weight-loss" &&
      profile.targetWeightKg >= profile.currentWeightKg) ||
      (profile.fitnessGoal === "muscle-gain" &&
        profile.targetWeightKg <= profile.currentWeightKg))
  ) {
    issues.push("goal-direction-invalid");
  }

  if (profile.fitnessGoal === "weight-loss") {
    if (
      !isFiniteNumber(profile.desiredRateKgPerWeek) ||
      !WEIGHT_LOSS_RATES.includes(
        profile.desiredRateKgPerWeek as (typeof WEIGHT_LOSS_RATES)[number],
      )
    ) {
      issues.push("loss-rate-invalid");
    }
  } else if (profile.fitnessGoal === "muscle-gain") {
    if (
      !isFiniteNumber(profile.desiredRateKgPerWeek) ||
      !MUSCLE_GAIN_RATES.includes(
        profile.desiredRateKgPerWeek as (typeof MUSCLE_GAIN_RATES)[number],
      )
    ) {
      issues.push("gain-rate-invalid");
    }
  }

  if (!isMacroPreference(profile.macroPreference)) {
    issues.push("macro-preference-required");
  } else if (
    profile.macroPreference === "custom" &&
    !isValidCustomSplit(profile.customMacroSplit)
  ) {
    issues.push("custom-split-invalid");
  }

  if (currentBmi !== undefined && currentBmi < 18.5) {
    if (profile.fitnessGoal === "weight-loss") {
      issues.push("low-current-bmi-weight-loss");
    }
  }

  if (targetBmi !== undefined && targetBmi < 18.5) {
    warnings.push("target-bmi-below-range");
  }

  if (
    profile.fitnessGoal === "maintenance" &&
    isFiniteNumber(profile.currentWeightKg) &&
    isFiniteNumber(profile.targetWeightKg) &&
    Math.abs(profile.currentWeightKg - profile.targetWeightKg) > 1
  ) {
    warnings.push("maintenance-target-differs");
  }

  return { issues: [...new Set(issues)], warnings, bmi: currentBmi, targetBmi };
}

export function validateProfileForEditing(
  profile: UserProfile,
): CalculationIssue[] {
  const issues: CalculationIssue[] = [];

  if (
    profile.ageYears !== undefined &&
    (!Number.isInteger(profile.ageYears) || profile.ageYears <= 0)
  ) {
    issues.push("age-out-of-range");
  }
  if (
    profile.heightCm !== undefined &&
    (!isFiniteNumber(profile.heightCm) ||
      profile.heightCm < 100 ||
      profile.heightCm > 250)
  ) {
    issues.push("height-out-of-range");
  }
  if (
    profile.currentWeightKg !== undefined &&
    (!isFiniteNumber(profile.currentWeightKg) ||
      profile.currentWeightKg < 30 ||
      profile.currentWeightKg > 300)
  ) {
    issues.push("weight-out-of-range");
  }
  if (
    profile.workoutDaysPerWeek !== undefined &&
    (!Number.isInteger(profile.workoutDaysPerWeek) ||
      profile.workoutDaysPerWeek < 0 ||
      profile.workoutDaysPerWeek > 7)
  ) {
    issues.push("workout-days-out-of-range");
  }
  if (
    profile.targetWeightKg !== undefined &&
    (!isFiniteNumber(profile.targetWeightKg) ||
      profile.targetWeightKg < 30 ||
      profile.targetWeightKg > 300)
  ) {
    issues.push("target-weight-out-of-range");
  }
  if (
    isFiniteNumber(profile.targetWeightKg) &&
    isFiniteNumber(profile.currentWeightKg) &&
    ((profile.fitnessGoal === "weight-loss" &&
      profile.targetWeightKg >= profile.currentWeightKg) ||
      (profile.fitnessGoal === "muscle-gain" &&
        profile.targetWeightKg <= profile.currentWeightKg))
  ) {
    issues.push("goal-direction-invalid");
  }
  if (
    profile.fitnessGoal === "weight-loss" &&
    profile.desiredRateKgPerWeek !== undefined &&
    !WEIGHT_LOSS_RATES.includes(
      profile.desiredRateKgPerWeek as (typeof WEIGHT_LOSS_RATES)[number],
    )
  ) {
    issues.push("loss-rate-invalid");
  }
  if (
    profile.fitnessGoal === "muscle-gain" &&
    profile.desiredRateKgPerWeek !== undefined &&
    !MUSCLE_GAIN_RATES.includes(
      profile.desiredRateKgPerWeek as (typeof MUSCLE_GAIN_RATES)[number],
    )
  ) {
    issues.push("gain-rate-invalid");
  }
  if (
    profile.macroPreference === "custom" &&
    !isValidCustomSplit(profile.customMacroSplit)
  ) {
    issues.push("custom-split-invalid");
  }

  return [...new Set(issues)];
}

export function calculateNutritionTargets(
  profile: UserProfile,
): NutritionCalculation {
  const validation = validateProfile(profile);

  if (validation.issues.length > 0) {
    return { available: false, ...validation };
  }

  const sex = profile.biologicalSex as BiologicalSex;
  const goal = profile.fitnessGoal as FitnessGoal;
  const activityLevel = profile.activityLevel as ActivityLevel;
  const preference = profile.macroPreference as MacroPreference;
  const weightKg = profile.currentWeightKg as number;
  const heightCm = profile.heightCm as number;
  const ageYears = profile.ageYears as number;
  const activityPal = ACTIVITY_PAL[activityLevel];

  const bmr =
    10 * weightKg +
    6.25 * heightCm -
    5 * ageYears +
    (sex === "male" ? 5 : -161);
  const tdee = bmr * activityPal;
  let rawCalorieTarget = tdee;
  let requestedDeficitKcal: number | undefined;
  let actualDeficitKcal: number | undefined;
  let calorieGuardrailKcal: number | undefined;
  const warnings = [...validation.warnings];

  if (goal === "weight-loss") {
    const rawRequestedDeficit =
      (profile.desiredRateKgPerWeek as number) * 7700 / 7;
    requestedDeficitKcal = rawRequestedDeficit;
    calorieGuardrailKcal =
      sex === "female"
        ? FEMALE_WEIGHT_LOSS_GUARDRAIL_KCAL
        : MALE_WEIGHT_LOSS_GUARDRAIL_KCAL;

    if (tdee <= calorieGuardrailKcal) {
      rawCalorieTarget = tdee;
      actualDeficitKcal = 0;
      warnings.push("tdee-at-or-below-calorie-guardrail");
    } else {
      const appliedDeficit = Math.min(
        rawRequestedDeficit,
        MAX_WEIGHT_LOSS_DEFICIT_KCAL,
      );
      rawCalorieTarget = Math.max(tdee - appliedDeficit, calorieGuardrailKcal);
      const calories = roundHalfUp(rawCalorieTarget);
      actualDeficitKcal = Math.max(0, tdee - calories);

      if (rawRequestedDeficit > MAX_WEIGHT_LOSS_DEFICIT_KCAL) {
        warnings.push("deficit-limited-by-cap");
      }

      if (rawCalorieTarget === calorieGuardrailKcal) {
        warnings.push("deficit-limited-by-calorie-guardrail");
      }
    }
  } else if (goal === "muscle-gain") {
    rawCalorieTarget = tdee + clamp(tdee * 0.15, 250, 500);
  }

  const calories = roundHalfUp(rawCalorieTarget);
  const goalProteinFactor =
    goal === "maintenance" ? 1.4 : 1.6;
  const proteinRangeMax = (calories * 0.3) / 4;
  let rawProtein: number;
  let rawFat: number;

  if (preference === "higher-protein") {
    rawProtein = (calories * 0.3) / 4;
    rawFat = (calories * 0.25) / 9;
  } else if (preference === "custom") {
    const split = profile.customMacroSplit as CustomMacroSplit;
    rawProtein = (calories * split.proteinPercent / 100) / 4;
    rawFat = (calories * split.fatPercent / 100) / 9;
  } else {
    rawProtein = clamp(
      goalProteinFactor * weightKg,
      (calories * 0.1) / 4,
      proteinRangeMax,
    );
    rawFat = (calories * 0.25) / 9;
  }

  const roundedProtein = roundHalfUp(rawProtein);
  const protein = clamp(
    roundedProtein,
    Math.ceil((calories * 0.1) / 4),
    Math.floor((calories * 0.35) / 4),
  );
  if (protein !== roundedProtein) {
    warnings.push("protein-clamped-to-amdr");
  }
  const fat = roundHalfUp(rawFat);
  const carbohydrates = roundHalfUp(
    (calories - 4 * protein - 9 * fat) / 4,
  );
  const energyFromProtein = protein * 4;
  const energyFromCarbohydrates = carbohydrates * 4;
  const energyFromFat = fat * 9;
  const proteinPercent = (energyFromProtein / calories) * 100;
  const carbohydratePercent = (energyFromCarbohydrates / calories) * 100;
  const fatPercent = (energyFromFat / calories) * 100;
  const roundingDifferenceKcal =
    energyFromProtein +
    energyFromCarbohydrates +
    energyFromFat -
    calories;

  if (carbohydratePercent < 45 || carbohydratePercent > 65) {
    warnings.push("carbohydrate-outside-amdr");
  }

  if (goal === "muscle-gain") {
    warnings.push("muscle-gain-limitations");
  }

  if (roundingDifferenceKcal !== 0) {
    warnings.push("rounding-difference");
  }

  return {
    available: true,
    issues: [],
    warnings: [...new Set(warnings)],
    targets: {
      calories,
      protein,
      carbohydrates,
      fat,
      source: "calculated",
      bmr: roundToOneDecimal(bmr),
      tdee: roundToOneDecimal(tdee),
      activityPal,
      formulaVersion: 1,
      requestedDeficitKcal,
      actualDeficitKcal,
      calorieGuardrailKcal,
    },
    details: {
      bmi: validation.bmi as number,
      targetBmi: validation.targetBmi as number,
      proteinPerKg: protein / weightKg,
      proteinPercent,
      carbohydratePercent,
      fatPercent,
      roundingDifferenceKcal,
      requestedDeficitKcal,
      actualDeficitKcal,
      calorieGuardrailKcal,
    },
  };
}
