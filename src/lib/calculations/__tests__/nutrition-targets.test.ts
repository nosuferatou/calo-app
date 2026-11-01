import { describe, expect, it } from "vitest";
import { mockUserProfile } from "@/data/mock";
import {
  ACTIVITY_PAL,
  calculateNutritionTargets,
  suggestActivityLevel,
} from "@/lib/calculations/nutrition-targets";
import type { UserProfile } from "@/types";

function profile(overrides: Partial<UserProfile>): UserProfile {
  return { ...mockUserProfile, ...overrides };
}

describe("nutrition target calculations", () => {
  it("matches the approved maintenance worked example", () => {
    const result = calculateNutritionTargets(
      profile({
        ageYears: 30,
        biologicalSex: "female",
        heightCm: 165,
        currentWeightKg: 65,
        activityLevel: "moderate",
        workoutDaysPerWeek: 3,
        fitnessGoal: "maintenance",
        targetWeightKg: 65,
        desiredRateKgPerWeek: 0,
        macroPreference: "balanced",
      }),
    );

    expect(result.available).toBe(true);

    if (result.available) {
      expect(result.targets).toMatchObject({
        calories: 2329,
        protein: 91,
        carbohydrates: 345,
        fat: 65,
        bmr: 1370.3,
        tdee: 2329.4,
        activityPal: 1.7,
        formulaVersion: 1,
        source: "calculated",
      });
    }
  });

  it("matches the approved weight-loss worked example", () => {
    const result = calculateNutritionTargets(
      profile({
        ageYears: 35,
        biologicalSex: "male",
        heightCm: 178,
        currentWeightKg: 90,
        activityLevel: "light",
        workoutDaysPerWeek: 1,
        fitnessGoal: "weight-loss",
        targetWeightKg: 80,
        desiredRateKgPerWeek: 0.5,
        macroPreference: "balanced",
      }),
    );

    expect(result.available).toBe(true);

    if (result.available) {
      expect(result.targets).toMatchObject({
        calories: 2214,
        protein: 144,
        carbohydrates: 270,
        fat: 62,
        bmr: 1842.5,
        tdee: 2763.8,
        requestedDeficitKcal: 550,
        actualDeficitKcal: 549.75,
      });
    }
  });

  it("matches the approved muscle-gain worked example and preserves rounding difference", () => {
    const result = calculateNutritionTargets(
      profile({
        ageYears: 25,
        biologicalSex: "male",
        heightCm: 175,
        currentWeightKg: 70,
        activityLevel: "very-active",
        workoutDaysPerWeek: 5,
        fitnessGoal: "muscle-gain",
        targetWeightKg: 75,
        desiredRateKgPerWeek: 0.25,
        macroPreference: "balanced",
      }),
    );

    expect(result.available).toBe(true);

    if (result.available) {
      expect(result.targets).toMatchObject({
        calories: 3561,
        protein: 112,
        carbohydrates: 556,
        fat: 99,
        bmr: 1673.8,
        tdee: 3096.4,
      });
      expect(result.details.roundingDifferenceKcal).toBe(2);
    }
  });

  it("caps high requested weight-loss deficits and reports the applied deficit", () => {
    const result = calculateNutritionTargets(
      profile({
        ageYears: 35,
        biologicalSex: "male",
        heightCm: 178,
        currentWeightKg: 90,
        activityLevel: "light",
        workoutDaysPerWeek: 2,
        fitnessGoal: "weight-loss",
        targetWeightKg: 80,
        desiredRateKgPerWeek: 0.75,
        macroPreference: "balanced",
      }),
    );

    expect(result.available).toBe(true);

    if (result.available) {
      expect(result.targets.calories).toBe(2014);
      expect(result.targets.requestedDeficitKcal).toBe(825);
      expect(result.targets.actualDeficitKcal).toBe(749.75);
      expect(result.warnings).toContain("deficit-limited-by-cap");
    }
  });

  it("does not create a deficit when TDEE is at or below the sex-specific guardrail", () => {
    const result = calculateNutritionTargets(
      profile({
        ageYears: 40,
        biologicalSex: "female",
        heightCm: 100,
        currentWeightKg: 40,
        activityLevel: "sedentary",
        workoutDaysPerWeek: 0,
        fitnessGoal: "weight-loss",
        targetWeightKg: 35,
        desiredRateKgPerWeek: 0.5,
        macroPreference: "balanced",
      }),
    );

    expect(result.available).toBe(true);

    if (result.available) {
      expect(result.targets.calories).toBe(930);
      expect(result.targets.calorieGuardrailKcal).toBe(1200);
      expect(result.targets.actualDeficitKcal).toBe(0);
      expect(result.warnings).toContain(
        "tdee-at-or-below-calorie-guardrail",
      );
    }
  });

  it("raises a weight-loss target to the algorithmic guardrail and reports the smaller deficit", () => {
    const result = calculateNutritionTargets(
      profile({
        ageYears: 50,
        biologicalSex: "female",
        heightCm: 160,
        currentWeightKg: 50,
        activityLevel: "light",
        workoutDaysPerWeek: 1,
        fitnessGoal: "weight-loss",
        targetWeightKg: 45,
        desiredRateKgPerWeek: 0.5,
        macroPreference: "balanced",
      }),
    );

    expect(result.available).toBe(true);

    if (result.available) {
      expect(result.targets.calories).toBe(1200);
      expect(result.targets.actualDeficitKcal).toBeCloseTo(433.5);
      expect(result.targets.requestedDeficitKcal).toBe(550);
      expect(result.warnings).toContain(
        "deficit-limited-by-calorie-guardrail",
      );
    }
  });

  it("requires manual targets for weight loss when current BMI is below 18.5", () => {
    const result = calculateNutritionTargets(
      profile({
        currentWeightKg: 50,
        heightCm: 170,
        fitnessGoal: "weight-loss",
        targetWeightKg: 45,
      }),
    );

    expect(result.available).toBe(false);

    if (!result.available) {
      expect(result.issues).toContain("low-current-bmi-weight-loss");
    }
  });

  it("flags a low target BMI without treating BMI as a diagnosis", () => {
    const result = calculateNutritionTargets(
      profile({
        biologicalSex: "female",
        fitnessGoal: "maintenance",
        targetWeightKg: 50,
        heightCm: 170,
      }),
    );

    expect(result.available).toBe(true);

    if (result.available) {
      expect(result.warnings).toContain("target-bmi-below-range");
      expect(result.details.targetBmi).toBeLessThan(18.5);
    }
  });

  it("requires an in-range custom split summing to 100 percent", () => {
    const result = calculateNutritionTargets(
      profile({
        macroPreference: "custom",
        customMacroSplit: {
          proteinPercent: 35,
          fatPercent: 35,
          carbPercent: 30,
        },
      }),
    );

    expect(result.available).toBe(false);

    if (!result.available) {
      expect(result.issues).toContain("custom-split-invalid");
    }
  });

  it("uses the approved PAL values and calculates TDEE from the selected level only", () => {
    expect(ACTIVITY_PAL).toEqual({
      sedentary: 1.4,
      light: 1.5,
      moderate: 1.7,
      "very-active": 1.85,
      "extra-active": 2,
    });

    for (const [activityLevel, pal] of Object.entries(ACTIVITY_PAL)) {
      const result = calculateNutritionTargets(
        profile({ activityLevel: activityLevel as UserProfile["activityLevel"] }),
      );

      expect(result.available).toBe(true);

      if (result.available) {
        expect(result.targets.tdee).toBeCloseTo(result.targets.bmr * pal, 0);
        expect(result.targets.activityPal).toBe(pal);
      }
    }
  });

  it("supports the higher-protein and custom macro presets", () => {
    const higherProtein = calculateNutritionTargets(
      profile({ macroPreference: "higher-protein" }),
    );
    const custom = calculateNutritionTargets(
      profile({
        macroPreference: "custom",
        customMacroSplit: {
          proteinPercent: 25,
          fatPercent: 25,
          carbPercent: 50,
        },
      }),
    );

    expect(higherProtein.available).toBe(true);
    expect(custom.available).toBe(true);

    if (higherProtein.available && custom.available) {
      expect(higherProtein.details.proteinPercent).toBeCloseTo(30, 0);
      expect(higherProtein.details.fatPercent).toBeCloseTo(25, 0);
      expect(higherProtein.details.carbohydratePercent).toBeCloseTo(45, 0);
      expect(custom.details.proteinPercent).toBeCloseTo(25, 0);
      expect(custom.details.fatPercent).toBeCloseTo(25, 0);
      expect(custom.details.carbohydratePercent).toBeCloseTo(50, 0);
    }
  });

  it("requires manual targets outside the supported age and biological-sex inputs", () => {
    const tooYoung = calculateNutritionTargets(profile({ ageYears: 17 }));
    const missingSex = calculateNutritionTargets(
      profile({ biologicalSex: undefined }),
    );

    expect(tooYoung.available).toBe(false);
    expect(missingSex.available).toBe(false);

    if (!tooYoung.available && !missingSex.available) {
      expect(tooYoung.issues).toContain("age-out-of-range");
      expect(missingSex.issues).toContain("sex-required");
    }
  });
});

describe("activity level suggestions", () => {
  it("maps weekly workout frequency to the approved suggestion", () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7].map(suggestActivityLevel)).toEqual([
      "sedentary",
      "light",
      "light",
      "moderate",
      "moderate",
      "very-active",
      "very-active",
      "extra-active",
    ]);
  });

  it("uses only the specified PAL values", () => {
    expect(Object.values(ACTIVITY_PAL)).toEqual([1.4, 1.5, 1.7, 1.85, 2]);
    expect(suggestActivityLevel(8)).toBeUndefined();
  });
});
