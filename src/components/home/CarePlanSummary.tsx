import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { StageRing } from "@/components/ui/StageRing";
import { babySizeFor } from "@/lib/babySize";
import { cn } from "@/lib/utils";

/**
 * Compact stage / care-plan summary. Secondary to "Your next step" —
 * it never becomes a second competing primary CTA.
 */
export function CarePlanSummary({
  loading,
  isPregnancyStage,
  week,
  dueDate,
  trimesterKey,
  stageSubtitle,
}: {
  loading: boolean;
  isPregnancyStage: boolean;
  week: number;
  dueDate: string | null;
  trimesterKey: string;
  stageSubtitle: string | null;
}) {
  const { t } = useTranslation();
  const progressPct = Math.min(100, Math.round((week / 40) * 100));

  if (loading) {
    return (
      <div className="mx-3 mt-5">
        <div className={cn("h-24 w-full animate-pulse rounded-2xl bg-eve-muted/20")} />
      </div>
    );
  }

  if (!isPregnancyStage && !stageSubtitle) return null;

  return (
    <section className="mx-3 mt-5 rounded-2xl border border-eve-teal/20 bg-white p-4 rtl:text-right">
      <div className="flex items-center justify-between gap-2 rtl:flex-row-reverse">
        <SectionLabel>
          {isPregnancyStage ? t(`trimester.${trimesterKey}`) : t("homev2.whereYouAre")}
        </SectionLabel>
        <Link
          to="/eve/match/results"
          className="font-sans text-[13px] font-medium text-eve-teal underline-offset-2 hover:underline"
        >
          {t("homev2.viewPlan")}
        </Link>
      </div>

      {isPregnancyStage ? (
        <>
          <div className="mt-2 flex items-center gap-4 rtl:flex-row-reverse">
            <StageRing week={week} size={52} />
            <div className="min-w-0 flex-1 rtl:text-right">
              <p className="font-sans text-[14px] text-eve-teal-dark">
                {t("home.babySize", { size: babySizeFor(week) })}
              </p>
              {dueDate && (
                <p className="mt-1 font-sans text-[12px] text-eve-teal-dark/70">
                  {t("home.due", { date: dueDate })}
                </p>
              )}
            </div>
          </div>
          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-eve-teal-light">
            <div
              className="h-full rounded-full bg-eve-teal transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </>
      ) : (
        <p className="mt-1 font-sans text-[14px] text-eve-teal-dark">{stageSubtitle}</p>
      )}
    </section>
  );
}
