import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OnboardingView } from "@/components/onboarding/OnboardingView";
import { SettingsView } from "@/components/settings/SettingsView";

const mocks = vi.hoisted(() => ({
  profile: {
    id: "profile-test",
    createdAt: "2026-10-31T00:00:00.000Z",
    updatedAt: "2026-10-31T00:00:00.000Z",
    displayName: "Test User",
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
  },
  targets: {
    id: "targets-test",
    createdAt: "2026-10-31T00:00:00.000Z",
    updatedAt: "2026-10-31T00:00:00.000Z",
    calories: 2200,
    protein: 150,
    carbohydrates: 180,
    fat: 73,
    source: "manual",
  },
  updateProfile: vi.fn(),
  updateTargets: vi.fn(),
  toast: vi.fn(),
  routerPush: vi.fn(),
}));

vi.mock("@/components/providers/DemoDataProvider", () => ({
  useDemoData: () => ({
    profile: mocks.profile,
    targets: mocks.targets,
    updateProfile: mocks.updateProfile,
    updateTargets: mocks.updateTargets,
    exportData: () => "{}",
    importData: () => ({ ok: true }),
    resetDemoData: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-i18n", () => ({
  useI18n: () => ({
    locale: "en",
    t: (key: string) => key,
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock("@/hooks/use-storage-status", () => ({
  useStorageStatus: () => ({ available: true, readOnly: false }),
}));

vi.mock("@/components/common/LanguageToggle", () => ({
  LanguageToggle: () => null,
}));

vi.mock("@/components/common/ThemeToggle", () => ({
  ThemeToggle: () => null,
}));

vi.mock("@/components/auth/SignOutButton", () => ({
  SignOutButton: () => null,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.routerPush }),
}));

describe("nutrition target UI integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(mocks.profile, {
      id: "profile-test",
      createdAt: "2026-10-31T00:00:00.000Z",
      updatedAt: "2026-10-31T00:00:00.000Z",
      displayName: "Test User",
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
    });
    Object.assign(mocks.targets, {
      id: "targets-test",
      createdAt: "2026-10-31T00:00:00.000Z",
      updatedAt: "2026-10-31T00:00:00.000Z",
      calories: 2200,
      protein: 150,
      carbohydrates: 180,
      fat: 73,
      source: "manual",
    });
  });

  it("uses calculated estimates by default in onboarding and saves formula metadata", async () => {
    render(<OnboardingView />);

    fireEvent.click(screen.getByRole("button", { name: "onboarding.next" }));
    fireEvent.click(screen.getByRole("button", { name: "onboarding.next" }));
    fireEvent.click(screen.getByRole("button", { name: "onboarding.next" }));

    expect(screen.getByText("nutrition.calculationAvailable")).toBeVisible();
    expect(screen.getByLabelText("settings.targetCalories")).toHaveValue(2329);
    expect(screen.getByLabelText("settings.targetProtein")).toHaveValue(91);
    expect(screen.getByLabelText("settings.targetCarbs")).toHaveValue(345);
    expect(screen.getByLabelText("settings.targetFat")).toHaveValue(65);
    expect(screen.getByText("nutrition.proteinPercent")).toBeVisible();
    expect(screen.getByText("nutrition.carbohydratePercent")).toBeVisible();
    expect(screen.getByText("nutrition.fatPercent")).toBeVisible();
    expect(screen.getByText("nutrition.disclaimerGuardrail")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "onboarding.next" }));
    expect(screen.getByText("onboarding.desiredRate")).toBeVisible();
    expect(screen.getByText("settings.macro.balanced")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "onboarding.finish" }));

    await waitFor(() => {
      expect(mocks.updateTargets).toHaveBeenCalledWith(
        expect.objectContaining({
          calories: 2329,
          protein: 91,
          carbohydrates: 345,
          fat: 65,
          source: "calculated",
          formulaVersion: 1,
          bmr: 1370.3,
          tdee: 2329.4,
          activityPal: 1.7,
          calculatedAt: expect.any(String),
        }),
      );
      expect(mocks.routerPush).toHaveBeenCalledWith("/");
    });
  });

  it("recalculates targets after a valid Settings profile update", async () => {
    Object.assign(mocks.profile, {
      ageYears: 35,
      biologicalSex: "male",
      heightCm: 178,
      currentWeightKg: 90,
      activityLevel: "light",
      workoutDaysPerWeek: 2,
      fitnessGoal: "weight-loss",
      targetWeightKg: 80,
      desiredRateKgPerWeek: 0.5,
      macroPreference: "balanced",
    });

    render(<SettingsView />);

    fireEvent.click(screen.getByRole("button", { name: "settings.saveProfile" }));

    await waitFor(() => {
      expect(mocks.updateTargets).toHaveBeenCalledWith(
        expect.objectContaining({
          calories: 2214,
          protein: 144,
          carbohydrates: 270,
          fat: 62,
          source: "calculated",
          formulaVersion: 1,
        }),
      );
    });
  });

  it("keeps onboarding open when the cloud profile write fails", async () => {
    mocks.updateProfile.mockResolvedValueOnce(false);
    render(<OnboardingView />);

    fireEvent.click(screen.getByRole("button", { name: "onboarding.next" }));
    fireEvent.click(screen.getByRole("button", { name: "onboarding.next" }));
    fireEvent.click(screen.getByRole("button", { name: "onboarding.next" }));
    fireEvent.click(screen.getByRole("button", { name: "onboarding.next" }));
    fireEvent.click(screen.getByRole("button", { name: "onboarding.finish" }));

    await waitFor(() => {
      expect(mocks.updateProfile).toHaveBeenCalled();
    });
    expect(mocks.updateTargets).not.toHaveBeenCalled();
    expect(mocks.routerPush).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "onboarding.finish" }),
    ).toBeEnabled();
  });

  it("keeps manual targets editable and marks them manual when saved", () => {
    render(<SettingsView />);

    fireEvent.change(screen.getByLabelText("settings.targetCalories"), {
      target: { value: "2000" },
    });
    fireEvent.change(screen.getByLabelText("settings.targetProtein"), {
      target: { value: "100" },
    });
    fireEvent.change(screen.getByLabelText("settings.targetCarbs"), {
      target: { value: "200" },
    });
    fireEvent.change(screen.getByLabelText("settings.targetFat"), {
      target: { value: "70" },
    });
    fireEvent.click(screen.getByRole("button", { name: "settings.saveTargets" }));

    expect(mocks.updateTargets).toHaveBeenCalledWith({
      calories: 2000,
      protein: 100,
      carbohydrates: 200,
      fat: 70,
      source: "manual",
    });
  });

  it("preserves zero workout days in the Settings profile form", () => {
    Object.assign(mocks.profile, { workoutDaysPerWeek: 0 });

    render(<SettingsView />);

    expect(screen.getByLabelText("settings.workoutDays")).toHaveValue(0);
  });
});
