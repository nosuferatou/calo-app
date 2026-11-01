import { Suspense } from "react";
import { connection } from "next/server";
import { Skeleton } from "@/components/ui/skeleton";
import { DiaryView } from "@/components/diary/DiaryView";

export default function DiaryPage() {
  return (
    <Suspense fallback={<DiaryFallback />}>
      <DiaryContent />
    </Suspense>
  );
}

async function DiaryContent() {
  await connection();

  return <DiaryView />;
}

function DiaryFallback() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  );
}
