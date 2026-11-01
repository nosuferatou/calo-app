import { Suspense } from "react";
import { connection } from "next/server";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardView } from "@/components/dashboard/DashboardView";

export default async function DashboardPage() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  await connection();

  return <DashboardView />;
}

function DashboardFallback() {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-3 h-4 w-64" />
        <Skeleton className="mt-3 h-4 w-56" />
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <Skeleton className="h-8 w-40" />
      </div>
    </div>
  );
}
