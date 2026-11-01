"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/hooks/use-i18n";
import { createClient } from "@/lib/supabase/client";
import {
  getAuthCallbackUrl,
  getSafeReturnPath,
} from "@/lib/auth/paths";
import {
  isGoogleOAuthEnabled,
  validateAuthForm,
  type AuthFormMode,
  type AuthFormValues,
  type AuthValidationError,
} from "@/lib/auth/validation";
import type { TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type AuthFeedback = {
  kind: "error" | "success";
  key: TranslationKey;
};

type AuthFormProps = {
  mode: AuthFormMode;
  nextPath?: string;
  initialError?: "callback" | "oauth" | "profile" | "session";
};

const initialValues: AuthFormValues = {
  email: "",
  password: "",
  confirmPassword: "",
};

const initialErrorKeys = {
  callback: "auth.error.callback",
  oauth: "auth.error.oauth",
  profile: "auth.error.profile",
  session: "auth.error.session",
} as const satisfies Record<
  NonNullable<AuthFormProps["initialError"]>,
  TranslationKey
>;

const titleKeys = {
  login: "auth.title.login",
  signup: "auth.title.signup",
  forgot: "auth.title.forgot",
  reset: "auth.title.reset",
} as const satisfies Record<AuthFormMode, TranslationKey>;

const descriptionKeys = {
  login: "auth.description.login",
  signup: "auth.description.signup",
  forgot: "auth.description.forgot",
  reset: "auth.description.reset",
} as const satisfies Record<AuthFormMode, TranslationKey>;

const actionKeys = {
  login: "auth.action.login",
  signup: "auth.action.signup",
  forgot: "auth.action.forgot",
  reset: "auth.action.reset",
} as const satisfies Record<AuthFormMode, TranslationKey>;

export function AuthForm({
  mode,
  nextPath,
  initialError,
}: AuthFormProps) {
  const { t } = useI18n();
  const router = useRouter();
  const safeNextPath = getSafeReturnPath(
    nextPath,
    mode === "signup" ? "/onboarding" : "/",
  );
  const [values, setValues] = useState(initialValues);
  const [validationError, setValidationError] =
    useState<AuthValidationError | null>(null);
  const [feedback, setFeedback] = useState<AuthFeedback | null>(
    initialError
      ? { kind: "error", key: initialErrorKeys[initialError] }
      : null,
  );
  const [loadingAction, setLoadingAction] = useState<"form" | "google" | null>(
    null,
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const submitting = useRef(false);
  const googleEnabled = isGoogleOAuthEnabled();

  function updateValue(field: keyof AuthFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setValidationError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) {
      return;
    }

    const error = validateAuthForm(mode, values);
    if (error) {
      setValidationError(error);
      setFeedback(null);
      return;
    }

    submitting.current = true;
    setLoadingAction("form");
    setFeedback(null);

    try {
      const supabase = createClient();
      const email = values.email.trim();

      if (mode === "login") {
        const { data, error: authError } =
          await supabase.auth.signInWithPassword({
            email,
            password: values.password,
          });
        if (authError || !data.session) {
          setFeedback({ kind: "error", key: "auth.error.generic" });
          return;
        }

        router.replace(
          `/auth/complete?next=${encodeURIComponent(safeNextPath)}`,
        );
        return;
      }

      if (mode === "signup") {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password: values.password,
          options: {
            emailRedirectTo: getAuthCallbackUrl(
              window.location.origin,
              safeNextPath,
            ),
          },
        });
        if (authError) {
          setFeedback({ kind: "error", key: "auth.error.generic" });
          return;
        }

        if (data.session) {
          router.replace(
            `/auth/complete?next=${encodeURIComponent(safeNextPath)}`,
          );
          return;
        }

        setFeedback({ kind: "success", key: "auth.notice.signupEmail" });
        return;
      }

      if (mode === "forgot") {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(
          email,
          {
            redirectTo: getAuthCallbackUrl(
              window.location.origin,
              "/reset-password",
            ),
          },
        );
        if (authError) {
          setFeedback({ kind: "error", key: "auth.error.generic" });
          return;
        }

        setFeedback({ kind: "success", key: "auth.notice.recoveryEmail" });
        return;
      }

      const { error: authError } = await supabase.auth.updateUser({
        password: values.password,
      });
      if (authError) {
        setFeedback({ kind: "error", key: "auth.error.generic" });
        return;
      }

      setValues(initialValues);
      setFeedback({ kind: "success", key: "auth.notice.passwordUpdated" });
    } catch {
      setFeedback({ kind: "error", key: "auth.error.generic" });
    } finally {
      submitting.current = false;
      setLoadingAction(null);
    }
  }

  async function handleGoogleSignIn() {
    if (!googleEnabled || submitting.current) {
      return;
    }

    submitting.current = true;
    setLoadingAction("google");
    setFeedback(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: getAuthCallbackUrl(
            window.location.origin,
            safeNextPath,
          ),
        },
      });
      if (error) {
        setFeedback({ kind: "error", key: "auth.error.oauth" });
      }
    } catch {
      setFeedback({ kind: "error", key: "auth.error.oauth" });
    } finally {
      submitting.current = false;
      setLoadingAction(null);
    }
  }

  const emailError =
    validationError === "auth.validation.email" ? validationError : null;
  const passwordError =
    validationError === "auth.validation.passwordRequired" ||
    validationError === "auth.validation.passwordLength"
      ? validationError
      : null;
  const confirmPasswordError =
    validationError === "auth.validation.passwordMismatch"
      ? validationError
      : null;
  const needsEmail = mode !== "reset";
  const needsPassword = mode !== "forgot";
  const needsConfirmation = mode === "signup" || mode === "reset";
  const showGoogle = mode === "login" || mode === "signup";

  return (
    <div>
      <header className="mb-6 space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          {t(titleKeys[mode])}
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          {t(descriptionKeys[mode])}
        </p>
      </header>

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        {needsEmail ? (
          <div className="space-y-1.5">
            <label
              className="text-sm font-medium text-slate-800 dark:text-slate-200"
              htmlFor="auth-email"
            >
              {t("auth.label.email")}
            </label>
            <Input
              autoComplete="email"
              id="auth-email"
              name="email"
              type="email"
              required
              value={values.email}
              onChange={(event) => updateValue("email", event.target.value)}
              aria-invalid={Boolean(emailError)}
              aria-describedby={emailError ? "auth-email-error" : undefined}
              className="h-11"
            />
            {emailError ? (
              <p
                className="text-sm text-error"
                id="auth-email-error"
                role="alert"
              >
                {t(emailError)}
              </p>
            ) : null}
          </div>
        ) : null}

        {needsPassword ? (
          <PasswordField
            id="auth-password"
            label={t("auth.label.password")}
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            value={values.password}
            visible={showPassword}
            error={passwordError}
            onChange={(value) => updateValue("password", value)}
            onToggle={() => setShowPassword((visible) => !visible)}
            showLabel={t(showPassword ? "auth.password.hide" : "auth.password.show")}
            t={t}
          />
        ) : null}

        {needsConfirmation ? (
          <PasswordField
            id="auth-confirm-password"
            label={t("auth.label.confirmPassword")}
            autoComplete="new-password"
            value={values.confirmPassword}
            visible={showConfirmPassword}
            error={confirmPasswordError}
            onChange={(value) => updateValue("confirmPassword", value)}
            onToggle={() =>
              setShowConfirmPassword((visible) => !visible)
            }
            showLabel={t(
              showConfirmPassword ? "auth.password.hide" : "auth.password.show",
            )}
            t={t}
          />
        ) : null}

        {validationError &&
        !emailError &&
        !passwordError &&
        !confirmPasswordError ? (
          <p className="text-sm text-error" role="alert">
            {t(validationError)}
          </p>
        ) : null}

        {feedback ? (
          <p
            className={cn(
              "rounded-lg border px-3 py-2.5 text-sm leading-5",
              feedback.kind === "error"
                ? "border-red-300 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
                : "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
            )}
            role={feedback.kind === "error" ? "alert" : "status"}
            aria-live="polite"
          >
            {t(feedback.key)}
          </p>
        ) : null}

        <Button
          className="h-11 w-full"
          type="submit"
          disabled={loadingAction !== null}
        >
          {loadingAction === "form" ? t("auth.loading") : t(actionKeys[mode])}
        </Button>
      </form>

      {showGoogle ? (
        <div className="mt-5 space-y-2">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" aria-hidden="true" />
            <span>{t("auth.divider")}</span>
            <span className="h-px flex-1 bg-border" aria-hidden="true" />
          </div>
          <Button
            className="h-11 w-full"
            type="button"
            variant="outline"
            disabled={!googleEnabled || loadingAction !== null}
            onClick={handleGoogleSignIn}
          >
            {loadingAction === "google"
              ? t("auth.loading")
              : t("auth.action.google")}
          </Button>
          {!googleEnabled ? (
            <p className="text-center text-xs text-muted-foreground">
              {t("auth.google.unavailable")}
            </p>
          ) : null}
        </div>
      ) : null}

      {mode === "login" ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
          <Link
            className="inline-flex min-h-11 items-center font-medium text-brand-700 underline-offset-4 hover:underline active:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:text-brand-400"
            href="/forgot-password"
          >
            {t("auth.link.forgot")}
          </Link>
          <p className="text-muted-foreground">
            {t("auth.link.signupPrompt")}{" "}
            <Link
              className="inline-flex min-h-11 items-center font-medium text-brand-700 underline-offset-4 hover:underline active:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:text-brand-400"
              href="/signup"
            >
              {t("auth.link.signup")}
            </Link>
          </p>
        </div>
      ) : null}

      {mode === "signup" ? (
        <p className="mt-5 text-center text-sm text-muted-foreground">
          {t("auth.link.loginPrompt")}{" "}
          <Link
            className="inline-flex min-h-11 items-center font-medium text-brand-700 underline-offset-4 hover:underline active:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:text-brand-400"
            href="/login"
          >
            {t("auth.link.login")}
          </Link>
        </p>
      ) : null}

      {mode === "forgot" || mode === "reset" ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
          <Link
            className="inline-flex min-h-11 items-center font-medium text-brand-700 underline-offset-4 hover:underline active:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:text-brand-400"
            href="/login"
          >
            {t("auth.link.returnLogin")}
          </Link>
          {mode === "reset" && feedback?.kind === "success" ? (
            <Link
              className="inline-flex min-h-11 items-center font-medium text-brand-700 underline-offset-4 hover:underline active:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:text-brand-400"
              href="/"
            >
              {t("auth.link.returnApp")}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function AuthFormLoading() {
  const { t } = useI18n();

  return (
    <p className="text-sm text-muted-foreground" role="status">
      {t("auth.loading")}
    </p>
  );
}

type PasswordFieldProps = {
  id: string;
  label: string;
  autoComplete: string;
  value: string;
  visible: boolean;
  error: AuthValidationError | null;
  onChange: (value: string) => void;
  onToggle: () => void;
  showLabel: string;
  t: ReturnType<typeof useI18n>["t"];
};

function PasswordField({
  id,
  label,
  autoComplete,
  value,
  visible,
  error,
  onChange,
  onToggle,
  showLabel,
  t,
}: PasswordFieldProps) {
  return (
    <div className="space-y-1.5">
      <label
        className="text-sm font-medium text-slate-800 dark:text-slate-200"
        htmlFor={id}
      >
        {label}
      </label>
      <div className="relative">
        <Input
          autoComplete={autoComplete}
          className="h-11 pr-20"
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <button
          className="absolute inset-y-0 right-1 min-w-16 px-2 text-xs font-medium text-brand-700 underline-offset-4 hover:underline active:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:text-brand-400"
          type="button"
          onClick={onToggle}
          aria-label={showLabel}
        >
          {visible ? t("auth.password.hide") : t("auth.password.show")}
        </button>
      </div>
      {error ? (
        <p className="text-sm text-error" id={`${id}-error`} role="alert">
          {t(error)}
        </p>
      ) : null}
    </div>
  );
}
