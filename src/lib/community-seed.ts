/**
 * Shared community taxonomy + seeded example threads.
 *
 * These posts are written by the Eve & Eden team. They are always labelled
 * "Sample" in the UI — nothing here is a real member post. Extracted from the
 * community route so Home can preview the same dataset without duplicating it.
 */

export type CategoryKey =
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

export type CategoryTone = "teal" | "rose" | "gold" | "muted";

export type CategoryDef = {
  key: CategoryKey;
  label: string;
  tone: CategoryTone;
};

export const CATEGORIES: CategoryDef[] = [
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

/** Filters grouped so the feed no longer shows one long pill list. */
export const FILTER_GROUPS: { id: string; label: string; keys: CategoryKey[] }[] = [
  {
    id: "journey",
    label: "Journey",
    keys: ["ttc", "ivf", "pregnancy", "postpartum", "newborn"],
  },
  {
    id: "needs",
    label: "Needs",
    keys: ["symptoms", "provider", "nutrition", "labs", "insurance"],
  },
  {
    id: "culture",
    label: "Community & Culture",
    keys: ["fasting", "culture", "birth", "emotional"],
  },
];

/**
 * Feed tabs. Only tabs whose behaviour can be truthfully derived from the
 * data we actually hold are `backed: true`. The rest are shown but labelled.
 */
export type FeedTabKey = "for_you" | "nearby" | "following" | "expert" | "new";

export const FEED_TABS: {
  key: FeedTabKey;
  label: string;
  /** False => not backed by real data yet; UI must say so. */
  backed: boolean;
}[] = [
  { key: "for_you", label: "For You", backed: true },
  { key: "new", label: "New", backed: true },
  { key: "expert", label: "Expert Answers", backed: true },
  { key: "nearby", label: "Nearby", backed: false },
  { key: "following", label: "Following", backed: false },
];

export const UNBACKED_TAB_COPY =
  "Coming with the community pilot — showing all example conversations for now.";

export const POST_TAGS = [
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

export const LIFE_STAGES = [
  "trying",
  "fertility",
  "pregnant",
  "postpartum",
  "newborn",
  "family",
];

export const toneBg: Record<string, string> = {
  teal: "bg-eve-teal text-white",
  rose: "bg-eve-rose text-white",
  gold: "bg-eve-terra text-white",
  muted: "bg-eve-muted text-white",
};

export const toneBadge: Record<string, string> = {
  teal: "bg-eve-teal-light text-eve-teal",
  rose: "bg-eve-rose-light text-eve-rose",
  gold: "bg-eve-terra-light text-eve-terra",
  muted: "bg-eve-sand text-eve-teal-dark",
};

export type Post = {
  id: string;
  category: CategoryKey;
  anonName: string;
  avatarLetter: string;
  avatarColor: string;
  timeAgo: string;
  /** Minutes since posting — used for the "New" ordering. */
  minutesAgo: number;
  title: string;
  body: string;
  hearts: number;
  replies: number;
  topAnswer?: string;
  trending?: boolean;
};

export const SEED_POSTS: Post[] = [
  {
    id: "1",
    category: "pregnancy",
    anonName: "First-time Mama",
    avatarLetter: "A",
    avatarColor: "bg-eve-rose",
    timeAgo: "2 hours ago",
    minutesAgo: 120,
    title: "Is it normal to feel this dizzy in the morning? I can barely stand up.",
    body: "I'm 9 weeks and every morning the room spins when I get up. I've tried eating crackers before standing but it's not really helping. Did this happen to anyone else? When did it stop?",
    hearts: 34,
    replies: 12,
    topAnswer:
      "Yes, completely normal in the first trimester. Try sipping water before sitting up and eat something small...",
  },
  {
    id: "2",
    category: "symptoms",
    anonName: "Mama Doe",
    avatarLetter: "M",
    avatarColor: "bg-eve-teal",
    timeAgo: "5 hours ago",
    minutesAgo: 300,
    title: "My OBGYN said my iron is low — what foods helped you?",
    body: "She gave me supplements but I'd rather get it from food where I can. Looking for things that actually worked for you, especially Moroccan/local options.",
    hearts: 28,
    replies: 19,
    topAnswer:
      "Lentils, dates, and beef liver if you can handle it. Pair with orange juice for absorption...",
  },
  {
    id: "3",
    category: "pregnancy",
    anonName: "Anonymous Mama",
    avatarLetter: "Z",
    avatarColor: "bg-eve-terra",
    timeAgo: "just now",
    minutesAgo: 1,
    title: "Baby hasn't moved much today, should I go in? I'm scared to bother the doctor.",
    body: "I'm 34 weeks. Usually very active around now but today barely anything. I don't want to be that mother who panics over nothing.",
    hearts: 67,
    replies: 31,
    topAnswer:
      "Please go in. You are never bothering them. Drink something cold, lie on your left side — if still nothing in an hour, go.",
    trending: true,
  },
  {
    id: "4",
    category: "provider",
    anonName: "Mama N.",
    avatarLetter: "N",
    avatarColor: "bg-eve-teal-dark",
    timeAgo: "1 day ago",
    minutesAgo: 1440,
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
    minutesAgo: 180,
    title: "I cried for 2 hours today for no reason. Is this normal? Am I okay?",
    body: "Baby is 3 weeks old. I love her so much but I just couldn't stop crying. Husband was kind but I feel ashamed.",
    hearts: 89,
    replies: 44,
    topAnswer:
      "You are okay and you are not alone. The baby blues are real. But if it lasts past 2 weeks please talk to someone — there is no shame in this.",
    trending: true,
  },
  {
    id: "6",
    category: "culture",
    anonName: "Mama F.",
    avatarLetter: "F",
    avatarColor: "bg-eve-terra",
    timeAgo: "6 hours ago",
    minutesAgo: 360,
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
    minutesAgo: 30,
    title: "Had my first ultrasound today. I saw the heartbeat. I'm still shaking.",
    body: "After two losses, I didn't dare believe. Today I saw it. I just had to share with someone who would understand.",
    hearts: 103,
    replies: 28,
    topAnswer: "Congratulations mama. We are all crying with you. 💛",
  },
];

/** Map a saved care-profile stage onto the closest community category. */
export function categoryForStage(stage?: string | null): CategoryKey {
  switch (stage) {
    case "postpartum":
      return "postpartum";
    case "newborn":
      return "newborn";
    case "pregnant":
      return "pregnancy";
    case "trying":
    case "ttc":
      return "ttc";
    case "fertility":
    case "ivf":
      return "ivf";
    case "family":
      return "culture";
    default:
      return "all";
  }
}

/**
 * Ordering for a feed tab. Never fabricates personalization: unbacked tabs
 * return the default order and the UI explains why.
 */
export function postsForTab(posts: Post[], tab: FeedTabKey): Post[] {
  switch (tab) {
    case "new":
      return [...posts].sort((a, b) => a.minutesAgo - b.minutesAgo);
    case "expert":
      return posts.filter((p) => Boolean(p.topAnswer));
    default:
      return posts;
  }
}

/** Up to `limit` seeded threads most relevant to a stage, stage first. */
export function previewPostsForStage(stage: string | null | undefined, limit = 3): Post[] {
  const cat = categoryForStage(stage);
  const preferred = cat === "all" ? [] : SEED_POSTS.filter((p) => p.category === cat);
  const rest = SEED_POSTS.filter((p) => !preferred.includes(p)).sort(
    (a, b) => b.hearts - a.hearts,
  );
  return [...preferred, ...rest].slice(0, limit);
}
