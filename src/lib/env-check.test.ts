import { describe, expect, it } from "vitest";
import { checkClientEnv } from "@/lib/env-check";

describe("checkClientEnv", () => {
  it("passes when required keys are present", () => {
    const r = checkClientEnv({
      VITE_SUPABASE_URL: "https://example.supabase.co",
      VITE_SUPABASE_PUBLISHABLE_KEY: "key",
    });
    expect(r.ok).toBe(true);
    expect(r.missingRequired).toEqual([]);
  });

  it("reports missing and blank required keys", () => {
    const r = checkClientEnv({ VITE_SUPABASE_URL: "   " });
    expect(r.ok).toBe(false);
    expect(r.missingRequired).toContain("VITE_SUPABASE_URL");
    expect(r.missingRequired).toContain("VITE_SUPABASE_PUBLISHABLE_KEY");
  });

  it("lists unset optional flag keys without failing", () => {
    const r = checkClientEnv({
      VITE_SUPABASE_URL: "https://example.supabase.co",
      VITE_SUPABASE_PUBLISHABLE_KEY: "key",
    });
    expect(r.unsetOptional.length).toBeGreaterThan(0);
  });
});
