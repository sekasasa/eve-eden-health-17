import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { X, ArrowLeft, Users, ShieldCheck, Sparkles, Calendar, Plus } from "lucide-react";
import { EveShell } from "@/components/shells/EveShell";
import { ContentCard } from "@/components/ui/ContentCard";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { CommunityHeader } from "@/components/community/CommunityHeader";
import { CommunityTabs } from "@/components/community/CommunityTabs";
import { CommunityFilterSheet } from "@/components/community/CommunityFilterSheet";
import { CommunityPostCard } from "@/components/community/CommunityPostCard";
import { CommunityReadOnlyNotice } from "@/components/community/CommunityReadOnlyNotice";
import { CommunityCirclesPreview } from "@/components/community/CommunityCirclesPreview";
import { useSavedProfile } from "@/hooks/useSavedProfile";
import { useCarePreferences } from "@/hooks/useCarePreferences";
import { prefHelpers } from "@/lib/personalization";
import { eveToast } from "@/lib/eve-toast";
import { flagOffCopy } from "@/lib/flags";
import {
  isCommunityReadOnly,
  isReported,
  readReports,
  reportAcknowledgement,
  submitReport,
  type ReportStore,
} from "@/lib/moderation";
import { ANALYTICS_EVENTS, track } from "@/lib/analytics";
import { rankForProfile, type ContentRow } from "@/lib/content-filter";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  CATEGORIES,
  FEED_TABS,
  LIFE_STAGES,
  POST_TAGS,
  SEED_POSTS,
  categoryForStage,
  postsForTab,
  type CategoryKey,
  type FeedTabKey,
  type Post,
} from "@/lib/community-seed";
import {
  loadCommunityFeedWithFallback,
  type CommunityFeedStatus,
} from "@/features/community/services/communityFeed";

export const Route = createFileRoute("/eve/community")({
  head: () => ({
    meta: [
      { title: "Community & support — Eve & Eden Health" },
      {
        name: "description",
        content:
          "Read questions and answers from mothers on fertility, pregnancy, postpartum and finding care.",
      },
      { property: "og:title", content: "Community & support — Eve & Eden Health" },
      {
        property: "og:description",
        content:
          "Read questions and answers from mothers on fertility, pregnancy, postpartum and finding care.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CommunityPage,
});

function CommunityPage() {
  const nav = useNavigate();
  const { t } = useTranslation();
  const { profile } = useSavedProfile();
  const { prefs } = useCarePreferences();
  const hideFamilyPromo = prefHelpers.privateFromFamily(prefs);

  const defaultCategory: CategoryKey = useMemo(
    () => categoryForStage(prefs.stage ?? profile.stage),
    [prefs.stage, profile.stage],
  );
  const [active, setActive] = useState<CategoryKey>(defaultCategory);
  const [tab, setTab] = useState<FeedTabKey>("for_you");
  const [filterOpen, setFilterOpen] = useState(false);
  const [open, setOpen] = useState(false);

  // Posting requires BOTH the posting flag and a verified moderation backend.
  const readOnly = isCommunityReadOnly();
  const postingEnabled = !readOnly;
  const [reports, setReports] = useState<ReportStore>({});

  useEffect(() => {
    setReports(readReports());
  }, []);
  const [hearts, setHearts] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  const [partnerContent, setPartnerContent] = useState<ContentRow[]>([]);
  const [vendorNames, setVendorNames] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("vendor_content")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(30);
      const rows = (data ?? []) as ContentRow[];
      setPartnerContent(rows);
      const ids = [...new Set(rows.map((r) => r.vendor_id))];
      if (ids.length) {
        const { data: vs } = await supabase
          .from("vendors")
          .select("id,business_name")
          .in("id", ids);
        const map: Record<string, string> = {};
        (vs ?? []).forEach((v: { id: string; business_name: string | null }) => {
          map[v.id] = v.business_name ?? "Partner";
        });
        setVendorNames(map);
      }
    })();
  }, []);

  const personalizedContent = useMemo(
    () => rankForProfile(partnerContent, profile).slice(0, 6),
    [partnerContent, profile],
  );

  // Persisted community conversations, loaded through the typed service with a
  // truthful seeded fallback. Nothing here enables posting.
  const [feedPosts, setFeedPosts] = useState<Post[]>([]);
  const [feedStatus, setFeedStatus] = useState<CommunityFeedStatus | "loading">("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await loadCommunityFeedWithFallback({ limit: 30 });
      if (cancelled) return;
      setFeedPosts(result.posts);
      setFeedStatus(result.status);
      track(ANALYTICS_EVENTS.communityPersistedFeedLoaded, {
        persisted_count: result.source === "persisted" ? result.posts.length : 0,
        fallback_count: result.source === "seeded_fallback" ? result.posts.length : 0,
        source: result.source,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loading = feedStatus === "loading";
  const usingSeeded = feedStatus !== "live";

  const tabBacked = FEED_TABS.find((x) => x.key === tab)?.backed ?? false;

  const filtered = useMemo(() => {
    if (!tabBacked) return [];
    const byCategory =
      active === "all" ? feedPosts : feedPosts.filter((p) => p.category === active);
    return postsForTab(byCategory, tab);
  }, [active, tab, tabBacked, feedPosts]);


  return (
    <EveShell>
      <button
        onClick={() => nav({ to: "/eve/home" })}
        className="mb-2 mt-2 inline-flex min-h-11 items-center gap-1 text-[13px] text-eve-teal-dark/70 rtl:flex-row-reverse"
      >
        <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" /> {t("common.back")}
      </button>

      {/* A. Header */}
      <CommunityHeader />

      {/* B. Composer / status */}
      <div className="mt-4">
        {postingEnabled ? (
          <button
            onClick={() => setOpen(true)}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-eve-teal px-4 text-[14px] font-medium text-white shadow-sm transition active:scale-95"
          >
            <Plus className="h-4 w-4" /> {t("community.postCta")}
          </button>
        ) : (
          <CommunityReadOnlyNotice />
        )}
        {profile.stage && (
          <p className="mt-2 text-[13px] text-eve-teal-dark/70">
            {t("community.personalized")}
          </p>
        )}
      </div>

      {/* B2. Circles entry */}
      <div className="mt-4">
        <Link
          to="/eve/community/circles"
          onClick={() => track(ANALYTICS_EVENTS.circlesDirectoryOpened)}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-eve-teal px-4 text-[13px] font-medium text-eve-teal"
        >
          <Users className="h-4 w-4" /> {t("community.circles.explore")}
        </Link>
      </div>

      {/* C. Feed tabs */}
      <div className="mt-4">
        <CommunityTabs
          value={tab}
          onChange={(next) => {
            setTab(next);
            track(ANALYTICS_EVENTS.communityTabSelected, { tab: next });
          }}
        />
      </div>

      <CommunityCirclesPreview countryCode={prefs.country ?? null} />


      {/* D. Compact topic filters */}
      <div className="mt-3">
        <CommunityFilterSheet
          value={active}
          open={filterOpen}
          onOpenChange={(next) => {
            setFilterOpen(next);
            if (next) track(ANALYTICS_EVENTS.communityFilterOpened);
          }}
          onChange={(key) => {
            setActive(key);
            track(ANALYTICS_EVENTS.communityFilterSelected, { category: key });
          }}
        />
      </div>

      {/* E. Feed */}
      {tab === "expert" && tabBacked && (
        <p className="mt-4 text-[13px] leading-relaxed text-eve-teal-dark/70">
          {t("community.expertNote")}
        </p>
      )}

      {tabBacked && feedStatus === "fallback" && (
        <p
          role="status"
          data-testid="community-live-error"
          className="mt-4 rounded-2xl border border-eve-sand bg-white px-4 py-3 text-[13px] leading-relaxed text-eve-teal-dark/75 rtl:text-right"
        >
          {t("community.detail.liveUnavailableShort")}
        </p>
      )}

      {tabBacked && feedStatus === "empty" && (
        <p
          role="status"
          data-testid="community-empty-notice"
          className="mt-4 rounded-2xl border border-eve-sand bg-white px-4 py-3 text-[13px] leading-relaxed text-eve-teal-dark/75 rtl:text-right"
        >
          {t("community.detail.noPublishedShort")}
        </p>
      )}

      {tabBacked && !loading && usingSeeded && (
        <div
          role="note"
          data-testid="community-sample-disclosure"
          className="mt-4 rounded-2xl border border-eve-sand bg-eve-cream/60 px-4 py-3 rtl:text-right"
        >
          <p className="text-[13px] leading-relaxed text-eve-teal-dark/75">
            <span className="font-semibold text-eve-teal-dark">
              {t("community.sampleDisclosureTitle")}
            </span>{" "}
            {t("community.sampleDisclosure")}
          </p>
        </div>
      )}

      <div className="mt-4 space-y-3">
        {!tabBacked ? (
          <div className="rounded-2xl border border-dashed border-eve-teal/30 bg-eve-cream/40 px-6 py-10 text-center">
            <p className="font-serif text-lg text-eve-teal-dark">
              {t("community.pilotTitle")}
            </p>
            <p className="mt-1 text-[14px] leading-relaxed text-eve-teal-dark/75">
              {tab === "nearby" ? t("community.pilotNearby") : t("community.pilotFollowing")}
            </p>
          </div>
        ) : loading ? (
          <div role="status" aria-live="polite" data-testid="community-feed-loading">
            <span className="sr-only">{t("community.loading")}</span>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                aria-hidden="true"
                className="mb-3 h-40 animate-pulse rounded-2xl bg-eve-cream/70"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-eve-muted/30 bg-eve-cream/40 px-6 py-10 text-center">
            <p className="font-serif text-lg text-eve-teal-dark">
              {t("community.emptyTopic")}
            </p>
            {!postingEnabled && (
              <p className="mt-2 text-[13px] text-eve-teal-dark/70">
                {flagOffCopy("communityPosting")}
              </p>
            )}
          </div>
        ) : (
          filtered.map((p) =>
            isReported(p.id, reports) ? (
              <article
                key={p.id}
                className="rounded-2xl border border-eve-sand bg-white p-4 text-[13px] text-eve-teal-dark/70"
              >
                {t("community.reportedHidden")}
              </article>
            ) : (
              <CommunityPostCard
                key={p.id}
                post={p}
                hearted={Boolean(hearts[p.id])}
                saved={Boolean(saved[p.id])}
                onHeart={() => setHearts((h) => ({ ...h, [p.id]: !h[p.id] }))}
                onSave={() => setSaved((s) => ({ ...s, [p.id]: !s[p.id] }))}
                onReport={() => {
                  setReports(submitReport(p.id, "other"));
                  eveToast.info(reportAcknowledgement());
                }}
              />
            ),
          )
        )}
      </div>

      {/* F. Secondary modules below the feed */}
      <div className="mt-8">
        <SectionLabel>{t("community.supportLabel")}</SectionLabel>
      </div>
      <SupportSections
        hideFamilyPromo={hideFamilyPromo}
        personalizedContent={personalizedContent}
        vendorNames={vendorNames}
        personalized={Boolean(profile.stage)}
      />

      {/* New post sheet */}
      {open && <NewPostSheet onClose={() => setOpen(false)} prefs={prefs} />}
    </EveShell>
  );
}


function SupportSections({
  hideFamilyPromo,
  personalizedContent,
  vendorNames,
  personalized,
}: {
  hideFamilyPromo: boolean;
  personalizedContent: ContentRow[];
  vendorNames: Record<string, string>;
  personalized: boolean;
}) {
  return (
    <>
      {/* Care Navigator */}
      <section className="mt-6 rounded-2xl border border-eve-teal/20 bg-white p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-eve-teal-light">
            <Sparkles className="h-4 w-4 text-eve-teal" />
          </div>
          <div className="flex-1">
            <p className="font-sans text-sm font-semibold text-eve-teal-dark">Care Navigator</p>
            <p className="mt-0.5 text-[12px] text-eve-muted">
              A navigator can help you compare options, prepare questions, or decide what to do next.
            </p>
            <Link
              to="/eve/ask"
              className="mt-3 inline-flex min-h-11 items-center rounded-full bg-eve-teal px-4 text-[13px] font-medium text-white"
            >
              Talk to a navigator
            </Link>
          </div>
        </div>
      </section>

      {/* Family Support — hidden when the mother keeps care private from family */}
      {!hideFamilyPromo ? (
        <section className="mt-3 rounded-2xl border border-eve-muted/20 bg-white p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-eve-cream">
              <Users className="h-4 w-4 text-eve-terra" />
            </div>
            <div className="flex-1">
              <p className="font-sans text-sm font-semibold text-eve-teal-dark">Family support</p>
              <p className="mt-0.5 text-[12px] text-eve-muted">
                Inviting a family supporter opens with our pilot — there is no invite backend yet.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  className="min-h-11 rounded-full bg-eve-teal px-3 text-[12px] text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Invite family supporter — coming soon
                </button>
                <Link
                  to="/eve/profile/care-preferences"
                  className="inline-flex min-h-11 items-center rounded-full border border-eve-teal px-3 text-[12px] text-eve-teal"
                >
                  Privacy settings
                </Link>
              </div>
              <p className="mt-2 inline-flex items-center gap-1 text-[12px] text-eve-muted">
                <ShieldCheck className="h-3 w-3" />
                You choose what your family supporter can see.
              </p>
            </div>
          </div>
        </section>
      ) : (
        <section className="mt-3 rounded-2xl border border-eve-teal/20 bg-white p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 text-eve-teal" />
            <div className="flex-1">
              <p className="font-sans text-sm font-semibold text-eve-teal-dark">Your privacy controls</p>
              <p className="mt-0.5 text-[12px] text-eve-muted">
                You asked to keep your care private from family. Family-sharing features are off — you can change this anytime in Care Preferences.
              </p>
              <Link
                to="/eve/profile/care-preferences"
                className="mt-3 inline-flex min-h-11 items-center rounded-full border border-eve-teal px-3 text-[12px] text-eve-teal"
              >
                Privacy preferences
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Events entry */}
      <Link
        to="/eve/events"
        className="mt-3 flex items-center justify-between rounded-2xl border border-eve-teal/20 bg-white p-4"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-eve-rose-light">
            <Calendar className="h-4 w-4 text-eve-rose" />
          </div>
          <div>
            <p className="font-sans text-sm font-semibold text-eve-teal-dark">Events &amp; workshops</p>
            <p className="mt-0.5 text-[12px] text-eve-muted">
              Classes, talks, and wellness sessions for mothers and families.
            </p>
          </div>
        </div>
        <span className="text-[12px] font-medium text-eve-teal">Browse →</span>
      </Link>

      {personalizedContent.length > 0 && (
        <section className="mt-5">
          <SectionLabel>Helpful guides from trusted partners</SectionLabel>
          <p className="mt-1 text-[12px] text-eve-muted">
            {personalized
              ? "Personalized to your saved care profile."
              : "Educational content from verified vendors and providers."}
          </p>
          <div className="mt-3 grid grid-cols-1 gap-3">
            {personalizedContent.map((c) => (
              <ContentCard key={c.id} content={c} vendorName={vendorNames[c.vendor_id]} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}


function NewPostSheet({
  onClose,
  prefs,
}: {
  onClose: () => void;
  prefs: ReturnType<typeof useCarePreferences>["prefs"];
}) {
  const [anonymous, setAnonymous] = useState(true);
  const [category, setCategory] = useState<CategoryKey>("pregnancy");
  const [country, setCountry] = useState(prefs.country ?? "");
  const [city, setCity] = useState(prefs.city ?? "");
  const [language, setLanguage] = useState(prefs.language ?? "");
  const [dialect, setDialect] = useState(prefs.dialect ?? "");
  const [stage, setStage] = useState(prefs.stage ?? "");
  const [tags, setTags] = useState<string[]>([]);

  function toggleTag(t: string) {
    setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
  }

  function submit() {
    // Posting is not connected to a persisted, moderated backend yet, so we
    // never claim a post was shared. See FLAG_DEFAULTS.communityPosting.
    eveToast.info(flagOffCopy("communityPosting"));
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-3xl">
        <div className="flex items-start justify-between">
          <h3 className="font-serif text-xl font-semibold text-eve-teal-dark">
            Share with the community
          </h3>
          <button onClick={onClose} aria-label="Close">
            <X className="h-5 w-5 text-eve-muted" />
          </button>
        </div>

        <label className="mt-4 flex items-center justify-between rounded-xl bg-eve-teal-light px-3 py-2 text-[12px] text-eve-teal">
          <span>Post anonymously</span>
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
            className="h-4 w-4"
          />
        </label>

        <Field label="Category">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as CategoryKey)}
            className="w-full rounded-xl border border-eve-sand bg-eve-cream px-3 py-2 text-sm"
          >
            {CATEGORIES.filter((c) => c.key !== "all").map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </Field>

        <Field label="Life stage (optional)">
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            className="w-full rounded-xl border border-eve-sand bg-eve-cream px-3 py-2 text-sm"
          >
            <option value="">Not specified</option>
            {LIFE_STAGES.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </Field>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Field label="Country">
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. Morocco"
              className="w-full rounded-xl border border-eve-sand bg-eve-cream px-3 py-2 text-sm"
            />
          </Field>
          <Field label="City or region">
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Casablanca"
              className="w-full rounded-xl border border-eve-sand bg-eve-cream px-3 py-2 text-sm"
            />
          </Field>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Field label="Language">
            <input
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="e.g. English"
              className="w-full rounded-xl border border-eve-sand bg-eve-cream px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Dialect (optional)">
            <input
              value={dialect}
              onChange={(e) => setDialect(e.target.value)}
              placeholder="e.g. Darija"
              className="w-full rounded-xl border border-eve-sand bg-eve-cream px-3 py-2 text-sm"
            />
          </Field>
        </div>

        <Field label="Title">
          <input
            placeholder="What's on your mind?"
            className="w-full rounded-xl border border-eve-sand bg-eve-cream px-3 py-2 text-sm"
          />
        </Field>

        <Field label="Your post">
          <textarea
            rows={4}
            placeholder="Share your experience, ask a question, or offer support..."
            className="w-full rounded-xl border border-eve-sand bg-eve-cream px-3 py-2 text-sm"
          />
        </Field>

        <div className="mt-3">
          <p className="text-[12px] font-medium uppercase tracking-wide text-eve-muted">Tags (optional)</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {POST_TAGS.map((t) => (
              <button
                key={t}
                onClick={() => toggleTag(t)}
                className={cn(
                  "rounded-full px-3 py-1 text-[12px] font-medium border",
                  tags.includes(t)
                    ? "bg-eve-teal text-white border-eve-teal"
                    : "bg-white text-eve-muted border-eve-sand",
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-3 text-[12px] text-eve-muted">
          You choose what to share. Country and language help us show your post to mothers nearby — they are never used to identify you.
        </p>

        <button
          onClick={submit}
          className="mt-4 w-full rounded-full bg-eve-teal py-3 text-sm font-medium text-white"
        >
          {anonymous ? "Post anonymously" : "Post"}
        </button>
        <button
          onClick={onClose}
          className="mt-2 w-full text-center text-xs text-eve-muted"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <label className="block text-[12px] font-medium uppercase tracking-wide text-eve-muted">
        {label}
      </label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

