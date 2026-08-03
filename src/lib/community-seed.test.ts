import { describe, expect, it } from "vitest";
import {
  CATEGORIES,
  FEED_TABS,
  SEED_POSTS,
  categoryForStage,
  postsForTab,
  previewPostsForStage,
} from "./community-seed";

describe("community seed taxonomy", () => {
  it("has a unique key for every category and tab", () => {
    expect(new Set(CATEGORIES.map((c) => c.key)).size).toBe(CATEGORIES.length);
    expect(new Set(FEED_TABS.map((t) => t.key)).size).toBe(FEED_TABS.length);
  });

  it("marks every seeded post with a known category", () => {
    const keys = new Set(CATEGORIES.map((c) => c.key));
    for (const p of SEED_POSTS) expect(keys.has(p.category)).toBe(true);
  });
});

describe("previewPostsForStage", () => {
  it("returns at most the requested number of posts", () => {
    expect(previewPostsForStage("pregnant", 3).length).toBeLessThanOrEqual(3);
  });

  it("prefers posts matching the stage category", () => {
    const cat = categoryForStage("postpartum");
    const posts = previewPostsForStage("postpartum", 3);
    if (SEED_POSTS.some((p) => p.category === cat)) {
      expect(posts[0].category).toBe(cat);
    }
  });

  it("still returns posts for an unknown stage", () => {
    expect(previewPostsForStage("banana", 2).length).toBeGreaterThan(0);
  });
});

describe("postsForTab", () => {
  it("never invents posts that are not seeded", () => {
    for (const tab of FEED_TABS) {
      for (const p of postsForTab(SEED_POSTS, tab.key)) {
        expect(SEED_POSTS).toContain(p);
      }
    }
  });
});
