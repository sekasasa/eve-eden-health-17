/**
 * Community moderation state.
 *
 * There is no verified moderation backend yet, so:
 * - the community is READ-ONLY (posting is flag-gated OFF), and
 * - a report is recorded on the reader's own device and hides the post for
 *   them immediately. We never tell the reader a moderator has seen it.
 *
 * When a real queue exists, `submitReport` becomes the single place to send
 * the report server-side; the local hide stays as optimistic feedback.
 */

import { isFeatureEnabled } from "./flags";

export const REPORTS_STORAGE_KEY = "eve.community.reports.v1";

export type ReportReason =
  | "harmful_advice"
  | "harassment"
  | "spam"
  | "personal_info"
  | "other";

export type ReportRecord = {
  postId: string;
  reason: ReportReason;
  reportedAt: string;
};

export type ReportStore = Record<string, ReportRecord>;

type Storage = Pick<globalThis.Storage, "getItem" | "setItem">;

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
  };
}

function defaultStorage(): Storage {
  try {
    if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  } catch {
    /* storage blocked — fall through */
  }
  return memoryStorage();
}

export function readReports(storage: Storage = defaultStorage()): ReportStore {
  try {
    const raw = storage.getItem(REPORTS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as ReportStore;
  } catch {
    return {};
  }
}

/**
 * Record a report. Returns the updated store so the caller can re-render
 * without re-reading storage.
 */
export function submitReport(
  postId: string,
  reason: ReportReason,
  storage: Storage = defaultStorage(),
): ReportStore {
  const store = readReports(storage);
  const next: ReportStore = {
    ...store,
    [postId]: { postId, reason, reportedAt: new Date().toISOString() },
  };
  try {
    storage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* best effort — the in-memory result is still returned */
  }
  return next;
}

export function isReported(postId: string, store: ReportStore): boolean {
  return Boolean(store[postId]);
}

/**
 * The community is read-only unless BOTH posting is enabled and a moderation
 * backend is verified. Posting without moderation is never allowed.
 */
export function isCommunityReadOnly(
  env?: Record<string, unknown>,
): boolean {
  const posting = isFeatureEnabled("communityPosting", env);
  const moderation = isFeatureEnabled("communityModeration", env);
  return !(posting && moderation);
}

/** Honest copy for the report confirmation, based on backend availability. */
export function reportAcknowledgement(env?: Record<string, unknown>): string {
  return isFeatureEnabled("communityModeration", env)
    ? "Thanks — this post is queued for a moderator."
    : "Hidden for you on this device. We do not have a moderation queue yet, so no one has reviewed it — email support@eveandeden.health if it is urgent.";
}
