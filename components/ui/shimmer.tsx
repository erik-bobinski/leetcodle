import { cn } from "@/lib/utils";

interface ShimmerProps {
  className?: string;
  width?: string;
  height?: string;
}

export function Shimmer({
  className,
  width = "w-full",
  height = "h-4"
}: ShimmerProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded bg-gray-200 dark:bg-gray-700",
        width,
        height,
        className
      )}
    />
  );
}

interface ShimmerTextProps {
  lines?: number;
  className?: string;
}

export function ShimmerText({ lines = 3, className }: ShimmerTextProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Shimmer
          key={i}
          width={i === lines - 1 ? "w-3/4" : "w-full"}
          height="h-4"
        />
      ))}
    </div>
  );
}

interface ShimmerTitleProps {
  className?: string;
}

export function ShimmerTitle({ className }: ShimmerTitleProps) {
  return <Shimmer className={cn("mx-auto h-8 w-64", className)} />;
}
