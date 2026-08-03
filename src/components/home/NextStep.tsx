import { useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SectionLabel } from "@/components/ui/SectionLabel";

/**
 * Exactly one prioritized care action. Derived from existing match-intake
 * state only — no new data sources, no fabricated tasks.
 */
export function NextStep({
  hasIntake,
  planTitle,
}: {
  hasIntake: boolean;
  planTitle: string | null;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const title = hasIntake ? (planTitle ?? t("homev2.carePlanLabel")) : t("homev2.nextStepSetup");
  const sub = hasIntake ? t("homev2.nextStepGoPlan") : t("homev2.nextStepSetupSub");
  const to = hasIntake ? "/eve/match/results" : "/eve/match";

  return (
    <button
      type="button"
      onClick={() => navigate({ to })}
      className="mx-3 mt-3 block w-full max-w-[calc(100%-1.5rem)] rounded-2xl border border-eve-teal/30 bg-gradient-to-br from-white to-eve-teal-light/40 p-4 text-left transition-transform active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eve-teal rtl:text-right"
    >
      <div className="flex items-start justify-between gap-3 rtl:flex-row-reverse">
        <div className="min-w-0 flex-1">
          <SectionLabel>{t("homev2.nextStep")}</SectionLabel>
          <p className="mt-1 font-serif text-eve-forest" style={{ fontSize: "17px" }}>
            {title}
          </p>
          <p className="mt-1 font-sans text-[13px] text-eve-teal-dark/70">{sub}</p>
        </div>
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-eve-teal text-white">
          <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        </span>
      </div>
    </button>
  );
}
