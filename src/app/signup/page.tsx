import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm, AuthFormLoading } from "@/components/auth/AuthForm";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { getSafeReturnPath } from "@/lib/auth/paths";

export const metadata: Metadata = {
  title: "Create account | CALO",
};

type SignupPageProps = {
  searchParams?: Promise<{
    next?: string | string[];
    error?: string | string[];
  }>;
};

export default function SignupPage({ searchParams }: SignupPageProps) {
  return (
    <AuthLayout>
      <Suspense fallback={<AuthFormLoading />}>
        <SignupPageContent searchParams={searchParams} />
      </Suspense>
    </AuthLayout>
  );
}

async function SignupPageContent({ searchParams }: SignupPageProps) {
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
      mode="signup"
      nextPath={getSafeReturnPath(nextPathValue, "/onboarding")}
      initialError={initialError}
    />
  );
}
