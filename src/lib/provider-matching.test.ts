import { describe, it, expect } from "vitest";
import {
  matchProviders,
  isDisplayableProvider,
  sameCountry,
  type MatchProviderRecord,
} from "@/lib/provider-matching";

function p(over: Partial<MatchProviderRecord>): MatchProviderRecord {
  return {
    id: Math.random().toString(36).slice(2),
    full_name: "Dr. Test Name",
    specialty: "OB-GYN",
    clinic_name: null,
    city: "Casablanca",
    country: "MA",
    bio: null,
    languages: ["French"],
    services: null,
    credentials: null,
    avg_rating: 4,
    review_count: 3,
    consultation_fee_mad: 400,
    is_verified: true,
    accepting_patients: true,
    status: "active",
    ...over,
  };
}

describe("country normalization", () => {
  it("treats 'Morocco' and 'MA' as the same country", () => {
    expect(sameCountry("Morocco", "MA")).toBe(true);
    expect(sameCountry("maroc", "ma")).toBe(true);
    expect(sameCountry("Morocco", "FR")).toBe(false);
  });
});

describe("excluded provider records", () => {
  it("quarantines unverified, inactive, and placeholder records", () => {
    expect(isDisplayableProvider(p({ is_verified: false }))).toBe(false);
    expect(isDisplayableProvider(p({ status: "quarantined" }))).toBe(false);
    expect(isDisplayableProvider(p({ full_name: "TEST provider" }))).toBe(false);
    expect(isDisplayableProvider(p({ full_name: "Dr. Aicha Bensouda" }))).toBe(true);
  });

  it("never returns excluded records from matchProviders", () => {
    const out = matchProviders(
      [p({ full_name: "Hidden", is_verified: false }), p({ full_name: "Shown" })],
      { city: "Casablanca", country: "Morocco" },
    );
    expect(out.results.map((r) => r.full_name)).toEqual(["Shown"]);
    expect(out.excludedCount).toBe(1);
  });
});

describe("Casablanca matching fallback", () => {
  it("returns exact-city results without broadening", () => {
    const out = matchProviders([p({ full_name: "Casa Doc" })], {
      city: "Casablanca",
      country: "Morocco",
    });
    expect(out.tier).toBe("exact_city");
    expect(out.broadened).toBe(false);
    expect(out.results).toHaveLength(1);
  });

  it("does not zero out when preferences are unmet (ranking, not filtering)", () => {
    const out = matchProviders([p({ languages: ["Arabic"] })], {
      city: "Casablanca",
      country: "Morocco",
      languages: ["English"],
      preferenceKeywords: [["halal"]],
    });
    expect(out.results).toHaveLength(1);
  });

  it("falls back to nearby cities when Casablanca has no match", () => {
    const out = matchProviders([p({ city: "Rabat", full_name: "Rabat Doc" })], {
      city: "Casablanca",
      country: "Morocco",
    });
    expect(out.tier).toBe("nearby");
    expect(out.broadened).toBe(true);
    expect(out.broadenedReason).toMatch(/nearby/i);
  });

  it("falls back to verified virtual care before giving up", () => {
    const out = matchProviders(
      [p({ city: "Dakar", country: "SN", services: "telehealth consultations" })],
      { city: "Casablanca", country: "Morocco" },
    );
    expect(out.tier).toBe("virtual");
    expect(out.broadened).toBe(true);
  });

  it("returns a truthful zero state when strict filters exclude everything", () => {
    const out = matchProviders([p({ city: "Rabat" })], {
      city: "Casablanca",
      strict: { city: true },
    });
    expect(out.results).toHaveLength(0);
    expect(out.tier).toBe("none");
  });

  it("ranks the language and city match above a weaker record", () => {
    const out = matchProviders(
      [
        p({ full_name: "Far", city: "Rabat", languages: ["Arabic"] }),
        p({ full_name: "Near", city: "Casablanca", languages: ["English", "French"] }),
      ],
      { city: "Casablanca", country: "Morocco", languages: ["English"] },
    );
    expect(out.results[0].full_name).toBe("Near");
  });
});

describe("review_status eligibility", () => {
  it("excludes rows that are not moderation-approved", () => {
    expect(isDisplayableProvider(p({ review_status: "pending" }))).toBe(false);
    expect(isDisplayableProvider(p({ review_status: "rejected" }))).toBe(false);
    expect(isDisplayableProvider(p({ review_status: "verified" }))).toBe(true);
    expect(isDisplayableProvider(p({ review_status: "approved" }))).toBe(true);
  });

  it("keeps ineligible rows out of Casablanca results entirely", () => {
    const out = matchProviders(
      [
        p({ full_name: "Pending Doc", review_status: "pending" }),
        p({ full_name: "Approved Doc", review_status: "verified" }),
      ],
      { city: "Casablanca", country: "Morocco" },
    );
    expect(out.results.map((r) => r.full_name)).toEqual(["Approved Doc"]);
    expect(out.excludedCount).toBe(1);
  });
});
