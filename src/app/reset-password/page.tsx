import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthLayout } from "@/components/auth/AuthLayout";

export const metadata: Metadata = {
  title: "Choose a new password | CALO",
};

export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <AuthForm mode="reset" />
    </AuthLayout>
  );
}
