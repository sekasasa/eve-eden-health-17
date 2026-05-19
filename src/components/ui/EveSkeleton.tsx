import { cn } from "@/lib/utils";

type EveSkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  rounded?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
};

const radiusMap = {
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  full: "rounded-full",
} as const;

export function EveSkeleton({
  className,
  rounded = "lg",
  ...props
}: EveSkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-eve-muted/20",
        radiusMap[rounded],
        className,
      )}
      {...props}
    />
  );
}

// Pre-composed skeletons for common Eve surfaces.

export function StageCardSkeleton() {
  return (
    <EveSkeleton rounded="2xl" className="h-48 w-full" />
  );
}

export function AICardSkeleton() {
  return <EveSkeleton rounded="2xl" className="h-28 w-full" />;
}

export function GuidanceCardSkeleton() {
  return <EveSkeleton rounded="xl" className="h-32 w-full" />;
}

export function QuickActionsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <EveSkeleton key={i} rounded="xl" className="h-24 w-full" />
      ))}
    </div>
  );
}

export function ProviderListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <EveSkeleton key={i} rounded="xl" className="h-28 w-full" />
      ))}
    </div>
  );
}

export function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <EveSkeleton key={i} rounded="xl" className="h-40 w-full" />
      ))}
    </div>
  );
}

export function PatientTableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <EveSkeleton key={i} rounded="md" className="h-12 w-full" />
      ))}
    </div>
  );
}

export function ChartSkeleton({ className }: { className?: string }) {
  return <EveSkeleton rounded="lg" className={cn("h-64 w-full", className)} />;
}
