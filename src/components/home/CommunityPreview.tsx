import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, MessageCircle } from "lucide-react";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ANALYTICS_EVENTS, track } from "@/lib/analytics";
import { previewPostsForStage } from "@/lib/community-seed";

/**
 * Up to three seeded community threads, clearly labelled as examples.
 * There is no post-detail route yet, so cards link to the feed only.
 */
export function CommunityPreview({
  stage,
  lang,
}: {
  stage?: string | null;
  lang: "en" | "fr" | "ar";
}) {
  const navigate = useNavigate();
  const posts = previewPostsForStage(stage, 3);

  const copy = {
    en: { label: "From the community", note: "Example conversations written by our team.", all: "See all" },
    fr: { label: "Depuis la communauté", note: "Conversations d'exemple écrites par notre équipe.", all: "Tout voir" },
    ar: { label: "من المجتمع", note: "محادثات نموذجية كتبها فريقنا.", all: "عرض الكل" },
  }[lang];

  if (posts.length === 0) return null;

  return (
    <section className="mt-5 px-3 rtl:text-right">
      <div className="flex items-center justify-between gap-2 rtl:flex-row-reverse">
        <SectionLabel>{copy.label}</SectionLabel>
        <Link to="/eve/community" className="font-sans text-[13px] font-medium text-eve-teal">
          {copy.all}
        </Link>
      </div>
      <p className="mt-1 font-sans text-[12px] text-eve-teal-dark/70">{copy.note}</p>
      <div className="mt-2 space-y-2">
        {posts.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              track(ANALYTICS_EVENTS.communityPreviewOpened, {
                post_category: p.category,
                is_sample: true,
              });
              navigate({ to: "/eve/community" });
            }}
            className="block w-full rounded-2xl border border-eve-sand bg-white p-3 text-left rtl:text-right"
          >
            <div className="flex items-center gap-2 rtl:flex-row-reverse">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-semibold text-white ${p.avatarColor}`}
              >
                {p.avatarLetter}
              </span>
              <span className="font-sans text-[13px] text-eve-teal-dark/80">{p.anonName}</span>
              <span className="ms-auto rounded-full border border-eve-sand px-2 py-0.5 font-sans text-[11px] font-semibold uppercase tracking-wide text-eve-teal-dark/70">
                Sample
              </span>
            </div>
            <p className="mt-2 font-serif text-[15px] leading-snug text-eve-teal-dark">
              {p.title}
            </p>
            <div className="mt-2 flex items-center gap-3 font-sans text-[12px] text-eve-teal-dark/70 rtl:flex-row-reverse">
              <span className="inline-flex items-center gap-1">
                <Heart className="h-3.5 w-3.5" /> {p.hearts}
              </span>
              <span className="inline-flex items-center gap-1">
                <MessageCircle className="h-3.5 w-3.5" /> {p.replies}
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
