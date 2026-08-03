/**
 * Seeded-fallback feed loader.
 *
 * Not wired into any UI yet. Returns a machine-readable status so callers can
 * disclose honestly whether they are showing live or sample content. Database
 * errors are preserved internally and never surfaced to UI callers.
 */

import { SEED_POSTS, type Post } from "@/lib/community-seed";
import { getPublishedPosts } from "./communityService";
import { adaptPosts } from "../adapters/communityAdapter";
import type { CommunityFeedFilters, CommunityServiceError } from "../types";

export type CommunityFeedStatus = "live" | "empty" | "fallback";

export type CommunityFeedResult = {
  posts: Post[];
  status: CommunityFeedStatus;
  source: "persisted" | "seeded_fallback";
  /** Internal only — do not render. */
  internalError?: CommunityServiceError;
};

export async function loadCommunityFeedWithFallback(
  filters: CommunityFeedFilters = {},
): Promise<CommunityFeedResult> {
  const result = await getPublishedPosts(filters);

  if (!result.ok) {
    return {
      posts: SEED_POSTS,
      status: "fallback",
      source: "seeded_fallback",
      internalError: result.error,
    };
  }

  if (result.data.length === 0) {
    return { posts: SEED_POSTS, status: "empty", source: "seeded_fallback" };
  }

  return { posts: adaptPosts(result.data), status: "live", source: "persisted" };
}
