import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ShieldCheck, AlertTriangle } from "lucide-react";
import { EveShell } from "@/components/shells/EveShell";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { writeIntake, readIntake, persistIntake } from "@/lib/match-store";
import type { LifeStage, PaymentKey, Urgency } from "@/lib/match-data";
import { eveToast } from "@/lib/eve-toast";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/eve/match")({
  component: MatchIntake,
});

const TOTAL_STEPS = 8;

const STAGES: { key: LifeStage; label: string; sub: string; emoji: string }[] = [
  { key: "ttc", label: "Trying to conceive", sub: "Fertility, cycle tracking, preconception care", emoji: "🌱" },
  { key: "ivf", label: "IVF or fertility treatment", sub: "Clinics, labs, medication, emotional support", emoji: "🧬" },
  { key: "pregnant", label: "Pregnant", sub: "Prenatal care, labs, symptoms, providers", emoji: "🤰" },
  { key: "postpartum", label: "Postpartum", sub: "Recovery, feeding, mood, follow-up care", emoji: "🍼" },
  { key: "newborn", label: "Newborn or child care", sub: "Pediatric care, feeding, milestones", emoji: "👶" },
  { key: "pcos", label: "PCOS / hormonal health", sub: "Labs, symptoms, cycle support", emoji: "🌸" },
  { key: "labs", label: "Lab results", sub: "Understand results and next steps", emoji: "🧪" },
  { key: "rx", label: "Prescription support", sub: "Medication, refills, safety questions", emoji: "💊" },
  { key: "insurance", label: "Insurance or payment", sub: "Coverage, self-pay, international insurance", emoji: "🛡️" },
  { key: "mood", label: "Anxiety or mood support", sub: "Mental health, stress, postpartum emotions", emoji: "💛" },
  { key: "wellness", label: "Wellness or preventive care", sub: "Annual visits, screenings, nutrition", emoji: "🌿" },
  { key: "family", label: "Helping a family member", sub: "Coordinate care or help pay", emoji: "🤝" },
];

// Stage-specific support options for Step 2
const NEEDS_BY_STAGE: Record<LifeStage, { key: string; label: string }[]> = {
  ttc: [
    { key: "find_fertility", label: "Find a fertility or OB-GYN provider" },
    { key: "labs_explain", label: "Understand fertility labs" },
    { key: "cycle_track", label: "Track cycle or symptoms" },
    { key: "supplements", label: "Explore supplements or prescriptions" },
    { key: "compare_pay", label: "Compare insurance or self-pay options" },
    { key: "navigator", label: "Talk to a care navigator" },
  ],
  ivf: [
    { key: "compare_clinics", label: "Find or compare IVF clinics" },
    { key: "labs_explain", label: "Understand fertility labs" },
    { key: "ivf_meds", label: "Manage IVF medication questions" },
    { key: "pharmacy", label: "Find pharmacy support" },
    { key: "compare_pay", label: "Compare insurance or self-pay packages" },
    { key: "emotional", label: "Emotional support or counseling" },
    { key: "navigator", label: "Talk to a care navigator" },
  ],
  pregnant: [
    { key: "find_prenatal", label: "Find an OB-GYN, midwife, or doula" },
    { key: "labs_explain", label: "Understand prenatal labs" },
    { key: "rx_explain", label: "Check prescription or supplement questions" },
    { key: "symptoms", label: "Track symptoms" },
    { key: "compare_pay", label: "Compare insurance/payment options" },
    { key: "birth_prep", label: "Prepare for birth" },
    { key: "navigator", label: "Talk to a care navigator" },
  ],
  postpartum: [
    { key: "find_postpartum", label: "Find postpartum care" },
    { key: "lactation", label: "Find lactation or feeding support" },
    { key: "mood", label: "Mental health or mood support" },
    { key: "labs_explain", label: "Understand postpartum labs" },
    { key: "rx_breastfeeding", label: "Check medication while breastfeeding" },
    { key: "baby_products", label: "Find baby/postpartum products" },
    { key: "family", label: "Invite family support" },
    { key: "navigator", label: "Talk to a care navigator" },
  ],
  newborn: [
    { key: "pediatric", label: "Find a pediatrician" },
    { key: "feeding", label: "Feeding support" },
    { key: "milestones", label: "Track appointments or milestones" },
    { key: "pharmacy", label: "Pharmacy or medication support" },
    { key: "baby_essentials", label: "Find baby essentials" },
    { key: "compare_pay", label: "Insurance/payment support" },
    { key: "navigator", label: "Talk to a care navigator" },
  ],
  pcos: [
    { key: "find_hormonal", label: "Find a hormonal health provider" },
    { key: "labs_explain", label: "Understand labs" },
    { key: "cycle_track", label: "Track cycle or symptoms" },
    { key: "rx_explain", label: "Medication questions" },
    { key: "fertility", label: "Fertility support" },
    { key: "nutrition", label: "Nutrition or wellness support" },
    { key: "compare_pay", label: "Insurance/payment support" },
    { key: "navigator", label: "Talk to a care navigator" },
  ],
  labs: [
    { key: "upload_lab", label: "Upload lab result" },
    { key: "manual_lab", label: "Enter results manually" },
    { key: "labs_explain", label: "Understand what the result may mean" },
    { key: "find_review", label: "Find a provider to review results" },
    { key: "find_lab", label: "Find a lab nearby" },
    { key: "navigator", label: "Talk to a care navigator" },
  ],
  rx: [
    { key: "add_med", label: "Add medication" },
    { key: "upload_rx", label: "Upload prescription" },
    { key: "rx_explain", label: "Check medication questions by life stage" },
    { key: "refill", label: "Set refill reminder" },
    { key: "pharmacy", label: "Find pharmacy" },
    { key: "compare_cost", label: "Compare cost/payment options" },
    { key: "navigator", label: "Talk to a care navigator" },
  ],
  insurance: [
    { key: "local_insurance", label: "Use local insurance" },
    { key: "international", label: "Use international insurance" },
    { key: "compare", label: "Compare insurance vendors" },
    { key: "qualify", label: "See if I qualify for coverage" },
    { key: "self_pay", label: "Choose self-pay" },
    { key: "family", label: "Invite a family member to help pay" },
    { key: "navigator", label: "Talk to a care navigator" },
  ],
  mood: [
    { key: "find_therapist", label: "Find a therapist or counselor" },
    { key: "mood_postpartum", label: "Postpartum mood support" },
    { key: "stress", label: "Stress or anxiety support" },
    { key: "rx_explain", label: "Medication questions" },
    { key: "community", label: "Community support" },
    { key: "navigator", label: "Talk to a care navigator" },
  ],
  wellness: [
    { key: "find_wellness", label: "Find a women's health provider" },
    { key: "annual", label: "Annual visit or screening" },
    { key: "nutrition", label: "Nutrition or wellness support" },
    { key: "labs_general", label: "General labs" },
    { key: "compare_pay", label: "Insurance/payment support" },
    { key: "navigator", label: "Talk to a care navigator" },
  ],
  family: [
    { key: "help_book", label: "Help book care" },
    { key: "help_pay", label: "Help pay for care" },
    { key: "find_provider", label: "Find provider or vendor" },
    { key: "track_appts", label: "Track appointments" },
    { key: "coordinate_labs_rx", label: "Coordinate labs or prescriptions" },
    { key: "navigator", label: "Talk to a care navigator" },
  ],
};

const LOCATIONS = [
  { key: "near", label: "Near me" },
  { key: "other_city", label: "In another city" },
  { key: "other_country", label: "In another country" },
  { key: "virtual", label: "Virtual care is okay" },
  { key: "home", label: "Home visit preferred" },
  { key: "unsure", label: "I'm not sure" },
];

const LANGUAGES = ["English", "French", "Arabic", "Darija", "Spanish", "Other", "No preference"];

const PREFERENCES = [
  "Female provider preferred",
  "Culturally familiar care",
  "Faith-sensitive care",
  "Modesty-sensitive care",
  "Home visit preferred",
  "Telehealth preferred",
  "In-person preferred",
  "Family member involved",
  "Prefer not to say",
  "No preference",
];

const URGENCY: { key: Urgency | "soon" | "month"; label: string; urgent?: boolean }[] = [
  { key: "today", label: "Today", urgent: true },
  { key: "soon", label: "Within 24 hours", urgent: true },
  { key: "this_week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "planning", label: "Planning ahead" },
  { key: "exploring", label: "Just exploring" },
];

const PAYMENTS: { key: PaymentKey; label: string; sub: string }[] = [
  { key: "local_insurance", label: "I have local insurance", sub: "Use a local plan" },
  { key: "international", label: "I have international insurance", sub: "Use a global plan" },
  { key: "compare", label: "Compare insurance vendors", sub: "See your options" },
  { key: "qualify", label: "See if I qualify for coverage", sub: "Eligibility check" },
  { key: "self_pay", label: "I want to self-pay", sub: "Pay out-of-pocket" },
  { key: "family", label: "A family member will help", sub: "Invite a supporter" },
  { key: "unsure", label: "I'm not sure", sub: "A navigator can help" },
];

const LOCAL_COVERS = [
  "Doctor visit",
  "Lab",
  "Prescription",
  "Pregnancy care",
  "Fertility/IVF",
  "Postpartum care",
  "Pediatric care",
  "Mental health",
  "Wellness",
];

const INTL_NEEDS = [
  "Direct billing",
  "Reimbursement documents",
  "Provider match",
  "Not sure",
];

const SELF_PAY_PRIORITIES = [
  "Lowest cost",
  "Fastest appointment",
  "Best-rated provider",
  "Home visit",
  "Payment plan",
  "Package or bundle",
  "No preference",
];

const FAMILY_SUPPORT = [
  "Yes, help pay only",
  "Yes, help coordinate care",
  "Yes, view appointments only",
  "Not now",
];

const FIRST_TASKS = [
  { key: "match", label: "Match me with providers or vendors" },
  { key: "labs", label: "Help me understand labs" },
  { key: "rx", label: "Help me with prescriptions" },
  { key: "compare_pay", label: "Compare insurance/payment options" },
  { key: "plan", label: "Build my care plan" },
  { key: "navigator", label: "Connect me with a navigator" },
];

function MatchIntake() {
  const nav = useNavigate();
  const existing = readIntake();
  const [step, setStep] = useState(1);

  // Step state
  const [stage, setStage] = useState<LifeStage | undefined>(existing.stage);
  const [need, setNeed] = useState<string | undefined>(existing.need);
  const [locationMode, setLocationMode] = useState<string | undefined>(existing.locationMode);
  const [city, setCity] = useState(existing.city ?? "");
  const [languages, setLanguages] = useState<string[]>(
    existing.languages ?? (existing.language ? [existing.language] : []),
  );
  const [preferences, setPreferences] = useState<string[]>(existing.preferences ?? []);
  const [urgency, setUrgency] = useState<string | undefined>(existing.urgency);
  const [payment, setPayment] = useState<PaymentKey | undefined>(existing.payment);

  // Payment sub-question state
  const [localProvider, setLocalProvider] = useState(existing.localProvider ?? "");
  const [localPlan, setLocalPlan] = useState(existing.localPlan ?? "");
  const [localMemberId, setLocalMemberId] = useState(existing.localMemberId ?? "");
  const [localCovers, setLocalCovers] = useState<string[]>(existing.localCovers ?? []);
  const [intlProvider, setIntlProvider] = useState(existing.intlProvider ?? "");
  const [intlCountry, setIntlCountry] = useState(existing.intlCountry ?? "");
  const [currentCountry, setCurrentCountry] = useState(existing.currentCountry ?? "");
  const [intlNeeds, setIntlNeeds] = useState<string[]>(existing.intlNeeds ?? []);
  const [selfPayPriority, setSelfPayPriority] = useState(existing.selfPayPriority ?? "");
  const [familySupport, setFamilySupport] = useState(existing.familySupport ?? "");

  const [firstTask, setFirstTask] = useState<string | undefined>(existing.firstTask);

  function saveAll() {
    writeIntake({
      stage,
      need,
      locationMode,
      city,
      language: languages[0],
      languages,
      preferences,
      urgency: urgency as Urgency | undefined,
      payment,
      firstTask,
      localProvider,
      localPlan,
      localMemberId,
      localCovers,
      intlProvider,
      intlCountry,
      currentCountry,
      intlNeeds,
      selfPayPriority,
      familySupport,
    });
  }

  async function next() {
    saveAll();
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
      return;
    }
    const res = await persistIntake();
    if (res.ok) eveToast.success("Saved — you can resume anytime");
    nav({ to: "/eve/match/results" });
  }

  function back() {
    if (step > 1) setStep(step - 1);
    else nav({ to: "/eve/home" });
  }

  const needsList = stage ? NEEDS_BY_STAGE[stage] : [];

  const canNext =
    (step === 1 && !!stage) ||
    (step === 2 && !!need) ||
    (step === 3 && !!locationMode) ||
    (step === 4 && languages.length > 0) ||
    (step === 5 && preferences.length > 0) ||
    (step === 6 && !!urgency) ||
    (step === 7 && !!payment) ||
    (step === 8 && !!firstTask);

  const showUrgentNote = urgency === "today" || urgency === "soon";

  return (
    <EveShell>
      {/* Header */}
      <div className="px-3 rtl:text-right">
        <button
          onClick={back}
          className="mb-2 inline-flex items-center gap-1 text-xs text-eve-muted"
        >
          <ArrowLeft className="h-3 w-3" /> Back
        </button>
        <SectionLabel>Care + Vendor Match · Step {step} of {TOTAL_STEPS}</SectionLabel>
        <h1 className="mt-1 font-serif text-eve-forest" style={{ fontSize: "22px" }}>
          {step === 1 && "What are you navigating right now?"}
          {step === 2 && "What kind of support would be most helpful?"}
          {step === 3 && "Where do you need care or support?"}
          {step === 4 && "What language feels most comfortable?"}
          {step === 5 && "Any preferences we should keep in mind?"}
          {step === 6 && "How soon do you need help?"}
          {step === 7 && "How would you like to pay for care?"}
          {step === 8 && "What should we help you with first?"}
        </h1>
        <div className="mt-3 flex gap-1">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full",
                i < step ? "bg-eve-teal" : "bg-eve-teal-light",
              )}
            />
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className="mt-5 px-3">
        {step === 1 && (
          <div className="grid grid-cols-2 gap-2">
            {STAGES.map((s) => (
              <OptionTile
                key={s.key}
                selected={stage === s.key}
                onClick={() => setStage(s.key)}
                label={s.label}
                sub={s.sub}
                emoji={s.emoji}
              />
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-2">
            {needsList.map((n) => (
              <ListPick
                key={n.key}
                selected={need === n.key}
                onClick={() => setNeed(n.key)}
                label={n.label}
              />
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              {LOCATIONS.map((l) => (
                <button
                  key={l.key}
                  type="button"
                  onClick={() => setLocationMode(l.key)}
                  className={cn(
                    "rounded-xl border px-3 py-3 text-left text-sm",
                    locationMode === l.key
                      ? "border-eve-teal bg-eve-teal-light text-eve-teal-dark"
                      : "border-eve-muted/30 bg-white text-eve-teal-dark",
                  )}
                >
                  {l.label}
                </button>
              ))}
            </div>
            {(locationMode === "near" ||
              locationMode === "other_city" ||
              locationMode === "other_country") && (
              <Field label="What city or area should we search in?">
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Casablanca, Marrakech, Paris"
                  className="w-full rounded-xl border border-eve-muted/30 bg-white px-3 py-2 text-sm"
                />
              </Field>
            )}
          </div>
        )}

        {step === 4 && (
          <ChipMulti options={LANGUAGES} values={languages} onChange={setLanguages} />
        )}

        {step === 5 && (
          <ChipMulti options={PREFERENCES} values={preferences} onChange={setPreferences} />
        )}

        {step === 6 && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              {URGENCY.map((u) => (
                <button
                  key={u.key}
                  type="button"
                  onClick={() => setUrgency(u.key)}
                  className={cn(
                    "rounded-xl border px-3 py-3 text-xs",
                    urgency === u.key
                      ? "border-eve-teal bg-eve-teal text-white"
                      : "border-eve-muted/30 bg-white text-eve-teal-dark",
                  )}
                >
                  {u.label}
                </button>
              ))}
            </div>
            {showUrgentNote && (
              <div className="flex items-start gap-2 rounded-xl bg-eve-rose-light p-3 text-[11px] text-eve-rose">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <p>
                  If this feels urgent or life-threatening, please seek immediate medical
                  care or contact local emergency services.
                </p>
              </div>
            )}
          </div>
        )}

        {step === 7 && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              {PAYMENTS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPayment(p.key)}
                  className={cn(
                    "flex items-center justify-between rounded-xl border px-3 py-2 text-left",
                    payment === p.key
                      ? "border-eve-teal bg-eve-teal-light"
                      : "border-eve-muted/30 bg-white",
                  )}
                >
                  <div>
                    <p className="text-sm font-medium text-eve-teal-dark">{p.label}</p>
                    <p className="text-[11px] text-eve-muted">{p.sub}</p>
                  </div>
                  {payment === p.key && <ShieldCheck className="h-4 w-4 text-eve-teal" />}
                </button>
              ))}
            </div>

            {payment === "local_insurance" && (
              <div className="flex flex-col gap-3 rounded-2xl border border-eve-muted/20 bg-white p-3">
                <SectionLabel>Who is your insurance provider?</SectionLabel>
                <input
                  value={localProvider}
                  onChange={(e) => setLocalProvider(e.target.value)}
                  placeholder="e.g. Saham, AXA, CNSS"
                  className="w-full rounded-xl border border-eve-muted/30 bg-white px-3 py-2 text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={localPlan}
                    onChange={(e) => setLocalPlan(e.target.value)}
                    placeholder="Plan name (optional)"
                    className="rounded-xl border border-eve-muted/30 bg-white px-3 py-2 text-xs"
                  />
                  <input
                    value={localMemberId}
                    onChange={(e) => setLocalMemberId(e.target.value)}
                    placeholder="Member ID (optional)"
                    className="rounded-xl border border-eve-muted/30 bg-white px-3 py-2 text-xs"
                  />
                </div>
                <SectionLabel>What do you need covered?</SectionLabel>
                <ChipMulti
                  options={LOCAL_COVERS}
                  values={localCovers}
                  onChange={setLocalCovers}
                />
              </div>
            )}

            {payment === "international" && (
              <div className="flex flex-col gap-3 rounded-2xl border border-eve-muted/20 bg-white p-3">
                <SectionLabel>Tell us a little about your international insurance</SectionLabel>
                <input
                  value={intlProvider}
                  onChange={(e) => setIntlProvider(e.target.value)}
                  placeholder="Insurance provider (e.g. Cigna, Allianz)"
                  className="w-full rounded-xl border border-eve-muted/30 bg-white px-3 py-2 text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={intlCountry}
                    onChange={(e) => setIntlCountry(e.target.value)}
                    placeholder="Country of coverage"
                    className="rounded-xl border border-eve-muted/30 bg-white px-3 py-2 text-xs"
                  />
                  <input
                    value={currentCountry}
                    onChange={(e) => setCurrentCountry(e.target.value)}
                    placeholder="Current country"
                    className="rounded-xl border border-eve-muted/30 bg-white px-3 py-2 text-xs"
                  />
                </div>
                <ChipMulti options={INTL_NEEDS} values={intlNeeds} onChange={setIntlNeeds} />
                <p className="text-[11px] text-eve-muted">
                  We'll help you find providers who may accept international insurance or
                  provide documentation for reimbursement.
                </p>
              </div>
            )}

            {payment === "self_pay" && (
              <div className="flex flex-col gap-3 rounded-2xl border border-eve-muted/20 bg-white p-3">
                <SectionLabel>What matters most for self-pay?</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {SELF_PAY_PRIORITIES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelfPayPriority(s)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs",
                        selfPayPriority === s
                          ? "border-eve-teal bg-eve-teal text-white"
                          : "border-eve-muted/30 bg-white text-eve-teal-dark",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-eve-muted">
                  Self-pay may help you book faster, access more provider options, and
                  avoid claim paperwork.
                </p>
              </div>
            )}

            {payment === "family" && (
              <div className="flex flex-col gap-3 rounded-2xl border border-eve-muted/20 bg-white p-3">
                <SectionLabel>Would you like to invite a family supporter?</SectionLabel>
                <div className="flex flex-col gap-2">
                  {FAMILY_SUPPORT.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFamilySupport(f)}
                      className={cn(
                        "rounded-xl border px-3 py-2 text-left text-sm",
                        familySupport === f
                          ? "border-eve-teal bg-eve-teal-light text-eve-teal-dark"
                          : "border-eve-muted/30 bg-white text-eve-teal-dark",
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-eve-muted">
                  You choose what your family supporter can see.
                </p>
              </div>
            )}
          </div>
        )}

        {step === 8 && (
          <div className="flex flex-col gap-2">
            {FIRST_TASKS.map((t) => (
              <ListPick
                key={t.key}
                selected={firstTask === t.key}
                onClick={() => setFirstTask(t.key)}
                label={t.label}
              />
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 flex items-center justify-between gap-2 px-3">
        <SecondaryButton onClick={back} className="!py-2 !px-4 text-sm">
          Back
        </SecondaryButton>
        <PrimaryButton
          onClick={next}
          disabled={!canNext}
          className="!py-2 !px-5 text-sm inline-flex items-center gap-2"
        >
          {step === TOTAL_STEPS ? "See my dashboard" : "Continue"}
          <ArrowRight className="h-4 w-4" />
        </PrimaryButton>
      </div>

      <p className="mt-4 px-3 text-[10px] leading-relaxed text-eve-muted">
        Eve & Eden provides education and care navigation — not diagnosis. For
        urgent or life-threatening symptoms, contact emergency services right away.
      </p>
    </EveShell>
  );
}

function OptionTile({
  selected,
  onClick,
  label,
  sub,
  emoji,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  sub?: string;
  emoji: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-transform active:scale-[0.98]",
        selected
          ? "border-eve-teal bg-eve-teal-light"
          : "border-eve-muted/20 bg-white",
      )}
    >
      <span className="text-lg">{emoji}</span>
      <span className="font-sans text-[12px] font-medium text-eve-teal-dark">
        {label}
      </span>
      {sub && (
        <span className="font-sans text-[10px] leading-snug text-eve-muted">
          {sub}
        </span>
      )}
    </button>
  );
}

function ListPick({
  selected,
  onClick,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border px-3 py-3 text-left text-sm font-medium",
        selected
          ? "border-eve-teal bg-eve-teal-light text-eve-teal-dark"
          : "border-eve-muted/20 bg-white text-eve-teal-dark",
      )}
    >
      {label}
    </button>
  );
}

function ChipMulti({
  options,
  values,
  onChange,
}: {
  options: string[];
  values: string[];
  onChange: (next: string[]) => void;
}) {
  function toggle(o: string) {
    onChange(values.includes(o) ? values.filter((x) => x !== o) : [...values, o]);
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => toggle(o)}
          className={cn(
            "rounded-full border px-3 py-2 text-xs",
            values.includes(o)
              ? "border-eve-teal bg-eve-teal text-white"
              : "border-eve-muted/30 bg-white text-eve-teal-dark",
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <div className="mt-2">{children}</div>
    </div>
  );
}
