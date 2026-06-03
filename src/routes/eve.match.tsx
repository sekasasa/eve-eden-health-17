import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { EveShell } from "@/components/shells/EveShell";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { writeIntake, readIntake, persistIntake } from "@/lib/match-store";
import type { LifeStage, NeedKey, PaymentKey, Urgency } from "@/lib/match-data";
import { eveToast } from "@/lib/eve-toast";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/eve/match")({
  component: MatchIntake,
});

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

const NEEDS: { key: NeedKey; label: string }[] = [
  { key: "doctor", label: "Find a doctor or specialist" },
  { key: "lab", label: "Find a lab" },
  { key: "pharmacy", label: "Find a pharmacy or medication support" },
  { key: "labs_explain", label: "Understand my lab results" },
  { key: "rx_explain", label: "Understand my prescription" },
  { key: "postpartum_support", label: "Find postpartum or baby support" },
  { key: "wellness", label: "Find wellness or home support" },
  { key: "insurance_understand", label: "Understand insurance/payment options" },
  { key: "insurance_compare", label: "Compare insurance vendors" },
  { key: "international", label: "Use international insurance" },
  { key: "self_pay", label: "Choose self-pay options" },
  { key: "navigator", label: "Talk to a care navigator" },
];

const PAYMENTS: { key: PaymentKey; label: string; sub: string }[] = [
  { key: "local_insurance", label: "I have local insurance", sub: "Use a Moroccan plan" },
  { key: "international", label: "I have international insurance", sub: "Use a global plan" },
  { key: "qualify", label: "See if I qualify for coverage", sub: "Eligibility check" },
  { key: "compare", label: "Compare insurance vendors", sub: "See your options" },
  { key: "self_pay", label: "I want to self-pay", sub: "Pay out-of-pocket" },
  { key: "family", label: "A family member will help", sub: "Invite a supporter" },
  { key: "unsure", label: "I'm not sure", sub: "A navigator can help" },
];

const URGENCY: { key: Urgency; label: string }[] = [
  { key: "today", label: "I need help today" },
  { key: "this_week", label: "This week" },
  { key: "planning", label: "Planning ahead" },
  { key: "exploring", label: "Just exploring" },
];

function MatchIntake() {
  const nav = useNavigate();
  const existing = readIntake();
  const [step, setStep] = useState(1);
  const [stage, setStage] = useState<LifeStage | undefined>(existing.stage);
  const [need, setNeed] = useState<NeedKey | undefined>(existing.need);
  const [city, setCity] = useState(existing.city ?? "");
  const [language, setLanguage] = useState(existing.language ?? "");
  const [payment, setPayment] = useState<PaymentKey | undefined>(existing.payment);
  const [urgency, setUrgency] = useState<Urgency | undefined>(existing.urgency);

  async function next() {
    writeIntake({ stage, need, city, language, payment, urgency });
    if (step < 4) {
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

  const canNext =
    (step === 1 && !!stage) ||
    (step === 2 && !!need) ||
    (step === 3 && city.trim().length > 0 && language.trim().length > 0) ||
    (step === 4 && !!payment && !!urgency);

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
        <SectionLabel>Care + Vendor Match</SectionLabel>
        <h1 className="mt-1 font-serif text-eve-forest" style={{ fontSize: "22px" }}>
          {step === 1 && "What are you navigating right now?"}
          {step === 2 && "What kind of help do you need?"}
          {step === 3 && "A few details about you"}
          {step === 4 && "Payment & timing"}
        </h1>
        <div className="mt-3 flex gap-1">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full",
                i <= step ? "bg-eve-teal" : "bg-eve-teal-light",
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
            {NEEDS.map((n) => (
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
            <Field label="City">
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Casablanca"
                className="w-full rounded-xl border border-eve-muted/30 bg-white px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Preferred language">
              <div className="grid grid-cols-2 gap-2">
                {["Arabic", "French", "English", "Berber"].map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLanguage(l)}
                    className={cn(
                      "rounded-full border px-3 py-2 text-xs",
                      language === l
                        ? "border-eve-teal bg-eve-teal text-white"
                        : "border-eve-muted/30 bg-white text-eve-teal-dark",
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-4">
            <div>
              <SectionLabel>How would you like to pay for care?</SectionLabel>
              <div className="mt-2 flex flex-col gap-2">
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
            </div>
            <div>
              <SectionLabel>When do you need support?</SectionLabel>
              <div className="mt-2 grid grid-cols-2 gap-2">
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
            </div>
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
          {step === 4 ? "See my matches" : "Continue"}
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
  emoji,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <div className="mt-2">{children}</div>
    </div>
  );
}
