import { XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function FieldError({
  message,
  className,
}: {
  message?: string | null;
  className?: string;
}) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className={cn(
        "mt-1 flex items-center gap-1 text-[12px] text-eve-rose",
        className,
      )}
    >
      <XCircle className="size-3.5" />
      <span>{message}</span>
    </p>
  );
}

export function RequiredMark() {
  return <span className="ml-0.5 text-eve-muted/70" aria-hidden>*</span>;
}
