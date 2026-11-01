import { z } from "zod";

export type AuthFormMode = "login" | "signup" | "forgot" | "reset";
export type AuthValidationError =
  | "auth.validation.email"
  | "auth.validation.passwordRequired"
  | "auth.validation.passwordLength"
  | "auth.validation.passwordMismatch";

export type AuthFormValues = {
  email: string;
  password: string;
  confirmPassword: string;
};

const emailSchema = z.email();

export function validateAuthForm(
  mode: AuthFormMode,
  values: AuthFormValues,
): AuthValidationError | null {
  if (mode !== "reset" && !emailSchema.safeParse(values.email.trim()).success) {
    return "auth.validation.email";
  }

  if (mode === "forgot") {
    return null;
  }

  if (!values.password) {
    return "auth.validation.passwordRequired";
  }

  if (
    (mode === "signup" || mode === "reset") &&
    values.password.length < 8
  ) {
    return "auth.validation.passwordLength";
  }

  if (
    (mode === "signup" || mode === "reset") &&
    values.password !== values.confirmPassword
  ) {
    return "auth.validation.passwordMismatch";
  }

  return null;
}

export function isGoogleOAuthEnabled(): boolean {
  return process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === "true";
}
