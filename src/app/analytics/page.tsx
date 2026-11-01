import { Suspense } from "react";
import { connection } from "next/server";
import { Skeleton } from "@/components/ui/skeleton";
import { AnalyticsView } from "@/components/analytics/AnalyticsView";

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<AnalyticsFallback />}>
      <AnalyticsContent />
    </Suspense>
  );
}

async function AnalyticsContent() {
  await connection();

  return <AnalyticsView />;
}

function AnalyticsFallback() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-20 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  );
}
