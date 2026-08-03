/**
 * Community persistence service — the only module allowed to talk to the
 * community tables.
 *
 * The product is READ-ONLY by default: `createPost` / `createReply` refuse to
 * run unless BOTH `communityPosting` and `communityModeration` are enabled
 * (see `isCommunityReadOnly`). Read-only rejection happens BEFORE any Supabase
 * call.
 *
 * Callers can never set `status`, `author_id`, `provider_id`, `reply_type`,
 * `visibility` or `is_seeded`. Everything is submitted as pending review via
 * database defaults and RLS.
 *
 * Never log post/reply text.
 */

import { supabase } from "@/integrations/supabase/client";
import { isCommunityReadOnly } from "@/lib/moderation";
import { assessRisk } from "@/lib/urgent-safety";
import { CATEGORIES, type CategoryKey } from "@/lib/community-seed";
import {
  PUBLIC_POST_SELECT,
  PUBLIC_REPLY_SELECT,
  CREATED_POST_SELECT,
  CREATED_REPLY_SELECT,
} from "../columns";
import {
  fail,
  ok,
  type CommunityFeedFilters,
  type CommunityResult,
  type CreateCommunityPostInput,
  type CreateCommunityReplyInput,
  type PersistedCommunityPost,
  type PersistedCommunityReply,
} from "../types";

/** Legacy row aliases kept so existing imports stay valid. */
export type CommunityPostRow = PersistedCommunityPost;
export type CommunityReplyRow = PersistedCommunityReply;
export type PostFilters = CommunityFeedFilters;
export type CreatePostInput = CreateCommunityPostInput;
export type CreateReplyInput = CreateCommunityReplyInput;

export const DEFAULT_FEED_LIMIT = 20;
export const MAX_FEED_LIMIT = 50;
export const MAX_TITLE = 200;
export const MAX_BODY = 8000;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_CATEGORIES = new Set<string>(
  CATEGORIES.map((c) => c.key).filter((k) => k !== "all"),
);

export function isValidCategory(value: string): value is CategoryKey {
  return VALID_CATEGORIES.has(value);
}

function clampLimit(limit?: number): number {
  if (!limit || Number.isNaN(limit) || limit < 1) return DEFAULT_FEED_LIMIT;
  return Math.min(Math.floor(limit), MAX_FEED_LIMIT);
}

/** Maps a Supabase/postgrest error onto a typed code without leaking details. */
function normalizeError<T>(error: { code?: string; message?: string }): CommunityResult<T> {
  const code = error.code ?? "";
  if (code === "PGRST301" || code === "42501") {
    return fail("PERMISSION_DENIED", "You do not have access to this content.");
  }
  if (code === "PGRST116") return fail("NOT_FOUND", "This conversation is not available.");
  if (/fetch|network|timeout/i.test(error.message ?? "")) {
    return fail("NETWORK", "We could not reach the community right now.");
  }
  return fail("UNKNOWN", "Something went wrong loading the community.");
}

function unexpected<T>(e: unknown): CommunityResult<T> {
  if (e instanceof Error && /fetch|network|timeout/i.test(e.message)) {
    return fail("NETWORK", "We could not reach the community right now.");
  }
  return fail("UNKNOWN", "Something went wrong loading the community.");
}

/** Crisis-level content is never queued into a peer feed. */
function safetyPrecheck<T>(text: string): CommunityResult<T> | null {
  const risk = assessRisk(text);
  if (risk.crisis) {
    return fail(
      "SAFETY_BLOCKED",
      "This sounds urgent. Please contact emergency services or a clinician now — the community is not the right place for this.",
    );
  }
  return null;
}

/* ------------------------------- reads ---------------------------------- */

/** Published, community-visible posts, newest first. */
export async function getPublishedPosts(
  filters: CommunityFeedFilters = {},
): Promise<CommunityResult<PersistedCommunityPost[]>> {
  try {
    let query = supabase
      .from("community_posts")
      .select(PUBLIC_POST_SELECT)
      .eq("status", "published")
      .eq("visibility", "community")
      .order("created_at", { ascending: false })
      .limit(clampLimit(filters.limit));

    if (filters.category && filters.category !== "all") {
      if (!isValidCategory(String(filters.category))) {
        return fail("INVALID_INPUT", "Unknown category.");
      }
      query = query.eq("category", filters.category);
    }
    if (filters.lifeStage) query = query.eq("life_stage", filters.lifeStage);
    if (filters.countryCode) query = query.eq("country_code", filters.countryCode);
    if (filters.languageCode) query = query.eq("language_code", filters.languageCode);
    if (filters.createdBefore) query = query.lt("created_at", filters.createdBefore);

    const { data, error } = await query;
    if (error) return normalizeError(error);
    return ok((data ?? []) as unknown as PersistedCommunityPost[]);
  } catch (e) {
    return unexpected(e);
  }
}

/** One published post, or null when it does not exist / is not published. */
export async function getPublishedPostById(
  id: string,
): Promise<CommunityResult<PersistedCommunityPost | null>> {
  if (!id || !UUID_RE.test(id)) return fail("INVALID_INPUT", "A valid post id is required.");
  try {
    const { data, error } = await supabase
      .from("community_posts")
      .select(PUBLIC_POST_SELECT)
      .eq("id", id)
      .eq("status", "published")
      .eq("visibility", "community")
      .maybeSingle();
    if (error) return normalizeError(error);
    return ok((data ?? null) as unknown as PersistedCommunityPost | null);
  } catch (e) {
    return unexpected(e);
  }
}

/** Published replies for a post, oldest first. */
export async function getPublishedReplies(
  postId: string,
): Promise<CommunityResult<PersistedCommunityReply[]>> {
  if (!postId || !UUID_RE.test(postId)) {
    return fail("INVALID_INPUT", "A valid post id is required.");
  }
  try {
    const { data, error } = await supabase
      .from("community_replies")
      .select(PUBLIC_REPLY_SELECT)
      .eq("post_id", postId)
      .eq("status", "published")
      .order("created_at", { ascending: true });
    if (error) return normalizeError(error);
    return ok((data ?? []) as unknown as PersistedCommunityReply[]);
  } catch (e) {
    return unexpected(e);
  }
}

/* ------------------------------ creates --------------------------------- */

export async function createPost(
  input: CreateCommunityPostInput,
): Promise<CommunityResult<{ id: string; status: string }>> {
  if (isCommunityReadOnly()) {
    return fail(
      "READ_ONLY",
      "Posting is unavailable during the pilot. Reading is open; posting opens once moderation is staffed.",
    );
  }

  const title = input.title?.trim() ?? "";
  const body = input.body?.trim() ?? "";
  const category = String(input.category ?? "").trim();

  if (!title || title.length > MAX_TITLE) {
    return fail("INVALID_INPUT", "A title between 1 and 200 characters is required.");
  }
  if (!body || body.length > MAX_BODY) {
    return fail("INVALID_INPUT", "A message between 1 and 8000 characters is required.");
  }
  if (!category || !isValidCategory(category)) {
    return fail("INVALID_INPUT", "A supported category is required.");
  }

  const unsafe = safetyPrecheck<{ id: string; status: string }>(`${title} ${body}`);
  if (unsafe) return unsafe;

  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return fail("UNAUTHENTICATED", "Please sign in to post.");

    const { data, error } = await supabase
      .from("community_posts")
      .insert({
        author_id: userId,
        title,
        body,
        category,
        life_stage: input.lifeStage?.trim() || null,
        city: input.city?.trim() || null,
        country_code: input.countryCode?.trim() || null,
        language_code: input.languageCode?.trim() || null,
        anonymous_alias: input.anonymousAlias?.trim() || null,
        is_anonymous: input.isAnonymous ?? true,
      })
      .select(CREATED_POST_SELECT)
      .single();

    if (error) return normalizeError(error);
    return ok(data as { id: string; status: string });
  } catch (e) {
    return unexpected(e);
  }
}

export async function createReply(
  input: CreateCommunityReplyInput,
): Promise<CommunityResult<{ id: string; status: string }>> {
  if (isCommunityReadOnly()) {
    return fail(
      "READ_ONLY",
      "Replies are unavailable during the pilot. Reading is open; replying opens once moderation is staffed.",
    );
  }

  const body = input.body?.trim() ?? "";
  if (!input.postId || !UUID_RE.test(input.postId)) {
    return fail("INVALID_INPUT", "A valid post id is required.");
  }
  if (!body || body.length > MAX_BODY) {
    return fail("INVALID_INPUT", "A reply between 1 and 8000 characters is required.");
  }

  const unsafe = safetyPrecheck<{ id: string; status: string }>(body);
  if (unsafe) return unsafe;

  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return fail("UNAUTHENTICATED", "Please sign in to reply.");

    const { data, error } = await supabase
      .from("community_replies")
      .insert({ post_id: input.postId, author_id: userId, body })
      .select(CREATED_REPLY_SELECT)
      .single();

    if (error) return normalizeError(error);
    return ok(data as { id: string; status: string });
  } catch (e) {
    return unexpected(e);
  }
}
