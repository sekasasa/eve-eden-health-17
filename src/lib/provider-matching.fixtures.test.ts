import { describe, expect, it } from "vitest";
import {
  matchProviders,
  matchesSpecialty,
  normalizeCity,
  normalizeLanguage,
  sameCountry,
  type MatchProviderRecord,
} from "@/lib/provider-matching";

/** Launch-corridor fixtures. Shapes mirror rows in `providers`. */
function provider(over: Partial<MatchProviderRecord>): MatchProviderRecord {
  return {
    id: over.id ?? Math.random().toString(36).slice(2),
    full_name: "Dr. Fixture",
    specialty: "OB-GYN",
    clinic_name: null,
    city: "Casablanca",
    country: "MA",
    bio: null,
    languages: ["French"],
    services: null,
    credentials: null,
    avg_rating: 4.2,
    review_count: 8,
    consultation_fee_mad: 400,
    is_verified: true,
    review_status: "verified",
    accepting_patients: true,
    status: "active",
    ...over,
  } as MatchProviderRecord;
}

const FIXTURES: MatchProviderRecord[] = [
  provider({
    id: "casa-obgyn-fr",
    full_name: "Dr. Aicha Bensouda",
    specialty: "OB-GYN",
    city: "Casablanca",
    country: "Morocco",
    languages: ["French", "Arabic"],
  }),
  provider({
    id: "casa-midwife-en",
    full_name: "Salma El Idrissi",
    specialty: "Sage-femme / Midwife",
    city: "casablanca",
    country: "MA",
    languages: ["English", "Arabic"],
  }),
  provider({
    id: "casa-doula-ar",
    full_name: "Nadia Cherkaoui",
    specialty: "Doula",
    city: "Casa",
    country: "MA",
    languages: ["Arabic"],
  }),
  provider({
    id: "rabat-ivf-fr",
    full_name: "Dr. Youssef Alaoui",
    specialty: "Fertility / IVF specialist",
    city: "Rabat",
    country: "MA",
    languages: ["French", "English"],
  }),
  provider({
    id: "rabat-obgyn-en",
    full_name: "Dr. Leila Tazi",
    specialty: "OB-GYN",
    city: "rabat",
    country: "Maroc",
    languages: ["English"],
  }),
  provider({
    id: "marrakech-obgyn",
    full_name: "Dr. Omar Fassi",
    specialty: "OB-GYN",
    city: "Marrakech",
    country: "MA",
    languages: ["French"],
  }),
  provider({
    id: "virtual-therapist",
    full_name: "Dr. Sara Haddad",
    specialty: "Perinatal therapist",
    city: "Rabat",
    country: "MA",
    languages: ["French", "English", "Arabic"],
    services: ["Teleconsultation", "Online video visits"],
  }),
  // Ineligible rows — must never surface.
  provider({
    id: "pending-review",
    full_name: "Dr. Pending Row",
    city: "Casablanca",
    review_status: "pending",
  }),
  provider({
    id: "unverified",
    full_name: "Dr. Unverified Row",
    city: "Casablanca",
    is_verified: false,
  }),
];

describe("normalization for the Morocco launch corridor", () => {
  it("normalizes country spellings to one value", () => {
    expect(sameCountry("Morocco", "MA")).toBe(true);
    expect(sameCountry("Maroc", "ma")).toBe(true);
    expect(sameCountry("MA", "France")).toBe(false);
  });

  it("normalizes city spellings and casing", () => {
    expect(normalizeCity("Casablanca")).toBe(normalizeCity("casablanca"));
    expect(normalizeCity(" Rabat ")).toBe(normalizeCity("rabat"));
  });

  it("normalizes language names across en/fr/ar inputs", () => {
    expect(normalizeLanguage("Français")).toBe(normalizeLanguage("french"));
    expect(normalizeLanguage("العربية") ?? "ar").toBeTruthy();
    expect(normalizeLanguage("English")).toBe(normalizeLanguage("english"));
  });
});

describe("specialty taxonomy", () => {
  it("matches OB-GYN, midwife, doula and IVF fixtures", () => {
    expect(matchesSpecialty(FIXTURES[0], "OB-GYN")).toBe(true);
    expect(matchesSpecialty(FIXTURES[1], "Midwife")).toBe(true);
    expect(matchesSpecialty(FIXTURES[2], "Doula")).toBe(true);
    expect(matchesSpecialty(FIXTURES[3], "Fertility / IVF")).toBe(true);
  });

  it("does not cross-match unrelated specialties", () => {
    expect(matchesSpecialty(FIXTURES[2], "OB-GYN")).toBe(false);
    expect(matchesSpecialty(FIXTURES[0], "Doula")).toBe(false);
  });
});

describe("Casablanca and Rabat discovery", () => {
  it("returns exact-city Casablanca results for each specialty without broadening", () => {
    for (const [specialty, expected] of [
      ["OB-GYN", "casa-obgyn-fr"],
      ["Midwife", "casa-midwife-en"],
      ["Doula", "casa-doula-ar"],
    ] as const) {
      const out = matchProviders(FIXTURES, {
        specialty,
        city: "Casablanca",
        country: "Morocco",
      });
      expect(out.broadened).toBe(false);
      expect(out.tier).toBe("exact_city");
      expect(out.results.map((r) => r.id)).toContain(expected);
    }
  });

  it("returns Rabat IVF results for a Rabat mother", () => {
    const out = matchProviders(FIXTURES, {
      specialty: "Fertility / IVF",
      city: "Rabat",
      country: "MA",
    });
    expect(out.tier).toBe("exact_city");
    expect(out.results[0].id).toBe("rabat-ivf-fr");
  });

  it("ranks language preference without hiding other providers", () => {
    const out = matchProviders(FIXTURES, {
      specialty: "OB-GYN",
      city: "Casablanca",
      country: "MA",
      languages: ["English"],
    });
    // Casablanca OB-GYN speaks French/Arabic only — still returned, just ranked.
    expect(out.results.map((r) => r.id)).toContain("casa-obgyn-fr");
  });

  it("honours an explicit strict language filter", () => {
    const out = matchProviders(FIXTURES, {
      city: "Casablanca",
      country: "MA",
      languages: ["English"],
      strict: { language: true },
    });
    expect(out.results.every((r) => (r.languages ?? []).includes("English"))).toBe(
      true,
    );
  });

  it("broadens to the regional corridor when the exact city has nothing", () => {
    const out = matchProviders(FIXTURES, {
      specialty: "Fertility / IVF",
      city: "Mohammedia",
      country: "MA",
    });
    expect(out.broadened).toBe(true);
    expect(out.tier).toBe("nearby");
    expect(out.broadenedReason).toBeTruthy();
  });

  it("falls back to virtual care before giving up", () => {
    const out = matchProviders(FIXTURES, {
      specialty: "Therapist",
      city: "Agadir",
      country: "MA",
    });
    expect(["virtual", "nearby"]).toContain(out.tier);
    expect(out.results.length).toBeGreaterThan(0);
  });

  it("returns an honest empty state rather than inventing providers", () => {
    const out = matchProviders(FIXTURES, {
      specialty: "Pharmacy",
      city: "Casablanca",
      country: "MA",
      strict: { city: true },
    });
    expect(out.results).toHaveLength(0);
    expect(out.tier).toBe("none");
  });

  it("never surfaces pending or unverified rows in any tier", () => {
    for (const city of ["Casablanca", "Rabat", "Agadir"]) {
      const out = matchProviders(FIXTURES, { city, country: "MA" });
      const ids = out.results.map((r) => r.id);
      expect(ids).not.toContain("pending-review");
      expect(ids).not.toContain("unverified");
    }
  });
});
