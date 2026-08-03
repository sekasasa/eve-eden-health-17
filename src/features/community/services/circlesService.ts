/**
 * Curated Circles service — the only module allowed to talk to
 * `community_circles` / `community_circle_members`.
 *
 * Rules:
 * - explicit public-safe column lists; other members' `user_id` is never selected.
 * - circles are curated: there is no create/update/delete path from the client.
 * - join/leave rely entirely on RLS; role/status/user_id are never caller-controlled.
 */

import { supabase } from "@/integrations/supabase/client";
import { fail, ok, type CommunityResult } from "../types";

export const PUBLIC_CIRCLE_COLUMNS = [
  "id",
  "slug",
  "name",
  "description",
  "circle_type",
  "visibility",
  "country_code",
  "city",
  "language_code",
  "life_stage",
  "topic_category",
  "is_curated",
  "status",
  "created_at",
] as const;

export const PUBLIC_CIRCLE_SELECT = PUBLIC_CIRCLE_COLUMNS.join(",");

/** Own membership only — deliberately omits `user_id`. */
export const MY_MEMBERSHIP_SELECT = "id,circle_id,role,status,joined_at";

export type CircleType =
  | "location"
  | "life_stage"
  | "experience"
  | "culture_language"
  | "topic";

export type PublicCircle = {
  id: string;
  slug: string;
  name: string;
  description: string;
  circle_type: string;
  visibility: string;
  country_code: string | null;
  city: string | null;
  language_code: string | null;
  life_stage: string | null;
  topic_category: string | null;
  is_curated: boolean;
  status: string;
  created_at: string;
};

export type MyCircleMembership = {
  id: string;
  circle_id: string;
  role: string;
  status: string;
  joined_at: string;
};

export type CircleFilters = {
  circleType?: CircleType;
  countryCode?: string;
  city?: string;
  lifeStage?: string;
  topicCategory?: string;
  limit?: number;
};

export const DEFAULT_CIRCLE_LIMIT = 30;
export const MAX_CIRCLE_LIMIT = 50;

function clampLimit(limit?: number): number {
  if (!limit || Number.isNaN(limit) || limit < 1) return DEFAULT_CIRCLE_LIMIT;
  return Math.min(Math.floor(limit), MAX_CIRCLE_LIMIT);
}

function normalizeError<T>(error: { code?: string; message?: string }): CommunityResult<T> {
  const code = error.code ?? "";
  if (code === "PGRST301" || code === "42501") {
    return fail("PERMISSION_DENIED", "You do not have access to this circle.");
  }
  if (code === "PGRST116") return fail("NOT_FOUND", "This circle is not available.");
  if (/fetch|network|timeout/i.test(error.message ?? "")) {
    return fail("NETWORK", "We could not reach circles right now.");
  }
  return fail("UNKNOWN", "Something went wrong loading circles.");
}

function unexpected<T>(e: unknown): CommunityResult<T> {
  if (e instanceof Error && /fetch|network|timeout/i.test(e.message)) {
    return fail("NETWORK", "We could not reach circles right now.");
  }
  return fail("UNKNOWN", "Something went wrong loading circles.");
}

/** Public-safe: strips anything not in the allow-list. */
export function adaptCircle(row: Record<string, unknown>): PublicCircle {
  const out: Record<string, unknown> = {};
  for (const key of PUBLIC_CIRCLE_COLUMNS) out[key] = row[key] ?? null;
  out.is_curated = Boolean(row.is_curated);
  return out as PublicCircle;
}

export function adaptCircles(rows: Record<string, unknown>[]): PublicCircle[] {
  return rows.map(adaptCircle);
}

/* -------------------------------- reads --------------------------------- */

export async function getPublicCircles(
  filters: CircleFilters = {},
): Promise<CommunityResult<PublicCircle[]>> {
  try {
    let query = supabase
      .from("community_circles")
      .select(PUBLIC_CIRCLE_SELECT)
      .eq("status", "active")
      .eq("visibility", "public")
      .order("created_at", { ascending: true })
      .limit(clampLimit(filters.limit));

    if (filters.circleType) query = query.eq("circle_type", filters.circleType);
    if (filters.countryCode) query = query.eq("country_code", filters.countryCode);
    if (filters.city) query = query.eq("city", filters.city);
    if (filters.lifeStage) query = query.eq("life_stage", filters.lifeStage);
    if (filters.topicCategory) query = query.eq("topic_category", filters.topicCategory);

    const { data, error } = await query;
    if (error) return normalizeError(error);
    return ok(adaptCircles((data ?? []) as unknown as Record<string, unknown>[]));
  } catch (e) {
    return unexpected(e);
  }
}

export async function getCircleBySlug(
  slug: string,
): Promise<CommunityResult<PublicCircle>> {
  const clean = slug?.trim();
  if (!clean) return fail("INVALID_INPUT", "Missing circle.");
  try {
    const { data, error } = await supabase
      .from("community_circles")
      .select(PUBLIC_CIRCLE_SELECT)
      .eq("slug", clean)
      .eq("status", "active")
      .eq("visibility", "public")
      .maybeSingle();
    if (error) return normalizeError(error);
    if (!data) return fail("NOT_FOUND", "This circle is not available.");
    return ok(adaptCircle(data as unknown as Record<string, unknown>));
  } catch (e) {
    return unexpected(e);
  }
}

export async function getMyCircleMemberships(): Promise<
  CommunityResult<MyCircleMembership[]>
> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return ok([]);
    const { data, error } = await supabase
      .from("community_circle_members")
      .select(MY_MEMBERSHIP_SELECT)
      .eq("user_id", auth.user.id)
      .eq("status", "active");
    if (error) return normalizeError(error);
    return ok((data ?? []) as unknown as MyCircleMembership[]);
  } catch (e) {
    return unexpected(e);
  }
}

/* -------------------------------- writes -------------------------------- */

/**
 * Joins a public circle as a plain member. The insert payload is built here —
 * role and status are never caller-controlled, and RLS re-checks everything.
 */
export async function joinPublicCircle(
  circleId: string,
): Promise<CommunityResult<{ circle_id: string }>> {
  const id = circleId?.trim();
  if (!id) return fail("INVALID_INPUT", "Missing circle.");
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return fail("UNAUTHENTICATED", "Sign in to join a circle.");
    const { error } = await supabase.from("community_circle_members").insert({
      circle_id: id,
      user_id: auth.user.id,
      role: "member",
      status: "active",
    });
    if (error) return normalizeError(error);
    return ok({ circle_id: id });
  } catch (e) {
    return unexpected(e);
  }
}

export async function leaveCircle(
  circleId: string,
): Promise<CommunityResult<{ circle_id: string }>> {
  const id = circleId?.trim();
  if (!id) return fail("INVALID_INPUT", "Missing circle.");
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return fail("UNAUTHENTICATED", "Sign in to manage circles.");
    const { error } = await supabase
      .from("community_circle_members")
      .delete()
      .eq("circle_id", id)
      .eq("user_id", auth.user.id);
    if (error) return normalizeError(error);
    return ok({ circle_id: id });
  } catch (e) {
    return unexpected(e);
  }
}

/* ------------------------------- filtering ------------------------------ */

export type CircleFilterKey = "all" | "near_you" | "journey" | "experience" | "culture";

export function filterCircles(
  circles: PublicCircle[],
  key: CircleFilterKey,
): PublicCircle[] {
  switch (key) {
    case "near_you":
      return circles.filter((c) => c.circle_type === "location");
    case "journey":
      return circles.filter((c) => c.circle_type === "life_stage");
    case "experience":
      return circles.filter((c) => c.circle_type === "experience");
    case "culture":
      return circles.filter((c) => c.circle_type === "culture_language");
    default:
      return circles;
  }
}
