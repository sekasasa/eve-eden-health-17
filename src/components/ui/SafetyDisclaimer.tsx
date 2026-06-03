import { ShieldAlert } from "lucide-react";

export function SafetyDisclaimer({ short = false }: { short?: boolean }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-eve-muted/20 bg-eve-cream px-3 py-2 text-[11px] text-eve-muted">
      <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-eve-teal" />
      <p>
        {short
          ? "For education only — not medical advice. Please speak with a licensed clinician."
          : "This content is for education only and is not medical advice. Please speak with a licensed clinician for personal medical decisions."}
      </p>
    </div>
  );
}
