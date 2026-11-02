import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DemoModeNotice } from "@/components/auth/DemoModeNotice";

const mocks = vi.hoisted(() => ({
  dataMode: "demo" as "demo" | "cloud",
  pathname: "/analytics",
  exitDemoMode: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
}));

vi.mock("@/hooks/use-i18n", () => ({
  useI18n: () => ({ locale: "en", t: (key: string) => key }),
}));

vi.mock("@/components/providers/DemoDataProvider", () => ({
  useDemoData: () => ({ dataMode: mocks.dataMode }),
}));

vi.mock("@/lib/auth/demo-mode", () => ({
  exitDemoMode: mocks.exitDemoMode,
}));

describe("DemoModeNotice", () => {
  beforeEach(() => {
    mocks.dataMode = "demo";
    mocks.pathname = "/analytics";
    mocks.exitDemoMode.mockReset();
  });

  it("offers the login action while the visitor is in demo mode", () => {
    render(<DemoModeNotice />);

    expect(screen.getByText(/demoMode\.notice/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "auth.action.login" }));

    expect(mocks.exitDemoMode).toHaveBeenCalledWith("/login?next=%2Fanalytics");
  });

  it("keeps the return path inside the allow-list", () => {
    mocks.pathname = "/../../etc/passwd";

    render(<DemoModeNotice />);
    fireEvent.click(screen.getByRole("button", { name: "auth.action.login" }));

    expect(mocks.exitDemoMode).toHaveBeenCalledWith("/login");
  });

  it("is absent for authenticated accounts", () => {
    mocks.dataMode = "cloud";

    render(<DemoModeNotice />);

    expect(
      screen.queryByRole("button", { name: "auth.action.login" }),
    ).toBeNull();
  });
});
