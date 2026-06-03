import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Users,
  Stethoscope,
  FlaskConical,
  Pill,
  Heart,
  Building2,
} from "lucide-react";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { eveToast } from "@/lib/eve-toast";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/partner")({
  component: PartnerPage,
});

const CATEGORIES = [
  { key: "doctor", label: "Doctor / OB-GYN", icon: Stethoscope },
  { key: "midwife", label: "Midwife / Doula", icon: Heart },
  { key: "pediatrician", label: "Pediatrician", icon: Heart },
  { key: "therapist", label: "Therapist", icon: Heart },
  { key: "lab", label: "Lab", icon: FlaskConical },
  { key: "pharmacy", label: "Pharmacy", icon: Pill },
  { key: "lactation", label: "Lactation consultant", icon: Heart },
  { key: "postpartum", label: "Postpartum vendor", icon: Heart },
  { key: "baby", label: "Baby vendor", icon: Heart },
  { key: "wellness", label: "Wellness provider", icon: Heart },
  { key: "home_care", label: "Home care provider", icon: Heart },
  { key: "ins_local", label: "Local insurance", icon: ShieldCheck },
  { key: "ins_intl", label: "International insurance", icon: ShieldCheck },
  { key: "broker", label: "Insurance broker", icon: Building2 },
  { key: "employer", label: "Employer benefit partner", icon: Building2 },
  { key: "payment", label: "Payment plan / diaspora", icon: Building2 },
];

const TIERS = [
  { key: "Listed", color: "bg-eve-cream text-eve-muted" },
  { key: "Verified", color: "bg-eve-teal-light text-eve-teal" },
  { key: "Preferred Partner", color: "bg-eve-terra text-white" },
  { key: "Clinical Partner", color: "bg-eve-teal text-white" },
];

function PartnerPage() {
  const [step, setStep] = useState<"intro" | "form" | "done">("intro");
  const [name, setName] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [city, setCity] = useState("");
  const [langs, setLangs] = useState<string[]>([]);
  const [visits, setVisits] = useState<string[]>([]);
  const [bio, setBio] = useState("");

  function toggleArr(
    val: string,
    arr: string[],
    setter: (v: string[]) => void,
  ) {
    setter(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  }

  const valid = name && cat && city;

  if (step === "done") {
    return (
      <Wrapper>
        <div className="rounded-2xl border border-eve-muted/20 bg-white p-6 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-eve-teal" />
          <h2 className="mt-3 font-serif text-xl text-eve-forest">
            Thanks for partnering with us
          </h2>
          <p className="mt-2 text-sm text-eve-muted">
            We've received your profile. Our team will review your details and reach
            out within 2 business days to verify your listing.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Link
              to="/eden/dashboard"
              className="rounded-full bg-eve-teal px-4 py-2 text-xs text-white"
            >
              Go to vendor dashboard
            </Link>
            <Link
              to="/"
              className="rounded-full border border-eve-teal px-4 py-2 text-xs text-eve-teal"
            >
              Back to home
            </Link>
          </div>
        </div>
      </Wrapper>
    );
  }

  if (step === "form") {
    return (
      <Wrapper>
        <button
          onClick={() => setStep("intro")}
          className="mb-3 inline-flex items-center gap-1 text-xs text-eve-muted"
        >
          <ArrowLeft className="h-3 w-3" /> Back
        </button>
        <SectionLabel>Partner onboarding</SectionLabel>
        <h1 className="mt-1 font-serif text-eve-forest" style={{ fontSize: "22px" }}>
          Tell us about your service
        </h1>

        <div className="mt-4 flex flex-col gap-3">
          <Field label="Business or provider name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-eve-muted/30 bg-white px-3 py-2 text-sm"
              placeholder="e.g. Clinique Al Inbiat"
            />
          </Field>

          <Field label="Category">
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCat(c.key)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs",
                    cat === c.key
                      ? "border-eve-teal bg-eve-teal-light text-eve-teal-dark"
                      : "border-eve-muted/20 bg-white text-eve-teal-dark",
                  )}
                >
                  <c.icon className="h-3.5 w-3.5 text-eve-teal" />
                  {c.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="City">
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Casablanca"
              className="w-full rounded-xl border border-eve-muted/30 bg-white px-3 py-2 text-sm"
            />
          </Field>

          <Field label="Languages spoken">
            <div className="flex flex-wrap gap-2">
              {["Arabic", "French", "English", "Berber"].map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => toggleArr(l, langs, setLangs)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs",
                    langs.includes(l)
                      ? "border-eve-teal bg-eve-teal text-white"
                      : "border-eve-muted/30 bg-white text-eve-teal-dark",
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Visit types">
            <div className="flex flex-wrap gap-2">
              {["in-person", "telehealth", "home visit", "delivery"].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => toggleArr(v, visits, setVisits)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs",
                    visits.includes(v)
                      ? "border-eve-teal bg-eve-teal text-white"
                      : "border-eve-muted/30 bg-white text-eve-teal-dark",
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Short bio">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="What makes your care a great fit for mothers and families?"
              className="w-full rounded-xl border border-eve-muted/30 bg-white px-3 py-2 text-sm"
            />
          </Field>

          <PrimaryButton
            disabled={!valid}
            onClick={() => {
              eveToast.success("Profile submitted for review");
              setStep("done");
            }}
          >
            Submit for review
          </PrimaryButton>
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <Link
        to="/"
        className="mb-3 inline-flex items-center gap-1 text-xs text-eve-muted"
      >
        <ArrowLeft className="h-3 w-3" /> Back to home
      </Link>
      <SectionLabel>Partner with Eve & Eden</SectionLabel>
      <h1 className="mt-1 font-serif text-eve-forest" style={{ fontSize: "26px" }}>
        Receive qualified requests from mothers who need your care.
      </h1>
      <p className="mt-2 text-sm text-eve-muted">
        Eve & Eden connects vetted providers, labs, pharmacies, wellness vendors, and
        insurance partners to women across Morocco and beyond — matched by life stage,
        language, location, payment type, and urgency.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <Stat
          icon={<Users className="h-4 w-4 text-eve-teal" />}
          label="Matched requests"
          value="Daily"
        />
        <Stat
          icon={<ShieldCheck className="h-4 w-4 text-eve-teal" />}
          label="Verification tiers"
          value="4 levels"
        />
        <Stat
          icon={<Stethoscope className="h-4 w-4 text-eve-teal" />}
          label="Categories"
          value="16+"
        />
        <Stat
          icon={<Heart className="h-4 w-4 text-eve-teal" />}
          label="Culturally aligned"
          value="Built-in"
        />
      </div>

      <div className="mt-5">
        <SectionLabel>Verification tiers</SectionLabel>
        <div className="mt-2 flex flex-wrap gap-2">
          {TIERS.map((t) => (
            <span
              key={t.key}
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-medium",
                t.color,
              )}
            >
              {t.key}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <PrimaryButton onClick={() => setStep("form")}>
          Create my partner profile
        </PrimaryButton>
        <SecondaryButton onClick={() => eveToast.info("We'll be in touch")}>
          Talk to partnerships
        </SecondaryButton>
      </div>

      <p className="mt-6 text-[11px] text-eve-muted">
        Insurance vendors can list maternity, postpartum, pediatric, mental health,
        lab, prescription, telehealth, and international reimbursement coverage. Provider
        partners receive customer requests including life stage, language, payment
        type, and urgency — with Accept, Propose Time, Request More Info, or Decline.
      </p>
    </Wrapper>
  );
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-eve-sand">
      <div className="mx-auto max-w-xl px-5 py-8">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-eve-muted/20 bg-white p-3">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-eve-cream">
        {icon}
      </div>
      <p className="mt-1 text-[11px] text-eve-muted">{label}</p>
      <p className="text-sm font-semibold text-eve-teal-dark">{value}</p>
    </div>
  );
}
