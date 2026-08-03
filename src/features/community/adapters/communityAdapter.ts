/**
 * Maps persisted community rows onto the UI model used by the seeded feed.
 *
 * Rules:
 * - `author_id` is never selected nor mapped, so it can never reach the UI.
 * - Persisted rows never fabricate hearts, saves, trending or "top answer" —
 *   those metrics do not exist in the schema, so the UI hides them
 *   (`persisted: true` / `metricsAvailable: false`).
 * - Provider identity is never inferred from `provider_id`.
 * - Seeded posts keep `persisted: false` and stay labelled as samples.
 */

import type { Post, CategoryKey } from "@/lib/community-seed";
import { CATEGORIES } from "@/lib/community-seed";
import type { PersistedCommunityPost, PersistedCommunityReply } from "../types";

const KNOWN_CATEGORIES = new Set(CATEGORIES.map((c) => c.key));

function toCategory(value: string): CategoryKey {
  return KNOWN_CATEGORIES.has(value as CategoryKey) ? (value as CategoryKey) : "all";
}

export function minutesSince(iso: string, now: Date = new Date()): number {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 0;
  return Math.max(0, Math.round((now.getTime() - then) / 60000));
}

export function relativeTime(minutes: number): string {
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

const DEFAULT_ALIAS = "Community member";

/** Feed model for a persisted post — no metrics, no sample label. */
export function adaptPersistedPostToFeedModel(
  row: PersistedCommunityPost,
  now: Date = new Date(),
): Post & { metricsAvailable: false } {
  const alias = row.anonymous_alias?.trim() || DEFAULT_ALIAS;
  const minutesAgo = minutesSince(row.created_at, now);

  return {
    id: row.id,
    category: toCategory(row.category),
    anonName: alias,
    avatarLetter: alias.charAt(0).toUpperCase() || "C",
    avatarColor: "bg-eve-teal",
    timeAgo: relativeTime(minutesAgo),
    minutesAgo,
    title: row.title,
    body: row.body,
    // Social metrics do not exist for persisted rows. `metricsAvailable:false`
    // tells the UI these numbers are unavailable, not measured as zero.
    hearts: 0,
    replies: 0,
    metricsAvailable: false,
    persisted: true,
  };
}

/** Back-compat aliases used by existing routes. */
export const adaptPost = adaptPersistedPostToFeedModel;

export function adaptPosts(rows: PersistedCommunityPost[], now: Date = new Date()): Post[] {
  return rows.map((r) => adaptPersistedPostToFeedModel(r, now));
}

export type CommunityReplyView = {
  id: string;
  body: string;
  /** Reply type as stored — never inferred from provider_id. */
  isProvider: boolean;
  timeAgo: string;
  displayAlias: string;
};

export function adaptPersistedReplyToThreadModel(
  row: PersistedCommunityReply,
  now: Date = new Date(),
): CommunityReplyView {
  const isProvider = row.reply_type === "provider";
  return {
    id: row.id,
    body: row.body,
    isProvider,
    timeAgo: relativeTime(minutesSince(row.created_at, now)),
    displayAlias: isProvider ? "Verified provider" : DEFAULT_ALIAS,
  };
}

export const adaptReply = adaptPersistedReplyToThreadModel;

export function adaptReplies(
  rows: PersistedCommunityReply[],
  now: Date = new Date(),
): CommunityReplyView[] {
  return rows.map((r) => adaptPersistedReplyToThreadModel(r, now));
}

/**
 * Merges persisted posts with seeded samples. Persisted posts always come
 * first; seeded posts keep their sample labelling.
 */
export function combinePersistedAndSeededPosts(
  persisted: PersistedCommunityPost[],
  seeded: Post[],
  options: { includeSeeded?: boolean; now?: Date; limit?: number } = {},
): Post[] {
  const now = options.now ?? new Date();
  const live = persisted.map((r) => adaptPersistedPostToFeedModel(r, now));
  const rest = options.includeSeeded === false ? [] : seeded.map((p) => ({ ...p, persisted: false }));
  const merged = [...live, ...rest];
  return options.limit ? merged.slice(0, options.limit) : merged;
}
