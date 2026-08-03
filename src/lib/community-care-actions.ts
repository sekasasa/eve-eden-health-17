/**
 * Community -> provider-directory conversion mapping.
 *
 * Pure metadata: maps an existing community category enum onto a contextual
 * care action and, where a real directory mapping exists, an existing
 * specialty filter value used by /eve/providers.
 *
 * Rules:
 * - No free text ever leaves the post (no title, body, symptoms).
 * - Categories with no sensible provider path return null.
 * - Wording is exploratory ("find care"), never diagnostic.
 */

import type { CategoryKey } from "@/lib/community-seed";

/** Topic enum carried in the route search param. Bounded + non-sensitive. */
export type CareTopic =
  | "provider"
  | "nutrition"
  | "emotional"
  | "ivf"
  | "ttc"
  | "pregnancy"
  | "postpartum"
  | "newborn"
  | "symptoms"
  | "birth";

export const CARE_TOPICS: CareTopic[] = [
  "provider",
  "nutrition",
  "emotional",
  "ivf",
  "ttc",
  "pregnancy",
  "postpartum",
  "newborn",
  "symptoms",
  "birth",
];

export function isCareTopic(v: unknown): v is CareTopic {
  return typeof v === "string" && (CARE_TOPICS as string[]).includes(v);
}

export type CareAction = {
  topic: CareTopic;
  /** i18n key for the button label. */
  labelKey: string;
  /**
   * Existing /eve/providers specialty filter value, when a real mapping
   * exists. Null means: open the directory unfiltered with a context banner.
   */
  specialty: string | null;
};

const MAP: Partial<Record<CategoryKey, CareAction>> = {
  provider: { topic: "provider", labelKey: "communityCare.action.provider", specialty: null },
  nutrition: { topic: "nutrition", labelKey: "communityCare.action.nutrition", specialty: null },
  emotional: { topic: "emotional", labelKey: "communityCare.action.emotional", specialty: "Therapist" },
  ivf: { topic: "ivf", labelKey: "communityCare.action.ivf", specialty: "Fertility / IVF" },
  ttc: { topic: "ttc", labelKey: "communityCare.action.ttc", specialty: "Fertility / IVF" },
  pregnancy: { topic: "pregnancy", labelKey: "communityCare.action.pregnancy", specialty: "OB-GYN" },
  postpartum: { topic: "postpartum", labelKey: "communityCare.action.postpartum", specialty: "Midwife" },
  newborn: { topic: "newborn", labelKey: "communityCare.action.newborn", specialty: "Pediatrician" },
  symptoms: { topic: "symptoms", labelKey: "communityCare.action.symptoms", specialty: null },
  birth: { topic: "birth", labelKey: "communityCare.action.birth", specialty: "Midwife" },
};

/** Categories such as labs, insurance, fasting, culture, all -> no action. */
export function careActionForCategory(category: CategoryKey): CareAction | null {
  return MAP[category] ?? null;
}

/** Specialty filter to preselect on /eve/providers for a topic, if any. */
export function specialtyForTopic(topic: CareTopic): string | null {
  return Object.values(MAP).find((a) => a.topic === topic)?.specialty ?? null;
}
