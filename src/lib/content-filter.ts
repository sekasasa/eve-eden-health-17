import type { MatchIntake } from "./match-store";
import type { LifeStage } from "./match-data";

export type ContentRow = {
  id: string;
  vendor_id: string;
  title: string;
  excerpt: string | null;
  body: string | null;
  content_type: string;
  category: string | null;
  life_stage: string | null;
  language: string | null;
  location: string | null;
  tags: string[] | null;
  media_url: string | null;
  cta_type: string | null;
  cta_url: string | null;
  status: string;
  requires_review: boolean;
  event_at: string | null;
  views: number;
  saves: number;
  profile_visits: number;
  booking_clicks: number;
  quote_requests: number;
  messages: number;
  event_registrations: number;
  shop_clicks: number;
  created_at: string;
};

export const CLINICAL_CATEGORIES = new Set([
  "labs",
  "rx",
  "ivf",
  "ttc",
  "pregnant",
  "postpartum",
  "pcos",
  "mood",
]);

export const STAGE_CATEGORY_MAP: Partial<Record<LifeStage, string[]>> = {
  ttc: ["ttc", "ivf", "wellness", "labs", "pcos"],
  ivf: ["ivf", "ttc", "labs", "rx", "insurance", "mood"],
  pregnant: ["pregnant", "labs", "wellness", "mood", "insurance"],
  postpartum: ["postpartum", "newborn", "mood", "baby", "wellness"],
  newborn: ["newborn", "baby", "postpartum"],
  pcos: ["pcos", "labs", "wellness", "ttc"],
  mood: ["mood", "wellness", "postpartum"],
  labs: ["labs", "rx", "wellness"],
  rx: ["rx", "labs"],
  insurance: ["insurance"],
  wellness: ["wellness", "labs"],
  family: ["family", "insurance"],
};

export function scoreContent(c: ContentRow, profile: MatchIntake): number {
  let s = 0;
  if (profile.stage && c.life_stage === profile.stage) s += 6;
  if (profile.stage) {
    const allowed = STAGE_CATEGORY_MAP[profile.stage as LifeStage] ?? [];
    if (c.category && allowed.includes(c.category)) s += 3;
  }
  if (profile.languages && c.language && profile.languages.includes(c.language)) s += 2;
  else if (profile.language && c.language === profile.language) s += 2;
  if (profile.city && c.location && c.location.toLowerCase().includes(profile.city.toLowerCase())) s += 2;
  return s;
}

export function rankForProfile(rows: ContentRow[], profile: MatchIntake) {
  return [...rows].sort((a, b) => scoreContent(b, profile) - scoreContent(a, profile));
}

export function estimateReadTime(body: string | null, type: string): string {
  if (type === "video") return "Watch · 3 min";
  if (type === "tip") return "Read · 1 min";
  if (type === "event") return "Event";
  if (type === "promotion") return "Offer";
  const words = (body ?? "").trim().split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.round(words / 200));
  return `Read · ${mins} min`;
}

export const CONTENT_TYPES = [
  { key: "article", label: "Article" },
  { key: "video", label: "Video" },
  { key: "tip", label: "Quick tip" },
  { key: "event", label: "Event / workshop" },
  { key: "promotion", label: "Promotion" },
] as const;

export const CONTENT_CATEGORIES = [
  { key: "ttc", label: "Trying to conceive" },
  { key: "ivf", label: "IVF / fertility" },
  { key: "pregnant", label: "Pregnancy" },
  { key: "postpartum", label: "Postpartum" },
  { key: "newborn", label: "Newborn care" },
  { key: "pcos", label: "PCOS / hormonal health" },
  { key: "labs", label: "Labs" },
  { key: "rx", label: "Prescriptions" },
  { key: "insurance", label: "Insurance / payment" },
  { key: "mood", label: "Mental health" },
  { key: "wellness", label: "Wellness" },
  { key: "family", label: "Family support" },
  { key: "baby", label: "Baby essentials" },
  { key: "community", label: "Community events" },
] as const;

export const CTA_OPTIONS = [
  { key: "book", label: "Book appointment" },
  { key: "quote", label: "Request quote" },
  { key: "profile", label: "View profile" },
  { key: "message", label: "Message vendor" },
  { key: "save", label: "Save post" },
  { key: "register", label: "Register for event" },
  { key: "shop", label: "Shop now" },
  { key: "navigator", label: "Ask a navigator" },
] as const;
