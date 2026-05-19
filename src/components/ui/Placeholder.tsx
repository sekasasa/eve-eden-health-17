import { ReactNode } from "react";
import { SectionLabel } from "@/components/ui/SectionLabel";

interface Props {
  label: string;
  title: string;
  body?: ReactNode;
}

/** Mobile Eve-style placeholder body (used inside EveShell / CHWShell) */
export function PlaceholderBody({ label, title, body }: Props) {
  return (
    <div className="pt-6">
      <SectionLabel>{label}</SectionLabel>
      <h1 className="mt-2 font-serif text-3xl text-eve-teal-dark">{title}</h1>
      <p className="mt-3 font-sans text-sm text-eve-muted">
        {body ?? "Coming soon."}
      </p>
    </div>
  );
}

/** Desktop SaaS-style placeholder body (used inside EdenShell / AdminShell / ProgramShell) */
export function DesktopPlaceholder({ label, title, body }: Props) {
  return (
    <div>
      <p className="font-sans text-[11px] uppercase tracking-wide text-eve-muted">
        {label}
      </p>
      <h1 className="mt-2 font-serif text-3xl text-eve-teal-dark">{title}</h1>
      <p className="mt-3 max-w-xl font-sans text-sm text-eve-muted">
        {body ?? "Coming soon."}
      </p>
    </div>
  );
}
