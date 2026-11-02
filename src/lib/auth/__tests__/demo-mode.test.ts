import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEMO_COOKIE_NAME,
  clearDemoModeOptIn,
  enterDemoMode,
  exitDemoMode,
  optInToDemoMode,
} from "@/lib/auth/demo-mode";

function mockAssign() {
  const assign = vi.fn();
  Object.defineProperty(window, "location", {
    configurable: true,
    writable: true,
    value: { ...window.location, assign },
  });

  return assign;
}

describe("demo mode opt-in", () => {
  let assign: ReturnType<typeof mockAssign>;

  beforeEach(() => {
    assign = mockAssign();
    document.cookie = `${DEMO_COOKIE_NAME}=; path=/; max-age=0`;
  });

  afterEach(() => {
    document.cookie = `${DEMO_COOKIE_NAME}=; path=/; max-age=0`;
  });

  function demoCookie(): string | null {
    const entry = document.cookie
      .split("; ")
      .find((item) => item.startsWith(`${DEMO_COOKIE_NAME}=`));

    return entry ? entry.split("=")[1] : null;
  }

  it("records the opt-in and navigates with a full document load", () => {
    enterDemoMode("/analytics");

    expect(demoCookie()).toBe("1");
    expect(assign).toHaveBeenCalledWith("/analytics");
  });

  it("leaves demo mode for the login gate without touching stored data", () => {
    optInToDemoMode();
    localStorage.setItem("calo:weight-records", '{"version":1,"data":{}}');

    exitDemoMode("/login?next=/analytics");

    expect(demoCookie()).toBeNull();
    expect(assign).toHaveBeenCalledWith("/login?next=/analytics");
    expect(localStorage.getItem("calo:weight-records")).not.toBeNull();

    localStorage.removeItem("calo:weight-records");
  });

  it("clears the opt-in without navigating when the visitor signs out", () => {
    optInToDemoMode();

    clearDemoModeOptIn();

    expect(demoCookie()).toBeNull();
    expect(assign).not.toHaveBeenCalled();
  });
});
