import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { format, differenceInWeeks, addWeeks } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
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

type Region = "north_america" | "africa" | "south_america" | "central_america" | "other";

const REGIONS: { key: Region; label: string }[] = [
  { key: "north_america", label: "North America" },
  { key: "africa", label: "Africa" },
  { key: "south_america", label: "South America" },
  { key: "central_america", label: "Central America" },
  { key: "other", label: "Other region" },
];

const COUNTRIES: Record<Region, string[]> = {
  north_america: ["United States", "Canada", "Mexico", "Other"],
  africa: [
    "Morocco", "Uganda", "Mauritius", "Nigeria", "Kenya", "South Africa",
    "Ghana", "Egypt", "Ethiopia", "Tanzania", "Rwanda", "Senegal",
    "Côte d’Ivoire", "Cameroon", "Democratic Republic of Congo", "Angola",
    "Algeria", "Tunisia", "Other",
  ],
  south_america: [
    "Brazil", "Colombia", "Argentina", "Peru", "Chile", "Ecuador", "Bolivia",
    "Paraguay", "Uruguay", "Venezuela", "Guyana", "Suriname", "French Guiana", "Other",
  ],
  central_america: [
    "Guatemala", "Belize", "Honduras", "El Salvador", "Nicaragua",
    "Costa Rica", "Panama", "Other",
  ],
  other: ["Other"],
};

const CARE_SETTINGS = [
  { v: "in_person", l: "In-person" },
  { v: "virtual", l: "Virtual" },
  { v: "home_visit", l: "Home visit" },
  { v: "not_sure", l: "Not sure" },
];

const LANGUAGES = [
  "English", "French", "Arabic", "Spanish", "Portuguese", "Swahili", "Luganda",
  "Kinyarwanda", "Amharic", "Hausa", "Yoruba", "Igbo", "Wolof", "Zulu", "Xhosa",
  "Afrikaans", "Somali", "Lingala", "Darija / Moroccan Arabic", "Tamazight / Amazigh",
  "Haitian Creole", "Jamaican Patois", "Quechua", "Guaraní", "Aymara",
  "K’iche’", "Kaqchikel", "Garifuna", "Mayan languages", "Other",
];

const STAGES: { key: LifeStage; label: string; sub: string; emoji: string }[] = [
  { key: "ttc", label: "Trying to conceive", sub: "Fertility, cycle tracking", emoji: "🌱" },
  { key: "ivf", label: "IVF or fertility support", sub: "Clinics, labs, medication", emoji: "🧬" },
  { key: "pregnant", label: "Pregnant", sub: "Prenatal care, providers", emoji: "🤰" },
  { key: "postpartum", label: "Postpartum", sub: "Recovery, feeding, mood", emoji: "🍼" },
  { key: "newborn", label: "Newborn care", sub: "Pediatric care, feeding", emoji: "👶" },
  { key: "pcos", label: "PCOS / hormonal health", sub: "Labs, symptoms, support", emoji: "🌸" },
  { key: "labs", label: "Labs or prescriptions", sub: "Results, medication", emoji: "🧪" },
  { key: "insurance", label: "Insurance / payment help", sub: "Coverage, self-pay", emoji: "🛡️" },
  { key: "mood", label: "Emotional support", sub: "Mental health, mood", emoji: "💛" },
  { key: "family", label: "Supporting a family member", sub: "Coordinate care", emoji: "🤝" },
];

const CULTURAL_OPTIONS = [
  "I prefer a female provider",
  "I want modesty-sensitive care",
  "I want faith-sensitive care",
  "I want culturally familiar care",
  "I want family involved in care",
  "I want privacy from family or supporters",
  "I observe religious fasting",
  "I want support navigating Ramadan, Lent, or other fasts",
  "I want help balancing cultural practices with medical advice",
  "I want support with postpartum traditions",
  "I want support with family decision-making",
  "I prefer a provider who explains decisions clearly",
  "I prefer not to say",
  "Other",
];

const DIETARY_OPTIONS = [
  "Halal", "No pork", "Kosher", "Vegan", "Vegetarian", "Pescatarian",
  "Dairy-free", "Gluten-free", "Avoid alcohol-based ingredients",
  "Fasting-aware nutrition", "Postpartum cultural foods",
  "Traditional foods or herbal practices", "No preference", "Other",
];

const BIRTH_OPTIONS = [
  "Low-intervention birth when medically appropriate",
  "Midwife-supported care",
  "Doula-supported care",
  "VBAC conversation",
  "C-section explanation and informed consent",
  "Birth plan support",
  "Pain management options",
  "Partner or family present",
  "Privacy or modesty during labor",
  "I want help understanding my options",
  "No preference yet",
];

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-2 font-sans text-sm transition-all text-left",
        active ? "border-eve-teal bg-eve-teal text-white" : "border-eve-muted/30 bg-white text-eve-teal-dark",
      )}
    >
      {children}
    </button>
  );
}

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);

  // Step 1
  const [region, setRegion] = useState<Region | null>(null);
  // Step 2
  const [country, setCountry] = useState("");
  const [countryOther, setCountryOther] = useState("");
  const [city, setCity] = useState("");
  const [careSetting, setCareSetting] = useState("");
  // Step 3
  const [language, setLanguage] = useState("");
  const [languageOther, setLanguageOther] = useState("");
  const [dialect, setDialect] = useState("");
  // Step 4
  const [stage, setStage] = useState<LifeStage | null>(null);
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [isFirst, setIsFirst] = useState<boolean | null>(null);
  // Step 5
  const [personalize, setPersonalize] = useState<"yes" | "no" | "skip" | "">("");
  // Step 6
  const [cultural, setCultural] = useState<string[]>([]);
  const [culturalOther, setCulturalOther] = useState("");
  // Step 7
  const [dietary, setDietary] = useState<string[]>([]);
  const [dietaryOther, setDietaryOther] = useState("");
  // Step 8
  const [birth, setBirth] = useState<string[]>([]);

  const isPregnant = stage === "pregnant";
  const wantsPersonalize = personalize === "yes";

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (!u) return;
      setUserId(u.id);
      setFullName((u.user_metadata?.full_name as string) || u.email?.split("@")[0] || "");
    });
  }, []);

  // Apply RTL when Arabic-family language chosen
  useEffect(() => {
    const isAr = /arabic|darija/i.test(language);
    if (typeof document !== "undefined") {
      document.documentElement.dir = isAr ? "rtl" : "ltr";
    }
  }, [language]);

  const week = useMemo(() => {
    if (!dueDate) return 0;
    const conception = addWeeks(dueDate, -40);
    return Math.max(1, Math.min(40, differenceInWeeks(new Date(), conception)));
  }, [dueDate]);

  // Steps: 0 region, 1 country/city, 2 language, 3 stage (+ pregnancy details), 4 personalize, 5 cultural, 6 dietary, 7 birth
  const steps: number[] = wantsPersonalize ? [0, 1, 2, 3, 4, 5, 6, 7] : [0, 1, 2, 3, 4];

  function toggle(list: string[], setList: (l: string[]) => void, v: string) {
    setList(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  }

  const resolvedCountry = country === "Other" ? countryOther.trim() : country;
  const resolvedLanguage = language === "Other" ? languageOther.trim() : language;

  const canContinue: Record<number, boolean> = {
    0: !!region,
    1: !!resolvedCountry && !!city.trim(),
    2: !!resolvedLanguage,
    3: !!stage && (!isPregnant || (!!dueDate && isFirst !== null)),
    4: !!personalize,
    5: true,
    6: true,
    7: true,
  };

  async function finish() {
    if (!userId) return;
    setSaving(true);

    const langCode = /arabic|darija/i.test(resolvedLanguage)
      ? "ar"
      : /french/i.test(resolvedLanguage)
        ? "fr"
        : /spanish/i.test(resolvedLanguage)
          ? "es"
          : /portuguese/i.test(resolvedLanguage)
            ? "pt"
            : "en";

    await supabase
      .from("profiles")
      .update({ language: langCode, language_chosen_at: new Date().toISOString() })
      .eq("id", userId);

    await supabase.from("mothers").insert({
      user_id: userId,
      full_name: fullName || null,
      region: region ?? null,
      country: resolvedCountry || null,
      city: city || null,
      care_setting: careSetting || null,
      language: resolvedLanguage || null,
      dialect: dialect || null,
      stage: stage ?? null,
      due_date: isPregnant && dueDate ? format(dueDate, "yyyy-MM-dd") : null,
      pregnancy_week: isPregnant && dueDate ? week : null,
      is_first_pregnancy: isPregnant ? isFirst : null,
      personalize_opt: personalize || null,
      cultural_prefs: wantsPersonalize && cultural.length ? cultural : null,
      cultural_other: wantsPersonalize && culturalOther.trim() ? culturalOther.trim() : null,
      dietary_prefs: wantsPersonalize && dietary.length ? dietary : null,
      dietary_other: wantsPersonalize && dietaryOther.trim() ? dietaryOther.trim() : null,
      dietary_notes: wantsPersonalize && dietary.length ? dietary.join(", ") : null,
      birth_prefs: wantsPersonalize && birth.length ? birth : null,
      whatsapp_opt_in: true,
    });

    writeIntake({
      stage: stage ?? undefined,
      city: city || undefined,
      language: resolvedLanguage || undefined,
      languages: resolvedLanguage ? [resolvedLanguage] : undefined,
    });

    setSaving(false);
    navigate({ to: "/eve/home" });
  }

  const isLastStep = step === steps.length - 1;

  return (
    <div className="min-h-dvh bg-eve-sand">
      <div className="mx-auto flex min-h-dvh max-w-sm flex-col px-5 pb-8 pt-8">
        <div className="flex items-center justify-center gap-2">
          {steps.map((i) => (
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

        <div className="mt-8 flex-1 space-y-5">
          {step === 0 && (
            <div>
              <h1 className="font-serif text-3xl text-eve-teal-dark">Where are you receiving care?</h1>
              <p className="mt-2 font-sans text-sm text-eve-muted">
                This helps us personalize care guidance, events, language, emergency resources, and provider recommendations.
              </p>
              <div className="mt-6 space-y-2">
                {REGIONS.map((r) => (
                  <button
                    key={r.key}
                    onClick={() => setRegion(r.key)}
                    className={cn(
                      "w-full rounded-2xl border p-4 text-left font-sans text-base transition-all",
                      region === r.key ? "border-eve-teal bg-eve-teal-light" : "border-eve-muted/30 bg-white",
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && region && (
            <div className="space-y-5">
              <h1 className="font-serif text-3xl text-eve-teal-dark">Your country & city</h1>
              <div>
                <label className="font-sans text-sm font-medium text-eve-teal-dark">Country</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-eve-muted/30 bg-white px-4 py-3 font-sans text-sm"
                >
                  <option value="">Select your country</option>
                  {COUNTRIES[region].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {country === "Other" && (
                  <Input
                    value={countryOther}
                    onChange={(e) => setCountryOther(e.target.value)}
                    placeholder="Type your country"
                    maxLength={80}
                    className="mt-2 rounded-2xl border-eve-muted/30 bg-white"
                  />
                )}
              </div>
              <div>
                <label className="font-sans text-sm font-medium text-eve-teal-dark">City or region</label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City, region, or area"
                  maxLength={100}
                  className="mt-2 rounded-2xl border-eve-muted/30 bg-white py-6"
                />
              </div>
              <div>
                <label className="font-sans text-sm font-medium text-eve-teal-dark">
                  Care setting preference <span className="font-normal text-eve-muted">(optional)</span>
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CARE_SETTINGS.map((c) => (
                    <Chip key={c.v} active={careSetting === c.v} onClick={() => setCareSetting(careSetting === c.v ? "" : c.v)}>
                      {c.l}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h1 className="font-serif text-3xl text-eve-teal-dark">What language would you like to use?</h1>
              <p className="font-sans text-xs text-eve-muted">
                If you do not see your language or dialect, choose Other. Eve & Eden will keep expanding language support.
              </p>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-2xl border border-eve-muted/30 bg-white px-4 py-3 font-sans text-sm"
              >
                <option value="">Select a language</option>
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              {language === "Other" && (
                <Input
                  value={languageOther}
                  onChange={(e) => setLanguageOther(e.target.value)}
                  placeholder="Type your language"
                  maxLength={60}
                  className="rounded-2xl border-eve-muted/30 bg-white"
                />
              )}
              <div>
                <label className="font-sans text-sm font-medium text-eve-teal-dark">
                  Dialect <span className="font-normal text-eve-muted">(optional)</span>
                </label>
                <Input
                  value={dialect}
                  onChange={(e) => setDialect(e.target.value)}
                  placeholder="e.g. Egyptian, Brazilian, Kenyan"
                  maxLength={60}
                  className="mt-2 rounded-2xl border-eve-muted/30 bg-white"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h1 className="font-serif text-3xl text-eve-teal-dark">Where are you in your journey?</h1>
              <div className="grid grid-cols-2 gap-2">
                {STAGES.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setStage(s.key)}
                    className={cn(
                      "rounded-2xl border p-3 text-left transition-all",
                      stage === s.key ? "border-eve-teal bg-eve-teal-light" : "border-eve-muted/30 bg-white",
                    )}
                  >
                    <span className="text-lg">{s.emoji}</span>
                    <p className="mt-1 font-sans text-sm font-medium text-eve-teal-dark">{s.label}</p>
                    <p className="mt-0.5 font-sans text-[11px] text-eve-muted">{s.sub}</p>
                  </button>
                ))}
              </div>

              {isPregnant && (
                <div className="space-y-4 rounded-2xl border border-eve-muted/20 bg-white p-4">
                  <div>
                    <label className="font-sans text-sm font-medium text-eve-teal-dark">Due date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className={cn("mt-2 flex w-full items-center justify-between rounded-2xl border border-eve-muted/30 bg-white px-4 py-3 font-sans text-left text-sm", !dueDate && "text-eve-muted")}>
                          {dueDate ? format(dueDate, "PPP") : "Pick your due date"}
                          <CalendarIcon className="h-4 w-4 text-eve-muted" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={dueDate} onSelect={setDueDate} captionLayout="dropdown" disabled={(d) => d < new Date()} initialFocus className="p-3 pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                    {dueDate && <p className="mt-2 font-sans text-sm text-eve-teal">You are {week} weeks along</p>}
                  </div>
                  <div>
                    <label className="font-sans text-sm font-medium text-eve-teal-dark">Is this your first pregnancy?</label>
                    <div className="mt-2 flex gap-3">
                      {[{ v: true, l: "Yes" }, { v: false, l: "No" }].map((o) => (
                        <button key={o.l} onClick={() => setIsFirst(o.v)} className={cn("flex-1 rounded-full border px-5 py-3 font-sans text-sm transition-all", isFirst === o.v ? "border-eve-teal bg-eve-teal text-white" : "border-eve-muted/30 bg-white text-eve-teal-dark")}>
                          {o.l}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h1 className="font-serif text-3xl text-eve-teal-dark">Personalize your recommendations?</h1>
              <p className="font-sans text-sm text-eve-muted">
                Optional. This helps us recommend care, content, events, and providers that better respect what matters to you. You can skip this or update it anytime.
              </p>
              <div className="space-y-2">
                {[
                  { v: "yes", l: "Yes, personalize my recommendations" },
                  { v: "no", l: "Not now" },
                  { v: "skip", l: "I prefer not to answer" },
                ].map((o) => (
                  <button
                    key={o.v}
                    onClick={() => setPersonalize(o.v as "yes" | "no" | "skip")}
                    className={cn(
                      "w-full rounded-2xl border p-4 text-left font-sans text-sm transition-all",
                      personalize === o.v ? "border-eve-teal bg-eve-teal-light" : "border-eve-muted/30 bg-white",
                    )}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h1 className="font-serif text-3xl text-eve-teal-dark">Are there any preferences you want us to consider?</h1>
              <p className="font-sans text-xs text-eve-muted">All optional. Select any that apply.</p>
              <div className="flex flex-wrap gap-2">
                {CULTURAL_OPTIONS.map((o) => (
                  <Chip key={o} active={cultural.includes(o)} onClick={() => toggle(cultural, setCultural, o)}>{o}</Chip>
                ))}
              </div>
              {cultural.includes("Other") && (
                <Input
                  value={culturalOther}
                  onChange={(e) => setCulturalOther(e.target.value)}
                  placeholder="Tell us more"
                  maxLength={200}
                  className="rounded-2xl border-eve-muted/30 bg-white"
                />
              )}
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <h1 className="font-serif text-3xl text-eve-teal-dark">Food, supplement, or nutrition preferences?</h1>
              <div className="flex flex-wrap gap-2">
                {DIETARY_OPTIONS.map((o) => (
                  <Chip key={o} active={dietary.includes(o)} onClick={() => toggle(dietary, setDietary, o)}>{o}</Chip>
                ))}
              </div>
              {dietary.includes("Other") && (
                <Input
                  value={dietaryOther}
                  onChange={(e) => setDietaryOther(e.target.value)}
                  placeholder="Tell us more"
                  maxLength={200}
                  className="rounded-2xl border-eve-muted/30 bg-white"
                />
              )}
            </div>
          )}

          {step === 7 && (
            <div className="space-y-4">
              <h1 className="font-serif text-3xl text-eve-teal-dark">Birth or care preferences you want support with?</h1>
              <div className="flex flex-wrap gap-2">
                {BIRTH_OPTIONS.map((o) => (
                  <Chip key={o} active={birth.includes(o)} onClick={() => toggle(birth, setBirth, o)}>{o}</Chip>
                ))}
              </div>
              <p className="rounded-2xl bg-eve-cream p-3 font-sans text-xs text-eve-muted">
                Eve & Eden helps you prepare questions and find supportive care. Your provider should explain what is medically safest for your situation.
              </p>
            </div>
          )}
        </div>

        <div className="pt-8">
          <div className="flex items-center gap-3">
            {step > 0 && (
              <button onClick={() => setStep(step - 1)} className="rounded-full px-5 py-3 font-sans text-sm text-eve-muted">
                Back
              </button>
            )}
            <PrimaryButton
              disabled={!canContinue[step] || saving}
              className="flex-1"
              onClick={() => {
                if (isLastStep) void finish();
                else setStep(step + 1);
              }}
            >
              {isLastStep ? (saving ? "Saving…" : "Finish") : "Continue"}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}
