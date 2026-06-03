import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, UserPlus } from "lucide-react";
import { EveShell } from "@/components/shells/EveShell";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { eveToast } from "@/lib/eve-toast";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/eve/match/family")({
  component: FamilyInvite,
});

const PERMS = [
  { key: "appts", label: "View my appointments" },
  { key: "pay", label: "Help pay for services" },
  { key: "plan", label: "View selected care plan steps" },
  { key: "reminders", label: "Receive reminders for me" },
  { key: "coordinate", label: "Help coordinate vendor bookings" },
];

function FamilyInvite() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [perms, setPerms] = useState<string[]>(["appts"]);

  function toggle(k: string) {
    setPerms((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));
  }

  const valid = name.trim().length > 1 && /.+@.+\..+/.test(email);

  return (
    <EveShell>
      <div className="px-3">
        <button
          onClick={() => nav({ to: "/eve/match/results" })}
          className="mb-2 inline-flex items-center gap-1 text-xs text-eve-muted"
        >
          <ArrowLeft className="h-3 w-3" /> Back
        </button>
        <SectionLabel>Family support</SectionLabel>
        <h1 className="mt-1 font-serif text-eve-forest" style={{ fontSize: "22px" }}>
          Invite a family supporter
        </h1>
        <p className="mt-1 text-[12px] text-eve-muted">
          Spouse, mother, sister, or diaspora family — choose exactly what they can see
          or do. Labs and prescriptions stay private unless you approve.
        </p>
      </div>

      <section className="mt-4 px-3 flex flex-col gap-3">
        <div>
          <SectionLabel>Their name</SectionLabel>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Fatima B."
            className="mt-1 w-full rounded-xl border border-eve-muted/30 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div>
          <SectionLabel>Their email</SectionLabel>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="them@example.com"
            className="mt-1 w-full rounded-xl border border-eve-muted/30 bg-white px-3 py-2 text-sm"
          />
        </div>

        <div>
          <SectionLabel>What can they do?</SectionLabel>
          <div className="mt-2 flex flex-col gap-2">
            {PERMS.map((p) => (
              <label
                key={p.key}
                className={cn(
                  "flex items-center justify-between rounded-xl border px-3 py-2 text-sm",
                  perms.includes(p.key)
                    ? "border-eve-teal bg-eve-teal-light"
                    : "border-eve-muted/30 bg-white",
                )}
              >
                <span className="text-eve-teal-dark">{p.label}</span>
                <input
                  type="checkbox"
                  checked={perms.includes(p.key)}
                  onChange={() => toggle(p.key)}
                  className="h-4 w-4 accent-eve-teal"
                />
              </label>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-eve-muted">
            Labs and prescriptions are never shared unless you turn them on.
          </p>
        </div>

        <PrimaryButton
          disabled={!valid}
          onClick={() => {
            eveToast.success(`Invite sent to ${name}`);
            nav({ to: "/eve/match/results" });
          }}
          className="mt-2 inline-flex items-center justify-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Send invite
        </PrimaryButton>
      </section>
    </EveShell>
  );
}
