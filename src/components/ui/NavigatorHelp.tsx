import { Link } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Persistent human-support fallback CTA shown across the mother app.
 * Routes to /eve/ask (care navigator). Not for emergencies — urgent symptoms
 * are routed via the UrgencyCard flow in Ask Eve.
 */
export function NavigatorHelp({
  className,
  label = "Need help? Ask a navigator",
  sub = "A real person can help you find care, book an appointment, or sort out payment or paperwork.",
  variant = "card",
}: {
  className?: string;
  label?: string;
  sub?: string;
  variant?: "card" | "inline";
}) {
  if (variant === "inline") {
    return (
      <Link
        to="/eve/ask"
        className={cn(
          "inline-flex items-center gap-2 rounded-full bg-eve-cream px-4 py-2 font-sans text-sm text-eve-forest transition-colors hover:bg-eve-cream/70",
          className,
        )}
      >
        <MessageCircle className="h-4 w-4 text-eve-teal" />
        {label}
      </Link>
    );
  }

  return (
    <Link
      to="/eve/ask"
      className={cn(
        "flex items-start gap-3 rounded-2xl border border-eve-teal/15 bg-eve-cream/60 p-4 transition-colors hover:bg-eve-cream",
        className,
      )}
    >
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white">
        <MessageCircle className="h-4 w-4 text-eve-teal" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-serif text-base text-eve-forest">{label}</span>
        <span className="mt-0.5 block font-sans text-xs leading-snug text-eve-muted">
          {sub}
        </span>
      </span>
    </Link>
  );
}
