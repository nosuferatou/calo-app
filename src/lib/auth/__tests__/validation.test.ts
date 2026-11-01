import { describe, expect, it } from "vitest";
import { validateAuthForm } from "@/lib/auth/validation";

const validValues = {
  email: "person@example.com",
  password: "calo-pass-123",
  confirmPassword: "calo-pass-123",
};

describe("authentication form validation", () => {
  it("requires a valid email and a non-empty password for login", () => {
    expect(
      validateAuthForm("login", { ...validValues, email: "invalid" }),
    ).toBe("auth.validation.email");
    expect(
      validateAuthForm("login", { ...validValues, password: "" }),
    ).toBe("auth.validation.passwordRequired");
  });

  it("requires an eight-character password and matching confirmation for signup", () => {
    expect(
      validateAuthForm("signup", { ...validValues, password: "short" }),
    ).toBe("auth.validation.passwordLength");
    expect(
      validateAuthForm("signup", {
        ...validValues,
        confirmPassword: "different",
      }),
    ).toBe("auth.validation.passwordMismatch");
    expect(validateAuthForm("signup", validValues)).toBeNull();
  });

  it("validates password recovery request and reset inputs", () => {
    expect(
      validateAuthForm("forgot", { ...validValues, email: "bad" }),
    ).toBe("auth.validation.email");
    expect(validateAuthForm("forgot", { ...validValues, password: "" })).toBeNull();
    expect(
      validateAuthForm("reset", {
        ...validValues,
        password: "new-password",
        confirmPassword: "different",
      }),
    ).toBe("auth.validation.passwordMismatch");
  });
});
