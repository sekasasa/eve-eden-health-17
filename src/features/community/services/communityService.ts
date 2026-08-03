/**
 * Community persistence service.
 *
 * The product is READ-ONLY by default: `createPost` / `createReply` refuse to
 * run unless BOTH `communityPosting` and `communityModeration` are enabled
 * (see `isCommunityReadOnly`). This module is the only place allowed to talk
 * to Supabase for community conversations — presentational components must
 * not query directly.
 *
 * Callers can never set `status`, `author_id`, `provider_id`, `is_seeded` or
 * any other moderation field. Everything is submitted as `pending_review`.
 */

import { supabase } from "@/integrations/supabase/client";
import { isCommunityReadOnly } from "@/lib/moderation";
import { assessRisk } from "@/lib/urgent-safety";
import type { CategoryKey } from "@/lib/community-seed";

export type CommunityPostRow = {
  id: string;
  anonymous_alias: string | null;
  title: string;
  body: string;
  category: string;
  life_stage: string | null;
  city: string | null;
  country_code: string | null;
  language_code: string | null;
  visibility: string;
  status: string;
  is_anonymous: boolean;
  is_seeded: boolean;
  created_at: string;
  updated_at: string;
};

export type CommunityReplyRow = {
  id: string;
  post_id: string;
  provider_id: string | null;
  body: string;
  reply_type: string;
  status: string;
  is_seeded: boolean;
  created_at: string;
  updated_at: string;
};

/**
 * Columns selected for public reads. `author_id` is deliberately excluded so
 * an anonymous author can never be de-anonymised through the UI layer.
 */
const POST_COLUMNS =
  "id,anonymous_alias,title,body,category,life_stage,city,country_code,language_code,visibility,status,is_anonymous,is_seeded,created_at,updated_at";

const REPLY_COLUMNS =
  "id,post_id,provider_id,body,reply_type,status,is_seeded,created_at,updated_at";

export type CommunityErrorCode =
  | "read_only"
  | "not_authenticated"
  | "invalid_input"
  | "safety_blocked"
  | "request_failed";

export type CommunityError = {
  code: CommunityErrorCode;
  message: string;
};

export type CommunityResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: CommunityError };

function fail<T>(code: CommunityErrorCode, message: string): CommunityResult<T> {
  return { ok: false, error: { code, message } };
}

export type PostFilters = {
  category?: CategoryKey | string;
  limit?: number;
};

export type CreatePostInput = {
  title: string;
  body: string;
  category: string;
  lifeStage?: string | null;
  city?: string | null;
  countryCode?: string | null;
  languageCode?: string | null;
  isAnonymous?: boolean;
  anonymousAlias?: string | null;
};

export type CreateReplyInput = {
  postId: string;
  body: string;
};

const MAX_TITLE = 200;
const MAX_BODY = 8000;

function validatePost(input: CreatePostInput): CommunityError | null {
  const title = input.title?.trim() ?? "";
  const body = input.body?.trim() ?? "";
  if (!title || title.length > MAX_TITLE) {
    return { code: "invalid_input", message: "A title between 1 and 200 characters is required." };
  }
  if (!body || body.length > MAX_BODY) {
    return { code: "invalid_input", message: "A message between 1 and 8000 characters is required." };
  }
  if (!input.category?.trim()) {
    return { code: "invalid_input", message: "A category is required." };
  }
  return null;
}

/** Crisis-level content is never queued into a peer feed. */
function safetyPrecheck(text: string): CommunityError | null {
  const risk = assessRisk(text);
  if (risk.crisis) {
    return {
      code: "safety_blocked",
      message:
        "This sounds urgent. Please contact emergency services or a clinician now — the community is not the right place for this.",
    };
  }
  return null;
}

/** Published, community-visible posts. Returns [] when nothing is published. */
export async function getPublishedPosts(
  filters: PostFilters = {},
): Promise<CommunityResult<CommunityPostRow[]>> {
  try {
    let query = supabase
      .from("community_posts")
      .select(POST_COLUMNS)
      .eq("status", "published")
      .eq("visibility", "community")
      .order("created_at", { ascending: false })
      .limit(filters.limit ?? 30);

    if (filters.category && filters.category !== "all") {
      query = query.eq("category", filters.category);
    }

    const { data, error } = await query;
    if (error) return fail("request_failed", error.message);
    return { ok: true, data: (data ?? []) as CommunityPostRow[] };
  } catch (e) {
    return fail("request_failed", e instanceof Error ? e.message : "Request failed");
  }
}

/** One published post, or null when it does not exist / is not published. */
export async function getPublishedPostById(
  id: string,
): Promise<CommunityResult<CommunityPostRow | null>> {
  if (!id) return fail("invalid_input", "A post id is required.");
  try {
    const { data, error } = await supabase
      .from("community_posts")
      .select(POST_COLUMNS)
      .eq("id", id)
      .eq("status", "published")
      .eq("visibility", "community")
      .maybeSingle();
    if (error) return fail("request_failed", error.message);
    return { ok: true, data: (data ?? null) as CommunityPostRow | null };
  } catch (e) {
    return fail("request_failed", e instanceof Error ? e.message : "Request failed");
  }
}

/** Published replies for a post, oldest first. */
export async function getPublishedReplies(
  postId: string,
): Promise<CommunityResult<CommunityReplyRow[]>> {
  if (!postId) return fail("invalid_input", "A post id is required.");
  try {
    const { data, error } = await supabase
      .from("community_replies")
      .select(REPLY_COLUMNS)
      .eq("post_id", postId)
      .eq("status", "published")
      .order("created_at", { ascending: true });
    if (error) return fail("request_failed", error.message);
    return { ok: true, data: (data ?? []) as CommunityReplyRow[] };
  } catch (e) {
    return fail("request_failed", e instanceof Error ? e.message : "Request failed");
  }
}

export async function createPost(
  input: CreatePostInput,
): Promise<CommunityResult<{ id: string; status: string }>> {
  if (isCommunityReadOnly()) {
    return fail(
      "read_only",
      "Posting is unavailable during the pilot. Reading is open; posting opens once moderation is staffed.",
    );
  }

  const invalid = validatePost(input);
  if (invalid) return { ok: false, error: invalid };

  const unsafe = safetyPrecheck(`${input.title} ${input.body}`);
  if (unsafe) return { ok: false, error: unsafe };

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) return fail("not_authenticated", "Please sign in to post.");

  const { data, error } = await supabase
    .from("community_posts")
    .insert({
      author_id: userId,
      title: input.title.trim(),
      body: input.body.trim(),
      category: input.category.trim(),
      life_stage: input.lifeStage ?? null,
      city: input.city ?? null,
      country_code: input.countryCode ?? null,
      language_code: input.languageCode ?? null,
      anonymous_alias: input.anonymousAlias ?? null,
      is_anonymous: input.isAnonymous ?? true,
      // Never caller-controlled.
      status: "pending_review",
      visibility: "community",
      is_seeded: false,
    })
    .select("id,status")
    .single();

  if (error) return fail("request_failed", error.message);
  return { ok: true, data: data as { id: string; status: string } };
}

export async function createReply(
  input: CreateReplyInput,
): Promise<CommunityResult<{ id: string; status: string }>> {
  if (isCommunityReadOnly()) {
    return fail(
      "read_only",
      "Replies are unavailable during the pilot. Reading is open; replying opens once moderation is staffed.",
    );
  }

  const body = input.body?.trim() ?? "";
  if (!input.postId) return fail("invalid_input", "A post id is required.");
  if (!body || body.length > MAX_BODY) {
    return fail("invalid_input", "A reply between 1 and 8000 characters is required.");
  }

  const unsafe = safetyPrecheck(body);
  if (unsafe) return { ok: false, error: unsafe };

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) return fail("not_authenticated", "Please sign in to reply.");

  const { data, error } = await supabase
    .from("community_replies")
    .insert({
      post_id: input.postId,
      author_id: userId,
      body,
      // Never caller-controlled: provider attribution and moderation state.
      provider_id: null,
      reply_type: "community",
      status: "pending_review",
      is_seeded: false,
    })
    .select("id,status")
    .single();

  if (error) return fail("request_failed", error.message);
  return { ok: true, data: data as { id: string; status: string } };
}
