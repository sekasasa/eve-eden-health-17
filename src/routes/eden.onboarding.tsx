import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EdenShell } from "@/components/shells/EdenShell";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/eden/onboarding")({
  component: EdenOnboarding,
});

const SPECIALTIES = ["OB-GYN", "Fertility/IVF", "Midwife", "Doula", "Pediatrician", "Therapist", "Other"];
const LANG_OPTIONS = ["English", "French", "Arabic", "Darija", "Spanish"];

function EdenOnboarding() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [specialty, setSpecialty] = useState("OB-GYN");
  const [clinicName, setClinicName] = useState("");
  const [city, setCity] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [fee, setFee] = useState<string>("");
  const [bio, setBio] = useState("");
  const [accepting, setAccepting] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data.user;
      if (!u) return;
      setUserId(u.id);
      setFullName(
        (u.user_metadata?.full_name as string) || u.email?.split("@")[0] || "",
      );
      // Prefill from existing row if present
      const { data: p } = await supabase
        .from("providers")
        .select("full_name,specialty,clinic_name,city,languages,consultation_fee_mad,bio,accepting_patients")
        .eq("user_id", u.id)
        .maybeSingle();
      if (p) {
        setFullName(p.full_name ?? "");
        setSpecialty(p.specialty ?? "OB-GYN");
        setClinicName(p.clinic_name ?? "");
        setCity(p.city ?? "");
        setLanguages(p.languages ?? []);
        setFee(p.consultation_fee_mad?.toString() ?? "");
        setBio(p.bio ?? "");
        setAccepting(p.accepting_patients ?? true);
      }
    })();
  }, []);

  const toggleLang = (l: string) =>
    setLanguages((prev) =>
      prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l],
    );

  const canSubmit = !!userId && !!fullName.trim() && !!specialty && !!city.trim();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    try {
      const feeNum = fee.trim() ? Number(fee) : null;
      const { error: err } = await supabase
        .from("providers")
        .upsert(
          {
            user_id: userId!,
            full_name: fullName.trim(),
            specialty,
            clinic_name: clinicName.trim() || null,
            city: city.trim(),
            country: "MA",
            languages: languages.length ? languages : null,
            consultation_fee_mad: feeNum && !isNaN(feeNum) ? feeNum : null,
            bio: bio.trim() || null,
            accepting_patients: accepting,
          },
          { onConflict: "user_id" },
        );
      if (err) throw err;
      navigate({ to: "/eden/dashboard" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save profile");
      setSaving(false);
    }
  };

  return (
    <EdenShell>
      <div className="mx-auto max-w-2xl">
        <p className="font-sans text-[11px] uppercase tracking-wide text-eve-muted">Welcome</p>
        <h1 className="mt-2 font-serif text-3xl text-eve-teal-dark">Set up your provider profile</h1>
        <p className="mt-2 font-sans text-sm text-gray-600">
          A few details so mothers can find and trust you. You can edit anytime.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-5 rounded-xl border border-gray-200 bg-white p-6">
          <Field label="Full name *">
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </Field>

          <Field label="Specialty *">
            <div className="flex flex-wrap gap-2">
              {SPECIALTIES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSpecialty(s)}
                  className={cn(
                    "rounded-full border px-4 py-1.5 font-sans text-sm transition-colors",
                    specialty === s
                      ? "border-eve-teal bg-eve-teal text-white"
                      : "border-gray-300 bg-white text-gray-700",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Clinic name">
            <Input value={clinicName} onChange={(e) => setClinicName(e.target.value)} />
          </Field>

          <Field label="City *">
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Casablanca" required />
          </Field>

          <Field label="Languages spoken">
            <div className="flex flex-wrap gap-2">
              {LANG_OPTIONS.map((l) => {
                const active = languages.includes(l);
                return (
                  <button
                    key={l}
                    type="button"
                    onClick={() => toggleLang(l)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 font-sans text-sm transition-colors",
                      active
                        ? "border-eve-teal bg-eve-teal-light text-eve-teal-dark"
                        : "border-gray-300 bg-white text-gray-700",
                    )}
                  >
                    {l}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Consultation fee (MAD)">
            <Input
              type="number"
              inputMode="numeric"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              placeholder="Optional"
            />
          </Field>

          <Field label="Short bio">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              maxLength={500}
              className="w-full rounded-md border border-gray-300 bg-white p-3 font-sans text-sm focus:border-eve-teal focus:outline-none"
              placeholder="Tell mothers about your care approach…"
            />
          </Field>

          <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
            <div>
              <p className="font-sans text-sm font-medium text-gray-900">Accepting new patients</p>
              <p className="font-sans text-xs text-gray-500">Mothers will see this on your profile.</p>
            </div>
            <Switch checked={accepting} onCheckedChange={setAccepting} />
          </div>

          {error && <p className="font-sans text-sm text-eve-rose">{error}</p>}

          <div className="flex items-center gap-3 pt-2">
            <SecondaryButton type="button" onClick={() => navigate({ to: "/eden/dashboard" })}>
              Skip for now
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={!canSubmit || saving} className="flex-1">
              {saving ? "Saving…" : "Save & continue"}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </EdenShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block font-sans text-sm font-medium text-gray-800">
        {label}
      </label>
      {children}
    </div>
  );
}
