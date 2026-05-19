import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Heart, MessageCircle, Bookmark, Flame, Plus, X } from "lucide-react";
import { EveShell } from "@/components/shells/EveShell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/eve/community")({
  component: CommunityPage,
});

type CategoryKey =
  | "all"
  | "first"
  | "second"
  | "third"
  | "postpartum"
  | "symptoms"
  | "family"
  | "provider"
  | "chat";

const CATEGORIES: { key: CategoryKey; label: string; tone: "teal" | "rose" | "gold" | "muted" }[] = [
  { key: "all", label: "🌟 All", tone: "teal" },
  { key: "first", label: "🤰 First Trimester", tone: "rose" },
  { key: "second", label: "👶 Second Trimester", tone: "teal" },
  { key: "third", label: "🌸 Third Trimester", tone: "rose" },
  { key: "postpartum", label: "🍼 Postpartum", tone: "teal" },
  { key: "symptoms", label: "💊 Symptoms & Health", tone: "rose" },
  { key: "family", label: "👨‍👩‍👧 Family & Partners", tone: "gold" },
  { key: "provider", label: "🏥 Finding a Provider", tone: "teal" },
  { key: "chat", label: "💬 Just Chatting", tone: "muted" },
];

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
    category: "first",
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
    category: "third",
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
    category: "family",
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
    category: "chat",
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
  const [active, setActive] = useState<CategoryKey>("all");
  const [open, setOpen] = useState(false);
  const [hearts, setHearts] = useState<Record<string, number>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  const filtered = useMemo(
    () => (active === "all" ? SEED_POSTS : SEED_POSTS.filter((p) => p.category === active)),
    [active],
  );

  return (
    <EveShell>
      <div className="pt-2">
        <h1 className="font-serif text-3xl text-eve-teal-dark">Community</h1>
        <p className="mt-1 italic font-sans text-sm text-eve-muted">
          Ask anything. Share everything. You're not alone.
        </p>

        <button
          onClick={() => setOpen(true)}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-eve-teal px-4 py-2 text-sm font-medium text-white shadow-sm transition active:scale-95"
        >
          <Plus className="h-4 w-4" /> New Post
        </button>
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
