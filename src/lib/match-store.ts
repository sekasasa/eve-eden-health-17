// SessionStorage-backed intake state for Care + Vendor Match.
import type { LifeStage, NeedKey, PaymentKey, Urgency } from "./match-data";

const KEY = "eve_match_intake_v1";

export type MatchIntake = {
  stage?: LifeStage;
  need?: NeedKey;
  city?: string;
  language?: string;
  payment?: PaymentKey;
  urgency?: Urgency;
  // payment-specific extras
  localProvider?: string;
  localPlan?: string;
  localCovers?: string[];
  intlProvider?: string;
  intlCountry?: string;
  currentCountry?: string;
  intlNeeds?: string[];
  selfPayPriority?: string;
  familyEmail?: string;
};

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
}
