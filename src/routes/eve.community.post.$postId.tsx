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
import { postById, relatedPosts, type Post } from "@/lib/community-seed";
import {
  getPublishedPostById,
  getPublishedReplies,
} from "@/features/community/services/communityService";
import {
  adaptPost,
  adaptReplies,
  type CommunityReplyView,
} from "@/features/community/adapters/communityAdapter";

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

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isPersistedPostId(id: string): boolean {
  return UUID_RE.test(id);
}

function CommunityPostDetailPage() {
  const { postId } = Route.useParams();
  const { t } = useTranslation();
  // A UUID always addresses a persisted row. A seeded id never hits the
  // database, and a missing UUID never falls back to an unrelated sample.
  const wantsPersisted = isPersistedPostId(postId);
  const seededPost = useMemo(
    () => (wantsPersisted ? undefined : postById(postId)),
    [postId, wantsPersisted],
  );

  const [persistedPost, setPersistedPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<CommunityReplyView[]>([]);
  const [loadingPersisted, setLoadingPersisted] = useState(wantsPersisted);

  useEffect(() => {
    if (!wantsPersisted) {
      setPersistedPost(null);
      setReplies([]);
      setLoadingPersisted(false);
      return;
    }
    let cancelled = false;
    setLoadingPersisted(true);
    (async () => {
      const result = await getPublishedPostById(postId);
      if (cancelled) return;
      if (!result.ok || !result.data) {
        setPersistedPost(null);
        setReplies([]);
        setLoadingPersisted(false);
        return;
      }
      const adapted = adaptPost(result.data);
      setPersistedPost(adapted);
      track(ANALYTICS_EVENTS.communityPersistedPostViewed, {
        post_id: adapted.id,
        category: adapted.category,
      });
      const replyResult = await getPublishedReplies(postId);
      if (cancelled) return;
      setReplies(replyResult.ok ? adaptReplies(replyResult.data) : []);
      setLoadingPersisted(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [postId, wantsPersisted]);

  const post = persistedPost ?? seededPost;
  const isPersisted = Boolean(persistedPost);

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
    if (loadingPersisted) {
      return (
        <EveShell>
          <BackLink />
          <p role="status" className="mt-6 text-[14px] text-eve-teal-dark/70">
            {t("common.loading", { defaultValue: "Loading…" })}
          </p>
        </EveShell>
      );
    }
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

  const related = isPersisted ? [] : relatedPosts(post);
  const hidden = !isPersisted && isReported(post.id, reports);

  return (
    <EveShell>
      <BackLink />

      {!isPersisted && (
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
      )}

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

      {!hidden && !isPersisted && post.topAnswer && (
        <CommunityThreadReply answer={post.topAnswer} />
      )}

      {!hidden && isPersisted && (
        <section
          aria-labelledby="persisted-replies"
          className="mt-5 rounded-2xl border border-eve-sand bg-white px-4 py-4 rtl:text-right"
        >
          <h2
            id="persisted-replies"
            className="text-[13px] font-semibold text-eve-teal-dark"
          >
            {t("community.detail.repliesTitle")}
          </h2>
          {replies.length === 0 ? (
            <p className="mt-1 text-[13px] leading-relaxed text-eve-teal-dark/75">
              {t("community.detail.noReplies")}
            </p>
          ) : (
            <ul className="mt-2 space-y-3">
              {replies.map((r) => (
                <li key={r.id} className="border-t border-eve-sand pt-3 first:border-0 first:pt-0">
                  <p className="text-[12px] text-eve-teal-dark/60">{r.timeAgo}</p>
                  <p className="mt-1 text-[14px] leading-relaxed text-eve-teal-dark/85">
                    {r.body}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {!hidden && !isPersisted && (
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
