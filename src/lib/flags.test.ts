import { describe, expect, it } from "vitest";
import {
  allFlags,
  FLAG_DEFAULTS,
  flagOffCopy,
  isFeatureEnabled,
} from "./flags";

describe("feature flags", () => {
  it("defaults every unverified capability to OFF", () => {
    for (const value of Object.values(FLAG_DEFAULTS)) {
      expect(value).toBe(false);
    }
  });

  it("stays OFF when the env var is absent or not an explicit on value", () => {
    expect(isFeatureEnabled("askEveAi", {})).toBe(false);
    expect(isFeatureEnabled("askEveAi", { VITE_FLAG_ASK_EVE_AI: "" })).toBe(false);
    expect(isFeatureEnabled("askEveAi", { VITE_FLAG_ASK_EVE_AI: "maybe" })).toBe(
      false,
    );
    expect(isFeatureEnabled("askEveAi", { VITE_FLAG_ASK_EVE_AI: "off" })).toBe(
      false,
    );
  });

  it("turns on only for explicit on/true/1", () => {
    for (const raw of ["on", "TRUE", "1"]) {
      expect(isFeatureEnabled("communityPosting", { VITE_FLAG_COMMUNITY_POSTING: raw })).toBe(true);
    }
  });

  it("exposes honest off-state copy for every flag", () => {
    for (const flag of Object.keys(FLAG_DEFAULTS) as (keyof typeof FLAG_DEFAULTS)[]) {
      expect(flagOffCopy(flag).length).toBeGreaterThan(10);
    }
  });

  it("snapshots all flags", () => {
    const snap = allFlags({ VITE_FLAG_EVENT_REGISTRATION: "on" });
    expect(snap.eventRegistration).toBe(true);
    expect(snap.carePassportSharing).toBe(false);
  });
});
