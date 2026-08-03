/**
 * Community domain types for the persisted posts/replies tables.
 *
 * These types describe the PUBLIC-SAFE shape of a row: `author_id` is never
 * part of them, so it cannot leak through the service or adapter layers.
 */

import type { Database } from "@/integrations/supabase/types";
import type { CategoryKey } from "@/lib/community-seed";

type PostRow = Database["public"]["Tables"]["community_posts"]["Row"];
type ReplyRow = Database["public"]["Tables"]["community_replies"]["Row"];

/** Public-safe persisted post — deliberately omits `author_id`. */
export type PersistedCommunityPost = Omit<PostRow, "author_id">;

/** Public-safe persisted reply — omits `author_id`; `provider_id` stays internal. */
export type PersistedCommunityReply = Omit<ReplyRow, "author_id">;

export type CommunityFeedFilters = {
  category?: CategoryKey | string;
  lifeStage?: string;
  countryCode?: string;
  languageCode?: string;
  /** Clamped to MAX_FEED_LIMIT by the service. */
  limit?: number;
  /** ISO timestamp cursor for "older than" pagination. */
  createdBefore?: string;
};

export type CreateCommunityPostInput = {
  title: string;
  body: string;
  category: CategoryKey | string;
  lifeStage?: string | null;
  city?: string | null;
  countryCode?: string | null;
  languageCode?: string | null;
  isAnonymous?: boolean;
  anonymousAlias?: string | null;
};

export type CreateCommunityReplyInput = {
  postId: string;
  body: string;
};

export type CommunityServiceErrorCode =
  | "READ_ONLY"
  | "UNAUTHENTICATED"
  | "INVALID_INPUT"
  | "SAFETY_BLOCKED"
  | "NOT_FOUND"
  | "PERMISSION_DENIED"
  | "NETWORK"
  | "UNKNOWN";

export class CommunityServiceError extends Error {
  readonly code: CommunityServiceErrorCode;

  constructor(code: CommunityServiceErrorCode, message: string) {
    super(message);
    this.name = "CommunityServiceError";
    this.code = code;
  }
}

export type CommunityResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: CommunityServiceError };

export function ok<T>(data: T): CommunityResult<T> {
  return { ok: true, data };
}

export function fail<T>(
  code: CommunityServiceErrorCode,
  message: string,
): CommunityResult<T> {
  return { ok: false, error: new CommunityServiceError(code, message) };
}

/** Creation payloads the service builds itself — moderation fields are never caller-controlled. */
export type SafePostInsert = {
  author_id: string;
  title: string;
  body: string;
  category: string;
  life_stage: string | null;
  city: string | null;
  country_code: string | null;
  language_code: string | null;
  anonymous_alias: string | null;
  is_anonymous: boolean;
};

export type SafeReplyInsert = {
  post_id: string;
  author_id: string;
  body: string;
};
