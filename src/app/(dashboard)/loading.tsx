import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 shimmer" />
          <Skeleton className="h-4 w-64 shimmer" />
        </div>
        <Skeleton className="h-8 w-32 shimmer" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-24 rounded-lg shimmer" />
        <Skeleton className="h-24 rounded-lg shimmer" />
        <Skeleton className="h-24 rounded-lg shimmer" />
      </div>
      <Skeleton className="h-64 rounded-lg shimmer" />
    </div>
  );
}
