import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm, AuthFormLoading } from "@/components/auth/AuthForm";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { getSafeReturnPath } from "@/lib/auth/paths";

export const metadata: Metadata = {
  title: "Sign in | CALO",
};

type LoginPageProps = {
  searchParams?: Promise<{
    next?: string | string[];
    error?: string | string[];
  }>;
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <AuthLayout>
      <Suspense fallback={<AuthFormLoading />}>
        <LoginPageContent searchParams={searchParams} />
      </Suspense>
    </AuthLayout>
  );
}

async function LoginPageContent({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPathValue =
    typeof params?.next === "string" ? params.next : undefined;
  const errorValue =
    typeof params?.error === "string" ? params.error : undefined;
  const initialError =
    errorValue === "oauth" ||
    errorValue === "callback" ||
    errorValue === "profile" ||
    errorValue === "session"
      ? errorValue
      : undefined;

  return (
    <AuthForm
      mode="login"
      nextPath={getSafeReturnPath(nextPathValue)}
      initialError={initialError}
    />
  );
}
