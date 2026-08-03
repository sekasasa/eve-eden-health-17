import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Bookmark,
  CalendarDays,
  ClipboardList,
  FileHeart,
  HeartHandshake,
  Search,
  ShieldCheck,
  ShoppingBag,
  Stethoscope,
  Users,
} from "lucide-react";
import { EveShell } from "@/components/shells/EveShell";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ANALYTICS_EVENTS, track } from "@/lib/analytics";
import { isFeatureEnabled } from "@/lib/flags";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/eve/care")({
  head: () => ({
    meta: [
      { title: "Care Hub — Eve & Eden Health" },
      {
        name: "description",
        content:
          "Find verified maternal care, manage appointments and next steps, and reach labs, prescription and payment support in one place.",
      },
      { property: "og:title", content: "Care Hub — Eve & Eden Health" },
      {
        property: "og:description",
        content:
          "Find verified maternal care, manage appointments and next steps, and reach labs, prescription and payment support in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CareHub,
});

function CareHub() {
  const { t } = useTranslation();
  const registrationOn = isFeatureEnabled("eventRegistration");
  const sharingOn = isFeatureEnabled("carePassportSharing");

  useEffect(() => {
    track(ANALYTICS_EVENTS.careHubOpened, { source: "nav" });
  }, []);

  return (
    <EveShell>
      <div className="rtl:text-right">
        <h1 className="font-serif text-eve-forest" style={{ fontSize: "28px" }}>
          {t("care.title")}
        </h1>
        <p className="mt-1 font-sans text-[14px] leading-snug text-eve-teal-dark/80">
          {t("care.intro")}
        </p>

        {/* A. Primary card — find trusted care */}
        <section className="mt-5 rounded-3xl border border-eve-sand bg-white p-4 shadow-sm">
          <p className="inline-flex items-center gap-1.5 font-sans text-[12px] font-medium text-eve-teal rtl:flex-row-reverse">
            <ShieldCheck className="h-4 w-4" />
            {t("care.trust")}
          </p>
          <h2 className="mt-2 font-serif text-[20px] text-eve-teal-dark">
            {t("care.findTitle")}
          </h2>
          <p className="mt-1 font-sans text-[14px] leading-snug text-eve-teal-dark/75">
            {t("care.findBody")}
          </p>
          <Link
            to="/eve/providers"
            className={cn(
              "mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-eve-teal px-5 font-sans text-[15px] font-medium text-white transition active:scale-95",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eve-teal focus-visible:ring-offset-2",
            )}
          >
            <Search className="h-4 w-4" />
            {t("care.findCta")}
          </Link>
          <Link
            to="/eve/match"
            className={cn(
              "mt-2 flex min-h-[44px] items-center gap-2 font-sans text-[14px] font-medium text-eve-teal underline underline-offset-4 rtl:flex-row-reverse",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eve-teal focus-visible:ring-offset-2 rounded-md",
            )}
          >
            <Stethoscope className="h-4 w-4 shrink-0" />
            {t("care.matchCta")}
          </Link>
        </section>

        {/* B. Your care */}
        <section className="mt-6">
          <SectionLabel>{t("care.yourCare")}</SectionLabel>
          <div className="mt-2 space-y-2">
            <Row
              to="/eve/match/results"
              icon={FileHeart}
              label={t("care.planLabel")}
              sub={t("care.planSub")}
            />
            <Row
              to="/eve/appointments"
              icon={CalendarDays}
              label={t("care.apptLabel")}
              sub={t("care.apptSub")}
            />
            <Row
              to="/eve/referrals"
              icon={Users}
              label={t("care.referralsLabel")}
              sub={t("care.referralsSub")}
            />
          </div>
        </section>

        {/* C. Events & classes */}
        <section className="mt-6">
          <SectionLabel>{t("care.events")}</SectionLabel>
          <div className="mt-2">
            <Row
              to="/eve/events"
              icon={CalendarDays}
              label={t("care.events")}
              sub={registrationOn ? t("care.eventsBrowse") : t("care.eventsOff")}
            />
          </div>
        </section>

        {/* D. Care support */}
        <section className="mt-6">
          <SectionLabel>{t("care.support")}</SectionLabel>
          <div className="mt-2">
            <Row
              to="/eve/care-support"
              icon={HeartHandshake}
              label={t("care.supportLabel")}
              sub={t("care.supportSub")}
            />
          </div>
        </section>

        {/* E. Secondary tools, de-emphasized */}
        <section className="mt-6">
          <SectionLabel>{t("care.more")}</SectionLabel>
          <div className="mt-2 space-y-2">
            <Row
              muted
              to="/eve/passport"
              icon={ClipboardList}
              label={t("care.passportLabel")}
              sub={sharingOn ? t("care.passportSubOn") : t("care.passportSub")}
            />
            <Row
              muted
              to="/eve/vendors"
              icon={ShoppingBag}
              label={t("care.vendorsLabel")}
              sub={t("care.vendorsSub")}
            />
          </div>
        </section>

        {/* F. Saved — truthful empty state (no saved-care storage exists yet) */}
        <section className="mt-6">
          <SectionLabel>{t("care.saved")}</SectionLabel>
          <div className="mt-2 flex items-center gap-3 rounded-2xl border border-dashed border-eve-sand bg-eve-cream/50 p-4 rtl:flex-row-reverse rtl:text-right">
            <Bookmark className="h-5 w-5 shrink-0 text-eve-teal-dark/50" />
            <p className="font-sans text-[13px] text-eve-teal-dark/70">
              {t("care.savedEmpty")}
            </p>
          </div>
        </section>
      </div>
    </EveShell>
  );
}

function Row({
  to,
  icon: Icon,
  label,
  sub,
  muted,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  sub: string;
  muted?: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex min-h-[60px] items-center gap-3 rounded-2xl border p-3 transition-transform active:scale-[0.99] rtl:flex-row-reverse rtl:text-right",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eve-teal focus-visible:ring-offset-2",
        muted ? "border-eve-sand bg-eve-cream/60" : "border-eve-sand bg-white",
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          muted ? "bg-white text-eve-teal-dark/60" : "bg-eve-teal-light text-eve-teal",
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block font-sans text-[15px] font-semibold text-eve-teal-dark">
          {label}
        </span>
        <span className="block font-sans text-[13px] leading-snug text-eve-teal-dark/70">
          {sub}
        </span>
      </span>
    </Link>
  );
}
