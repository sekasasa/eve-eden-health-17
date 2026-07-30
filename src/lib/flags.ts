/**
 * Launch feature flags.
 *
 * Every capability that depends on an unverified production backend,
 * clinical review, or a business/legal decision defaults to OFF. A flag is
 * only enabled when the corresponding environment variable is explicitly
 * set to the string "on" (or "true") at build time.
 *
 * Turning a flag ON is a deliberate release decision — never flip a default
 * here to make a screen "look finished".
 */

export type FeatureFlag =
  | "askEveAi"
  | "communityPosting"
  | "communityModeration"
  | "insuranceVerification"
  | "carePassportSharing"
  | "eventRegistration";

type Env = Record<string, unknown> | undefined;

function readEnv(): Env {
  try {
    return import.meta.env as unknown as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function isOn(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const v = value.trim().toLowerCase();
  return v === "on" || v === "true" || v === "1";
}

const ENV_KEYS: Record<FeatureFlag, string> = {
  askEveAi: "VITE_FLAG_ASK_EVE_AI",
  communityPosting: "VITE_FLAG_COMMUNITY_POSTING",
  communityModeration: "VITE_FLAG_COMMUNITY_MODERATION",
  insuranceVerification: "VITE_FLAG_INSURANCE_VERIFICATION",
  carePassportSharing: "VITE_FLAG_CARE_PASSPORT_SHARING",
  eventRegistration: "VITE_FLAG_EVENT_REGISTRATION",
};

/** Safe defaults. All unverified capabilities are OFF for launch. */
export const FLAG_DEFAULTS: Record<FeatureFlag, boolean> = {
  askEveAi: false,
  communityPosting: false,
  communityModeration: false,
  insuranceVerification: false,
  carePassportSharing: false,
  eventRegistration: false,
};

/** Human-readable reason shown in the UI when a flag is OFF. */
export const FLAG_OFF_COPY: Record<FeatureFlag, string> = {
  askEveAi:
    "Ask Eve replies are paused while we finish safety review. You can still write your question and save it for your next visit.",
  communityPosting:
    "Community posting opens with our pilot. Reading is open now; we turn on posting once moderation is staffed.",
  communityModeration: "Moderation tooling is not live yet.",
  insuranceVerification:
    "Insurance verification is not connected yet. Any amounts shown are estimates only — confirm with your insurer.",
  carePassportSharing:
    "Secure sharing is coming soon. Until then your Care Passport stays on your account only.",
  eventRegistration:
    "Registration opens soon. Details are being confirmed with the venue and hosts.",
};

export function isFeatureEnabled(flag: FeatureFlag, env: Env = readEnv()): boolean {
  const raw = env?.[ENV_KEYS[flag]];
  if (raw === undefined) return FLAG_DEFAULTS[flag];
  return isOn(raw);
}

export function flagOffCopy(flag: FeatureFlag): string {
  return FLAG_OFF_COPY[flag];
}

/** Snapshot of every flag — used by diagnostics and tests. */
export function allFlags(env: Env = readEnv()): Record<FeatureFlag, boolean> {
  return (Object.keys(FLAG_DEFAULTS) as FeatureFlag[]).reduce(
    (acc, f) => {
      acc[f] = isFeatureEnabled(f, env);
      return acc;
    },
    {} as Record<FeatureFlag, boolean>,
  );
}
