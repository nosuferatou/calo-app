import { render, screen, waitFor, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import {
  AppDataProvider,
  IDENTITY_TIMEOUT_MS,
} from "@/components/providers/AppDataProvider";

const authState = vi.hoisted(() => ({
  listener:
    null as
      | ((event: string, session: { user: { id: string } } | null) => void)
      | null,
  userId: "user-a",
  // When defined, overrides the `sub` returned by getClaims.
  claimsSub: undefined as string | undefined,
  claimsError: null as unknown,
  hangClaims: false,
  sessionError: null as unknown,
  sessionThrows: false,
}));

vi.mock("@/hooks/use-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

vi.mock("@/components/providers/DemoDataProvider", () => ({
  DemoDataProvider: ({ children }: { children: ReactNode }) => (
    <div data-testid="demo-provider">{children}</div>
  ),
}));

vi.mock("@/components/providers/CloudDataProvider", () => ({
  CloudDataProvider: ({
    children,
    userId,
  }: {
    children: ReactNode;
    userId: string;
  }) => (
    <div data-testid="cloud-provider" data-user-id={userId}>
      {children}
    </div>
  ),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: async () => {
        if (authState.sessionThrows) throw new Error("network unreachable");
        return {
          data: {
            session: authState.userId
              ? { user: { id: authState.userId } }
              : null,
          },
          error: authState.sessionError,
        };
      },
      getClaims: async () => {
        if (authState.hangClaims) return new Promise(() => {});
        return {
          data: {
            claims: {
              sub:
                authState.claimsSub !== undefined
                  ? authState.claimsSub
                  : authState.userId,
            },
          },
          error: authState.claimsError,
        };
      },
      onAuthStateChange: (
        callback: (
          event: string,
          session: { user: { id: string } } | null,
        ) => void,
      ) => {
        authState.listener = callback;
        return {
          data: { subscription: { unsubscribe: vi.fn() } },
        };
      },
    },
  }),
}));

function resetAuthState() {
  authState.listener = null;
  authState.userId = "user-a";
  authState.claimsSub = undefined;
  authState.claimsError = null;
  authState.hangClaims = false;
  authState.sessionError = null;
  authState.sessionThrows = false;
}

describe("AppDataProvider", () => {
  beforeEach(() => {
    resetAuthState();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("waits for verified identity before rendering the authenticated provider", async () => {
    localStorage.setItem("existing-demo-data", "preserve");
    render(
      <AppDataProvider>
        <p>Application</p>
      </AppDataProvider>,
    );

    expect(screen.queryByTestId("demo-provider")).not.toBeInTheDocument();
    expect(await screen.findByTestId("cloud-provider")).toHaveAttribute(
      "data-user-id",
      "user-a",
    );
    expect(localStorage.getItem("existing-demo-data")).toBe("preserve");
  });

  it("rebinds the provider when the authenticated account changes", async () => {
    render(
      <AppDataProvider>
        <p>Application</p>
      </AppDataProvider>,
    );
    await screen.findByTestId("cloud-provider");

    authState.userId = "user-b";
    act(() => {
      authState.listener?.("SIGNED_IN", { user: { id: "user-b" } });
    });

    await waitFor(() => {
      expect(screen.getByTestId("cloud-provider")).toHaveAttribute(
        "data-user-id",
        "user-b",
      );
    });
    expect(localStorage.length).toBe(0);
  });

  it("selects the demo provider only after the session is verified as anonymous", async () => {
    authState.userId = "";
    render(
      <AppDataProvider>
        <p>Application</p>
      </AppDataProvider>,
    );
    await screen.findByTestId("demo-provider");
    expect(screen.queryByTestId("cloud-provider")).not.toBeInTheDocument();
  });

  it("shows the expired state with a sign-in link when claims do not match the session", async () => {
    authState.claimsSub = "someone-else";
    render(
      <AppDataProvider>
        <p>Application</p>
      </AppDataProvider>,
    );

    expect(await screen.findByText("cloud.sessionExpired")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "cloud.signInAgain" }),
    ).toHaveAttribute("href", "/login");
    expect(screen.queryByTestId("cloud-provider")).not.toBeInTheDocument();
    expect(screen.queryByTestId("demo-provider")).not.toBeInTheDocument();
  });

  it("treats a missing subject in the claims as an expired session", async () => {
    authState.claimsSub = "";
    render(
      <AppDataProvider>
        <p>Application</p>
      </AppDataProvider>,
    );

    expect(await screen.findByText("cloud.sessionExpired")).toBeInTheDocument();
    expect(screen.queryByTestId("cloud-provider")).not.toBeInTheDocument();
  });

  it("shows a retryable error and never falls back to demo when the backend fails", async () => {
    authState.sessionThrows = true;
    render(
      <AppDataProvider>
        <p>Application</p>
      </AppDataProvider>,
    );

    expect(await screen.findByText("error.title")).toBeInTheDocument();
    expect(screen.getByText("cloud.identityError")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "cloud.retry" }),
    ).toBeInTheDocument();
    // A backend failure must not silently expose demo/LocalStorage data.
    expect(screen.queryByTestId("demo-provider")).not.toBeInTheDocument();
    expect(screen.queryByTestId("cloud-provider")).not.toBeInTheDocument();
  });

  it("bounds identity resolution and errors instead of loading forever", async () => {
    vi.useFakeTimers();
    authState.hangClaims = true;
    render(
      <AppDataProvider>
        <p>Application</p>
      </AppDataProvider>,
    );

    // Still resolving before the deadline.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(IDENTITY_TIMEOUT_MS - 1);
    });
    expect(screen.getByText("cloud.loadingIdentity")).toBeInTheDocument();

    // After the bounded timeout it becomes an explicit, retryable error.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(screen.getByText("error.title")).toBeInTheDocument();
    expect(screen.getByText("cloud.identityTimeout")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "cloud.retry" }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("cloud-provider")).not.toBeInTheDocument();
    expect(screen.queryByTestId("demo-provider")).not.toBeInTheDocument();
  });

  it("recovers to the authenticated provider when retry succeeds", async () => {
    authState.sessionThrows = true;
    render(
      <AppDataProvider>
        <p>Application</p>
      </AppDataProvider>,
    );
    await screen.findByText("error.title");

    authState.sessionThrows = false;
    await act(async () => {
      screen.getByRole("button", { name: "cloud.retry" }).click();
    });

    expect(await screen.findByTestId("cloud-provider")).toHaveAttribute(
      "data-user-id",
      "user-a",
    );
  });

  it("recovers after re-authentication following an expired session", async () => {
    authState.claimsError = { message: "token expired" };
    render(
      <AppDataProvider>
        <p>Application</p>
      </AppDataProvider>,
    );
    await screen.findByText("cloud.sessionExpired");

    authState.claimsError = null;
    act(() => {
      authState.listener?.("SIGNED_IN", { user: { id: "user-a" } });
    });

    expect(await screen.findByTestId("cloud-provider")).toHaveAttribute(
      "data-user-id",
      "user-a",
    );
  });
});
