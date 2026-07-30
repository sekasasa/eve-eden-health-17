// Provider discovery: normalization, exclusion, ranking and transparent
// fallback logic for Find Care.
//
// Design rules:
// - Location / language / cultural preferences are RANKING signals by default.
//   They only become hard filters when the mother explicitly turns them into
//   strict filters.
// - Records that are not verified / not active / malformed are never shown.
// - When we broaden the search we say so, in order:
//   exact city -> nearby region -> verified virtual care -> truthful zero state.

export type MatchProviderRecord = {
  id: string;
  full_name: string | null;
  specialty: string | null;
  clinic_name: string | null;
  city: string | null;
  country: string | null;
  bio: string | null;
  languages: string[] | null;
  services: string | string[] | null;
  credentials: string | string[] | null;
  avg_rating: number | null;
  review_count: number | null;
  consultation_fee_mad: number | null;
  is_verified: boolean | null;
  accepting_patients: boolean | null;
  status?: string | null;
  /** Moderation field in this database ("verified" / "approved" are public). */
  review_status?: string | null;
};

/* ------------------------------------------------------------------ */
/* Normalization                                                       */
/* ------------------------------------------------------------------ */

const COUNTRY_ALIASES: Record<string, string> = {
  ma: "MA",
  mar: "MA",
  morocco: "MA",
  maroc: "MA",
  "al maghrib": "MA",
  us: "US",
  usa: "US",
  "united states": "US",
  ca: "CA",
  canada: "CA",
  mx: "MX",
  mexico: "MX",
  fr: "FR",
  france: "FR",
  br: "BR",
  brazil: "BR",
  brasil: "BR",
  ng: "NG",
  nigeria: "NG",
  ke: "KE",
  kenya: "KE",
  za: "ZA",
  "south africa": "ZA",
  eg: "EG",
  egypt: "EG",
  tn: "TN",
  tunisia: "TN",
  dz: "DZ",
  algeria: "DZ",
  sn: "SN",
  senegal: "SN",
  gh: "GH",
  ghana: "GH",
  ug: "UG",
  uganda: "UG",
  rw: "RW",
  rwanda: "RW",
};

/** Returns a stable ISO-2 style code when we recognise the value. */
export function normalizeCountry(value?: string | null): string | null {
  if (!value) return null;
  const raw = value.trim().toLowerCase();
  if (!raw) return null;
  return COUNTRY_ALIASES[raw] ?? value.trim().toUpperCase();
}

export function sameCountry(a?: string | null, b?: string | null): boolean {
  const na = normalizeCountry(a);
  const nb = normalizeCountry(b);
  if (!na || !nb) return false;
  return na === nb;
}

const LANGUAGE_ALIASES: Record<string, string> = {
  en: "english",
  eng: "english",
  english: "english",
  fr: "french",
  fra: "french",
  fre: "french",
  french: "french",
  français: "french",
  francais: "french",
  ar: "arabic",
  ara: "arabic",
  arabic: "arabic",
  darija: "arabic",
  "darija / moroccan arabic": "arabic",
  "moroccan arabic": "arabic",
  es: "spanish",
  spa: "spanish",
  spanish: "spanish",
  pt: "portuguese",
  por: "portuguese",
  portuguese: "portuguese",
  amazigh: "amazigh",
  tamazight: "amazigh",
  "tamazight / amazigh": "amazigh",
  berber: "amazigh",
};

export function normalizeLanguage(value?: string | null): string | null {
  if (!value) return null;
  const raw = value.trim().toLowerCase();
  if (!raw) return null;
  if (LANGUAGE_ALIASES[raw]) return LANGUAGE_ALIASES[raw];
  const head = raw.split(" / ")[0].trim();
  return LANGUAGE_ALIASES[head] ?? head;
}

/**
 * City spellings seen across seeded rows, onboarding free text and Arabic or
 * French input, mapped to one canonical key.
 */
const CITY_ALIASES: Record<string, string> = {
  casa: "casablanca",
  "casablanca-settat": "casablanca",
  "dar el beida": "casablanca",
  "dar elbeida": "casablanca",
  "الدار البيضاء": "casablanca",
  "الرباط": "rabat",
  rbat: "rabat",
  "rabat-sale": "rabat",
  "rabat-sale-kenitra": "rabat",
  "sale": "sale",
  "salé": "sale",
  "سلا": "sale",
  "kenitra": "kenitra",
  "القنيطرة": "kenitra",
  "mohammadia": "mohammedia",
  "المحمدية": "mohammedia",
  "marrakesh": "marrakech",
  "مراكش": "marrakech",
};

export function normalizeCity(value?: string | null): string | null {
  if (!value) return null;
  const s = value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
  if (!s) return null;
  return CITY_ALIASES[s] ?? CITY_ALIASES[value.trim().toLowerCase()] ?? s;
}


/* ------------------------------------------------------------------ */
/* Specialty taxonomy                                                  */
/* ------------------------------------------------------------------ */

export const SPECIALTY_GROUPS: Record<string, string[]> = {
  "OB-GYN": ["obgyn", "ob-gyn", "ob gyn", "obstetric", "gyneco", "gynaeco", "maternity hospital"],
  "Fertility / IVF": ["ivf", "fertility", "reproductive endocrin", "pma"],
  Midwife: ["midwife", "sage-femme", "sage femme"],
  Doula: ["doula"],
  Pediatrician: ["pediatric", "paediatric", "pédiatre"],
  Therapist: ["therapist", "psycholog", "psychiatr", "mental health", "perinatal mental"],
  Lab: ["lab", "laborato", "analyse", "imaging", "radiolog", "echograph"],
  Pharmacy: ["pharmac"],
  Insurance: ["insurance", "assurance", "mutuelle"],
  Wellness: ["wellness", "nutrition", "physio", "physiotherapy", "pelvic", "yoga", "lactation"],
};

export function matchesSpecialty(p: MatchProviderRecord, label: string): boolean {
  if (!label || label === "All") return true;
  const keywords = SPECIALTY_GROUPS[label];
  const hay = `${p.specialty ?? ""} ${listToText(p.services)}`.toLowerCase();
  if (!keywords) return hay.includes(label.toLowerCase());
  return keywords.some((k) => hay.includes(k));
}

/* ------------------------------------------------------------------ */
/* Exclusion / quarantine                                              */
/* ------------------------------------------------------------------ */

const INACTIVE_STATUSES = new Set([
  "inactive",
  "rejected",
  "quarantined",
  "suspended",
  "archived",
  "draft",
  "pending",
  "lead",
]);

const PLACEHOLDER_NAME = /^(test|demo|sample|placeholder|tbd|n\/?a|unknown|xxx+)\b/i;

/**
 * `providers.review_status` is the moderation field in this database. Only
 * these values are eligible for public display.
 */
export const ELIGIBLE_REVIEW_STATUSES = new Set(["verified", "approved"]);

/**
 * A record is displayable only when it is verified, moderation-approved,
 * active, and has a usable name. Everything else is quarantined.
 */
export function isDisplayableProvider(p: MatchProviderRecord): boolean {
  if (!p) return false;
  if (p.is_verified !== true) return false;
  const review = (p.review_status ?? "").trim().toLowerCase();
  if (review && !ELIGIBLE_REVIEW_STATUSES.has(review)) return false;
  const status = (p.status ?? "").trim().toLowerCase();
  if (status && INACTIVE_STATUSES.has(status)) return false;
  const name = (p.full_name ?? "").trim();
  if (name.length < 2) return false;
  if (PLACEHOLDER_NAME.test(name)) return false;
  return true;
}

/* ------------------------------------------------------------------ */
/* Geography fallback                                                  */
/* ------------------------------------------------------------------ */

/** Cities considered "nearby" for the launch corridor and other hubs. */
export const NEARBY_CITIES: Record<string, string[]> = {
  casablanca: ["rabat", "mohammedia", "sale", "kenitra", "bouskoura", "dar bouazza"],
  rabat: ["casablanca", "sale", "temara", "kenitra", "mohammedia"],
  sale: ["rabat", "casablanca", "kenitra"],
  kenitra: ["rabat", "sale", "casablanca"],
  mohammedia: ["casablanca", "rabat"],
  marrakech: ["casablanca"],
};

export function isNearbyCity(userCity?: string | null, providerCity?: string | null): boolean {
  const u = normalizeCity(userCity);
  const p = normalizeCity(providerCity);
  if (!u || !p) return false;
  if (u === p) return false;
  return (NEARBY_CITIES[u] ?? []).includes(p);
}

const VIRTUAL_RE = /virtual|telehealth|teleconsult|téléconsult|online|en ligne/;
const HOME_RE = /home visit|à domicile|a domicile|domicile|home-visit|in-home/;

export function haystackFor(p: MatchProviderRecord): string {
  return [
    listToText(p.services),
    listToText(p.credentials),
    (p.languages ?? []).join(" "),
    p.specialty ?? "",
    p.bio ?? "",
    p.clinic_name ?? "",
    p.city ?? "",
    p.country ?? "",
  ]
    .join(" ")
    .toLowerCase();
}

export function offersVirtual(p: MatchProviderRecord): boolean {
  return VIRTUAL_RE.test(haystackFor(p));
}

export function offersHomeVisit(p: MatchProviderRecord): boolean {
  return HOME_RE.test(haystackFor(p));
}

function listToText(v: string | string[] | null | undefined): string {
  if (!v) return "";
  return Array.isArray(v) ? v.join(" ") : v;
}

export function speaksLanguage(p: MatchProviderRecord, language: string): boolean {
  const want = normalizeLanguage(language);
  if (!want) return false;
  return (p.languages ?? []).some((l) => normalizeLanguage(l) === want);
}

/* ------------------------------------------------------------------ */
/* Matching                                                            */
/* ------------------------------------------------------------------ */

export type MatchCriteria = {
  specialty?: string;
  country?: string | null;
  city?: string | null;
  languages?: string[];
  dialect?: string | null;
  virtual?: boolean;
  homeVisit?: boolean;
  /** Free-text keyword preferences (cultural, dietary, birth, etc.) */
  preferenceKeywords?: string[][];
  /** Explicit strict filters chosen by the mother. */
  strict?: {
    country?: boolean;
    city?: boolean;
    language?: boolean;
    dialect?: boolean;
    virtual?: boolean;
    homeVisit?: boolean;
    preferences?: boolean;
  };
};

export type MatchTier = "exact_city" | "nearby" | "virtual" | "none";

export type MatchResult = {
  results: MatchProviderRecord[];
  tier: MatchTier;
  /** True when we had to relax location to produce these results. */
  broadened: boolean;
  /** Human-readable explanation of the broadening, or null. */
  broadenedReason: string | null;
  excludedCount: number;
};

/** Hard filters — only ever applied when explicitly marked strict. */
function passesStrict(p: MatchProviderRecord, c: MatchCriteria): boolean {
  const s = c.strict ?? {};
  if (s.country && c.country && !sameCountry(p.country, c.country)) return false;
  if (s.city && c.city && normalizeCity(p.city) !== normalizeCity(c.city)) return false;
  if (s.language && c.languages?.length) {
    if (!c.languages.some((l) => speaksLanguage(p, l))) return false;
  }
  if (s.dialect && c.dialect) {
    const d = c.dialect.trim().toLowerCase();
    if (d && !(p.languages ?? []).some((l) => l.toLowerCase().includes(d))) return false;
  }
  if (s.virtual && c.virtual && !offersVirtual(p)) return false;
  if (s.homeVisit && c.homeVisit && !offersHomeVisit(p)) return false;
  if (s.preferences && c.preferenceKeywords?.length) {
    const hay = haystackFor(p);
    const ok = c.preferenceKeywords.every((group) => group.some((k) => hay.includes(k)));
    if (!ok) return false;
  }
  return true;
}

export function scoreProvider(p: MatchProviderRecord, c: MatchCriteria): number {
  let s = 0;
  if (c.city && normalizeCity(p.city) === normalizeCity(c.city)) s += 8;
  else if (isNearbyCity(c.city, p.city)) s += 4;
  if (c.country && sameCountry(p.country, c.country)) s += 3;
  if (c.languages?.length) {
    const hits = c.languages.filter((l) => speaksLanguage(p, l)).length;
    s += Math.min(hits, 2) * 3;
  }
  if (c.dialect) {
    const d = c.dialect.trim().toLowerCase();
    if (d && (p.languages ?? []).some((l) => l.toLowerCase().includes(d))) s += 2;
  }
  if (c.virtual && offersVirtual(p)) s += 2;
  if (c.homeVisit && offersHomeVisit(p)) s += 2;
  if (c.preferenceKeywords?.length) {
    const hay = haystackFor(p);
    for (const group of c.preferenceKeywords) {
      if (group.some((k) => hay.includes(k))) s += 2;
    }
  }
  if (p.accepting_patients) s += 1;
  s += (p.avg_rating ?? 0) / 5;
  return s;
}

/**
 * Ranked matching with a transparent fallback ladder.
 * Preferences never remove providers unless marked strict.
 */
export function matchProviders(input: MatchProviderRecord[], criteria: MatchCriteria): MatchResult {
  const displayable = input.filter(isDisplayableProvider);
  const excludedCount = input.length - displayable.length;

  const pool = displayable
    .filter((p) => matchesSpecialty(p, criteria.specialty ?? "All"))
    .filter((p) => passesStrict(p, criteria));

  const sort = (list: MatchProviderRecord[]) =>
    [...list].sort((a, b) => scoreProvider(b, criteria) - scoreProvider(a, criteria));

  const base = { excludedCount };

  if (pool.length === 0) {
    return { ...base, results: [], tier: "none", broadened: false, broadenedReason: null };
  }

  const city = normalizeCity(criteria.city);
  if (!city) {
    return {
      ...base,
      results: sort(pool),
      tier: "exact_city",
      broadened: false,
      broadenedReason: null,
    };
  }

  const exact = pool.filter((p) => normalizeCity(p.city) === city);
  if (exact.length > 0) {
    return {
      ...base,
      results: sort(exact),
      tier: "exact_city",
      broadened: false,
      broadenedReason: null,
    };
  }

  const nearby = pool.filter((p) => isNearbyCity(criteria.city, p.city));
  if (nearby.length > 0) {
    return {
      ...base,
      results: sort(nearby),
      tier: "nearby",
      broadened: true,
      broadenedReason: `No verified match in ${criteria.city}. Showing nearby cities.`,
    };
  }

  const virtual = pool.filter(offersVirtual);
  if (virtual.length > 0) {
    return {
      ...base,
      results: sort(virtual),
      tier: "virtual",
      broadened: true,
      broadenedReason: `No verified match near ${criteria.city}. Showing verified virtual care.`,
    };
  }

  return { ...base, results: [], tier: "none", broadened: false, broadenedReason: null };
}
