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

export const Route = createFileRoute("/eve/onboarding")({
  component: () => (
    <ProtectedRoute requiredType="mother">
      <Onboarding />
    </ProtectedRoute>
  ),
});

const LANGUAGES = [
  { code: "fr", label: "Français" },
  { code: "ar", label: "العربية" },
  { code: "en", label: "English" },
  { code: "zgh", label: "Tamazight" },
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

interface Provider {
  id: string;
  full_name: string | null;
  specialty: string | null;
  clinic_name: string | null;
}

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");

  // Step 1
  const [language, setLanguage] = useState("fr");
  // Step 2
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
    await supabase.from("profiles").update({ language }).eq("id", userId);
    setStep(2);
  }

  async function finish() {
    if (!userId || !dueDate) return;
    setSaving(true);
    await supabase.from("mothers").insert({
      user_id: userId,
      full_name: fullName || null,
      due_date: format(dueDate, "yyyy-MM-dd"),
      pregnancy_week: week,
      is_first_pregnancy: isFirst,
      city: city || null,
      religious_pref: religion || null,
      dietary_notes: diets.join(", ") || null,
      preferred_provider_id: providerId,
      whatsapp_opt_in: whatsapp,
      language,
    });
    setSaving(false);
    navigate({ to: "/eve/home" });
  }

  const canContinue: Record<number, boolean> = {
    1: !!language,
    2: !!dueDate && isFirst !== null && !!city,
    3: diets.length > 0 && !!religion,
    4: true,
    5: true,
  };

  return (
    <div className="min-h-screen bg-eve-sand">
      <div className="mx-auto flex min-h-screen max-w-sm flex-col px-5 pb-8 pt-8">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
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
          {step === 1 && (
            <div>
              <h1 className="font-serif text-4xl text-eve-teal">Welcome to Eve</h1>
              <p className="mt-3 font-sans text-base text-eve-muted">
                Your pregnancy companion, in the language you think in.
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
                Tell us about your pregnancy
              </h1>

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

              <div>
                <label className="font-sans text-sm font-medium text-eve-teal-dark">
                  Dietary preference
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
                  Cultural context
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {RELIGIONS.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setReligion(r.value)}
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
                Do you already have an OB-GYN?
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
                    No verified providers found.
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
                  setStep(5);
                }}
                className="block w-full pt-2 text-center font-sans text-sm text-eve-muted underline"
              >
                Skip for now
              </button>
            </div>
          )}

          {step === 5 && (
            <div className="flex flex-col items-center pt-6 text-center">
              <h1
                className="font-serif text-eve-forest"
                style={{ fontSize: 26 }}
              >
                You are ready{fullName ? `, ${fullName.split(" ")[0]}` : ""}
              </h1>
              <p className="mt-3 font-sans text-sm text-eve-muted">
                Eve will guide you through every week of your pregnancy.
              </p>
              <div className="mt-10">
                <StageRing week={week || 1} size={180} />
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="pt-8">
          {step < 5 ? (
            <div className="flex items-center gap-3">
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="rounded-full px-5 py-3 font-sans text-sm text-eve-muted"
                >
                  Back
                </button>
              )}
              <PrimaryButton
                disabled={!canContinue[step]}
                className="flex-1"
                onClick={() => {
                  if (step === 1) void saveLanguage();
                  else setStep(step + 1);
                }}
              >
                Continue
              </PrimaryButton>
            </div>
          ) : (
            <PrimaryButton
              disabled={saving}
              className="w-full"
              onClick={() => void finish()}
            >
              {saving ? "Saving…" : "Go to my home"}
            </PrimaryButton>
          )}
        </div>
      </div>
    </div>
  );
}
