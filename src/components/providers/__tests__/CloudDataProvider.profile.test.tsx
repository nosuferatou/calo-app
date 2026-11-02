import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CloudDataProvider } from "@/components/providers/CloudDataProvider";
import type { UserProfile } from "@/types";

const state = vi.hoisted(() => ({
  profile: null as UserProfile | null,
  routerReplace: vi.fn(),
  routerPush: vi.fn(),
  pathname: "/",
  toast: vi.fn(),
}));

const EMPTY_TIME = "1970-01-01T00:00:00.000Z";

function completeProfile(userId: string): UserProfile {
  return {
    id: userId,
    createdAt: EMPTY_TIME,
    updatedAt: EMPTY_TIME,
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
  };
}

vi.mock("@/lib/repositories/client", () => ({
  createBrowserRepositories: () => ({
    profiles: { get: async () => state.profile },
    nutritionTargets: { get: async () => null },
    mealSessions: { list: async () => [] },
    foodEntries: { list: async () => [] },
    customFoods: { list: async () => [] },
    favorites: { list: async () => [] },
    savedMeals: { list: async () => [] },
    weightRecords: { list: async () => [] },
    mealCartDraft: { get: async () => null },
    accountPreferences: { get: async () => null },
    searchHistory: { get: async () => [] },
  }),
}));

vi.mock("@/hooks/use-i18n", () => ({
  useI18n: () => ({ locale: "en", t: (key: string) => key }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: state.toast }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => state.pathname,
  useRouter: () => ({ replace: state.routerReplace, push: state.routerPush }),
}));

function Child() {
  return <div data-testid="cloud-child">content</div>;
}

function renderProvider() {
  return render(
    <CloudDataProvider userId="user-a" onSessionExpired={vi.fn()}>
      <Child />
    </CloudDataProvider>,
  );
}

describe("CloudDataProvider missing profile", () => {
  beforeEach(() => {
    state.profile = null;
    state.pathname = "/";
    state.routerReplace.mockClear();
    state.routerPush.mockClear();
    state.toast.mockClear();
  });

  it("redirects to onboarding when the profile row is missing but does not hang", async () => {
    state.profile = null;
    renderProvider();

    await screen.findByTestId("cloud-child");
    await waitFor(() => {
      expect(state.routerReplace).toHaveBeenCalledWith("/onboarding");
    });
  });

  it("does not redirect when a complete profile is loaded", async () => {
    state.profile = completeProfile("user-a");
    renderProvider();

    await screen.findByTestId("cloud-child");
    expect(state.routerReplace).not.toHaveBeenCalled();
  });

  it("does not redirect again once already on the onboarding route", async () => {
    state.profile = null;
    state.pathname = "/onboarding";
    renderProvider();

    await screen.findByTestId("cloud-child");
    expect(state.routerReplace).not.toHaveBeenCalled();
  });
});
