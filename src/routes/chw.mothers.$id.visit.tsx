import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CHWShell } from "@/components/shells/CHWShell";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { supabase } from "@/integrations/supabase/client";
import { enqueue } from "@/lib/offline-sync";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/chw/mothers/$id/visit")({
  component: ChwMothersIdVisit,
});

type Mother = {
  id: string;
  mother_name: string;
  village: string | null;
  due_date: string | null;
  risk_level: string | null;
};

const SERVICES = [
  { key: "iron_folate", label: "Iron / folate" },
  { key: "malaria_net", label: "Malaria net" },
  { key: "referred", label: "Referred" },
  { key: "health_ed", label: "Health education" },
  { key: "nutrition", label: "Nutrition counselling" },
] as const;

const FEELINGS = ["😢", "😟", "😐", "🙂", "😄"];

function pregWeek(due: string | null) {
  if (!due) return null;
  const w = 40 - Math.round((new Date(due).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 7));
  return Math.max(0, Math.min(45, w));
}

const inp = "w-full rounded-md border border-gray-200 px-3 py-2 font-sans text-sm";

function ChwMothersIdVisit() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [mother, setMother] = useState<Mother | null>(null);

  const [visitDate, setVisitDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [visitType, setVisitType] = useState("home");
  const [duration, setDuration] = useState<number | "">("");
  const [bp, setBp] = useState("");
  const [weight, setWeight] = useState<number | "">("");
  const [fundal, setFundal] = useState<number | "">("");
  const [heartbeat, setHeartbeat] = useState("");
  const [oedema, setOedema] = useState("none");
  const [feeling, setFeeling] = useState<number | null>(null);
  const [concerns, setConcerns] = useState("");
  const [meds, setMeds] = useState("");
  const [services, setServices] = useState<Record<string, boolean>>({});
  const [nextVisit, setNextVisit] = useState("");
  const [actionNotes, setActionNotes] = useState("");
  const [referred, setReferred] = useState(false);
  const [refDest, setRefDest] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("chw_mothers")
        .select("id,mother_name,village,due_date,risk_level")
        .eq("id", id)
        .maybeSingle();
      setMother(data);
    })();
  }, [id]);

  async function save() {
    setSaving(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setSaving(false);
      return;
    }
    const payload = {
      chw_id: auth.user.id,
      mother_id: id,
      visit_date: visitDate,
      visit_type: visitType,
      duration_minutes: duration === "" ? null : duration,
      blood_pressure: bp || null,
      weight_kg: weight === "" ? null : weight,
      fundal_height_cm: fundal === "" ? null : fundal,
      fetal_heartbeat: heartbeat || null,
      oedema,
      feeling_scale: feeling,
      concerns: concerns || null,
      medications: meds || null,
      services,
      next_visit_date: nextVisit || null,
      action_notes: actionNotes || null,
      referred,
      referral_destination: referred ? refDest || null : null,
    };

    const motherPatch = { last_visit_date: visitDate };

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      enqueue({
        table: "visits",
        payload,
        follow_up: { table: "chw_mothers", id_field: "id", patch: motherPatch },
      });
      navigate({ to: "/chw/mothers" });
      return;
    }

    const { error } = await supabase.from("visits").insert(payload);
    if (!error) {
      // increment total_visits
      const { data: cur } = await supabase
        .from("chw_mothers")
        .select("total_visits")
        .eq("id", id)
        .maybeSingle();
      await supabase
        .from("chw_mothers")
        .update({
          last_visit_date: visitDate,
          total_visits: (cur?.total_visits ?? 0) + 1,
        })
        .eq("id", id);
      navigate({ to: "/chw/mothers" });
    }
    setSaving(false);
  }

  const week = pregWeek(mother?.due_date ?? null);

  return (
    <CHWShell>
      {mother && (
        <div className="rounded-xl border border-gray-100 bg-eve-cream/40 p-3">
          <p className="font-sans text-xs uppercase tracking-widest text-eve-muted">
            Visit for
          </p>
          <p className="mt-1 font-serif text-lg text-eve-forest">{mother.mother_name}</p>
          <p className="font-sans text-xs text-eve-muted">
            {mother.village ?? "—"}
            {week !== null && ` · Week ${week}`}
            {mother.risk_level && mother.risk_level !== "low" && (
              <span
                className={cn(
                  "ml-2 rounded-full px-2 py-0.5 capitalize",
                  mother.risk_level === "high"
                    ? "bg-red-100 text-red-700"
                    : "bg-amber-100 text-amber-800",
                )}
              >
                {mother.risk_level}
              </span>
            )}
          </p>
        </div>
      )}

      <Section title="Visit basics">
        <Field label="Date">
          <input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} className={inp} />
        </Field>
        <Field label="Type">
          <select value={visitType} onChange={(e) => setVisitType(e.target.value)} className={inp}>
            <option value="home">Home</option>
            <option value="clinic">Clinic</option>
            <option value="phone">Phone</option>
          </select>
        </Field>
        <Field label="Duration (minutes)">
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value === "" ? "" : Number(e.target.value))}
            className={inp}
          />
        </Field>
      </Section>

      <Section title="Clinical observations">
        <Field label="Blood pressure (e.g. 120/80)">
          <input value={bp} onChange={(e) => setBp(e.target.value)} className={inp} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Weight (kg)">
            <input
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value === "" ? "" : Number(e.target.value))}
              className={inp}
            />
          </Field>
          <Field label="Fundal height (cm)">
            <input
              type="number"
              step="0.1"
              value={fundal}
              onChange={(e) => setFundal(e.target.value === "" ? "" : Number(e.target.value))}
              className={inp}
            />
          </Field>
        </div>
        <Field label="Fetal heartbeat">
          <input
            placeholder="e.g. 140 bpm"
            value={heartbeat}
            onChange={(e) => setHeartbeat(e.target.value)}
            className={inp}
          />
        </Field>
        <Field label="Oedema">
          <select value={oedema} onChange={(e) => setOedema(e.target.value)} className={inp}>
            <option value="none">None</option>
            <option value="mild">Mild</option>
            <option value="moderate">Moderate</option>
            <option value="severe">Severe</option>
          </select>
        </Field>
      </Section>

      <Section title="Mother self-report">
        <div>
          <p className="mb-2 font-sans text-[10px] uppercase tracking-widest text-eve-muted">
            Feeling
          </p>
          <div className="flex justify-between">
            {FEELINGS.map((emoji, i) => (
              <button
                key={i}
                onClick={() => setFeeling(i + 1)}
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full text-2xl",
                  feeling === i + 1 ? "bg-eve-teal-light ring-2 ring-eve-teal" : "bg-gray-50",
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
        <Field label="Concerns">
          <textarea value={concerns} onChange={(e) => setConcerns(e.target.value)} rows={3} className={inp} />
        </Field>
        <Field label="Medications">
          <textarea value={meds} onChange={(e) => setMeds(e.target.value)} rows={2} className={inp} />
        </Field>
      </Section>

      <Section title="Services delivered">
        <div className="space-y-2">
          {SERVICES.map((s) => (
            <label
              key={s.key}
              className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2"
            >
              <span className="font-sans text-sm text-gray-900">{s.label}</span>
              <input
                type="checkbox"
                checked={!!services[s.key]}
                onChange={(e) => setServices((p) => ({ ...p, [s.key]: e.target.checked }))}
                className="h-4 w-4 accent-eve-teal"
              />
            </label>
          ))}
        </div>
      </Section>

      <Section title="Next steps">
        <Field label="Next visit date">
          <input type="date" value={nextVisit} onChange={(e) => setNextVisit(e.target.value)} className={inp} />
        </Field>
        <Field label="Action notes">
          <textarea value={actionNotes} onChange={(e) => setActionNotes(e.target.value)} rows={3} className={inp} />
        </Field>
        <label className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2">
          <span className="font-sans text-sm">Referral needed</span>
          <input
            type="checkbox"
            checked={referred}
            onChange={(e) => setReferred(e.target.checked)}
            className="h-4 w-4 accent-eve-teal"
          />
        </label>
        {referred && (
          <Field label="Referral destination">
            <input
              placeholder="Clinic / hospital name"
              value={refDest}
              onChange={(e) => setRefDest(e.target.value)}
              className={inp}
            />
          </Field>
        )}
      </Section>

      <div className="mt-6">
        <PrimaryButton className="w-full" disabled={saving} onClick={save}>
          {saving ? "Saving…" : "Save visit"}
        </PrimaryButton>
      </div>
    </CHWShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="font-serif text-base text-eve-forest">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block font-sans text-[10px] uppercase tracking-widest text-eve-muted">
        {label}
      </label>
      {children}
    </div>
  );
}
