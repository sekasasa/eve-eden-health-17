import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { format, differenceInWeeks, addWeeks } from "date-fns";
import { CalendarIcon, Check, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { StageRing } from "@/components/ui/StageRing";
import { TrustBadge } from "@/components/ui/TrustBadge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { writeIntake } from "@/lib/match-store";
import type { LifeStage } from "@/lib/match-data";

export const Route = createFileRoute("/eve/onboarding")({
  component: () => (
    <ProtectedRoute requiredType="mother">
      <Onboarding />
    </ProtectedRoute>
  ),
});

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "ar", label: "العربية" },
];

const CITIES = [
  "Casablanca", "Rabat", "Marrakech", "Fès", "Tangier", "Agadir",
  "Meknès", "Oujda", "Kenitra", "Tétouan", "Salé", "El Jadida",
];

const DIETS = ["Halal", "Vegetarian", "No restriction", "Other"];
const RELIGIONS = [
  { value: "muslim", label: "Muslim" },
  { value: "christian", label: "Christian" },
  { value: "none", label: "Prefer not to say" },
];

// Stage list aligned with src/routes/eve.match.tsx so the two flows stay in sync.
const STAGES: { key: LifeStage; label: string; sub: string; emoji: string }[] = [
  { key: "ttc", label: "Trying to conceive", sub: "Fertility, cycle tracking, preconception", emoji: "🌱" },
  { key: "ivf", label: "IVF or fertility support", sub: "Clinics, labs, medication, support", emoji: "🧬" },
  { key: "pregnant", label: "Pregnant", sub: "Prenatal care, labs, providers", emoji: "🤰" },
  { key: "postpartum", label: "Postpartum", sub: "Recovery, feeding, mood, follow-up", emoji: "🍼" },
  { key: "newborn", label: "Newborn care", sub: "Pediatric care, feeding, milestones", emoji: "👶" },
  { key: "pcos", label: "PCOS / hormonal health", sub: "Labs, symptoms, cycle support", emoji: "🌸" },
  { key: "labs", label: "Labs or prescriptions", sub: "Results, medication questions", emoji: "🧪" },
  { key: "insurance", label: "Insurance or payment help", sub: "Coverage, self-pay options", emoji: "🛡️" },
  { key: "mood", label: "Emotional support", sub: "Mental health, stress, mood", emoji: "💛" },
  { key: "family", label: "Helping a family member", sub: "Coordinate care or help pay", emoji: "🤝" },
];

interface Provider {
  id: string;
  full_name: string | null;
  specialty: string | null;
  clinic_name: string | null;
}

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");

  // Step 0: stage
  const [stage, setStage] = useState<LifeStage | null>(null);
  // Step 1
  const [language, setLanguage] = useState("en");
  // Step 2 (pregnancy-only fields are optional for other stages)
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [isFirst, setIsFirst] = useState<boolean | null>(null);
  const [city, setCity] = useState("");
  // Step 3
  const [diets, setDiets] = useState<string[]>([]);
  const [religion, setReligion] = useState<string>("");
  const [whatsapp, setWhatsapp] = useState(true);
  // Step 4
  const [providerQuery, setProviderQuery] = useState("");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isPregnant = stage === "pregnant";

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (!u) return;
      setUserId(u.id);
      setFullName(
        (u.user_metadata?.full_name as string) ||
          u.email?.split("@")[0] ||
          "",
      );
    });
  }, []);

  const week = useMemo(() => {
    if (!dueDate) return 0;
    const conception = addWeeks(dueDate, -40);
    const w = differenceInWeeks(new Date(), conception);
    return Math.max(1, Math.min(40, w));
  }, [dueDate]);

  // Fetch providers when on step 4
  useEffect(() => {
    if (step !== 4) return;
    let q = supabase
      .from("providers")
      .select("id, full_name, specialty, clinic_name")
      .eq("is_verified", true)
      .limit(3);
    if (providerQuery.trim()) {
      q = q.or(
        `full_name.ilike.%${providerQuery}%,clinic_name.ilike.%${providerQuery}%`,
      );
    }
    q.then(({ data }) => setProviders((data as Provider[]) ?? []));
  }, [step, providerQuery]);

  const filteredCities = city
    ? CITIES.filter((c) => c.toLowerCase().includes(city.toLowerCase())).slice(0, 5)
    : [];

  async function saveLanguage() {
    if (!userId) return;
    await supabase
      .from("profiles")
      .update({
        language,
        language_chosen_at: new Date().toISOString(),
      })
      .eq("id", userId);
    setStep(2);
  }

  async function finish() {
    if (!userId) return;
    setSaving(true);
    // Ensure language + language_chosen_at are persisted regardless of path
    await supabase
      .from("profiles")
      .update({
        language,
        language_chosen_at: new Date().toISOString(),
      })
      .eq("id", userId);

    await supabase.from("mothers").insert({
      user_id: userId,
      full_name: fullName || null,
      due_date: isPregnant && dueDate ? format(dueDate, "yyyy-MM-dd") : null,
      pregnancy_week: isPregnant && dueDate ? week : null,
      is_first_pregnancy: isPregnant ? isFirst : null,
      city: city || null,
      religious_pref: religion || null,
      dietary_notes: diets.join(", ") || null,
      preferred_provider_id: providerId,
      whatsapp_opt_in: whatsapp,
      language,
      stage: stage ?? null,
    });

    // Pre-fill Match intake from onboarding so home doesn't immediately push
    // the user into another multi-step flow.
    writeIntake({
      stage: stage ?? undefined,
      city: city || undefined,
      language: language === "fr" ? "French" : language === "ar" ? "Arabic" : "English",
      languages: [language === "fr" ? "French" : language === "ar" ? "Arabic" : "English"],
    });

    setSaving(false);
    navigate({ to: "/eve/home" });
  }

  const canContinue: Record<number, boolean> = {
    0: !!stage,
    1: !!language,
    // Step 2 only requires due date / first-pregnancy when user is pregnant; city is required across all stages.
    2: isPregnant ? !!dueDate && isFirst !== null && !!city : !!city,
    3: true, // diet + religion are optional
    4: true,
    5: true,
  };

  // Build dynamic step list. Step 0 = stage. Step 1 = language. Step 2 = stage details. Step 3 = preferences. Step 4 = provider (only for pregnant/ttc/ivf/postpartum/newborn). Step 5 = done.
  const totalDots = 5;

  return (
    <div className="min-h-dvh bg-eve-sand">
      <div className="mx-auto flex min-h-dvh max-w-sm flex-col px-5 pb-8 pt-8">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={cn(
                "h-2 rounded-full transition-all",
                i === step ? "w-8 bg-eve-teal" : "w-2",
                i < step ? "bg-eve-teal" : i > step ? "bg-eve-muted/30" : "",
              )}
            />
          ))}
        </div>

        <div className="mt-10 flex-1">
          {step === 0 && (
            <div>
              <h1 className="font-serif text-3xl text-eve-teal-dark">
                Where are you in your journey?
              </h1>
              <p className="mt-2 font-sans text-sm text-eve-muted">
                Pick what fits best today. You can update this anytime.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-2">
                {STAGES.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setStage(s.key)}
                    className={cn(
                      "rounded-2xl border p-3 text-left transition-all",
                      stage === s.key
                        ? "border-eve-teal bg-eve-teal-light"
                        : "border-eve-muted/30 bg-white",
                    )}
                  >
                    <span className="text-lg">{s.emoji}</span>
                    <p className="mt-1 font-sans text-sm font-medium text-eve-teal-dark">
                      {s.label}
                    </p>
                    <p className="mt-0.5 font-sans text-[11px] text-eve-muted">
                      {s.sub}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h1 className="font-serif text-4xl text-eve-teal">Welcome to Eve</h1>
              <p className="mt-3 font-sans text-base text-eve-muted">
                Your care companion, in the language you think in.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-3">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setLanguage(l.code)}
                    className={cn(
                      "rounded-full border px-5 py-4 font-sans text-base transition-all",
                      language === l.code
                        ? "border-eve-teal bg-eve-teal text-white"
                        : "border-eve-muted/30 bg-white text-eve-teal-dark",
                    )}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h1 className="font-serif text-3xl text-eve-teal-dark">
                {isPregnant
                  ? "Tell us about your pregnancy"
                  : "A few details about you"}
              </h1>

              {isPregnant && (
                <>
                  <div>
                    <label className="font-sans text-sm font-medium text-eve-teal-dark">
                      Due date
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          className={cn(
                            "mt-2 flex w-full items-center justify-between rounded-2xl border border-eve-muted/30 bg-white px-4 py-3 font-sans text-left text-sm",
                            !dueDate && "text-eve-muted",
                          )}
                        >
                          {dueDate ? format(dueDate, "PPP") : "Pick your due date"}
                          <CalendarIcon className="h-4 w-4 text-eve-muted" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dueDate}
                          onSelect={setDueDate}
                          captionLayout="dropdown"
                          disabled={(d) => d < new Date()}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    {dueDate && (
                      <p className="mt-2 font-sans text-sm text-eve-teal">
                        You are {week} weeks along
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="font-sans text-sm font-medium text-eve-teal-dark">
                      Is this your first pregnancy?
                    </label>
                    <div className="mt-2 flex gap-3">
                      {[
                        { v: true, l: "Yes" },
                        { v: false, l: "No" },
                      ].map((o) => (
                        <button
                          key={o.l}
                          onClick={() => setIsFirst(o.v)}
                          className={cn(
                            "flex-1 rounded-full border px-5 py-3 font-sans text-sm transition-all",
                            isFirst === o.v
                              ? "border-eve-teal bg-eve-teal text-white"
                              : "border-eve-muted/30 bg-white text-eve-teal-dark",
                          )}
                        >
                          {o.l}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="font-sans text-sm font-medium text-eve-teal-dark">
                  City
                </label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Casablanca, Rabat..."
                  maxLength={100}
                  className="mt-2 rounded-2xl border-eve-muted/30 bg-white py-6"
                />
                {filteredCities.length > 0 && !CITIES.includes(city) && (
                  <div className="mt-1 overflow-hidden rounded-xl border border-eve-muted/20 bg-white">
                    {filteredCities.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCity(c)}
                        className="block w-full px-4 py-2 text-left font-sans text-sm text-eve-teal-dark hover:bg-eve-cream"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <p className="font-sans text-xs text-eve-teal">
                Eve is free for you. Always.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h1 className="font-serif text-3xl text-eve-teal-dark">
                Help Eve understand you better
              </h1>
              <p className="font-sans text-xs text-eve-muted">
                Optional — this helps us match culturally familiar care when relevant.
              </p>

              <div>
                <label className="font-sans text-sm font-medium text-eve-teal-dark">
                  Dietary preference <span className="font-normal text-eve-muted">(optional)</span>
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {DIETS.map((d) => {
                    const active = diets.includes(d);
                    return (
                      <button
                        key={d}
                        onClick={() =>
                          setDiets((prev) =>
                            active ? prev.filter((x) => x !== d) : [...prev, d],
                          )
                        }
                        className={cn(
                          "rounded-full border px-4 py-2 font-sans text-sm transition-all",
                          active
                            ? "border-eve-teal bg-eve-teal text-white"
                            : "border-eve-muted/30 bg-white text-eve-teal-dark",
                        )}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="font-sans text-sm font-medium text-eve-teal-dark">
                  Cultural context <span className="font-normal text-eve-muted">(optional)</span>
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {RELIGIONS.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setReligion(religion === r.value ? "" : r.value)}
                      className={cn(
                        "rounded-full border px-4 py-2 font-sans text-sm transition-all",
                        religion === r.value
                          ? "border-eve-teal bg-eve-teal text-white"
                          : "border-eve-muted/30 bg-white text-eve-teal-dark",
                      )}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-eve-muted/20 bg-white p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-sans text-sm font-medium text-eve-teal-dark">
                      WhatsApp reminders
                    </p>
                    <p className="mt-1 font-sans text-xs text-eve-muted">
                      We will send care reminders to your WhatsApp. You can stop
                      anytime.
                    </p>
                  </div>
                  <Switch checked={whatsapp} onCheckedChange={setWhatsapp} />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <h1 className="font-serif text-3xl text-eve-teal-dark">
                {isPregnant
                  ? "Do you already have an OB-GYN?"
                  : "Do you already have a provider?"}
              </h1>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-eve-muted" />
                <Input
                  value={providerQuery}
                  onChange={(e) => setProviderQuery(e.target.value)}
                  placeholder="Search by name or clinic"
                  maxLength={100}
                  className="rounded-2xl border-eve-muted/30 bg-white py-6 pl-11"
                />
              </div>

              <div className="space-y-3">
                {providers.length === 0 && (
                  <p className="font-sans text-sm text-eve-muted">
                    We don't have a verified match here yet — you can skip and let Eve help you find one later.
                  </p>
                )}
                {providers.map((p) => {
                  const selected = providerId === p.id;
                  return (
                    <div
                      key={p.id}
                      className={cn(
                        "rounded-2xl border bg-white p-4",
                        selected ? "border-eve-teal" : "border-eve-muted/20",
                      )}
                    >
                      <p className="font-serif text-lg text-eve-teal-dark">
                        {p.full_name ?? "Provider"}
                      </p>
                      <p className="font-sans text-xs text-eve-muted">
                        {p.specialty ?? "OB-GYN"}
                        {p.clinic_name ? ` · ${p.clinic_name}` : ""}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <TrustBadge />
                        <button
                          onClick={() =>
                            setProviderId(selected ? null : p.id)
                          }
                          className={cn(
                            "rounded-full px-4 py-1.5 font-sans text-xs font-medium",
                            selected
                              ? "bg-eve-teal text-white"
                              : "border border-eve-teal text-eve-teal",
                          )}
                        >
                          {selected ? (
                            <span className="inline-flex items-center gap-1">
                              <Check className="h-3 w-3" /> Selected
                            </span>
                          ) : (
                            "Select"
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => {
                  setProviderId(null);
                  void finish();
                }}
                className="block w-full pt-2 text-center font-sans text-sm text-eve-muted underline"
              >
                Skip for now
              </button>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="pt-8">
          <div className="flex items-center gap-3">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="rounded-full px-5 py-3 font-sans text-sm text-eve-muted"
              >
                Back
              </button>
            )}
            <PrimaryButton
              disabled={!canContinue[step] || saving}
              className="flex-1"
              onClick={() => {
                if (step === 1) void saveLanguage();
                else if (step === 4) void finish();
                else setStep(step + 1);
              }}
            >
              {step === 4 ? (saving ? "Saving…" : "Finish") : "Continue"}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}
