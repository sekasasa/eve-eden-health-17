import { useTranslation } from "react-i18next";
import { PenLine } from "lucide-react";

/**
 * The single existing seeded answer, labelled as team-written sample content.
 * Never presented as a clinician-verified or member reply.
 */
export function CommunityThreadReply({ answer }: { answer: string }) {
  const { t } = useTranslation();
  return (
    <section
      aria-labelledby="thread-sample-answer"
      className="mt-5 rounded-2xl border border-eve-sand bg-white p-4 rtl:text-right"
    >
      <h2
        id="thread-sample-answer"
        className="inline-flex items-center gap-2 text-[13px] font-semibold text-eve-teal"
      >
        <PenLine className="h-3.5 w-3.5" aria-hidden="true" />
        {t("community.detail.sampleAnswerTitle")}
      </h2>
      <p className="mt-2 text-[14px] leading-relaxed text-eve-teal-dark/85">{answer}</p>
      <p className="mt-2 text-[12px] text-eve-teal-dark/60">{t("community.topAnswerSample")}</p>
    </section>
  );
}
