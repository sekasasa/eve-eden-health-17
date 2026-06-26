import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Heart, MessageCircle, Bookmark, Flame, Plus, X, ArrowLeft, Users, ShieldCheck, Sparkles, Calendar } from "lucide-react";
import { EveShell } from "@/components/shells/EveShell";
import { ContentCard } from "@/components/ui/ContentCard";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { useSavedProfile } from "@/hooks/useSavedProfile";
import { useCarePreferences } from "@/hooks/useCarePreferences";
import { prefHelpers } from "@/lib/personalization";
import { eveToast } from "@/lib/eve-toast";
import { rankForProfile, type ContentRow } from "@/lib/content-filter";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/eve/community")({
  component: CommunityPage,
});

type CategoryKey =
  | "all"
  | "ttc"
  | "ivf"
  | "pregnancy"
  | "postpartum"
  | "newborn"
  | "symptoms"
  | "provider"
  | "nutrition"
  | "labs"
  | "insurance"
  | "fasting"
  | "culture"
  | "birth"
  | "emotional";

const CATEGORIES: { key: CategoryKey; label: string; tone: "teal" | "rose" | "gold" | "muted" }[] = [
  { key: "all", label: "🌟 All", tone: "teal" },
  { key: "ttc", label: "🌱 Trying to Conceive", tone: "rose" },
  { key: "ivf", label: "🧬 IVF / Fertility", tone: "teal" },
  { key: "pregnancy", label: "🤰 Pregnancy", tone: "rose" },
  { key: "postpartum", label: "🍼 Postpartum", tone: "teal" },
  { key: "newborn", label: "👶 Newborn Care", tone: "gold" },
  { key: "symptoms", label: "💊 Symptoms & Health", tone: "rose" },
  { key: "provider", label: "🏥 Finding a Provider", tone: "teal" },
  { key: "nutrition", label: "🥗 Nutrition", tone: "gold" },
  { key: "labs", label: "🧪 Labs & Prescriptions", tone: "teal" },
  { key: "insurance", label: "💳 Insurance & Payment", tone: "muted" },
  { key: "fasting", label: "🌙 Fasting & Faith", tone: "rose" },
  { key: "culture", label: "👨‍👩‍👧 Culture & Family", tone: "gold" },
  { key: "birth", label: "🌸 Birth Preferences", tone: "teal" },
  { key: "emotional", label: "💛 Emotional Support", tone: "rose" },
];

const POST_TAGS = [
  "Ramadan",
  "Lent/Fasting",
  "Halal",
  "Kosher",
  "Vegan",
  "Vegetarian",
  "Female provider",
  "Modesty",
  "Family support",
  "C-section questions",
  "VBAC",
  "Midwife",
  "Doula",
  "Postpartum traditions",
];

const LIFE_STAGES = ["trying", "fertility", "pregnant", "postpartum", "newborn", "family"];

const toneBg: Record<string, string> = {
  teal: "bg-eve-teal text-white",
  rose: "bg-eve-rose text-white",
  gold: "bg-eve-terra text-white",
  muted: "bg-eve-muted text-white",
};
const toneBadge: Record<string, string> = {
  teal: "bg-eve-teal-light text-eve-teal",
  rose: "bg-eve-rose-light text-eve-rose",
  gold: "bg-eve-terra-light text-eve-terra",
  muted: "bg-eve-sand text-eve-muted",
};

type Post = {
  id: string;
  category: CategoryKey;
  anonName: string;
  avatarLetter: string;
  avatarColor: string;
  timeAgo: string;
  title: string;
  body: string;
  hearts: number;
  replies: number;
  topAnswer?: string;
  trending?: boolean;
};

const SEED_POSTS: Post[] = [
  {
    id: "1",
    category: "pregnancy",
    anonName: "First-time Mama",
    avatarLetter: "A",
    avatarColor: "bg-eve-rose",
    timeAgo: "2 hours ago",
    title: "Is it normal to feel this dizzy in the morning? I can barely stand up.",
    body: "I'm 9 weeks and every morning the room spins when I get up. I've tried eating crackers before standing but it's not really helping. Did this happen to anyone else? When did it stop?",
    hearts: 34,
    replies: 12,
    topAnswer: "Yes, completely normal in the first trimester. Try sipping water before sitting up and eat something small...",
  },
  {
    id: "2",
    category: "symptoms",
    anonName: "Mama Doe",
    avatarLetter: "M",
    avatarColor: "bg-eve-teal",
    timeAgo: "5 hours ago",
    title: "My OBGYN said my iron is low — what foods helped you?",
    body: "She gave me supplements but I'd rather get it from food where I can. Looking for things that actually worked for you, especially Moroccan/local options.",
    hearts: 28,
    replies: 19,
    topAnswer: "Lentils, dates, and beef liver if you can handle it. Pair with orange juice for absorption...",
  },
  {
    id: "3",
    category: "pregnancy",
    anonName: "Anonymous Mama",
    avatarLetter: "Z",
    avatarColor: "bg-eve-terra",
    timeAgo: "just now",
    title: "Baby hasn't moved much today, should I go in? I'm scared to bother the doctor.",
    body: "I'm 34 weeks. Usually very active around now but today barely anything. I don't want to be that mother who panics over nothing.",
    hearts: 67,
    replies: 31,
    topAnswer: "Please go in. You are never bothering them. Drink something cold, lie on your left side — if still nothing in an hour, go.",
    trending: true,
  },
  {
    id: "4",
    category: "provider",
    anonName: "Mama N.",
    avatarLetter: "N",
    avatarColor: "bg-eve-teal-dark",
    timeAgo: "1 day ago",
    title: "Can anyone recommend a good midwife in Casablanca who speaks Darija?",
    body: "Looking for someone warm and patient. First baby. Budget is moderate. Open to clinic or independent.",
    hearts: 22,
    replies: 8,
  },
  {
    id: "5",
    category: "postpartum",
    anonName: "Mama G.",
    avatarLetter: "G",
    avatarColor: "bg-eve-rose",
    timeAgo: "3 hours ago",
    title: "I cried for 2 hours today for no reason. Is this normal? Am I okay?",
    body: "Baby is 3 weeks old. I love her so much but I just couldn't stop crying. Husband was kind but I feel ashamed.",
    hearts: 89,
    replies: 44,
    topAnswer: "You are okay and you are not alone. The baby blues are real. But if it lasts past 2 weeks please talk to someone — there is no shame in this.",
    trending: true,
  },
  {
    id: "6",
    category: "culture",
    anonName: "Mama F.",
    avatarLetter: "F",
    avatarColor: "bg-eve-terra",
    timeAgo: "6 hours ago",
    title: "My husband doesn't understand why I'm so tired. How do I explain it to him?",
    body: "He's supportive but says 'you're not even that big yet'. I'm exhausted by 3pm and he doesn't get it.",
    hearts: 41,
    replies: 17,
  },
  {
    id: "7",
    category: "emotional",
    anonName: "Mama A.",
    avatarLetter: "A",
    avatarColor: "bg-eve-teal",
    timeAgo: "30 minutes ago",
    title: "Had my first ultrasound today. I saw the heartbeat. I'm still shaking.",
    body: "After two losses, I didn't dare believe. Today I saw it. I just had to share with someone who would understand.",
    hearts: 103,
    replies: 28,
    topAnswer: "Congratulations mama. We are all crying with you. 💛",
  },
];

function CommunityPage() {
  const nav = useNavigate();
  const { profile } = useSavedProfile();
  const { prefs } = useCarePreferences();
  const hideFamilyPromo = prefHelpers.privateFromFamily(prefs);
  // Default category from stage
  const defaultCategory: CategoryKey = useMemo(() => {
    const s = prefs.stage ?? profile.stage;
    if (s === "postpartum") return "postpartum";
    if (s === "newborn") return "newborn";
    if (s === "pregnant") return "pregnancy";
    if (s === "trying") return "ttc";
    if (s === "fertility") return "ivf";
    if (s === "family") return "culture";
    return "all";
  }, [prefs.stage, profile.stage]);
  const [active, setActive] = useState<CategoryKey>(defaultCategory);
  const [open, setOpen] = useState(false);
  const [hearts, setHearts] = useState<Record<string, number>>({});
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

  const filtered = useMemo(
    () => (active === "all" ? SEED_POSTS : SEED_POSTS.filter((p) => p.category === active)),
    [active],
  );

  return (
    <EveShell>
      <div className="pt-2">
        <button
          onClick={() => nav({ to: "/eve/home" })}
          className="mb-2 inline-flex items-center gap-1 text-xs text-eve-muted"
        >
          <ArrowLeft className="h-3 w-3" /> Back to dashboard
        </button>
        <h1 className="font-serif text-3xl text-eve-teal-dark">Community & support</h1>
        <p className="mt-1 italic font-sans text-sm text-eve-muted">
          Navigator, family support, emotional support, and women like you.
        </p>
      </div>

      {/* Care Navigator */}
      <section className="mt-4 rounded-2xl border border-eve-teal/20 bg-white p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-eve-teal-light">
            <Sparkles className="h-4 w-4 text-eve-teal" />
          </div>
          <div className="flex-1">
            <p className="font-sans text-sm font-semibold text-eve-teal-dark">Care Navigator</p>
            <p className="mt-0.5 text-[12px] text-eve-muted">
              A navigator can help you compare options, prepare questions, or decide what to do next.
            </p>
            <button
              onClick={() => nav({ to: "/eve/ask" })}
              className="mt-3 rounded-full bg-eve-teal px-4 py-1.5 text-[12px] font-medium text-white"
            >
              Talk to a navigator
            </button>
          </div>
        </div>
      </section>

      {/* Family Support — hidden when user prefers to keep care private from family */}
      {!hideFamilyPromo && (
        <section className="mt-3 rounded-2xl border border-eve-muted/20 bg-white p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-eve-cream">
              <Users className="h-4 w-4 text-eve-terra" />
            </div>
            <div className="flex-1">
              <p className="font-sans text-sm font-semibold text-eve-teal-dark">Family support</p>
              <p className="mt-0.5 text-[12px] text-eve-muted">
                Invite a family supporter to help pay, coordinate, or follow along.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => eveToast.success("Invite link copied")}
                  className="rounded-full bg-eve-teal px-3 py-1 text-[11px] text-white"
                >
                  Invite family supporter
                </button>
                <button
                  onClick={() => eveToast.info("Privacy settings opening soon")}
                  className="rounded-full border border-eve-teal px-3 py-1 text-[11px] text-eve-teal"
                >
                  Privacy settings
                </button>
              </div>
              <p className="mt-2 inline-flex items-center gap-1 text-[10px] text-eve-muted">
                <ShieldCheck className="h-3 w-3" />
                You choose what your family supporter can see.
              </p>
            </div>
          </div>
        </section>
      )}
      {hideFamilyPromo && (
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
                className="mt-3 inline-block rounded-full border border-eve-teal px-3 py-1 text-[11px] text-eve-teal"
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
            <p className="font-sans text-sm font-semibold text-eve-teal-dark">Events & workshops</p>
            <p className="mt-0.5 text-[12px] text-eve-muted">
              Classes, talks, and wellness sessions for mothers and families.
            </p>
          </div>
        </div>
        <span className="text-[12px] font-medium text-eve-teal">Browse →</span>
      </Link>


      {/* Helpful guides from trusted partners */}
      {personalizedContent.length > 0 && (
        <section className="mt-5">
          <SectionLabel>Helpful guides from trusted partners</SectionLabel>
          <p className="mt-1 text-[11px] text-eve-muted">
            {profile.stage
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



      {/* New community post */}
      <div className="mt-4">
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-eve-teal px-4 py-2 text-sm font-medium text-white shadow-sm transition active:scale-95"
        >
          <Plus className="h-4 w-4" /> New Post
        </button>
        {profile.stage && (
          <p className="mt-2 text-[11px] text-eve-muted">
            Showing community posts relevant to your profile.
          </p>
        )}
      </div>

      {/* Category pills */}
      <div className="-mx-5 mt-5 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-2 pb-1">
          {CATEGORIES.map((c) => {
            const isActive = active === c.key;
            return (
              <button
                key={c.key}
                onClick={() => setActive(c.key)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-200",
                  isActive ? toneBg[c.tone] : "bg-eve-cream text-eve-muted",
                )}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Posts */}
      <div className="mt-5 space-y-3">
        {filtered.map((p) => {
          const cat = CATEGORIES.find((c) => c.key === p.category)!;
          const liked = hearts[p.id] ?? 0;
          return (
            <article
              key={p.id}
              className="relative overflow-hidden rounded-2xl bg-eve-cream p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="absolute inset-y-0 left-0 w-[3px] bg-eve-teal" />

              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white",
                    p.avatarColor,
                  )}
                >
                  {p.avatarLetter}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-eve-teal-dark">{p.anonName}</p>
                  <p className="text-[11px] text-eve-muted">{p.timeAgo}</p>
                </div>
                {p.trending && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-eve-terra-light px-2 py-0.5 text-[10px] font-semibold text-eve-terra">
                    <Flame className="h-3 w-3" /> Trending
                  </span>
                )}
              </div>

              <span
                className={cn(
                  "mt-3 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium",
                  toneBadge[cat.tone],
                )}
              >
                {cat.label}
              </span>

              <h2 className="mt-2 font-serif text-[17px] font-semibold leading-snug text-eve-teal-dark">
                {p.title}
              </h2>
              <p className="mt-1 line-clamp-2 text-[13px] text-eve-muted">{p.body}</p>
              <Link
                to="/eve/community"
                className="mt-1 inline-block text-[12px] font-medium text-eve-teal"
              >
                Read more
              </Link>

              <div className="mt-3 flex items-center gap-4 border-t border-eve-sand pt-3 text-[12px] text-eve-muted">
                <button
                  onClick={() =>
                    setHearts((h) => ({ ...h, [p.id]: (h[p.id] ?? 0) === 0 ? 1 : 0 }))
                  }
                  className={cn(
                    "inline-flex items-center gap-1 transition active:scale-110",
                    liked > 0 && "text-eve-rose",
                  )}
                >
                  <Heart className={cn("h-4 w-4", liked > 0 && "fill-current")} />
                  {p.hearts + liked}
                </button>
                <span className="inline-flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  {p.replies}
                </span>
                <button
                  onClick={() => setSaved((s) => ({ ...s, [p.id]: !s[p.id] }))}
                  className={cn(
                    "ml-auto inline-flex items-center gap-1",
                    saved[p.id] && "text-eve-teal",
                  )}
                >
                  <Bookmark className={cn("h-4 w-4", saved[p.id] && "fill-current")} />
                </button>
              </div>

              {p.topAnswer && (
                <div className="mt-3 border-t border-eve-sand pt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-eve-teal">
                    Top answer
                  </p>
                  <p className="mt-1 line-clamp-2 text-[12px] text-eve-muted">{p.topAnswer}</p>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <button className="mt-5 w-full rounded-full border border-eve-teal py-2.5 text-sm font-medium text-eve-teal transition hover:bg-eve-teal-light">
        Load more
      </button>

      {/* New post sheet */}
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center">
          <div className="w-full max-w-sm rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-3xl">
            <div className="flex items-start justify-between">
              <h3 className="font-serif text-xl font-semibold text-eve-teal-dark">
                Share with the community
              </h3>
              <button onClick={() => setOpen(false)} aria-label="Close">
                <X className="h-5 w-5 text-eve-muted" />
              </button>
            </div>

            <div className="mt-3 rounded-xl bg-eve-teal-light px-3 py-2 text-[12px] text-eve-teal">
              Your post will be shared anonymously. Your name is never shown.
            </div>

            <label className="mt-4 block text-[11px] font-medium uppercase tracking-wide text-eve-muted">
              Category
            </label>
            <select className="mt-1 w-full rounded-xl border border-eve-sand bg-eve-cream px-3 py-2 text-sm">
              {CATEGORIES.filter((c) => c.key !== "all").map((c) => (
                <option key={c.key}>{c.label}</option>
              ))}
            </select>

            <label className="mt-3 block text-[11px] font-medium uppercase tracking-wide text-eve-muted">
              Title
            </label>
            <input
              placeholder="What's on your mind?"
              className="mt-1 w-full rounded-xl border border-eve-sand bg-eve-cream px-3 py-2 text-sm"
            />

            <label className="mt-3 block text-[11px] font-medium uppercase tracking-wide text-eve-muted">
              Your post
            </label>
            <textarea
              rows={4}
              placeholder="Share your experience, ask a question, or offer support..."
              className="mt-1 w-full rounded-xl border border-eve-sand bg-eve-cream px-3 py-2 text-sm"
            />

            <p className="mt-2 text-[12px] text-eve-teal">You'll post as: Mama Doe</p>

            <button
              onClick={() => setOpen(false)}
              className="mt-4 w-full rounded-full bg-eve-teal py-3 text-sm font-medium text-white"
            >
              Post anonymously
            </button>
            <button
              onClick={() => setOpen(false)}
              className="mt-2 w-full text-center text-xs text-eve-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </EveShell>
  );
}
