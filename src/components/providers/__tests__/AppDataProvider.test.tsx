import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { AppDataProvider } from "@/components/providers/AppDataProvider";

const authState = vi.hoisted(() => ({
  listener: null as
    | ((
        event: string,
        session: { user: { id: string } } | null,
      ) => void)
    | null,
  userId: "user-a",
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
      getSession: async () => ({
        data: {
          session: authState.userId
            ? { user: { id: authState.userId } }
            : null,
        },
        error: null,
      }),
      getClaims: async () => ({
        data: { claims: { sub: authState.userId } },
        error: null,
      }),
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

describe("AppDataProvider", () => {
  beforeEach(() => {
    authState.listener = null;
    authState.userId = "user-a";
    localStorage.clear();
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
    authState.listener?.("SIGNED_IN", { user: { id: "user-b" } });

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
});
