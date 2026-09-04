import { Skeleton } from "@/components/ui/skeleton";

// Loading placeholder for the content studio, shown until the first data load
// resolves. Purely presentational — no props.
export function ContentSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="p-6 sm:p-7 rounded-xl bg-white border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32 rounded-full" />
          <Skeleton className="h-7 w-64 rounded-xl" />
          <Skeleton className="h-4 w-96 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
      </div>

      {/* 6 Tabs Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>

      {/* Active Panel Skeleton */}
      <div className="p-6 sm:p-8 rounded-xl bg-white border border-zinc-200 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48 rounded-xl" />
            <Skeleton className="h-4 w-72 rounded-lg" />
          </div>
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}
