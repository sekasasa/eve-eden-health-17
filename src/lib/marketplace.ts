// Marketplace (Shops & services) taxonomy and hygiene helpers.
//
// The vendors table also stores clinician directory records that were imported
// for Find Care. Those records carry clinical fields (credentials, medical
// biography, specialty training) that must NEVER surface as marketplace
// filters or card copy. We quarantine them at the display layer instead of
// mutating production data.

export type MarketplaceVendor = {
  id: string;
  business_name: string | null;
  category: string | null;
  city: string | null;
  country: string | null;
  logo_url: string | null;
  is_verified: boolean | null;
  is_featured: boolean | null;
  description: string | null;
  services: string | null;
  languages: string[] | null;
  credentials: string | null;
  avg_rating: number | null;
  created_at: string | null;
};

/** Explicit marketplace taxonomy. Anything outside it is not a shop listing. */
export const MARKETPLACE_CATEGORIES = [
  { value: "maternity_wear", label: "Maternity wear" },
  { value: "baby_gear", label: "Baby gear" },
  { value: "nutrition", label: "Nutrition" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "classes", label: "Classes" },
  { value: "services", label: "Support services" },
] as const;

export type MarketplaceCategory = (typeof MARKETPLACE_CATEGORIES)[number]["value"];

const MARKETPLACE_VALUES = new Set<string>(MARKETPLACE_CATEGORIES.map((c) => c.value));

/** Directory/clinical categories that belong to Find Care, not the marketplace. */
export const CLINICAL_CATEGORIES = new Set(["care_services", "provider", "clinic", "clinician"]);

export function categoryLabel(value?: string | null): string {
  const found = MARKETPLACE_CATEGORIES.find((c) => c.value === value);
  return found?.label ?? "Shop";
}

const CLINICAL_TERMS = [
  "ob-gyn",
  "obgyn",
  "obstetric",
  "gyneco",
  "gynaeco",
  "midwife",
  "sage-femme",
  "ivf",
  "fertility clinic",
  "pma",
  "hysteroscopy",
  "laparoscopy",
  "colposcopy",
  "ultrasound",
  "échograph",
  "echograph",
  "maternité",
  "maternity hospital",
  "clinique",
  "cabinet",
  "pediatrician",
  "diagnosis",
  "high-risk pregnancy",
  "medical faculty",
  "medical faculties",
  "hospital training",
];

function hasClinicalSignal(v: MarketplaceVendor): boolean {
  const hay = `${v.description ?? ""} ${v.credentials ?? ""} ${v.services ?? ""}`.toLowerCase();
  return CLINICAL_TERMS.some((t) => hay.includes(t));
}

/**
 * True only for records that are genuinely marketplace listings: verified,
 * inside the explicit taxonomy, with a usable name, and free of clinical
 * directory signals.
 */
export function isMarketplaceVendor(v: MarketplaceVendor): boolean {
  if (!v) return false;
  if (v.is_verified !== true) return false;
  const name = (v.business_name ?? "").trim();
  if (name.length < 2) return false;
  const cat = (v.category ?? "").trim().toLowerCase();
  if (!MARKETPLACE_VALUES.has(cat)) return false;
  if (CLINICAL_CATEGORIES.has(cat)) return false;
  if (hasClinicalSignal(v)) return false;
  return true;
}

/** Card copy for the marketplace — never credentials, never clinical bio. */
export function marketplaceCardCopy(v: MarketplaceVendor): {
  title: string;
  subtitle: string;
  blurb: string | null;
} {
  const title = (v.business_name ?? "").trim() || "Shop";
  const subtitle = [categoryLabel(v.category), v.city?.trim()].filter(Boolean).join(" · ");
  const desc = (v.description ?? "").trim();
  const blurb = desc && desc.length <= 160 && !hasClinicalSignal(v) ? desc : null;
  return { title, subtitle, blurb };
}

/** Language options, normalized and free of malformed / sentence-like values. */
export function marketplaceLanguageOptions(vendors: MarketplaceVendor[]): string[] {
  const set = new Set<string>();
  for (const v of vendors) {
    for (const raw of v.languages ?? []) {
      const l = (raw ?? "").trim();
      if (!l) continue;
      if (l.length > 24) continue; // malformed / pasted sentence
      if (/[.;:,]/.test(l)) continue;
      set.add(l[0].toUpperCase() + l.slice(1));
    }
  }
  return Array.from(set).sort();
}

/** Search scope for the marketplace: never clinical credential text. */
export function marketplaceSearchHaystack(v: MarketplaceVendor): string {
  return [v.business_name, categoryLabel(v.category), v.city, v.services]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}
