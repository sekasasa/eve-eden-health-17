import { describe, it, expect } from "vitest";
import {
  isMarketplaceVendor,
  marketplaceCardCopy,
  marketplaceLanguageOptions,
  marketplaceSearchHaystack,
  categoryLabel,
  type MarketplaceVendor,
} from "@/lib/marketplace";
import { LAUNCH_EVENT, isLaunchEventRelevant } from "@/lib/launch-event";

function v(over: Partial<MarketplaceVendor>): MarketplaceVendor {
  return {
    id: "v1",
    business_name: "Casa Maternity Shop",
    category: "maternity_wear",
    city: "Casablanca",
    country: "MA",
    logo_url: null,
    is_verified: true,
    is_featured: false,
    description: "Comfortable maternity clothing and nursing wear.",
    services: null,
    languages: ["french", "Arabic"],
    credentials: null,
    avg_rating: 4.5,
    created_at: null,
    ...over,
  };
}

describe("marketplace field contamination", () => {
  it("keeps real shop listings", () => {
    expect(isMarketplaceVendor(v({}))).toBe(true);
  });

  it("excludes clinician directory records imported into vendors", () => {
    expect(isMarketplaceVendor(v({ category: "care_services" }))).toBe(false);
    expect(
      isMarketplaceVendor(
        v({
          description:
            "Trained at the medical faculties of Paris Descartes. Expertise: laparoscopy and high-risk pregnancy.",
        }),
      ),
    ).toBe(false);
    expect(isMarketplaceVendor(v({ is_verified: false }))).toBe(false);
  });

  it("never puts credentials or clinical bio into card copy or search", () => {
    const clinicalish = v({ credentials: "MD, FRCOG", services: null });
    const copy = marketplaceCardCopy(clinicalish);
    expect(copy.subtitle).toBe("Maternity wear · Casablanca");
    expect(`${copy.title} ${copy.subtitle} ${copy.blurb ?? ""}`).not.toMatch(/FRCOG/);
    expect(marketplaceSearchHaystack(clinicalish)).not.toMatch(/frcog/);
  });

  it("drops the clinical bio blurb instead of rendering it", () => {
    const copy = marketplaceCardCopy(
      v({ description: "Cabinet specializing in obstetric ultrasound and colposcopy." }),
    );
    expect(copy.blurb).toBeNull();
  });

  it("quarantines malformed language values", () => {
    const opts = marketplaceLanguageOptions([
      v({ languages: ["french", "Arabic, English spoken on request; call us"] }),
    ]);
    expect(opts).toEqual(["Arabic, English spoken on request; call us"].length ? ["French"] : []);
  });

  it("labels unknown categories generically rather than leaking raw values", () => {
    expect(categoryLabel("care_services")).toBe("Shop");
    expect(categoryLabel("baby_gear")).toBe("Baby gear");
  });
});

describe("featured launch event visibility", () => {
  it("is shown to Casablanca and Rabat users", () => {
    expect(isLaunchEventRelevant({ country: "Morocco", city: "Casablanca" })).toBe(true);
    expect(isLaunchEventRelevant({ country: "MA", city: "Rabat" })).toBe(true);
  });

  it("is shown when the user has set no location yet", () => {
    expect(isLaunchEventRelevant({})).toBe(true);
  });

  it("is not forced on users in other countries", () => {
    expect(isLaunchEventRelevant({ country: "Kenya", city: "Nairobi" })).toBe(false);
  });

  it("labels unknown details as TBA rather than inventing them", () => {
    expect(LAUNCH_EVENT.venueLabel).toMatch(/to be announced/i);
    expect(LAUNCH_EVENT.timeLabel).toMatch(/to be announced/i);
    expect(LAUNCH_EVENT.capacityLabel).toMatch(/to be announced/i);
    expect(LAUNCH_EVENT.registrationDeadlineLabel).toMatch(/to be announced/i);
    for (const s of LAUNCH_EVENT.speakerCategories) {
      expect(s.note).toMatch(/to be announced/i);
    }
  });

  it("keeps the confirmed date and audience", () => {
    expect(LAUNCH_EVENT.dateISO).toBe("2026-09-05");
    expect(LAUNCH_EVENT.city).toBe("Casablanca");
    expect(LAUNCH_EVENT.speakerCategories.map((s) => s.label)).toEqual([
      "OB-GYNs",
      "Nutritionists",
      "Midwives",
    ]);
  });
});
