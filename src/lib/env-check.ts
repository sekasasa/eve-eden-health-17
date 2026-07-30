/**
 * Environment validation.
 *
 * Fails loudly and early when a required client variable is missing, instead
 * of letting a screen render with a broken backend client. Optional keys are
 * reported as warnings so a release check can show what is unconfigured.
 */

export const REQUIRED_CLIENT_ENV = ["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY"] as const;

export const OPTIONAL_CLIENT_ENV = [
  "VITE_FLAG_ASK_EVE_AI",
  "VITE_FLAG_COMMUNITY_POSTING",
  "VITE_FLAG_COMMUNITY_MODERATION",
  "VITE_FLAG_INSURANCE_VERIFICATION",
  "VITE_FLAG_CARE_PASSPORT_SHARING",
  "VITE_FLAG_EVENT_REGISTRATION",
] as const;

export type EnvReport = {
  ok: boolean;
  missingRequired: string[];
  unsetOptional: string[];
};

function hasValue(v: unknown): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

export function checkClientEnv(
  env: Record<string, unknown> = import.meta.env as unknown as Record<string, unknown>,
): EnvReport {
  const missingRequired = REQUIRED_CLIENT_ENV.filter((k) => !hasValue(env[k]));
  const unsetOptional = OPTIONAL_CLIENT_ENV.filter((k) => !hasValue(env[k]));
  return { ok: missingRequired.length === 0, missingRequired, unsetOptional };
}

/** Log a single, actionable warning in the browser when config is incomplete. */
export function warnOnInvalidEnv(report: EnvReport = checkClientEnv()): void {
  if (report.ok) return;
  console.error(
    `[env] Missing required configuration: ${report.missingRequired.join(", ")}. ` +
      `Backend features will not work until these are set.`,
  );
}
