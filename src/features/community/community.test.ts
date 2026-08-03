import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { adaptPost, adaptPosts, adaptReply, relativeTime, minutesSince } from "./adapters/communityAdapter";
import type { CommunityPostRow, CommunityReplyRow } from "./services/communityService";
import { SEED_POSTS } from "@/lib/community-seed";

const NOW = new Date("2026-01-10T12:00:00Z");

const row: CommunityPostRow = {
  id: "p1",
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

describe("community adapter", () => {
  it("marks persisted posts and never fabricates social metrics", () => {
    const post = adaptPost(row, NOW);
    expect(post.persisted).toBe(true);
    expect(post.hearts).toBe(0);
    expect(post.replies).toBe(0);
    expect(post.topAnswer).toBeUndefined();
    expect(post.trending).toBeUndefined();
  });

  it("never exposes an author id in the UI model", () => {
    const post = adaptPost({ ...row, ...({ author_id: "secret-user" } as object) }, NOW);
    expect(JSON.stringify(post)).not.toContain("secret-user");
    expect(Object.keys(post)).not.toContain("author_id");
  });

  it("falls back to a neutral alias and category", () => {
    const post = adaptPost({ ...row, anonymous_alias: null, category: "not-a-category" }, NOW);
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

  it("adapts replies without author information", () => {
    const reply: CommunityReplyRow = {
      id: "r1",
      post_id: "p1",
      provider_id: null,
      body: "A reply",
      reply_type: "provider",
      status: "published",
      is_seeded: false,
      created_at: "2026-01-10T11:00:00Z",
      updated_at: "2026-01-10T11:00:00Z",
    };
    const view = adaptReply(reply, NOW);
    expect(view).toEqual({ id: "r1", body: "A reply", isProvider: true, timeAgo: "1 hour ago" });
  });

  it("keeps seeded posts unmarked so they retain the sample label", () => {
    expect(SEED_POSTS.every((p) => !p.persisted)).toBe(true);
    expect(adaptPosts([row], NOW)).toHaveLength(1);
  });
});

describe("community service — read-only enforcement", () => {
  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("blocks createPost and createReply while the community is read-only", async () => {
    const { createPost, createReply } = await import("./services/communityService");
    const post = await createPost({ title: "Hi", body: "Body", category: "pregnancy" });
    expect(post.ok).toBe(false);
    if (!post.ok) expect(post.error.code).toBe("read_only");

    const reply = await createReply({ postId: "p1", body: "Body" });
    expect(reply.ok).toBe(false);
    if (!reply.ok) expect(reply.error.code).toBe("read_only");
  });

  it("still validates input and safety when posting is enabled", async () => {
    vi.stubEnv("VITE_FLAG_COMMUNITY_POSTING", "on");
    vi.stubEnv("VITE_FLAG_COMMUNITY_MODERATION", "on");
    const { createPost } = await import("./services/communityService");

    const empty = await createPost({ title: "", body: "Body", category: "pregnancy" });
    expect(empty.ok).toBe(false);
    if (!empty.ok) expect(empty.error.code).toBe("invalid_input");

    const noCategory = await createPost({ title: "Hi", body: "Body", category: "" });
    expect(noCategory.ok).toBe(false);
    if (!noCategory.ok) expect(noCategory.error.code).toBe("invalid_input");

    const unsafe = await createPost({
      title: "Help",
      body: "I want to kill myself",
      category: "emotional",
    });
    expect(unsafe.ok).toBe(false);
    if (!unsafe.ok) expect(unsafe.error.code).toBe("safety_blocked");
  });
});
