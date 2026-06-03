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
import { MATCH_PROVIDERS } from "@/lib/match-data";
import { eveToast } from "@/lib/eve-toast";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/eve/match/results")({
  component: MatchResults,
});

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

  const matched = useMemo(() => {
    const stage = intake.stage;
    const city = intake.city?.toLowerCase() ?? "";
    const lang = intake.language;
    const wantsIntl = intake.payment === "international";
    const wantsSelf = intake.payment === "self_pay";
    return MATCH_PROVIDERS.map((p) => {
      let score = 0;
      if (stage && p.bestFor.includes(stage)) score += 3;
      if (city && p.city.toLowerCase().includes(city.split(" ")[0])) score += 2;
      if (lang && p.languages.includes(lang)) score += 2;
      if (wantsIntl && p.acceptsInternational) score += 2;
      if (wantsSelf && p.acceptsSelfPay) score += 1;
      return { p, score };
    })
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((x) => x.p);
  }, [intake]);

  const nextStep = recommendedStep(intake);

  return (
    <EveShell>
      <div className="px-3">
        <div className="mb-2 flex items-center justify-between">
          <button
            onClick={() => nav({ to: "/eve/match" })}
            className="inline-flex items-center gap-1 text-xs text-eve-muted"
          >
            <ArrowLeft className="h-3 w-3" /> Edit answers
          </button>
          <Link
            to="/eve/match/history"
            className="inline-flex items-center gap-1 text-xs text-eve-teal"
          >
            <History className="h-3 w-3" /> History
          </Link>
        </div>
        <SectionLabel>Your matches</SectionLabel>
        <h1 className="mt-1 font-serif text-eve-forest" style={{ fontSize: "22px" }}>
          {intake.stage === "ttc" || intake.stage === "ivf"
            ? "Here are your best next steps for fertility support"
            : "Here are your best next steps"}
        </h1>
      </div>

      {/* Recommended Next Step */}
      <section className="mx-3 mt-4 rounded-2xl bg-eve-teal p-4 text-white">
        <p className="text-[10px] uppercase tracking-widest text-white/70">
          Recommended next step
        </p>
        <p className="mt-1 text-sm leading-relaxed">{nextStep}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <PrimaryButton
            onClick={() => eveToast.success("Saved to your plan")}
            className="!bg-white !text-eve-teal !py-2 !px-4 text-xs"
          >
            Start
          </PrimaryButton>
          <button
            onClick={() => eveToast.info("Saved for later")}
            className="rounded-full border border-white/40 px-4 py-2 text-xs text-white"
          >
            Save
          </button>
          <Link
            to="/eve/ask"
            className="rounded-full border border-white/40 px-4 py-2 text-xs text-white"
          >
            Ask a Navigator
          </Link>
        </div>
      </section>

      {/* Matched Providers / Vendors */}
      <section className="mt-5 px-3">
        <SectionLabel>Matched providers & vendors</SectionLabel>
        <div className="mt-2 flex flex-col gap-2">
          {matched.map((p) => (
            <article
              key={p.id}
              className="rounded-2xl border border-eve-muted/20 bg-white p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <h3 className="truncate font-sans text-sm font-semibold text-eve-teal-dark">
                      {p.name}
                    </h3>
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-eve-teal" />
                  </div>
                  <p className="text-[11px] text-eve-muted">
                    {p.category} · {p.city}
                  </p>
                  <p className="mt-1 text-[11px] text-eve-teal-dark">
                    {p.languages.join(" · ")} · {p.priceRange}
                  </p>
                </div>
                <TierBadge tier={p.tier} />
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {p.tags.slice(0, 3).map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-eve-cream px-2 py-0.5 text-[10px] text-eve-teal-dark"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-1 text-[10px] text-eve-muted">
                {p.visitTypes.map((v) => (
                  <span key={v} className="rounded bg-eve-teal-light px-1.5 py-0.5 text-eve-teal">
                    {v}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <PrimaryButton
                  onClick={() => eveToast.success(`Request sent to ${p.name}`)}
                  className="!py-1.5 !px-3 text-xs"
                >
                  Request booking
                </PrimaryButton>
                <SecondaryButton
                  onClick={() => eveToast.info("Saved")}
                  className="!py-1.5 !px-3 text-xs inline-flex items-center gap-1"
                >
                  <Bookmark className="h-3 w-3" /> Save
                </SecondaryButton>
              </div>
            </article>
          ))}
        </div>
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
            covered="See plans matched to pregnancy, postpartum, pediatrics"
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
          <ToolTile
            to="/eve/match/labs"
            icon={<FlaskConical className="h-4 w-4 text-eve-teal" />}
            label="Understand my labs"
          />
          <ToolTile
            to="/eve/match/prescriptions"
            icon={<Pill className="h-4 w-4 text-eve-terra" />}
            label="Check my prescription"
          />
          <ToolTile
            to="/eve/match/insurance"
            icon={<ShieldCheck className="h-4 w-4 text-eve-forest" />}
            label="Insurance/payment help"
          />
          <ToolTile
            to="/eve/match/family"
            icon={<Users className="h-4 w-4 text-eve-rose" />}
            label="Invite family supporter"
          />
          <ToolTile
            to="/eve/ask"
            icon={<MessageCircle className="h-4 w-4 text-eve-teal" />}
            label="Message care navigator"
          />
          <ToolTile
            to="/eve/match"
            icon={<PhoneCall className="h-4 w-4 text-eve-muted" />}
            label="Update my answers"
            onClick={() => resetIntake()}
          />
        </div>
      </section>

      <p className="mt-5 px-3 pb-2 text-[10px] leading-relaxed text-eve-muted">
        For urgent or life-threatening symptoms, please contact emergency services
        or seek immediate medical care.
      </p>
    </EveShell>
  );
}

function recommendedStep(i: ReturnType<typeof readIntake>) {
  if (i.urgency === "today")
    return "We've prioritised providers available today. Tap Request Booking on a match below to confirm a slot.";
  if (i.stage === "ivf")
    return "Compare fertility clinics, recommended labs, and medication or self-pay packages — and talk to a care navigator when you're ready.";
  if (i.stage === "ttc")
    return "Explore preconception care, fertility labs, and clinics that match your budget and language.";
  if (i.need === "labs_explain")
    return "Upload your lab result and we'll explain it in plain language so you can prepare for your next visit.";
  if (i.need === "rx_explain")
    return "Add your medication and we'll share what to ask your doctor or pharmacist.";
  if (i.payment === "compare")
    return "Compare insurance vendors side-by-side to find a plan that fits your life stage and budget.";
  if (i.stage === "postpartum")
    return "Book a postpartum check-in and save questions for your next visit.";
  return "Book a first visit with a matched provider and save your questions ahead of time.";
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
