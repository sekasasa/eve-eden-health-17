/**
 * Care Passport safeguards.
 *
 * The passport holds health documents, so every value that can travel out of
 * the app (a document link) is validated here, and any capability we cannot
 * prove end-to-end (audit logging, expiring signed URLs, share revocation
 * receipts) stays behind the `carePassportSharing` flag.
 */

/** Extensions we accept for a linked care document. */
export const ALLOWED_DOC_EXTENSIONS = [
  "pdf",
  "png",
  "jpg",
  "jpeg",
  "webp",
  "heic",
  "doc",
  "docx",
] as const;

/** Hard ceiling for any future direct upload, in bytes (10 MB). */
export const MAX_DOC_BYTES = 10 * 1024 * 1024;

export type DocLinkCheck = { ok: true } | { ok: false; reason: string };

/**
 * Validate a user-supplied document link.
 * Only absolute https URLs with a recognised document extension are accepted;
 * `javascript:`, `data:` and plain http are rejected outright.
 */
export function validateDocumentLink(value: string): DocLinkCheck {
  const raw = value.trim();
  if (!raw) return { ok: true }; // link is optional

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return {
      ok: false,
      reason: "Enter a full link starting with https:// or leave it blank.",
    };
  }

  if (url.protocol !== "https:") {
    return { ok: false, reason: "Only secure https links can be saved." };
  }

  const path = url.pathname.toLowerCase();
  const ext = path.includes(".") ? path.split(".").pop()! : "";
  if (!ALLOWED_DOC_EXTENSIONS.includes(ext as (typeof ALLOWED_DOC_EXTENSIONS)[number])) {
    return {
      ok: false,
      reason: `Link must point to a ${ALLOWED_DOC_EXTENSIONS.join(", ")} file.`,
    };
  }

  return { ok: true };
}

/** Validate a file chosen for direct upload (used once uploads are enabled). */
export function validateDocumentFile(file: {
  name: string;
  size: number;
  type?: string;
}): DocLinkCheck {
  const ext = file.name.toLowerCase().split(".").pop() ?? "";
  if (!ALLOWED_DOC_EXTENSIONS.includes(ext as (typeof ALLOWED_DOC_EXTENSIONS)[number])) {
    return {
      ok: false,
      reason: `Only ${ALLOWED_DOC_EXTENSIONS.join(", ")} files can be added.`,
    };
  }
  if (file.size > MAX_DOC_BYTES) {
    return {
      ok: false,
      reason: `Files must be under ${Math.round(MAX_DOC_BYTES / (1024 * 1024))} MB.`,
    };
  }
  return { ok: true };
}

/**
 * Sharing capabilities we must be able to prove before the sharing UI is
 * allowed to be interactive. Nothing here is verified in production yet, so
 * `carePassportSharing` stays OFF and the UI must say so honestly.
 */
export const SHARING_PREREQUISITES = [
  "Expiring signed links for every shared document",
  "An audit trail of who opened a shared passport and when",
  "Recorded consent and a revocation receipt for each recipient",
] as const;
