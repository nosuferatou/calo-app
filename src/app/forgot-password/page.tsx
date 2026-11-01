import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthLayout } from "@/components/auth/AuthLayout";

export const metadata: Metadata = {
  title: "Recover password | CALO",
};

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <AuthForm mode="forgot" />
    </AuthLayout>
  );
}
