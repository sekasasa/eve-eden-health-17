import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  adaptPersistedPostToFeedModel,
  adaptPosts,
  adaptPersistedReplyToThreadModel,
  combinePersistedAndSeededPosts,
  relativeTime,
  minutesSince,
} from "./adapters/communityAdapter";
import { PUBLIC_POST_COLUMNS, PUBLIC_REPLY_COLUMNS } from "./columns";
import type { PersistedCommunityPost, PersistedCommunityReply } from "./types";
import { SEED_POSTS } from "@/lib/community-seed";

const NOW = new Date("2026-01-10T12:00:00Z");
const POST_ID = "11111111-1111-4111-8111-111111111111";

const row: PersistedCommunityPost = {
  id: POST_ID,
  anonymous_alias: "Mama in Rabat",
  title: "Question about my 20 week scan",
  body: "Body text",
  category: "pregnancy",
  life_stage: "pregnant",
  city: "Rabat",
  country_code: "MA",
  language_code: "fr",
  visibility: "community",
  status: "published",
  is_anonymous: true,
  is_seeded: false,
  created_at: "2026-01-10T10:00:00Z",
  updated_at: "2026-01-10T10:00:00Z",
};

describe("public-safe columns", () => {
  it("never selects author_id", () => {
    expect(PUBLIC_POST_COLUMNS).not.toContain("author_id");
    expect(PUBLIC_REPLY_COLUMNS).not.toContain("author_id");
  });
});

describe("community adapter", () => {
  it("marks persisted posts and never fabricates social metrics", () => {
    const post = adaptPersistedPostToFeedModel(row, NOW);
    expect(post.persisted).toBe(true);
    expect(post.metricsAvailable).toBe(false);
    expect(post.topAnswer).toBeUndefined();
    expect(post.trending).toBeUndefined();
  });

  it("never exposes an author id in the UI model", () => {
    const post = adaptPersistedPostToFeedModel(
      { ...row, ...({ author_id: "secret-user" } as object) },
      NOW,
    );
    expect(JSON.stringify(post)).not.toContain("secret-user");
    expect(Object.keys(post)).not.toContain("author_id");
  });

  it("falls back to a neutral alias and category", () => {
    const post = adaptPersistedPostToFeedModel(
      { ...row, anonymous_alias: null, category: "not-a-category" },
      NOW,
    );
    expect(post.anonName).toBe("Community member");
    expect(post.category).toBe("all");
    expect(post.avatarLetter).toBe("C");
  });

  it("computes relative time from created_at", () => {
    expect(minutesSince(row.created_at, NOW)).toBe(120);
    expect(relativeTime(0)).toBe("Just now");
    expect(relativeTime(1)).toBe("1 minute ago");
    expect(relativeTime(120)).toBe("2 hours ago");
    expect(relativeTime(60 * 25)).toBe("1 day ago");
  });

  it("adapts replies without author information or inferred provider identity", () => {
    const reply: PersistedCommunityReply = {
      id: "r1",
      post_id: POST_ID,
      provider_id: "prov-1",
      body: "A reply",
      reply_type: "community",
      status: "published",
      is_seeded: false,
      created_at: "2026-01-10T11:00:00Z",
      updated_at: "2026-01-10T11:00:00Z",
    };
    const view = adaptPersistedReplyToThreadModel(reply, NOW);
    expect(view.isProvider).toBe(false);
    expect(view.displayAlias).toBe("Community member");
    expect(JSON.stringify(view)).not.toContain("prov-1");
  });

  it("keeps seeded posts unmarked so they retain the sample label", () => {
    expect(SEED_POSTS.every((p) => !p.persisted)).toBe(true);
    expect(adaptPosts([row], NOW)).toHaveLength(1);
  });

  it("combines persisted posts before seeded samples", () => {
    const merged = combinePersistedAndSeededPosts([row], SEED_POSTS, { now: NOW });
    expect(merged[0].persisted).toBe(true);
    expect(merged[1].persisted).toBe(false);
    expect(merged).toHaveLength(1 + SEED_POSTS.length);
  });
});

describe("community service — read-only + validation", () => {
  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("blocks createPost and createReply while the community is read-only", async () => {
    const { createPost, createReply } = await import("./services/communityService");
    const post = await createPost({ title: "Hi", body: "Body", category: "pregnancy" });
    expect(post.ok).toBe(false);
    if (!post.ok) expect(post.error.code).toBe("READ_ONLY");

    const reply = await createReply({ postId: POST_ID, body: "Body" });
    expect(reply.ok).toBe(false);
    if (!reply.ok) expect(reply.error.code).toBe("READ_ONLY");
  });

  it("validates input, category and safety when posting is enabled", async () => {
    vi.stubEnv("VITE_FLAG_COMMUNITY_POSTING", "on");
    vi.stubEnv("VITE_FLAG_COMMUNITY_MODERATION", "on");
    const { createPost, createReply } = await import("./services/communityService");

    const empty = await createPost({ title: "   ", body: "Body", category: "pregnancy" });
    expect(empty.ok).toBe(false);
    if (!empty.ok) expect(empty.error.code).toBe("INVALID_INPUT");

    const oversized = await createPost({
      title: "x".repeat(201),
      body: "Body",
      category: "pregnancy",
    });
    expect(oversized.ok).toBe(false);
    if (!oversized.ok) expect(oversized.error.code).toBe("INVALID_INPUT");

    const badCategory = await createPost({ title: "Hi", body: "Body", category: "banana" });
    expect(badCategory.ok).toBe(false);
    if (!badCategory.ok) expect(badCategory.error.code).toBe("INVALID_INPUT");

    const badId = await createReply({ postId: "not-a-uuid", body: "Body" });
    expect(badId.ok).toBe(false);
    if (!badId.ok) expect(badId.error.code).toBe("INVALID_INPUT");

    const unsafe = await createPost({
      title: "Help",
      body: "I want to kill myself",
      category: "emotional",
    });
    expect(unsafe.ok).toBe(false);
    if (!unsafe.ok) expect(unsafe.error.code).toBe("SAFETY_BLOCKED");
  });
});

describe("loadCommunityFeedWithFallback", () => {
  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => {
    vi.doUnmock("./services/communityService");
  });

  async function loadWith(mockImpl: () => Promise<unknown>) {
    vi.doMock("./services/communityService", () => ({ getPublishedPosts: mockImpl }));
    const { loadCommunityFeedWithFallback } = await import("./services/communityFeed");
    return loadCommunityFeedWithFallback();
  }

  it("reports live when persisted posts exist", async () => {
    const res = await loadWith(async () => ({ ok: true, data: [row] }));
    expect(res.status).toBe("live");
    expect(res.source).toBe("persisted");
    expect(res.posts[0].persisted).toBe(true);
  });

  it("reports empty with seeded fallback when nothing is published", async () => {
    const res = await loadWith(async () => ({ ok: true, data: [] }));
    expect(res.status).toBe("empty");
    expect(res.source).toBe("seeded_fallback");
    expect(res.posts).toEqual(SEED_POSTS);
  });

  it("reports fallback and keeps the error internal when the query fails", async () => {
    const res = await loadWith(async () => ({
      ok: false,
      error: { code: "NETWORK", message: "boom" },
    }));
    expect(res.status).toBe("fallback");
    expect(res.internalError?.code).toBe("NETWORK");
    expect(JSON.stringify(res.posts)).not.toContain("boom");
  });
});
