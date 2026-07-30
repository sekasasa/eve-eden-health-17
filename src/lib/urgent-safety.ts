/**
 * Centralized high-risk phrase detection for every surface that accepts free
 * text from a mother (Ask Eve, Community composer, symptom notes).
 *
 * Rules:
 * - Detection runs on the MOTHER'S words only, never on generated output.
 * - When a red-flag category matches we suppress generic reassurance and show
 *   urgent escalation with a country-aware emergency number.
 * - This module never diagnoses. It routes to human/emergency care.
 */

import { emergencyContact } from "./personalization";

export type RiskCategory =
  | "reduced_fetal_movement"
  | "severe_bleeding"
  | "chest_pain"
  | "trouble_breathing"
  | "seizure"
  | "self_harm"
  | "severe_pain"
  | "preeclampsia"
  | "fever_infection";

export type RiskMatch = {
  category: RiskCategory;
  /** The phrase that triggered the match — for logging counts, never content. */
  phrase: string;
};

export type RiskAssessment = {
  urgent: boolean;
  categories: RiskCategory[];
  matches: RiskMatch[];
  /** Highest-priority category, drives the headline shown to the user. */
  primary?: RiskCategory;
  /** True for self-harm / suicidal language: crisis routing, not obstetric. */
  crisis: boolean;
};

/**
 * Phrases in English, French and Arabic (MSA + common Darija spellings).
 * Kept lowercase and accent-tolerant via `normalize`.
 */
const PHRASES: Record<RiskCategory, string[]> = {
  self_harm: [
    "kill myself",
    "suicide",
    "suicidal",
    "end my life",
    "want to die",
    "hurt myself",
    "harm myself",
    "self harm",
    "me suicider",
    "suicidaire",
    "me tuer",
    "mourir",
    "me faire du mal",
    "انتحار",
    "اقتل نفسي",
    "أؤذي نفسي",
    "نموت",
  ],
  reduced_fetal_movement: [
    "baby not moving",
    "baby isn't moving",
    "baby is not moving",
    "no movement",
    "not felt the baby",
    "reduced movement",
    "less movement",
    "fewer kicks",
    "no kicks",
    "bebe ne bouge",
    "ne bouge plus",
    "moins de mouvements",
    "pas senti le bebe",
    "الجنين لا يتحرك",
    "ما كيتحركش",
    "قلة الحركة",
  ],
  severe_bleeding: [
    "heavy bleeding",
    "severe bleeding",
    "bleeding a lot",
    "soaking a pad",
    "blood clots",
    "hemorrhage",
    "haemorrhage",
    "saignement abondant",
    "saignement important",
    "hemorragie",
    "je saigne beaucoup",
    "نزيف",
    "نزيف حاد",
    "دم كثير",
  ],
  chest_pain: [
    "chest pain",
    "pain in my chest",
    "chest tightness",
    "crushing pain",
    "douleur thoracique",
    "douleur a la poitrine",
    "oppression thoracique",
    "ألم في الصدر",
    "ضغط في الصدر",
  ],
  trouble_breathing: [
    "can't breathe",
    "cant breathe",
    "trouble breathing",
    "hard to breathe",
    "short of breath",
    "shortness of breath",
    "gasping",
    "j'ai du mal a respirer",
    "difficulte a respirer",
    "essoufflement",
    "je ne peux pas respirer",
    "صعوبة في التنفس",
    "ما قادرة نتنفس",
    "ضيق التنفس",
  ],
  seizure: [
    "seizure",
    "convulsion",
    "fitting",
    "blacked out",
    "passed out",
    "fainted",
    "unconscious",
    "crise convulsive",
    "convulsions",
    "evanoui",
    "perte de connaissance",
    "تشنج",
    "تشنجات",
    "فقدان الوعي",
    "إغماء",
  ],
  preeclampsia: [
    "severe headache",
    "blurred vision",
    "seeing spots",
    "sudden swelling",
    "swollen face",
    "mal de tete severe",
    "vision floue",
    "gonflement soudain",
    "صداع شديد",
    "تشوش الرؤية",
    "تورم مفاجئ",
  ],
  severe_pain: [
    "severe pain",
    "unbearable pain",
    "worst pain",
    "constant pain",
    "douleur severe",
    "douleur intense",
    "douleur insupportable",
    "ألم شديد",
    "وجع قوي",
  ],
  fever_infection: [
    "high fever",
    "fever of 39",
    "fever of 40",
    "green discharge",
    "foul smelling",
    "fievre elevee",
    "forte fievre",
    "حمى شديدة",
    "سخانة قوية",
  ],
};

/** Priority order — the first matching category drives the headline. */
const PRIORITY: RiskCategory[] = [
  "self_harm",
  "seizure",
  "trouble_breathing",
  "chest_pain",
  "severe_bleeding",
  "reduced_fetal_movement",
  "preeclampsia",
  "fever_infection",
  "severe_pain",
];

/** Lowercase + strip accents + collapse punctuation/whitespace. */
export function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’'`]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function assessRisk(input: string | null | undefined): RiskAssessment {
  const text = normalizeText(input ?? "");
  if (!text) {
    return { urgent: false, categories: [], matches: [], crisis: false };
  }

  const matches: RiskMatch[] = [];
  for (const category of PRIORITY) {
    for (const phrase of PHRASES[category]) {
      if (text.includes(normalizeText(phrase))) {
        matches.push({ category, phrase });
        break;
      }
    }
  }

  const categories = matches.map((m) => m.category);
  return {
    urgent: categories.length > 0,
    categories,
    matches,
    primary: categories[0],
    crisis: categories.includes("self_harm"),
  };
}

export type UrgentGuidance = {
  headline: string;
  body: string;
  emergencyNumber: string;
  emergencyLabel: string;
  /** True when reassurance/AI answers must be suppressed entirely. */
  suppressReassurance: boolean;
};

const HEADLINES: Record<RiskCategory, string> = {
  self_harm: "You deserve support right now",
  seizure: "Get emergency help now",
  trouble_breathing: "Get emergency help now",
  chest_pain: "Get emergency help now",
  severe_bleeding: "Get emergency help now",
  reduced_fetal_movement: "Please be checked today",
  preeclampsia: "Please be checked today",
  fever_infection: "Please be checked today",
  severe_pain: "Please be checked today",
};

const BODIES: Record<RiskCategory, string> = {
  self_harm:
    "If you are thinking about harming yourself, please reach out to emergency services or a crisis line now, and tell someone you trust. You do not have to handle this alone.",
  seizure:
    "A seizure or loss of consciousness needs emergency care immediately. Do not wait and do not drive yourself.",
  trouble_breathing:
    "Trouble breathing needs emergency care immediately. Do not wait and do not drive yourself.",
  chest_pain:
    "Chest pain needs emergency care immediately. Do not wait and do not drive yourself.",
  severe_bleeding:
    "Heavy bleeding in pregnancy or after birth needs emergency care immediately. Do not wait and do not drive yourself.",
  reduced_fetal_movement:
    "A change in your baby's movements should always be checked the same day. Contact your maternity unit or midwife now — they expect these calls.",
  preeclampsia:
    "A severe headache, vision changes or sudden swelling should be checked the same day by your maternity unit.",
  fever_infection:
    "A high fever or signs of infection should be checked the same day by a clinician.",
  severe_pain:
    "Severe or constant pain should be checked the same day by a clinician.",
};

export function urgentGuidance(
  assessment: RiskAssessment,
  countryCode?: string | null,
): UrgentGuidance | null {
  if (!assessment.urgent || !assessment.primary) return null;
  const contact = emergencyContact(countryCode);
  return {
    headline: HEADLINES[assessment.primary],
    body: BODIES[assessment.primary],
    emergencyNumber: contact.number,
    emergencyLabel: contact.label,
    suppressReassurance: true,
  };
}

/** Convenience wrapper for callers that only need a boolean. */
export function isUrgentText(input: string | null | undefined): boolean {
  return assessRisk(input).urgent;
}
