// SessionStorage + Supabase-backed intake state for Care + Vendor Match.
import { supabase } from "@/integrations/supabase/client";
import type { LifeStage, NeedKey, PaymentKey, Urgency } from "./match-data";

const KEY = "eve_match_intake_v1";
const ID_KEY = "eve_match_intake_id_v1";

export type MatchIntake = {
  id?: string;
  stage?: LifeStage;
  /** Free-form need key. Stage-specific options are defined per pathway. */
  need?: string;
  city?: string;
  /** Primary language (first selected) — kept for back-compat */
  language?: string;
  /** Full multi-select language list */
  languages?: string[];
  /** Where care is needed: "near" | "other_city" | "other_country" | "virtual" | "home" | "unsure" */
  locationMode?: string;
  /** Care preferences (multi-select) */
  preferences?: string[];
  payment?: PaymentKey;
  urgency?: Urgency;
  /** What Eve should help with first */
  firstTask?: string;
  // payment-specific extras
  localProvider?: string;
  localPlan?: string;
  localMemberId?: string;
  localCovers?: string[];
  intlProvider?: string;
  intlCountry?: string;
  currentCountry?: string;
  intlNeeds?: string[];
  selfPayPriority?: string;
  familySupport?: string;
  familyEmail?: string;
};


const TOP_LEVEL = new Set([
  "stage",
  "need",
  "city",
  "language",
  "payment",
  "urgency",
]);

function splitExtras(intake: MatchIntake) {
  const extras: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(intake)) {
    if (k === "id") continue;
    if (!TOP_LEVEL.has(k) && v !== undefined) extras[k] = v;
  }
  return extras;
}

export function readIntake(): MatchIntake {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || "{}") as MatchIntake;
  } catch {
    return {};
  }
}

export function writeIntake(patch: Partial<MatchIntake>) {
  if (typeof window === "undefined") return;
  const next = { ...readIntake(), ...patch };
  sessionStorage.setItem(KEY, JSON.stringify(next));
}

export function resetIntake() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
  sessionStorage.removeItem(ID_KEY);
}

function currentRowId(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(ID_KEY);
}

function setRowId(id: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ID_KEY, id);
}

/**
 * Load the most recent intake from Supabase into sessionStorage if the user is
 * signed in and we don't already have a local row. Safe to call repeatedly.
 */
export async function hydrateIntakeFromCloud(): Promise<MatchIntake> {
  const local = readIntake();
  // If we already have a hydrated row id, just return local
  if (currentRowId()) return local;

  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return local;

  const { data, error } = await supabase
    .from("match_intakes")
    .select("*")
    .eq("user_id", u.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return local;

  const extras = (data.extras ?? {}) as Record<string, unknown>;
  const merged: MatchIntake = {
    stage: (data.stage as LifeStage | null) ?? undefined,
    need: (data.need as NeedKey | null) ?? undefined,
    city: data.city ?? undefined,
    language: data.language ?? undefined,
    payment: (data.payment as PaymentKey | null) ?? undefined,
    urgency: (data.urgency as Urgency | null) ?? undefined,
    ...extras,
  };
  sessionStorage.setItem(KEY, JSON.stringify(merged));
  setRowId(data.id as string);
  return merged;
}

/**
 * Persist the current intake to Supabase. Creates a new row the first time the
 * user completes intake, then updates that same row on subsequent edits.
 * Falls back silently when the user is signed out (sessionStorage still holds it).
 */
export async function persistIntake(): Promise<{ ok: boolean; id?: string }> {
  const intake = readIntake();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return { ok: false };

  const row = {
    user_id: u.user.id,
    stage: intake.stage ?? null,
    need: intake.need ?? null,
    city: intake.city ?? null,
    language: intake.language ?? null,
    payment: intake.payment ?? null,
    urgency: intake.urgency ?? null,
    extras: splitExtras(intake) as never,
  };

  const existing = currentRowId();
  if (existing) {
    const { error } = await supabase
      .from("match_intakes")
      .update(row)
      .eq("id", existing);
    if (error) return { ok: false };
    return { ok: true, id: existing };
  }

  const { data, error } = await supabase
    .from("match_intakes")
    .insert(row)
    .select("id")
    .single();
  if (error || !data) return { ok: false };
  setRowId(data.id as string);
  return { ok: true, id: data.id as string };
}

/** Start a fresh intake (used by "Start a new match" on history page). */
export function startNewIntake() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
  sessionStorage.removeItem(ID_KEY);
}
