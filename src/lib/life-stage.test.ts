import { describe, expect, it } from "vitest";
import {
  normalizeLifeStage,
  resolveLifeStage,
  sameLifeStage,
  stageCopy,
} from "./life-stage";

describe("normalizeLifeStage", () => {
  it("maps aliases to canonical stages", () => {
    expect(normalizeLifeStage("Trying to conceive")).toBe("ttc");
    expect(normalizeLifeStage("IVF")).toBe("fertility_treatment");
    expect(normalizeLifeStage("pregnancy")).toBe("pregnant");
    expect(normalizeLifeStage("newborn")).toBe("postpartum");
    expect(normalizeLifeStage("miscarriage")).toBe("loss");
  });

  it("returns unspecified for unknown or empty values", () => {
    expect(normalizeLifeStage(null)).toBe("unspecified");
    expect(normalizeLifeStage("")).toBe("unspecified");
    expect(normalizeLifeStage("banana")).toBe("unspecified");
  });
});

describe("resolveLifeStage", () => {
  it("prefers mothers.stage over other sources", () => {
    expect(
      resolveLifeStage({
        motherStage: "postpartum",
        preferenceStage: "pregnant",
        intakeStage: "ttc",
      }),
    ).toBe("postpartum");
  });

  it("falls through to preferences then intake", () => {
    expect(
      resolveLifeStage({ motherStage: null, preferenceStage: "ivf" }),
    ).toBe("fertility_treatment");
    expect(resolveLifeStage({ intakeStage: "trying" })).toBe("ttc");
  });

  it("derives pregnancy from a pregnancy week only as a last resort", () => {
    expect(resolveLifeStage({ pregnancyWeek: 22 })).toBe("pregnant");
    expect(
      resolveLifeStage({ motherStage: "postpartum", pregnancyWeek: 22 }),
    ).toBe("postpartum");
  });

  it("returns unspecified when nothing is known", () => {
    expect(resolveLifeStage({})).toBe("unspecified");
  });
});

describe("stageCopy", () => {
  it("gives every stage a label, summary and specialties", () => {
    for (const value of ["ttc", "ivf", "pregnant", "postpartum", "loss", null]) {
      const copy = stageCopy(normalizeLifeStage(value));
      expect(copy.label.length).toBeGreaterThan(0);
      expect(copy.summary.length).toBeGreaterThan(0);
      expect(copy.specialties.length).toBeGreaterThan(0);
    }
  });
});

describe("sameLifeStage", () => {
  it("treats aliases as equal", () => {
    expect(sameLifeStage("pregnancy", "pregnant")).toBe(true);
    expect(sameLifeStage("newborn", "postpartum")).toBe(true);
    expect(sameLifeStage("ttc", "pregnant")).toBe(false);
  });
});
