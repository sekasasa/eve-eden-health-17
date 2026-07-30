/**
 * Canonical life-stage service.
 *
 * Home, profile, My Plan, guidance and Care Passport all previously derived
 * stage labels independently. This module is the single source of truth for
 * normalizing whatever is stored (onboarding answers, mothers.stage,
 * care preferences, legacy values) into one canonical stage plus its copy.
 */

export const LIFE_STAGES = [
  "ttc",
  "fertility_treatment",
  "pregnant",
  "postpartum",
  "parenting",
  "loss",
  "unspecified",
] as const;

export type CanonicalLifeStage = (typeof LIFE_STAGES)[number];

const ALIASES: Record<string, CanonicalLifeStage> = {
  // trying to conceive
  ttc: "ttc",
  trying: "ttc",
  "trying to conceive": "ttc",
  preconception: "ttc",
  planning: "ttc",
  // fertility treatment
  ivf: "fertility_treatment",
  iui: "fertility_treatment",
  fertility: "fertility_treatment",
  "fertility treatment": "fertility_treatment",
  fertility_treatment: "fertility_treatment",
  pcos: "fertility_treatment",
  // pregnancy
  pregnant: "pregnant",
  pregnancy: "pregnant",
  expecting: "pregnant",
  prenatal: "pregnant",
  antenatal: "pregnant",
  // postpartum
  postpartum: "postpartum",
  "post-partum": "postpartum",
  newborn: "postpartum",
  fourthtrimester: "postpartum",
  "fourth trimester": "postpartum",
  // parenting
  parenting: "parenting",
  baby: "parenting",
  toddler: "parenting",
  family: "parenting",
  // loss
  loss: "loss",
  miscarriage: "loss",
  bereavement: "loss",
  stillbirth: "loss",
};

export type StageCopy = {
  stage: CanonicalLifeStage;
  /** Short label for nav, chips and headers. */
  label: string;
  /** One-line description used on Home and My Plan. */
  summary: string;
  /** Provider specialties this stage should rank first. */
  specialties: string[];
};

export const STAGE_COPY: Record<CanonicalLifeStage, StageCopy> = {
  ttc: {
    stage: "ttc",
    label: "Trying to conceive",
    summary: "Preparing your body, cycle tracking, and knowing when to ask for help.",
    specialties: ["ob_gyn", "fertility", "nutritionist"],
  },
  fertility_treatment: {
    stage: "fertility_treatment",
    label: "Fertility treatment",
    summary: "Navigating IVF or IUI, costs, timelines, and emotional support.",
    specialties: ["fertility", "ivf", "ob_gyn", "therapist"],
  },
  pregnant: {
    stage: "pregnant",
    label: "Pregnant",
    summary: "Appointments, tests, and preparing for the birth you want.",
    specialties: ["ob_gyn", "midwife", "doula", "ultrasound"],
  },
  postpartum: {
    stage: "postpartum",
    label: "Postpartum",
    summary: "Recovery, feeding, mood, and your baby's first months.",
    specialties: ["midwife", "lactation", "pediatrician", "therapist", "doula"],
  },
  parenting: {
    stage: "parenting",
    label: "Parenting",
    summary: "Growth, routines, and staying well as a family.",
    specialties: ["pediatrician", "nutritionist", "therapist"],
  },
  loss: {
    stage: "loss",
    label: "After a loss",
    summary: "Support at your pace — care, grief support, and next steps only if you want them.",
    specialties: ["therapist", "ob_gyn", "doula"],
  },
  unspecified: {
    stage: "unspecified",
    label: "Getting started",
    summary: "Tell us where you are and we'll tailor your care plan.",
    specialties: ["ob_gyn", "midwife"],
  },
};

/** Normalize any stored value into a canonical stage. Never throws. */
export function normalizeLifeStage(
  value?: string | null,
): CanonicalLifeStage {
  if (!value) return "unspecified";
  const key = value.trim().toLowerCase().replace(/\s+/g, " ");
  return ALIASES[key] ?? ALIASES[key.replace(/ /g, "_")] ?? "unspecified";
}

export type StageSources = {
  /** mothers.stage — most authoritative once onboarding completes. */
  motherStage?: string | null;
  /** care preferences stage, set from the profile screen. */
  preferenceStage?: string | null;
  /** legacy intake / match store value. */
  intakeStage?: string | null;
  /** presence of a pregnancy week implies pregnancy when nothing else is set. */
  pregnancyWeek?: number | null;
};

/**
 * Resolve one stage from all known sources with a documented precedence:
 * mothers.stage > care preference > intake > derived from pregnancy week.
 */
export function resolveLifeStage(sources: StageSources): CanonicalLifeStage {
  const ordered = [
    sources.motherStage,
    sources.preferenceStage,
    sources.intakeStage,
  ];
  for (const candidate of ordered) {
    const stage = normalizeLifeStage(candidate);
    if (stage !== "unspecified") return stage;
  }
  if (typeof sources.pregnancyWeek === "number" && sources.pregnancyWeek > 0) {
    return "pregnant";
  }
  return "unspecified";
}

export function stageCopy(stage: CanonicalLifeStage): StageCopy {
  return STAGE_COPY[stage] ?? STAGE_COPY.unspecified;
}

/** True when two stored values mean the same thing (used to detect drift). */
export function sameLifeStage(a?: string | null, b?: string | null): boolean {
  return normalizeLifeStage(a) === normalizeLifeStage(b);
}
