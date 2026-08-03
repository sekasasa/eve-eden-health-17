/**
 * Maps persisted community rows onto the UI model used by the seeded feed.
 *
 * Rules:
 * - Persisted rows never fabricate hearts, saves, replies counts, trending or
 *   "top answer" — those metrics do not exist in the schema yet, so the UI
 *   hides them (`persisted: true`).
 * - `author_id` is never selected nor mapped, so it can never reach the UI.
 * - Seeded posts keep `persisted: false` and stay labelled as samples.
 */

import type { Post, CategoryKey } from "@/lib/community-seed";
import { CATEGORIES } from "@/lib/community-seed";
import type { CommunityPostRow, CommunityReplyRow } from "../services/communityService";

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

export function adaptPost(row: CommunityPostRow, now: Date = new Date()): Post {
  const alias = row.is_anonymous
    ? (row.anonymous_alias?.trim() || DEFAULT_ALIAS)
    : (row.anonymous_alias?.trim() || DEFAULT_ALIAS);
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
    // No social metrics exist for persisted rows — never invent them.
    hearts: 0,
    replies: 0,
    persisted: true,
  };
}

export function adaptPosts(rows: CommunityPostRow[], now: Date = new Date()): Post[] {
  return rows.map((r) => adaptPost(r, now));
}

export type CommunityReplyView = {
  id: string;
  body: string;
  isProvider: boolean;
  timeAgo: string;
};

export function adaptReply(row: CommunityReplyRow, now: Date = new Date()): CommunityReplyView {
  return {
    id: row.id,
    body: row.body,
    isProvider: row.reply_type === "provider",
    timeAgo: relativeTime(minutesSince(row.created_at, now)),
  };
}

export function adaptReplies(
  rows: CommunityReplyRow[],
  now: Date = new Date(),
): CommunityReplyView[] {
  return rows.map((r) => adaptReply(r, now));
}
