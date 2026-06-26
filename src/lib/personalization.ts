// Central personalization helpers used across Home, Ask Eve, Find Care,
// Events, Community, and Care Plan.
//
// IMPORTANT: We never infer preferences from country, language, name, race,
// religion, ethnicity, or dialect. We only personalize based on what the
// mother explicitly selected in onboarding / Care Preferences.

export type Region =
  | "north_america"
  | "south_america"
  | "central_america"
  | "africa"
  | "europe"
  | "middle_east"
  | "asia"
  | "oceania"
  | "other";

export type CarePrefs = {
  region: string | null;
  country: string | null;
  city: string | null;
  language: string | null;
  secondary_language: string | null;
  dialect: string | null;
  stage: string | null;
  care_setting: string | null; // in_person | virtual | home | unsure
  cultural_prefs: string[];
  dietary_prefs: string[];
  birth_prefs: string[];
  personalize_opt: string | null; // "yes" | "no" | null
};

export const EMPTY_PREFS: CarePrefs = {
  region: null,
  country: null,
  city: null,
  language: null,
  secondary_language: null,
  dialect: null,
  stage: null,
  care_setting: null,
  cultural_prefs: [],
  dietary_prefs: [],
  birth_prefs: [],
  personalize_opt: null,
};

// Country -> emergency dispatch number. Falls back to a generic message.
const EMERGENCY_BY_COUNTRY: Record<string, { number: string; label: string }> = {
  MA: { number: "150", label: "SAMU (Morocco)" },
  FR: { number: "15", label: "SAMU (France)" },
  US: { number: "911", label: "911 (USA)" },
  CA: { number: "911", label: "911 (Canada)" },
  MX: { number: "911", label: "911 (Mexico)" },
  GT: { number: "123", label: "Emergencias (Guatemala)" },
  HN: { number: "911", label: "911 (Honduras)" },
  SV: { number: "911", label: "911 (El Salvador)" },
  NI: { number: "128", label: "Cruz Roja (Nicaragua)" },
  CR: { number: "911", label: "911 (Costa Rica)" },
  PA: { number: "911", label: "911 (Panama)" },
  BR: { number: "192", label: "SAMU (Brazil)" },
  AR: { number: "107", label: "SAME (Argentina)" },
  CL: { number: "131", label: "SAMU (Chile)" },
  CO: { number: "123", label: "Línea (Colombia)" },
  PE: { number: "106", label: "SAMU (Peru)" },
  EC: { number: "911", label: "911 (Ecuador)" },
  BO: { number: "118", label: "Emergencias (Bolivia)" },
  UY: { number: "105", label: "Emergencias (Uruguay)" },
  PY: { number: "141", label: "Emergencias (Paraguay)" },
  NG: { number: "112", label: "112 (Nigeria)" },
  KE: { number: "999", label: "999 (Kenya)" },
  UG: { number: "999", label: "999 (Uganda)" },
  RW: { number: "912", label: "912 (Rwanda)" },
  ET: { number: "907", label: "Ambulance (Ethiopia)" },
  ZA: { number: "10177", label: "Ambulance (South Africa)" },
  SN: { number: "1515", label: "SAMU (Senegal)" },
  CI: { number: "185", label: "SAMU (Côte d'Ivoire)" },
  CD: { number: "112", label: "Urgences (DRC)" },
  CM: { number: "119", label: "Urgences (Cameroon)" },
  DZ: { number: "14", label: "Protection civile (Algeria)" },
  TN: { number: "190", label: "SAMU (Tunisia)" },
  EG: { number: "123", label: "Ambulance (Egypt)" },
  GB: { number: "999", label: "999 (UK)" },
  IE: { number: "112", label: "112 (Ireland)" },
  ES: { number: "112", label: "112 (Spain)" },
  PT: { number: "112", label: "112 (Portugal)" },
  IT: { number: "118", label: "Soccorso (Italy)" },
  DE: { number: "112", label: "112 (Germany)" },
};

export function emergencyContact(countryCode?: string | null): { number: string; label: string } {
  if (!countryCode) return { number: "112", label: "International emergency" };
  return EMERGENCY_BY_COUNTRY[countryCode.toUpperCase()] ?? { number: "112", label: "International emergency" };
}

// Region inferred from a stored region key OR a country code.
// This is used to scope content/events when the user has not set region directly.
const COUNTRY_TO_REGION: Record<string, Region> = {
  US: "north_america", CA: "north_america", MX: "north_america",
  GT: "central_america", HN: "central_america", SV: "central_america", NI: "central_america", CR: "central_america", PA: "central_america", BZ: "central_america",
  BR: "south_america", AR: "south_america", CL: "south_america", CO: "south_america", PE: "south_america", EC: "south_america", BO: "south_america", UY: "south_america", PY: "south_america", VE: "south_america",
  MA: "africa", DZ: "africa", TN: "africa", EG: "africa", LY: "africa", NG: "africa", KE: "africa", UG: "africa", RW: "africa", ET: "africa", ZA: "africa", SN: "africa", CI: "africa", GH: "africa", CD: "africa", CM: "africa", SO: "africa",
  FR: "europe", ES: "europe", PT: "europe", GB: "europe", IE: "europe", IT: "europe", DE: "europe", NL: "europe", BE: "europe",
};

export function regionOf(prefs: CarePrefs): Region | null {
  if (prefs.region) {
    const r = prefs.region.toLowerCase().replace(/[\s-]/g, "_");
    if (r.includes("north")) return "north_america";
    if (r.includes("central")) return "central_america";
    if (r.includes("south")) return "south_america";
    if (r.includes("africa")) return "africa";
    if (r.includes("europe")) return "europe";
    if (r.includes("middle")) return "middle_east";
    if (r.includes("asia")) return "asia";
    if (r.includes("oceania")) return "oceania";
  }
  if (prefs.country) {
    return COUNTRY_TO_REGION[prefs.country.toUpperCase()] ?? null;
  }
  return null;
}

// Languages we surface as "regional priority" for each region. Used to rank
// providers, events, and community content, NOT to assume identity.
export function priorityLanguagesForRegion(region: Region | null): string[] {
  switch (region) {
    case "north_america": return ["en", "es", "fr", "ht"];
    case "central_america": return ["es", "en", "quc", "cak", "myn", "cab"];
    case "south_america": return ["es", "pt", "qu", "gn", "ay"];
    case "africa": return ["fr", "ar", "ary", "zgh", "sw", "lg", "rw", "am", "ha", "yo", "ig", "wo", "zu", "xh", "af", "so", "ln", "en"];
    case "europe": return ["en", "fr", "es", "pt", "ar"];
    default: return [];
  }
}

// Pref helpers — match by token, case-insensitive.
function hasPref(list: string[] | null | undefined, ...keys: string[]) {
  if (!list) return false;
  const lower = list.map((s) => s.toLowerCase());
  return keys.some((k) => lower.some((s) => s.includes(k.toLowerCase())));
}

export const prefHelpers = {
  femalePreferred: (p: CarePrefs) => hasPref(p.cultural_prefs, "female"),
  modesty: (p: CarePrefs) => hasPref(p.cultural_prefs, "modesty"),
  faithSensitive: (p: CarePrefs) => hasPref(p.cultural_prefs, "faith"),
  ramadan: (p: CarePrefs) => hasPref(p.cultural_prefs, "ramadan"),
  lent: (p: CarePrefs) => hasPref(p.cultural_prefs, "lent", "christian fasting"),
  fasting: (p: CarePrefs) =>
    hasPref(p.cultural_prefs, "fasting", "ramadan", "lent") ||
    hasPref(p.dietary_prefs, "fasting"),
  familyInvolved: (p: CarePrefs) => hasPref(p.cultural_prefs, "family involved"),
  privateFromFamily: (p: CarePrefs) => hasPref(p.cultural_prefs, "private", "keep care private"),
  vegan: (p: CarePrefs) => hasPref(p.dietary_prefs, "vegan"),
  vegetarian: (p: CarePrefs) => hasPref(p.dietary_prefs, "vegetarian", "vegan", "pescatarian"),
  halal: (p: CarePrefs) => hasPref(p.dietary_prefs, "halal", "no pork"),
  kosher: (p: CarePrefs) => hasPref(p.dietary_prefs, "kosher"),
  glutenFree: (p: CarePrefs) => hasPref(p.dietary_prefs, "gluten"),
  dairyFree: (p: CarePrefs) => hasPref(p.dietary_prefs, "dairy"),
  lowIntervention: (p: CarePrefs) => hasPref(p.birth_prefs, "low-intervention", "low intervention"),
  vbac: (p: CarePrefs) => hasPref(p.birth_prefs, "vbac"),
  midwife: (p: CarePrefs) => hasPref(p.birth_prefs, "midwife"),
  doula: (p: CarePrefs) => hasPref(p.birth_prefs, "doula"),
  birthPlan: (p: CarePrefs) => hasPref(p.birth_prefs, "birth plan"),
};

// Ask-Eve suggested prompts, derived ONLY from explicit user preferences.
export function suggestedPromptsFromPrefs(p: CarePrefs): { chip: string; label: string }[] {
  const out: { chip: string; label: string }[] = [];

  if (prefHelpers.ramadan(p) || prefHelpers.fasting(p)) {
    out.push({
      chip: "Fasting prep",
      label: "Help me prepare questions about fasting during pregnancy.",
    });
  }
  if (prefHelpers.halal(p)) {
    out.push({
      chip: "Medication ingredients",
      label: "Help me prepare questions about medication ingredients I should ask my provider about.",
    });
  }
  if (prefHelpers.vegan(p)) {
    out.push({
      chip: "Vegan nutrition",
      label: "Help me prepare questions about B12, iron, vitamin D, iodine, and omega-3 on a vegan pregnancy diet.",
    });
  } else if (prefHelpers.vegetarian(p)) {
    out.push({
      chip: "Vegetarian nutrition",
      label: "Help me prepare questions about iron, B12, and protein on a vegetarian pregnancy diet.",
    });
  }
  if (prefHelpers.vbac(p)) {
    out.push({
      chip: "VBAC conversation",
      label: "Help me prepare questions to discuss VBAC with my provider, when medically appropriate.",
    });
  }
  if (prefHelpers.lowIntervention(p)) {
    out.push({
      chip: "Birth options",
      label: "Help me understand low-intervention birth options, when medically appropriate.",
    });
  }
  if (prefHelpers.birthPlan(p)) {
    out.push({
      chip: "Birth plan",
      label: "Help me draft a birth plan I can discuss with my care team.",
    });
  }
  if (prefHelpers.femalePreferred(p)) {
    out.push({
      chip: "Female provider",
      label: "Help me find a female provider near me.",
    });
  }
  if (prefHelpers.familyInvolved(p)) {
    out.push({
      chip: "Family support",
      label: "How can I share a care plan summary with my family?",
    });
  }
  return out.slice(0, 6);
}

// Home callouts derived only from explicit preferences.
export function homeCalloutsFromPrefs(p: CarePrefs): {
  id: string;
  title: string;
  body: string;
  to?: string;
}[] {
  const out: { id: string; title: string; body: string; to?: string }[] = [];
  if (prefHelpers.ramadan(p)) {
    out.push({
      id: "ramadan",
      title: "Ramadan-aware care",
      body: "Prepare questions about fasting during pregnancy, and find clinicians and nutrition guidance you can discuss it with.",
      to: "/eve/ask",
    });
  }
  if (prefHelpers.vegan(p)) {
    out.push({
      id: "vegan",
      title: "Vegan pregnancy nutrition",
      body: "See lab/supplement question prep around B12, iron, vitamin D, iodine, and omega-3.",
      to: "/eve/ask",
    });
  }
  if (prefHelpers.halal(p)) {
    out.push({
      id: "halal",
      title: "Medication ingredient prep",
      body: "Get help preparing questions about medication ingredients to ask your provider.",
      to: "/eve/ask",
    });
  }
  if (prefHelpers.vbac(p) || prefHelpers.lowIntervention(p)) {
    out.push({
      id: "birth",
      title: "Birth planning support",
      body: "Explore birth options and find clinicians who can discuss them — when medically appropriate.",
      to: "/eve/providers",
    });
  }
  if (prefHelpers.familyInvolved(p) && !prefHelpers.privateFromFamily(p)) {
    out.push({
      id: "family",
      title: "Share care with family",
      body: "Invite a family supporter and share a care plan summary.",
      to: "/eve/match/family",
    });
  }
  return out;
}

// Rank providers using stated preferences. Returns a score; higher is better.
// Never infers preferences; only honors explicitly stated ones.
export function providerPersonalizationScore(
  p: {
    languages: string[] | null;
    city: string | null;
    services: string[] | null;
    credentials: string[] | null;
  },
  prefs: CarePrefs,
): number {
  let s = 0;
  const langs = (p.languages ?? []).map((l) => l.toLowerCase());
  const services = (p.services ?? []).map((l) => l.toLowerCase()).join(" ");
  const creds = (p.credentials ?? []).map((l) => l.toLowerCase()).join(" ");
  const haystack = `${services} ${creds}`;

  if (prefs.language && langs.some((l) => l.includes(prefs.language!.toLowerCase()))) s += 4;
  if (prefs.secondary_language && langs.some((l) => l.includes(prefs.secondary_language!.toLowerCase()))) s += 2;
  if (prefs.dialect && langs.some((l) => l.includes(prefs.dialect!.toLowerCase()))) s += 2;
  if (prefs.city && (p.city ?? "").toLowerCase().includes(prefs.city.toLowerCase())) s += 3;

  if (prefHelpers.vbac(prefs) && haystack.includes("vbac")) s += 3;
  if (prefHelpers.midwife(prefs) && (haystack.includes("midwife") || haystack.includes("sage-femme"))) s += 3;
  if (prefHelpers.doula(prefs) && haystack.includes("doula")) s += 3;
  if (prefHelpers.lowIntervention(prefs) && (haystack.includes("low-intervention") || haystack.includes("natural"))) s += 2;
  if (prefHelpers.ramadan(prefs) && haystack.includes("ramadan")) s += 2;
  if (prefHelpers.vegan(prefs) && (haystack.includes("vegan") || haystack.includes("vegetarian"))) s += 2;
  if (prefHelpers.halal(prefs) && haystack.includes("halal")) s += 1;

  return s;
}
