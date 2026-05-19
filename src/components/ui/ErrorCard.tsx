import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ErrorCardProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
};

export function ErrorCard({
  title,
  message = "Something went wrong.",
  onRetry,
  retryLabel = "Try again",
  className,
}: ErrorCardProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex gap-3 rounded-xl border-l-[3px] border-eve-rose bg-eve-rose-light p-4 rtl:border-l-0 rtl:border-r-[3px]",
        className,
      )}
    >
      <AlertCircle className="mt-0.5 size-5 shrink-0 text-eve-rose" />
      <div className="flex-1">
        {title ? (
          <p className="text-sm font-semibold text-eve-rose">{title}</p>
        ) : null}
        <p className="text-sm text-eve-rose/90">{message}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 inline-flex h-9 items-center rounded-md border border-eve-rose/30 bg-white px-3 text-sm font-medium text-eve-rose transition-colors hover:bg-eve-rose hover:text-white"
          >
            {retryLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
