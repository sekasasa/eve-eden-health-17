import { useNavigate } from "@tanstack/react-router";
import { MessageCircle, Sparkles, Stethoscope } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ANALYTICS_EVENTS, track } from "@/lib/analytics";

/**
 * "What do you need today?" — the single universal entry point on Home.
 * Three explicit choices, no free-text is ever sent to analytics.
 */
export function NeedPrompt() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const choices = [
    {
      id: "community",
      to: "/eve/community" as const,
      icon: MessageCircle,
      label: t("homev2.askCommunity"),
      sub: t("homev2.askCommunitySub"),
      accent: "bg-eve-rose-light text-eve-rose",
    },
    {
      id: "ask_eve",
      to: "/eve/ask" as const,
      icon: Sparkles,
      label: t("homev2.askEve"),
      sub: t("homev2.askEveSub"),
      accent: "bg-eve-teal-light text-eve-teal",
    },
    {
      id: "find_care",
      to: "/eve/care" as const,
      icon: Stethoscope,
      label: t("homev2.findCare"),
      sub: t("homev2.findCareSub"),
      accent: "bg-eve-terra-light text-eve-terra",
    },
  ];

  return (
    <section className="mx-3 mt-4 rounded-2xl border border-eve-teal/25 bg-white p-4">
      <h2 className="font-serif text-eve-forest" style={{ fontSize: "18px" }}>
        {t("homev2.needTitle")}
      </h2>
      <div className="mt-3 space-y-2">
        {choices.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => {
              track(ANALYTICS_EVENTS.homeNeedPromptSelected, { choice: c.id });
              if (c.id === "ask_eve") {
                track(ANALYTICS_EVENTS.askIntentSelected, { source: "home_need_prompt" });
              }
              if (c.id === "find_care") {
                track(ANALYTICS_EVENTS.careHubOpened, { source: "home_need_prompt" });
              }
              navigate({ to: c.to });
            }}
            className="flex min-h-[56px] w-full items-center gap-3 rounded-xl border border-eve-sand bg-eve-cream/60 px-3 py-2.5 text-left transition-transform active:scale-[0.99] rtl:flex-row-reverse rtl:text-right"
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${c.accent}`}
            >
              <c.icon className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block font-sans text-[15px] font-semibold text-eve-teal-dark">
                {c.label}
              </span>
              <span className="block font-sans text-[13px] text-eve-teal-dark/70">{c.sub}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
