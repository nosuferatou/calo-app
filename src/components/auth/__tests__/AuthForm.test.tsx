import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthForm } from "@/components/auth/AuthForm";
import { SignOutButton } from "@/components/auth/SignOutButton";

const mocks = vi.hoisted(() => ({
  auth: {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
    getClaims: vi.fn(),
    onAuthStateChange: vi.fn(),
  },
  router: {
    replace: vi.fn(),
    refresh: vi.fn(),
  },
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: mocks.auth }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => mocks.router,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

function submitForm(buttonName: string) {
  const form = screen.getByRole("button", { name: buttonName }).closest("form");
  if (!form) {
    throw new Error("Authentication form was not rendered.");
  }
  fireEvent.submit(form);
}

function fillSignupForm() {
  fireEvent.change(screen.getByLabelText("Email address"), {
    target: { value: "person@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "calo-pass-123" },
  });
  fireEvent.change(screen.getByLabelText("Confirm password"), {
    target: { value: "calo-pass-123" },
  });
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(
    "calo:settings",
    JSON.stringify({ version: 1, data: { theme: "system", language: "en" } }),
  );
  vi.clearAllMocks();
  mocks.auth.signInWithPassword.mockResolvedValue({
    data: { session: { access_token: "test-token" } },
    error: null,
  });
  mocks.auth.signUp.mockResolvedValue({
    data: { session: null },
    error: null,
  });
  mocks.auth.resetPasswordForEmail.mockResolvedValue({ error: null });
  mocks.auth.updateUser.mockResolvedValue({ error: null });
  mocks.auth.signInWithOAuth.mockResolvedValue({ error: null });
  mocks.auth.signOut.mockResolvedValue({ error: null });
  mocks.auth.getClaims.mockResolvedValue({
    data: { claims: { sub: "local-user" } },
    error: null,
  });
  mocks.auth.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("AuthForm", () => {
  it("blocks signup with invalid email and short passwords", () => {
    render(<AuthForm mode="signup" />);
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "not-an-email" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "short" },
    });
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "short" },
    });

    submitForm("Create account");

    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
    expect(mocks.auth.signUp).not.toHaveBeenCalled();
  });

  it("sends a valid login through the server-side completion route", async () => {
    render(<AuthForm mode="login" nextPath="/settings" />);
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: " person@example.com " },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "a short legacy password" },
    });

    submitForm("Sign in");

    await waitFor(() => {
      expect(mocks.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "person@example.com",
        password: "a short legacy password",
      });
      expect(mocks.router.replace).toHaveBeenCalledWith(
        "/auth/complete?next=%2Fsettings",
      );
    });
  });

  it("completes signup immediately when local Auth returns a session", async () => {
    mocks.auth.signUp.mockResolvedValue({
      data: { session: { access_token: "test-token" } },
      error: null,
    });
    render(<AuthForm mode="signup" />);
    fillSignupForm();
    submitForm("Create account");

    await waitFor(() => {
      expect(mocks.router.replace).toHaveBeenCalledWith(
        "/auth/complete?next=%2Fonboarding",
      );
    });
  });

  it("shows a neutral verification message when signup has no immediate session", async () => {
    render(<AuthForm mode="signup" />);
    fillSignupForm();
    submitForm("Create account");

    expect(
      await screen.findByText(
        "If this address can be registered, check your inbox for a verification link.",
      ),
    ).toBeInTheDocument();
    expect(mocks.auth.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "person@example.com",
        options: {
          emailRedirectTo:
            "http://localhost:3000/auth/callback?next=%2Fonboarding",
        },
      }),
    );
  });

  it("sends recovery mail through the PKCE callback and gives a non-enumerating response", async () => {
    render(<AuthForm mode="forgot" />);
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "person@example.com" },
    });
    submitForm("Send recovery instructions");

    expect(
      await screen.findByText(
        "If an account exists for this address, recovery instructions will arrive by email.",
      ),
    ).toBeInTheDocument();
    expect(mocks.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      "person@example.com",
      {
        redirectTo:
          "http://localhost:3000/auth/callback?next=%2Freset-password",
      },
    );
  });

  it("rejects a mismatched recovery password and shows the provider error safely", async () => {
    render(<AuthForm mode="reset" />);
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "calo-pass-123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "different-password" },
    });
    submitForm("Save new password");

    expect(screen.getByText("The passwords do not match.")).toBeInTheDocument();
    expect(mocks.auth.updateUser).not.toHaveBeenCalled();
  });

  it("shows Google as unavailable until the provider is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED", "false");
    render(<AuthForm mode="login" />);

    expect(
      screen.getByRole("button", { name: "Continue with Google" }),
    ).toBeDisabled();
    expect(
      screen.getByText("Google sign-in is not configured for this environment."),
    ).toBeInTheDocument();
  });

  it("handles Google OAuth provider failures without exposing provider details", async () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED", "true");
    mocks.auth.signInWithOAuth.mockResolvedValue({
      error: { message: "provider credentials are missing" },
    });
    render(<AuthForm mode="login" />);
    fireEvent.click(
      screen.getByRole("button", { name: "Continue with Google" }),
    );

    expect(
      await screen.findByText(
        "Google sign-in was cancelled or could not be completed.",
      ),
    ).toBeInTheDocument();
    expect(mocks.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: "http://localhost:3000/auth/callback?next=%2F",
      },
    });
  });

  it("toggles password visibility accessibly", () => {
    render(<AuthForm mode="login" />);
    const password = screen.getByLabelText("Password");
    expect(password).toHaveAttribute("type", "password");

    fireEvent.click(screen.getByRole("button", { name: "Show password" }));

    expect(password).toHaveAttribute("type", "text");
  });
});

describe("SignOutButton", () => {
  it("signs out an authenticated user and returns to login", async () => {
    render(<SignOutButton />);
    const button = await screen.findByRole("button", { name: "Sign out" });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mocks.auth.signOut).toHaveBeenCalledOnce();
      expect(mocks.router.replace).toHaveBeenCalledWith("/login");
      expect(mocks.router.refresh).toHaveBeenCalledOnce();
    });
  });
});
