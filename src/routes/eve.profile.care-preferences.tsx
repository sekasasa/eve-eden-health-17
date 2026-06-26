import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, Lock } from "lucide-react";
import { EveShell } from "@/components/shells/EveShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/eve/profile/care-preferences")({
  component: CarePreferencesPage,
});

const REGIONS = [
  "North America",
  "Africa",
  "South America",
  "Central America",
  "Europe",
  "Middle East",
  "Asia",
  "Oceania",
  "Caribbean",
  "Other region",
];

const CARE_SETTINGS = [
  { value: "in_person", label: "In-person" },
  { value: "virtual", label: "Virtual" },
  { value: "home", label: "Home visit" },
  { value: "unsure", label: "Not sure" },
];

const LANGUAGES = [
  "English", "Spanish", "French", "Portuguese", "Arabic",
  "Darija / Moroccan Arabic", "Tamazight / Amazigh", "Swahili", "Luganda",
  "Kinyarwanda", "Amharic", "Hausa", "Yoruba", "Igbo", "Wolof", "Zulu",
  "Xhosa", "Afrikaans", "Somali", "Lingala", "Haitian Creole",
  "Jamaican Patois", "Quechua", "Guaraní", "Aymara", "K'iche'",
  "Kaqchikel", "Garifuna", "Mayan languages", "Other",
];

const STAGES = [
  "Trying to conceive",
  "IVF or fertility support",
  "Pregnant",
  "Postpartum",
  "Newborn care",
  "PCOS or hormonal health",
  "Labs or prescriptions",
  "Insurance or payment help",
  "Emotional support",
  "Supporting a family member",
];

const CULTURAL_OPTIONS = [
  "Female provider preferred",
  "Modesty-sensitive care",
  "Faith-sensitive care",
  "Culturally familiar care",
  "Family involved in care",
  "Keep care private from family/supporters",
  "Fasting-aware support",
  "Postpartum tradition support",
  "Family decision-making support",
  "Prefer not to say",
  "Other",
];

const DIET_OPTIONS = [
  "Halal", "No pork", "Kosher", "Vegan", "Vegetarian", "Pescatarian",
  "Dairy-free", "Gluten-free", "Avoid alcohol-based ingredients",
  "Fasting-aware nutrition", "Postpartum cultural foods",
  "Traditional foods or herbal practices", "Other",
];

const BIRTH_OPTIONS = [
  "Low-intervention birth when medically appropriate",
  "Midwife-supported care",
  "Doula-supported care",
  "VBAC conversation",
  "C-section explanation and informed consent",
  "Birth plan support",
  "Pain management options",
  "Privacy/modesty during labor",
  "Partner or family present",
  "I want help understanding my options",
];

type Prefs = {
  id?: string;
  region: string;
  country: string;
  city: string;
  care_setting: string;
  language: string;
  dialect: string;
  secondary_language: string;
  language_other: string;
  stage: string;
  cultural_prefs: string[];
  cultural_other: string;
  dietary_prefs: string[];
  dietary_other: string;
  birth_prefs: string[];
};

const EMPTY: Prefs = {
  region: "", country: "", city: "", care_setting: "",
  language: "", dialect: "", secondary_language: "", language_other: "",
  stage: "",
  cultural_prefs: [], cultural_other: "",
  dietary_prefs: [], dietary_other: "",
  birth_prefs: [],
};

function CarePreferencesPage() {
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState<Prefs>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        navigate({ to: "/login" });
        return;
      }
      const { data } = await supabase
        .from("mothers")
        .select("id,region,country,city,care_setting,language,dialect,secondary_language,language_other,stage,cultural_prefs,cultural_other,dietary_prefs,dietary_other,birth_prefs")
        .eq("user_id", auth.user.id)
        .maybeSingle();
      if (data) {
        setPrefs({
          id: data.id,
          region: data.region ?? "",
          country: data.country ?? "",
          city: data.city ?? "",
          care_setting: data.care_setting ?? "",
          language: data.language ?? "",
          dialect: data.dialect ?? "",
          secondary_language: data.secondary_language ?? "",
          language_other: data.language_other ?? "",
          stage: data.stage ?? "",
          cultural_prefs: data.cultural_prefs ?? [],
          cultural_other: data.cultural_other ?? "",
          dietary_prefs: data.dietary_prefs ?? [],
          dietary_other: data.dietary_other ?? "",
          birth_prefs: data.birth_prefs ?? [],
        });
      }
      setLoading(false);
    })();
  }, [navigate]);

  function set<K extends keyof Prefs>(key: K, value: Prefs[K]) {
    setPrefs((p) => ({ ...p, [key]: value }));
  }

  function toggle(key: "cultural_prefs" | "dietary_prefs" | "birth_prefs", v: string) {
    setPrefs((p) => {
      const arr = p[key];
      return { ...p, [key]: arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v] };
    });
  }

  const showLangOther = useMemo(
    () => prefs.language === "Other" || prefs.secondary_language === "Other",
    [prefs.language, prefs.secondary_language],
  );
  const showCulturalOther = prefs.cultural_prefs.includes("Other");
  const showDietOther = prefs.dietary_prefs.includes("Other");

  async function save() {
    if (!prefs.id) return;
    setSaving(true);
    const { error } = await supabase
      .from("mothers")
      .update({
        region: prefs.region || null,
        country: prefs.country || null,
        city: prefs.city || null,
        care_setting: prefs.care_setting || null,
        language: prefs.language || null,
        dialect: prefs.dialect || null,
        secondary_language: prefs.secondary_language || null,
        language_other: showLangOther ? prefs.language_other || null : null,
        stage: prefs.stage || null,
        cultural_prefs: prefs.cultural_prefs,
        cultural_other: showCulturalOther ? prefs.cultural_other || null : null,
        dietary_prefs: prefs.dietary_prefs,
        dietary_other: showDietOther ? prefs.dietary_other || null : null,
        birth_prefs: prefs.birth_prefs,
      })
      .eq("id", prefs.id);
    setSaving(false);
    if (!error) setSavedAt(new Date().toLocaleTimeString());
  }

  if (loading) {
    return (
      <EveShell>
        <div className="mt-6 h-40 animate-pulse rounded-2xl bg-eve-cream" />
      </EveShell>
    );
  }

  return (
    <EveShell>
      <button
        type="button"
        onClick={() => navigate({ to: "/eve/profile" })}
        className="mt-2 inline-flex items-center gap-1 font-sans text-sm text-eve-teal"
      >
        <ArrowLeft className="h-4 w-4" /> Profile
      </button>

      <header className="mt-3">
        <h1 className="font-serif text-2xl text-eve-teal-dark">Care Preferences</h1>
        <p className="mt-1 font-sans text-sm text-eve-muted">
          Tell us what matters to you so Eve &amp; Eden can personalize care,
          content, events, and provider recommendations.
        </p>
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-eve-cream px-3 py-2">
          <Lock className="mt-0.5 h-3.5 w-3.5 text-eve-teal" />
          <p className="font-sans text-[11px] text-eve-muted">
            Private to you. Used only to personalize your experience.
          </p>
        </div>
      </header>

      <div className="mt-6 space-y-6 pb-32">
        {/* 1. Location */}
        <Card title="Location" subtitle="Where you live and how you want care delivered.">
          <Field label="Region">
            <Select value={prefs.region} onChange={(v) => set("region", v)} options={REGIONS} placeholder="Choose a region" />
          </Field>
          <Field label="Country">
            <Input value={prefs.country} onChange={(v) => set("country", v)} placeholder="e.g. Morocco, USA, Nigeria" />
          </Field>
          <Field label="City or region">
            <Input value={prefs.city} onChange={(v) => set("city", v)} placeholder="e.g. Casablanca" />
          </Field>
          <Field label="Care preference">
            <Pills
              options={CARE_SETTINGS.map((c) => c.label)}
              values={prefs.care_setting ? [CARE_SETTINGS.find((c) => c.value === prefs.care_setting)?.label ?? ""] : []}
              onToggle={(label) => {
                const found = CARE_SETTINGS.find((c) => c.label === label);
                set("care_setting", found && prefs.care_setting !== found.value ? found.value : "");
              }}
              single
            />
          </Field>
        </Card>

        {/* 2. Language */}
        <Card title="Language and dialect" subtitle="Pick the language Eve speaks to you in.">
          <Field label="Preferred language">
            <Select value={prefs.language} onChange={(v) => set("language", v)} options={LANGUAGES} placeholder="Choose a language" />
          </Field>
          <Field label="Preferred dialect (optional)">
            <Input value={prefs.dialect} onChange={(v) => set("dialect", v)} placeholder="e.g. Darija, Egyptian Arabic, Castilian" />
          </Field>
          <Field label="Secondary language (optional)">
            <Select value={prefs.secondary_language} onChange={(v) => set("secondary_language", v)} options={LANGUAGES} placeholder="Choose a language" />
          </Field>
          {showLangOther && (
            <Field label="Tell us your language">
              <Input value={prefs.language_other} onChange={(v) => set("language_other", v)} placeholder="Your language" />
            </Field>
          )}
        </Card>

        {/* 3. Life stage */}
        <Card title="Life stage" subtitle="What kind of care or support are you looking for right now?">
          <Pills
            options={STAGES}
            values={prefs.stage ? [prefs.stage] : []}
            onToggle={(label) => set("stage", prefs.stage === label ? "" : label)}
            single
          />
        </Card>

        {/* 4. What matters to you */}
        <Card
          title="What matters to you"
          subtitle="Optional. This helps Eve & Eden personalize recommendations while respecting what matters to you. Skip anything you'd rather not share."
        >
          <Pills
            options={CULTURAL_OPTIONS}
            values={prefs.cultural_prefs}
            onToggle={(v) => toggle("cultural_prefs", v)}
          />
          {showCulturalOther && (
            <Field label="Tell us more">
              <Input value={prefs.cultural_other} onChange={(v) => set("cultural_other", v)} placeholder="What matters to you" />
            </Field>
          )}
        </Card>

        {/* 5. Diet */}
        <Card title="Diet and nutrition" subtitle="So nutrition guidance fits how you eat.">
          <Pills
            options={DIET_OPTIONS}
            values={prefs.dietary_prefs}
            onToggle={(v) => toggle("dietary_prefs", v)}
          />
          {showDietOther && (
            <Field label="Tell us more">
              <Input value={prefs.dietary_other} onChange={(v) => set("dietary_other", v)} placeholder="Other dietary notes" />
            </Field>
          )}
        </Card>

        {/* 6. Birth */}
        <Card title="Birth and care preferences" subtitle="What you'd like your care team to know.">
          <Pills
            options={BIRTH_OPTIONS}
            values={prefs.birth_prefs}
            onToggle={(v) => toggle("birth_prefs", v)}
          />
        </Card>

        {/* 7. Privacy */}
        <div className="rounded-2xl border border-eve-teal/15 bg-eve-cream/60 p-4">
          <p className="font-sans text-xs text-eve-muted">
            These preferences are optional. They help Eve &amp; Eden personalize
            recommendations. You control what you share and can update this anytime.
          </p>
        </div>
      </div>

      {/* Sticky save bar */}
      <div className="fixed inset-x-0 bottom-[72px] z-30 border-t border-eve-muted/15 bg-white/95 px-4 py-3 backdrop-blur md:bottom-0">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <span className="font-sans text-[11px] text-eve-muted">
            {savedAt ? `Saved ${savedAt}` : "Changes save when you tap save"}
          </span>
          <Button
            onClick={save}
            disabled={saving}
            className="bg-eve-teal hover:bg-eve-teal-dark"
          >
            {saving ? "Saving…" : "Save preferences"}
          </Button>
        </div>
      </div>
    </EveShell>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-5">
      <h2 className="font-serif text-lg text-eve-teal-dark">{title}</h2>
      {subtitle && <p className="mt-1 font-sans text-xs text-eve-muted">{subtitle}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block font-sans text-[11px] uppercase tracking-wide text-eve-muted">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-eve-muted/20 bg-white px-3 py-2 font-sans text-sm text-eve-teal-dark placeholder:text-eve-muted/60 focus:border-eve-teal focus:outline-none"
    />
  );
}

function Select({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-eve-muted/20 bg-white px-3 py-2 font-sans text-sm text-eve-teal-dark focus:border-eve-teal focus:outline-none"
    >
      <option value="">{placeholder ?? "Select…"}</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

function Pills({
  options,
  values,
  onToggle,
  single,
}: {
  options: string[];
  values: string[];
  onToggle: (v: string) => void;
  single?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = values.includes(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => onToggle(o)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-sans text-xs transition",
              on
                ? "border-eve-teal bg-eve-teal text-white"
                : "border-eve-muted/25 bg-white text-eve-teal-dark hover:border-eve-teal/40",
            )}
            aria-pressed={on}
          >
            {on && <Check className="h-3 w-3" />}
            {o}
          </button>
        );
      })}
      {single && null}
    </div>
  );
}
