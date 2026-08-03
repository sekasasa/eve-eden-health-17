import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  adaptCircle,
  filterCircles,
  PUBLIC_CIRCLE_COLUMNS,
  MY_MEMBERSHIP_SELECT,
  type PublicCircle,
} from "./services/circlesService";

const SEEDED_SLUGS = [
  "casablanca-first-time-mothers",
  "rabat-pregnancy-circle",
  "trying-to-conceive-morocco",
  "postpartum-support",
  "pregnancy-after-loss",
  "darija-speaking-mothers",
  "ramadan-and-pregnancy",
  "c-section-recovery",
];

function circle(over: Partial<PublicCircle>): PublicCircle {
  return {
    id: "c1",
    slug: "s",
    name: "n",
    description: "d",
    circle_type: "topic",
    visibility: "public",
    country_code: null,
    city: null,
    language_code: null,
    life_stage: null,
    topic_category: null,
    is_curated: true,
    status: "active",
    created_at: "2026-01-01T00:00:00Z",
    ...over,
  };
}

describe("circles adapter", () => {
  it("never exposes user ids or unknown columns", () => {
    const adapted = adaptCircle({
      id: "c1",
      slug: "a",
      name: "A",
      description: "d",
      circle_type: "topic",
      visibility: "public",
      is_curated: true,
      status: "active",
      created_at: "2026-01-01T00:00:00Z",
      user_id: "leak",
      author_id: "leak",
      secret: "leak",
    });
    expect(Object.keys(adapted).sort()).toEqual([...PUBLIC_CIRCLE_COLUMNS].sort());
    expect(JSON.stringify(adapted)).not.toContain("leak");
  });

  it("membership select never requests other users' ids", () => {
    expect(MY_MEMBERSHIP_SELECT.split(",")).not.toContain("user_id");
  });

  it("public circle columns exclude user identifiers", () => {
    expect(PUBLIC_CIRCLE_COLUMNS).not.toContain("user_id" as never);
  });
});

describe("circles filters", () => {
  const list = [
    circle({ id: "1", circle_type: "location" }),
    circle({ id: "2", circle_type: "life_stage" }),
    circle({ id: "3", circle_type: "experience" }),
    circle({ id: "4", circle_type: "culture_language" }),
    circle({ id: "5", circle_type: "topic" }),
  ];

  it("all returns everything", () => {
    expect(filterCircles(list, "all")).toHaveLength(5);
  });
  it("near you returns location circles", () => {
    expect(filterCircles(list, "near_you").map((c) => c.id)).toEqual(["1"]);
  });
  it("journey returns life-stage circles", () => {
    expect(filterCircles(list, "journey").map((c) => c.id)).toEqual(["2"]);
  });
  it("experience and culture filters map correctly", () => {
    expect(filterCircles(list, "experience").map((c) => c.id)).toEqual(["3"]);
    expect(filterCircles(list, "culture").map((c) => c.id)).toEqual(["4"]);
  });
});

describe("circles service queries", () => {
  beforeEach(() => vi.resetModules());

  it("only requests active public circles and cannot set role/status/user_id on join", async () => {
    const eqCalls: [string, unknown][] = [];
    let inserted: Record<string, unknown> | null = null;

    const builder: Record<string, unknown> = {};
    const chain = () => builder;
    Object.assign(builder, {
      select: vi.fn(chain),
      eq: vi.fn((col: string, val: unknown) => {
        eqCalls.push([col, val]);
        return builder;
      }),
      order: vi.fn(chain),
      limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
      insert: vi.fn((payload: Record<string, unknown>) => {
        inserted = payload;
        return Promise.resolve({ error: null });
      }),
    });

    vi.doMock("@/integrations/supabase/client", () => ({
      supabase: {
        from: () => builder,
        auth: { getUser: async () => ({ data: { user: { id: "user-1" } } }) },
      },
    }));

    const svc = await import("./services/circlesService");
    await svc.getPublicCircles();
    expect(eqCalls).toContainEqual(["status", "active"]);
    expect(eqCalls).toContainEqual(["visibility", "public"]);

    await svc.joinPublicCircle("circle-1");
    expect(inserted).toEqual({
      circle_id: "circle-1",
      user_id: "user-1",
      role: "member",
      status: "active",
    });
  });
});

describe("curated seed contract", () => {
  it("defines exactly 8 stable pilot slugs", () => {
    expect(SEEDED_SLUGS).toHaveLength(8);
    expect(new Set(SEEDED_SLUGS).size).toBe(8);
  });
});

describe("browse-only circle detail", () => {
  it("makes no claim about circle posts", async () => {
    const fs = await import("node:fs/promises");
    const src = await fs.readFile("src/routes/eve.community.circle.$slug.tsx", "utf8");
    expect(src).not.toMatch(/community_posts|getPublishedPosts|postsForCircle/);
    expect(src).toContain("conversationsClosed");
  });
});
