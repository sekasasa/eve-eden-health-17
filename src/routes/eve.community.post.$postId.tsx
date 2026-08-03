import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Lock } from "lucide-react";
import { EveShell } from "@/components/shells/EveShell";
import { CommunityPostDetailHeader } from "@/components/community/CommunityPostDetailHeader";
import { CommunityThreadReply } from "@/components/community/CommunityThreadReply";
import { CommunityRelatedPosts } from "@/components/community/CommunityRelatedPosts";
import { CommunityCareAction } from "@/components/community/CommunityCareAction";
import { ANALYTICS_EVENTS, track } from "@/lib/analytics";
import { eveToast } from "@/lib/eve-toast";
import {
  isReported,
  readReports,
  reportAcknowledgement,
  submitReport,
  type ReportStore,
} from "@/lib/moderation";
import { postById, relatedPosts } from "@/lib/community-seed";

export const Route = createFileRoute("/eve/community/post/$postId")({
  head: () => ({
    meta: [
      { title: "Community conversation — Eve & Eden Health" },
      {
        name: "description",
        content:
          "Read a full example community conversation about fertility, pregnancy, postpartum or finding care.",
      },
      { property: "og:title", content: "Community conversation — Eve & Eden Health" },
      {
        property: "og:description",
        content:
          "Read a full example community conversation about fertility, pregnancy, postpartum or finding care.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CommunityPostDetailPage,
});

function BackLink() {
  const { t } = useTranslation();
  return (
    <Link
      to="/eve/community"
      className="mb-2 mt-2 inline-flex min-h-11 items-center gap-1 text-[13px] text-eve-teal-dark/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eve-teal rtl:flex-row-reverse"
    >
      <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
      {t("community.detail.back")}
    </Link>
  );
}

function CommunityPostDetailPage() {
  const { postId } = Route.useParams();
  const { t } = useTranslation();
  const post = useMemo(() => postById(postId), [postId]);

  const [reports, setReports] = useState<ReportStore>({});
  const [hearted, setHearted] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => setReports(readReports()), []);

  useEffect(() => {
    if (!post) return;
    track(ANALYTICS_EVENTS.communityPostDetailViewed, {
      post_id: post.id,
      category: post.category,
    });
  }, [post]);

  if (!post) {
    return (
      <EveShell>
        <BackLink />
        <section
          role="status"
          className="mt-4 rounded-2xl border border-dashed border-eve-muted/40 bg-eve-cream/40 px-6 py-10 text-center"
        >
          <h1 className="font-serif text-lg text-eve-teal-dark">
            {t("community.detail.notFoundTitle")}
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-eve-teal-dark/75">
            {t("community.detail.notFoundBody")}
          </p>
          <Link
            to="/eve/community"
            className="mt-4 inline-flex min-h-11 items-center rounded-full bg-eve-teal px-4 text-[14px] font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eve-teal focus-visible:ring-offset-2"
          >
            {t("community.detail.back")}
          </Link>
        </section>
      </EveShell>
    );
  }

  const related = relatedPosts(post);
  const hidden = isReported(post.id, reports);

  return (
    <EveShell>
      <BackLink />

      <div
        role="note"
        className="mt-2 rounded-2xl border border-eve-sand bg-eve-cream/60 px-4 py-3 rtl:text-right"
      >
        <p className="text-[13px] leading-relaxed text-eve-teal-dark/75">
          <span className="font-semibold text-eve-teal-dark">
            {t("community.sampleDisclosureTitle")}
          </span>{" "}
          {t("community.detail.disclosure")}
        </p>
      </div>

      {hidden ? (
        <p className="mt-4 rounded-2xl border border-eve-sand bg-white p-4 text-[13px] text-eve-teal-dark/70">
          {t("community.reportedHidden")}
        </p>
      ) : (
        <article className="mt-4 rounded-2xl bg-eve-cream p-4 shadow-sm">
          <CommunityPostDetailHeader
            post={post}
            hearted={hearted}
            saved={saved}
            onHeart={() => setHearted((v) => !v)}
            onSave={() => setSaved((v) => !v)}
            onReport={() => {
              setReports(submitReport(post.id, "other"));
              eveToast.info(reportAcknowledgement());
            }}
          />

          <p className="mt-3 text-[15px] leading-relaxed text-eve-teal-dark/85 rtl:text-right">
            {post.body}
          </p>

          <CommunityCareAction category={post.category} />
        </article>
      )}

      {!hidden && post.topAnswer && <CommunityThreadReply answer={post.topAnswer} />}

      {!hidden && (
        <section
          aria-labelledby="replies-status"
          className="mt-5 rounded-2xl border border-dashed border-eve-teal/30 bg-white px-4 py-4 rtl:text-right"
        >
          <h2
            id="replies-status"
            className="inline-flex items-center gap-2 text-[13px] font-semibold text-eve-teal-dark"
          >
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            {t("community.detail.repliesClosedTitle")}
          </h2>
          <p className="mt-1 text-[13px] leading-relaxed text-eve-teal-dark/75">
            {t("community.detail.repliesClosedBody")}
          </p>
        </section>
      )}

      <CommunityRelatedPosts posts={related} />
    </EveShell>
  );
}
