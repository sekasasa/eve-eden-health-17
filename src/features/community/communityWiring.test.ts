/**
 * Sprint 3A-2D — feed/detail wiring behaviour.
 *
 * These are pure-logic tests (no DOM runner in this project): they assert the
 * data contract the routes render from — feed status/source, sample-disclosure
 * eligibility, metric availability, and persisted-vs-seeded id routing.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { SEED_POSTS } from "@/lib/community-seed";
import type { PersistedCommunityPost, PersistedCommunityReply } from "./types";

vi.mock("./services/communityService", () => ({
  getPublishedPosts: vi.fn(),
  getPublishedPostById: vi.fn(),
  getPublishedReplies: vi.fn(),
}));

import {
  getPublishedPosts,
  getPublishedPostById,
  getPublishedReplies,
} from "./services/communityService";
import { loadCommunityFeedWithFallback } from "./services/communityFeed";
import { adaptPost, adaptReplies } from "./adapters/communityAdapter";
import { isPersistedPostId } from "@/routes/eve.community.post.$postId";
import { CommunityServiceError } from "./types";

const POST_ID = "22222222-2222-4222-8222-222222222222";

const row: PersistedCommunityPost = {
  id: POST_ID,
  anonymous_alias: "Mama in Casablanca",
  title: "Choosing a doula",
  body: "Looking for guidance on questions to ask.",
  category: "pregnancy",
  life_stage: "pregnant",
  city: "Casablanca",
  country_code: "MA",
  language_code: "fr",
  visibility: "community",
  status: "published",
  is_anonymous: true,
  is_seeded: false,
  created_at: "2026-01-10T10:00:00Z",
  updated_at: "2026-01-10T10:00:00Z",
};

const reply: PersistedCommunityReply = {
  id: "33333333-3333-4333-8333-333333333333",
  post_id: POST_ID,
  body: "Here is what helped me.",
  reply_type: "community",
  provider_id: null,
  anonymous_alias: null,
  is_anonymous: true,
  is_seeded: false,
  status: "published",
  created_at: "2026-01-10T11:00:00Z",
  updated_at: "2026-01-10T11:00:00Z",
} as PersistedCommunityReply;

beforeEach(() => {
  vi.mocked(getPublishedPosts).mockReset();
  vi.mocked(getPublishedPostById).mockReset();
  vi.mocked(getPublishedReplies).mockReset();
});

describe("feed wiring", () => {
  it("renders persisted posts with no sample disclosure when live rows exist", async () => {
    vi.mocked(getPublishedPosts).mockResolvedValue({ ok: true, data: [row] });
    const result = await loadCommunityFeedWithFallback({ limit: 30 });

    expect(result.status).toBe("live");
    expect(result.source).toBe("persisted");
    // status !== "live" is what drives the sample disclosure in the route.
    expect(result.status !== "live").toBe(false);
    expect(result.posts[0]?.persisted).toBe(true);
    expect(result.posts[0]?.title).toBe(row.title);
  });

  it("falls back to seeded content with the empty disclosure when nothing is published", async () => {
    vi.mocked(getPublishedPosts).mockResolvedValue({ ok: true, data: [] });
    const result = await loadCommunityFeedWithFallback();

    expect(result.status).toBe("empty");
    expect(result.source).toBe("seeded_fallback");
    expect(result.posts).toEqual(SEED_POSTS);
  });

  it("falls back to seeded content with the error disclosure when the live query fails", async () => {
    vi.mocked(getPublishedPosts).mockResolvedValue({
      ok: false,
      error: new CommunityServiceError("NETWORK", "boom"),
    });
    const result = await loadCommunityFeedWithFallback();

    expect(result.status).toBe("fallback");
    expect(result.source).toBe("seeded_fallback");
    expect(result.posts).toEqual(SEED_POSTS);
    // Internal error is available for logging but never part of the UI model.
    expect(result.internalError?.code).toBe("NETWORK");
  });

  it("hides metrics for persisted posts and keeps them for seeded samples", async () => {
    vi.mocked(getPublishedPosts).mockResolvedValue({ ok: true, data: [row] });
    const live = await loadCommunityFeedWithFallback();
    expect(live.posts[0]?.metricsAvailable).toBe(false);
    expect(live.posts[0]?.trending).toBeUndefined();
    expect(live.posts[0]?.topAnswer).toBeUndefined();

    for (const seeded of SEED_POSTS) {
      expect(seeded.persisted).toBeFalsy();
      expect(seeded.metricsAvailable).not.toBe(false);
      expect(typeof seeded.hearts).toBe("number");
    }
  });

  it("reports counts only in the feed analytics payload shape", async () => {
    vi.mocked(getPublishedPosts).mockResolvedValue({ ok: true, data: [row] });
    const result = await loadCommunityFeedWithFallback();
    const payload = {
      persisted_count: result.source === "persisted" ? result.posts.length : 0,
      fallback_count: result.source === "seeded_fallback" ? result.posts.length : 0,
      source: result.source,
    };
    expect(payload).toEqual({ persisted_count: 1, fallback_count: 0, source: "persisted" });
    expect(Object.keys(payload)).toEqual(["persisted_count", "fallback_count", "source"]);
  });
});

describe("post detail id routing", () => {
  it("treats UUIDs as persisted ids and seeded string ids as seeded", () => {
    expect(isPersistedPostId(POST_ID)).toBe(true);
    expect(isPersistedPostId("1")).toBe(false);
    expect(isPersistedPostId("postpartum-sleep")).toBe(false);
  });

  it("loads a persisted post and its published replies for a UUID", async () => {
    vi.mocked(getPublishedPostById).mockResolvedValue({ ok: true, data: row });
    vi.mocked(getPublishedReplies).mockResolvedValue({ ok: true, data: [reply] });

    const postResult = await getPublishedPostById(POST_ID);
    expect(postResult.ok && postResult.data).toBeTruthy();
    const adapted = adaptPost(row);
    expect(adapted.persisted).toBe(true);
    expect(adapted.metricsAvailable).toBe(false);

    const repliesResult = await getPublishedReplies(POST_ID);
    const views = repliesResult.ok ? adaptReplies(repliesResult.data) : [];
    expect(views).toHaveLength(1);
    expect(views[0]?.body).toBe(reply.body);
    expect(JSON.stringify(views[0])).not.toContain("author_id");
  });

  it("shows an empty replies state when a persisted post has none", async () => {
    vi.mocked(getPublishedReplies).mockResolvedValue({ ok: true, data: [] });
    const repliesResult = await getPublishedReplies(POST_ID);
    const views = repliesResult.ok ? adaptReplies(repliesResult.data) : [];
    expect(views).toHaveLength(0);
  });

  it("never substitutes a seeded post for a missing UUID", async () => {
    vi.mocked(getPublishedPostById).mockResolvedValue({ ok: true, data: null });
    const result = await getPublishedPostById("44444444-4444-4444-8444-444444444444");
    const persisted = result.ok ? result.data : null;
    // The route only consults seeded content when the id is NOT a UUID.
    const seededFallback = isPersistedPostId("44444444-4444-4444-8444-444444444444")
      ? undefined
      : SEED_POSTS[0];
    expect(persisted).toBeNull();
    expect(seededFallback).toBeUndefined();
  });

  it("keeps seeded detail behaviour unchanged for seeded ids", () => {
    const seeded = SEED_POSTS[0]!;
    expect(isPersistedPostId(seeded.id)).toBe(false);
    expect(seeded.persisted).toBeFalsy();
  });
});
