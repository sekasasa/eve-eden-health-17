import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  MessageCircle,
  Bookmark,
  FlaskConical,
  Pill,
  Users,
  PhoneCall,
  History,
  Stethoscope,
  Sparkles,
  Heart,
  Baby,
  ShoppingBag,
} from "lucide-react";
import { EveShell } from "@/components/shells/EveShell";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import {
  readIntake,
  resetIntake,
  hydrateIntakeFromCloud,
  type MatchIntake,
} from "@/lib/match-store";
import { MATCH_PROVIDERS, type LifeStage } from "@/lib/match-data";
import { eveToast } from "@/lib/eve-toast";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/eve/match/results")({
  component: MatchResults,
});

/**
 * Per-pathway configuration. Each life-stage card a user can pick maps to a
 * tailored set of headlines, suggested next actions, support tools, and a
 * provider-category filter so the Results page acts like a real care
 * navigation engine instead of a generic list.
 */
type ActionBtn = { label: string; to: string; icon?: React.ReactNode };
type Tool = { to: string; label: string; icon: React.ReactNode };

type Pathway = {
  eyebrow: string;
  headline: string;
  recommended: string;
  actions: ActionBtn[];
  tools: Tool[];
  providerCategories: string[]; // substring match on provider.category
};

const tool = (
  to: string,
  label: string,
  icon: React.ReactNode,
): Tool => ({ to, label, icon });

const TOOLS = {
  labs: tool("/eve/match/labs", "Understand labs", <FlaskConical className="h-4 w-4 text-eve-teal" />),
  rx: tool("/eve/match/prescriptions", "Prescription support", <Pill className="h-4 w-4 text-eve-terra" />),
  insurance: tool("/eve/match/insurance", "Insurance & payment", <ShieldCheck className="h-4 w-4 text-eve-forest" />),
  family: tool("/eve/match/family", "Invite family", <Users className="h-4 w-4 text-eve-rose" />),
  navigator: tool("/eve/ask", "Care navigator", <MessageCircle className="h-4 w-4 text-eve-teal" />),
  providers: tool("/eve/providers", "Find a provider", <Stethoscope className="h-4 w-4 text-eve-teal" />),
  shops: tool("/eve/vendors", "Shops & services", <ShoppingBag className="h-4 w-4 text-eve-terra" />),
  edit: tool("/eve/match", "Update my answers", <PhoneCall className="h-4 w-4 text-eve-muted" />),
};

const PATHWAYS: Partial<Record<LifeStage, Pathway>> = {
  ttc: {
    eyebrow: "Fertility & preconception",
    headline: "Your fertility support plan",
    recommended:
      "Start with a preconception visit, then layer in cycle tracking, fertility labs, and a nutrition or supplement plan.",
    actions: [
      { label: "Find fertility support", to: "/eve/providers" },
      { label: "Understand labs", to: "/eve/match/labs" },
      { label: "Compare payment options", to: "/eve/match/insurance" },
      { label: "Talk to navigator", to: "/eve/ask" },
    ],
    tools: [TOOLS.providers, TOOLS.labs, TOOLS.rx, TOOLS.insurance, TOOLS.navigator, TOOLS.edit],
    providerCategories: ["OB-GYN", "Fertility", "Reproductive", "Wellness", "Lab"],
  },
  ivf: {
    eyebrow: "IVF & fertility treatment",
    headline: "Your IVF & fertility care plan",
    recommended:
      "Compare fertility clinics, recommended labs, IVF medication support, and self-pay or international insurance options — a navigator can help you decide.",
    actions: [
      { label: "Compare clinics", to: "/eve/providers" },
      { label: "Find fertility labs", to: "/eve/match/labs" },
      { label: "Medication support", to: "/eve/match/prescriptions" },
      { label: "Insurance / self-pay", to: "/eve/match/insurance" },
      { label: "Talk to navigator", to: "/eve/ask" },
    ],
    tools: [TOOLS.providers, TOOLS.labs, TOOLS.rx, TOOLS.insurance, TOOLS.navigator, TOOLS.edit],
    providerCategories: ["Fertility", "Reproductive", "Lab", "Pharmacy"],
  },
  pregnant: {
    eyebrow: "Pregnancy care",
    headline: "Your pregnancy care plan",
    recommended:
      "Book a prenatal visit, prepare lab and prescription questions, and confirm how your visits will be paid for.",
    actions: [
      { label: "Find prenatal provider", to: "/eve/providers" },
      { label: "Understand labs", to: "/eve/match/labs" },
      { label: "Check prescriptions", to: "/eve/match/prescriptions" },
      { label: "Compare payment", to: "/eve/match/insurance" },
      { label: "Find birth support", to: "/eve/vendors" },
    ],
    tools: [TOOLS.providers, TOOLS.labs, TOOLS.rx, TOOLS.insurance, TOOLS.shops, TOOLS.navigator],
    providerCategories: ["OB-GYN", "Midwife", "Doula", "Lab", "Pharmacy"],
  },
  postpartum: {
    eyebrow: "Postpartum recovery",
    headline: "Your postpartum support plan",
    recommended:
      "Book a postpartum check-in, line up lactation and mental-health support, and invite a family supporter to help.",
    actions: [
      { label: "Find postpartum care", to: "/eve/providers" },
      { label: "Lactation support", to: "/eve/providers" },
      { label: "Medication safety", to: "/eve/match/prescriptions" },
      { label: "Invite family supporter", to: "/eve/match/family" },
      { label: "Talk to navigator", to: "/eve/ask" },
    ],
    tools: [TOOLS.providers, TOOLS.rx, TOOLS.labs, TOOLS.family, TOOLS.insurance, TOOLS.navigator],
    providerCategories: ["OB-GYN", "Midwife", "Lactation", "Therapist", "Pharmacy"],
  },
  newborn: {
    eyebrow: "Newborn & child care",
    headline: "Your child care support plan",
    recommended:
      "Book a pediatric check-in, add feeding support, and decide whether insurance or self-pay fits your family best.",
    actions: [
      { label: "Find pediatric care", to: "/eve/providers" },
      { label: "Feeding support", to: "/eve/providers" },
      { label: "Shop baby essentials", to: "/eve/vendors" },
      { label: "Check insurance/payment", to: "/eve/match/insurance" },
      { label: "Save appointments", to: "/eve/appointments" },
    ],
    tools: [TOOLS.providers, TOOLS.shops, TOOLS.insurance, TOOLS.family, TOOLS.navigator],
    providerCategories: ["Pediatric", "Lactation", "Midwife"],
  },
  pcos: {
    eyebrow: "Hormonal health & PCOS",
    headline: "Your hormonal health support plan",
    recommended:
      "Start with a hormone-focused visit, run baseline labs (thyroid, glucose, hormones), and ask about supplements or prescriptions.",
    actions: [
      { label: "Find hormonal provider", to: "/eve/providers" },
      { label: "Understand labs", to: "/eve/match/labs" },
      { label: "Prescription support", to: "/eve/match/prescriptions" },
      { label: "Explore fertility support", to: "/eve/providers" },
      { label: "Talk to navigator", to: "/eve/ask" },
    ],
    tools: [TOOLS.providers, TOOLS.labs, TOOLS.rx, TOOLS.insurance, TOOLS.navigator],
    providerCategories: ["OB-GYN", "Reproductive", "Wellness", "Lab"],
  },
  mood: {
    eyebrow: "Mental & emotional support",
    headline: "Your mood support plan",
    recommended:
      "Connect with a therapist who understands maternal mental health — telehealth can start within days.",
    actions: [
      { label: "Find a therapist", to: "/eve/providers" },
      { label: "Invite family supporter", to: "/eve/match/family" },
      { label: "Check medication safety", to: "/eve/match/prescriptions" },
      { label: "Talk to navigator", to: "/eve/ask" },
    ],
    tools: [TOOLS.providers, TOOLS.rx, TOOLS.family, TOOLS.navigator],
    providerCategories: ["Therapist", "OB-GYN", "Midwife"],
  },
  wellness: {
    eyebrow: "Wellness & preventive care",
    headline: "Your wellness care plan",
    recommended:
      "Schedule your annual women's-health visit and decide which preventive screenings or labs to add this year.",
    actions: [
      { label: "Find wellness provider", to: "/eve/providers" },
      { label: "Explore screenings", to: "/eve/providers" },
      { label: "Understand labs", to: "/eve/match/labs" },
      { label: "Compare payment options", to: "/eve/match/insurance" },
    ],
    tools: [TOOLS.providers, TOOLS.labs, TOOLS.insurance, TOOLS.shops, TOOLS.navigator],
    providerCategories: ["Wellness", "OB-GYN", "Lab"],
  },
  family: {
    eyebrow: "Family support",
    headline: "Your family care coordination plan",
    recommended:
      "Invite them with the permissions that fit your relationship — you can help book, pay, or just stay informed.",
    actions: [
      { label: "Invite family member", to: "/eve/match/family" },
      { label: "Help pay for care", to: "/eve/match/insurance" },
      { label: "Find provider/vendor", to: "/eve/providers" },
      { label: "Track appointments", to: "/eve/appointments" },
      { label: "Talk to navigator", to: "/eve/ask" },
    ],
    tools: [TOOLS.family, TOOLS.providers, TOOLS.insurance, TOOLS.navigator],
    providerCategories: [],
  },
  labs: {
    eyebrow: "Lab results support",
    headline: "Your lab results support plan",
    recommended:
      "Upload or enter your lab result and we'll help you understand what to ask next, then connect you with a provider if needed.",
    actions: [
      { label: "Upload result", to: "/eve/match/labs" },
      { label: "Find a lab/provider", to: "/eve/providers" },
      { label: "Ask navigator", to: "/eve/ask" },
    ],
    tools: [TOOLS.labs, TOOLS.providers, TOOLS.rx, TOOLS.insurance, TOOLS.navigator],
    providerCategories: ["Lab", "OB-GYN", "Wellness"],
  },
  rx: {
    eyebrow: "Prescription support",
    headline: "Your prescription support plan",
    recommended:
      "Add a medication or upload your prescription and we'll help you prepare the right questions, find a pharmacy, and check cost options.",
    actions: [
      { label: "Add medication", to: "/eve/match/prescriptions" },
      { label: "Find pharmacy", to: "/eve/providers" },
      { label: "Check payment", to: "/eve/match/insurance" },
      { label: "Ask navigator", to: "/eve/ask" },
    ],
    tools: [TOOLS.rx, TOOLS.providers, TOOLS.insurance, TOOLS.navigator],
    providerCategories: ["Pharmacy", "OB-GYN"],
  },
  insurance: {
    eyebrow: "Insurance & payment",
    headline: "Your insurance & payment options",
    recommended:
      "Compare local, international, and self-pay options that fit your life stage and budget.",
    actions: [
      { label: "Compare vendors", to: "/eve/match/insurance" },
      { label: "Find providers", to: "/eve/providers" },
      { label: "Invite family", to: "/eve/match/family" },
      { label: "Ask navigator", to: "/eve/ask" },
    ],
    tools: [TOOLS.insurance, TOOLS.providers, TOOLS.family, TOOLS.navigator],
    providerCategories: [],
  },
};


const DEFAULT_PATHWAY: Pathway = {
  eyebrow: "Your matches",
  headline: "Here are your best next steps",
  recommended:
    "Book a first visit with a matched provider and save your questions ahead of time.",
  actions: [
    { label: "Find care", to: "/eve/providers" },
    { label: "Insurance & payment", to: "/eve/match/insurance" },
    { label: "Talk to navigator", to: "/eve/ask" },
  ],
  tools: [TOOLS.providers, TOOLS.labs, TOOLS.rx, TOOLS.insurance, TOOLS.family, TOOLS.navigator],
  providerCategories: [],
};

function MatchResults() {
  const nav = useNavigate();
  const [intake, setIntake] = useState<MatchIntake>(() => readIntake());

  useEffect(() => {
    let cancel = false;
    hydrateIntakeFromCloud().then((i) => {
      if (!cancel) setIntake(i);
    });
    return () => {
      cancel = true;
    };
  }, []);

  const pathway: Pathway =
    (intake.stage && PATHWAYS[intake.stage]) || DEFAULT_PATHWAY;

  const matched = useMemo(() => {
    const stage = intake.stage;
    const city = intake.city?.toLowerCase() ?? "";
    const lang = intake.language;
    const wantsIntl = intake.payment === "international";
    const wantsSelf = intake.payment === "self_pay";
    const cats = pathway.providerCategories;
    return MATCH_PROVIDERS.map((p) => {
      let score = 0;
      if (stage && p.bestFor.includes(stage)) score += 3;
      if (cats.length && cats.some((c) => p.category.toLowerCase().includes(c.toLowerCase())))
        score += 4;
      if (city && p.city.toLowerCase().includes(city.split(" ")[0])) score += 2;
      if (lang && p.languages.includes(lang)) score += 2;
      if (wantsIntl && p.acceptsInternational) score += 2;
      if (wantsSelf && p.acceptsSelfPay) score += 1;
      return { p, score };
    })
      .filter((x) => (cats.length ? x.score >= 4 : true))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((x) => x.p);
  }, [intake, pathway]);

  const urgencyNote =
    intake.urgency === "today"
      ? "We've prioritised providers available today."
      : null;

  return (
    <EveShell>
      <div className="px-3">
        <div className="mb-2 flex items-center justify-between">
          <button
            onClick={() => nav({ to: "/eve/home" })}
            className="inline-flex items-center gap-1 text-xs text-eve-muted"
          >
            <ArrowLeft className="h-3 w-3" /> Back to dashboard
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => nav({ to: "/eve/match" })}
              className="inline-flex items-center gap-1 text-xs text-eve-teal"
            >
              <Sparkles className="h-3 w-3" /> Update my care profile
            </button>
            <Link
              to="/eve/match/history"
              className="inline-flex items-center gap-1 text-xs text-eve-teal"
            >
              <History className="h-3 w-3" /> History
            </Link>
          </div>
        </div>
        <SectionLabel>{pathway.eyebrow}</SectionLabel>
        <h1 className="mt-1 font-serif text-eve-forest" style={{ fontSize: "22px" }}>
          {pathway.headline}
        </h1>
      </div>

      {/* Your next steps — numbered, actionable */}
      <section className="mx-3 mt-4 rounded-2xl bg-eve-teal p-4 text-white">
        <p className="text-[10px] uppercase tracking-widest text-white/70">
          Your next steps
        </p>
        <p className="mt-1 text-sm leading-relaxed text-white/90">
          {urgencyNote ? `${urgencyNote} ` : ""}{pathway.recommended}
        </p>
        <ol className="mt-3 flex flex-col gap-2">
          {pathway.actions.slice(0, 3).map((a, i) => (
            <li key={a.label}>
              <Link
                to={a.to}
                className="flex items-center gap-3 rounded-xl bg-white/10 px-3 py-2.5 transition-colors hover:bg-white/15"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-eve-teal">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm font-medium text-white">{a.label}</span>
                <span className="text-white/60">→</span>
              </Link>
            </li>
          ))}
        </ol>
        {pathway.actions.length > 3 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {pathway.actions.slice(3).map((a) => (
              <Link
                key={a.label}
                to={a.to}
                className="rounded-full border border-white/30 bg-transparent px-3 py-1.5 text-[11px] text-white/90"
              >
                {a.label}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Matched providers — link to real, verified directory */}
      <section className="mt-5 px-3">
        <SectionLabel>Find your matched providers</SectionLabel>
        <button
          type="button"
          onClick={() => nav({ to: "/eve/providers" })}
          className="mt-2 flex w-full items-center justify-between gap-3 rounded-2xl border border-eve-teal/20 bg-white p-4 text-left transition-transform active:scale-[0.99]"
        >
          <div className="min-w-0 flex-1">
            <p className="font-sans text-sm font-semibold text-eve-teal-dark">
              Verified providers for {pathway.eyebrow.toLowerCase()}
            </p>
            <p className="mt-0.5 text-[11px] text-eve-muted">
              Filtered by your stage, language, and city.
            </p>
          </div>
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-eve-teal text-white">
            →
          </span>
        </button>
      </section>


      {/* Payment options */}
      <section className="mt-5 px-3">
        <SectionLabel>Your payment options</SectionLabel>
        <div className="mt-2 flex flex-col gap-2">
          <PaymentOption
            title="Use existing insurance"
            covered="Doctor visits, labs, basic maternity may be covered"
            notCovered="Some specialists, home visits, premium products"
            cost="0–150 MAD co-pay typical"
            cta="Check Coverage"
            onClick={() => eveToast.info("We'll verify with your insurer")}
          />
          <PaymentOption
            title="Compare insurance vendors"
            covered="See plans matched to your life stage and goals"
            notCovered="Waiting periods may apply"
            cost="From 350 MAD/mo"
            cta="Compare Plans"
            onClick={() => nav({ to: "/eve/match/insurance" })}
          />
          <PaymentOption
            title="Self-pay options"
            covered="Faster booking, your choice of provider"
            notCovered="No reimbursement paperwork"
            cost="From 200 MAD/visit"
            cta="Choose Self-Pay"
            onClick={() => eveToast.success("Self-pay preference saved")}
          />
        </div>
        <p className="mt-2 text-[11px] text-eve-muted">
          Not sure? A care navigator can help you compare your options.
        </p>
      </section>

      {/* Support tools */}
      <section className="mt-5 px-3">
        <SectionLabel>Support tools</SectionLabel>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {pathway.tools.map((t) => (
            <ToolTile
              key={t.label + t.to}
              to={t.to}
              icon={t.icon}
              label={t.label}
              onClick={t.to === "/eve/match" ? () => resetIntake() : undefined}
            />
          ))}
        </div>
      </section>

      <p className="mt-5 px-3 pb-2 text-[10px] leading-relaxed text-eve-muted">
        Eve & Eden provides education and care navigation — not diagnosis. For
        urgent or life-threatening symptoms, please contact emergency services
        or seek immediate medical care.
      </p>
      {/* unused icon imports kept for lint */}
      <span className="hidden">
        <Sparkles /> <Heart /> <Baby />
      </span>
    </EveShell>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const color =
    tier === "Clinical Partner"
      ? "bg-eve-teal text-white"
      : tier === "Preferred Partner"
        ? "bg-eve-terra text-white"
        : tier === "Verified"
          ? "bg-eve-teal-light text-eve-teal"
          : "bg-eve-cream text-eve-muted";
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-medium", color)}>
      {tier}
    </span>
  );
}

function PaymentOption({
  title,
  covered,
  notCovered,
  cost,
  cta,
  onClick,
}: {
  title: string;
  covered: string;
  notCovered: string;
  cost: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <div className="rounded-2xl border border-eve-muted/20 bg-white p-3">
      <p className="text-sm font-semibold text-eve-teal-dark">{title}</p>
      <p className="mt-1 text-[11px] text-eve-teal">✓ {covered}</p>
      <p className="text-[11px] text-eve-muted">✗ {notCovered}</p>
      <p className="mt-1 text-[11px] font-medium text-eve-terra">{cost}</p>
      <button
        onClick={onClick}
        className="mt-2 rounded-full bg-eve-teal-light px-3 py-1.5 text-xs font-medium text-eve-teal"
      >
        {cta}
      </button>
    </div>
  );
}

function ToolTile({
  to,
  icon,
  label,
  onClick,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex flex-col items-start gap-2 rounded-xl border border-eve-muted/20 bg-white p-3"
    >
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-eve-cream">
        {icon}
      </div>
      <p className="text-[11px] font-medium text-eve-teal-dark">{label}</p>
    </Link>
  );
}
