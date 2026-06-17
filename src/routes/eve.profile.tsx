import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Pencil } from "lucide-react";
import { EveShell } from "@/components/shells/EveShell";
import { NavigatorHelp } from "@/components/ui/NavigatorHelp";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/eve/profile")({
  component: EveProfile,
});

type Mother = {
  id: string;
  full_name: string | null;
  city: string | null;
  pregnancy_week: number | null;
  due_date: string | null;
  language: string | null;
  religious_pref: string | null;
  dietary_notes: string | null;
  whatsapp_opt_in: boolean | null;
};

const LANGS = [
  { code: "en", label: "English", comingSoon: false },
  { code: "fr", label: "Français", comingSoon: false },
  { code: "ar", label: "العربية", comingSoon: false },
  { code: "darija", label: "Darija — coming soon", comingSoon: true },
] as const;

function initials(n?: string | null) {
  if (!n) return "·";
  return n.split(" ").filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");
}

function EveProfile() {
  const navigate = useNavigate();
  const [m, setM] = useState<Mother | null>(null);
  const [loading, setLoading] = useState(true);
  const [apptReminders, setApptReminders] = useState(true);
  const [weeklyGuidance, setWeeklyGuidance] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data } = await supabase
        .from("mothers")
        .select(
          "id,full_name,city,pregnancy_week,due_date,language,religious_pref,dietary_notes,whatsapp_opt_in",
        )
        .eq("user_id", auth.user.id)
        .maybeSingle();
      setM(data as Mother | null);
      setLoading(false);
    })();
  }, []);

  async function update<K extends keyof Mother>(key: K, value: Mother[K]) {
    if (!m) return;
    setM({ ...m, [key]: value });
    await supabase.from("mothers").update({ [key]: value } as never).eq("id", m.id);
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  return (
    <EveShell>
      {/* Header */}
      <div className="mt-2 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-eve-teal font-serif text-2xl text-white">
          {initials(m?.full_name)}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-serif text-2xl text-eve-teal-dark truncate">
            {m?.full_name ?? (loading ? "…" : "Mother")}
          </h1>
          <p className="font-sans text-xs text-eve-muted">{m?.city ?? ""}</p>
          <span className="mt-1 inline-flex rounded-full bg-eve-cream px-2 py-0.5 font-sans text-[10px] uppercase tracking-wide text-eve-teal">
            Week {m?.pregnancy_week ?? "—"}
          </span>
        </div>
        <button
          aria-label="Edit"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-eve-teal"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={() => navigate({ to: "/eve/match" })}
        className="mt-6 flex w-full items-center justify-between rounded-2xl border border-eve-teal/20 bg-white px-4 py-3 text-left"
      >
        <div>
          <p className="font-sans text-sm font-medium text-eve-teal-dark">
            Update my care profile
          </p>
          <p className="font-sans text-[11px] text-eve-muted">
            Refresh life stage, language, location, and care preferences
          </p>
        </div>
        <Pencil className="h-4 w-4 text-eve-teal" />
      </button>

      <Accordion type="multiple" className="mt-4 space-y-2">
        <Section value="pregnancy" title="My pregnancy">
          <Row label="Due date" value={m?.due_date ?? "—"} />
          <Row label="Current week" value={m?.pregnancy_week ? `Week ${m.pregnancy_week}` : "—"} />
          <Row label="Preferred provider" value="—" />
          <Row label="Hospital plan" value="—" />
        </Section>

        <Section value="lang" title="Language and region">
          <div className="grid grid-cols-2 gap-2">
            {LANGS.map((l) => (
              <button
                key={l.code}
                disabled={l.comingSoon}
                onClick={() => !l.comingSoon && update("language", l.code)}
                className={cn(
                  "rounded-full border px-3 py-2 font-sans text-sm transition",
                  l.comingSoon
                    ? "cursor-not-allowed border-eve-muted/20 bg-eve-cream/50 text-eve-muted"
                    : m?.language === l.code
                      ? "border-eve-teal bg-eve-teal text-white"
                      : "border-eve-muted/30 bg-white text-eve-teal-dark",
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
        </Section>

        <Section value="diet" title="Dietary and cultural preferences">
          <Row label="Religious preference" value={m?.religious_pref ?? "—"} />
          <Row label="Dietary notes" value={m?.dietary_notes ?? "—"} />
        </Section>

        <Section value="notif" title="Notifications">
          <Toggle
            label="WhatsApp messages"
            checked={!!m?.whatsapp_opt_in}
            onChange={(v) => update("whatsapp_opt_in", v)}
          />
          <Toggle
            label="Appointment reminders"
            checked={apptReminders}
            onChange={setApptReminders}
          />
          <Toggle
            label="Weekly guidance"
            checked={weeklyGuidance}
            onChange={setWeeklyGuidance}
          />
        </Section>

        <Section value="privacy" title="Privacy">
          <button className="block font-sans text-sm text-eve-teal">
            What data does Eve store?
          </button>
          <button className="mt-3 block font-sans text-sm text-red-600">
            Delete my account
          </button>
        </Section>
      </Accordion>

      <div className="mt-10 flex flex-col items-center gap-2 pb-4">
        <button
          onClick={signOut}
          className="font-sans text-sm text-eve-teal underline-offset-2 hover:underline"
        >
          Sign out
        </button>
        <span className="font-sans text-[10px] text-eve-muted">v0.1.0</span>
      </div>

      <div className="mt-6">
        <NavigatorHelp />
      </div>
    </EveShell>
  );
}

function Section({
  value,
  title,
  children,
}: {
  value: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AccordionItem
      value={value}
      className="overflow-hidden rounded-2xl border-none bg-white"
    >
      <AccordionTrigger className="px-4 py-3 font-sans text-sm font-medium text-eve-teal-dark hover:no-underline">
        {title}
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">{children}</AccordionContent>
    </AccordionItem>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-eve-muted/10 py-2 last:border-0">
      <span className="font-sans text-xs text-eve-muted">{label}</span>
      <span className="font-sans text-sm text-eve-teal-dark">{value}</span>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="font-sans text-sm text-eve-teal-dark">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
