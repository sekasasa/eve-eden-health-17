/**
 * Consent versions recorded at account creation.
 *
 * Bump a version string whenever the corresponding document changes; the
 * new value is written to `profiles.*_version` with a UTC timestamp so we
 * can prove which text a person agreed to.
 */
export const CONSENT_VERSIONS = {
  terms: "2026-01-terms-v1",
  privacy: "2026-01-privacy-v1",
  medicalDisclaimer: "2026-01-medical-disclaimer-v1",
} as const;

export type ConsentRecord = {
  terms_version: string;
  terms_accepted_at: string;
  privacy_version: string;
  privacy_accepted_at: string;
  medical_disclaimer_version: string;
  medical_disclaimer_accepted_at: string;
};

/** Build the consent columns for a profiles insert/upsert. */
export function buildConsentRecord(at: Date = new Date()): ConsentRecord {
  const ts = at.toISOString();
  return {
    terms_version: CONSENT_VERSIONS.terms,
    terms_accepted_at: ts,
    privacy_version: CONSENT_VERSIONS.privacy,
    privacy_accepted_at: ts,
    medical_disclaimer_version: CONSENT_VERSIONS.medicalDisclaimer,
    medical_disclaimer_accepted_at: ts,
  };
}

/** Minimum password guidance shown in the UI and enforced client-side. */
export const PASSWORD_MIN_LENGTH = 10;

export function passwordIssues(password: string): string[] {
  const issues: string[] = [];
  if (password.length < PASSWORD_MIN_LENGTH) {
    issues.push(`Use at least ${PASSWORD_MIN_LENGTH} characters.`);
  }
  if (!/[a-zA-Z]/.test(password)) issues.push("Include at least one letter.");
  if (!/[0-9]/.test(password) && !/[^a-zA-Z0-9]/.test(password)) {
    issues.push("Include at least one number or symbol.");
  }
  return issues;
}
