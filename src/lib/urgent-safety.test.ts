import { describe, expect, it } from "vitest";
import {
  assessRisk,
  isUrgentText,
  normalizeText,
  urgentGuidance,
} from "./urgent-safety";

describe("assessRisk", () => {
  it("returns not urgent for ordinary questions", () => {
    for (const text of [
      "What foods should I eat in the second trimester?",
      "Quelles vitamines dois-je prendre ?",
      "ما هي الفيتامينات المناسبة؟",
    ]) {
      expect(assessRisk(text).urgent).toBe(false);
    }
  });

  it("detects reduced fetal movement in English, French and Arabic", () => {
    expect(assessRisk("my baby is not moving today").primary).toBe(
      "reduced_fetal_movement",
    );
    expect(assessRisk("le bébé ne bouge plus depuis ce matin").primary).toBe(
      "reduced_fetal_movement",
    );
    expect(assessRisk("الجنين لا يتحرك").primary).toBe(
      "reduced_fetal_movement",
    );
  });

  it("detects severe bleeding, chest pain, breathing trouble and seizures", () => {
    expect(assessRisk("I have heavy bleeding").categories).toContain(
      "severe_bleeding",
    );
    expect(assessRisk("douleur thoracique").categories).toContain("chest_pain");
    expect(assessRisk("I can't breathe properly").categories).toContain(
      "trouble_breathing",
    );
    expect(assessRisk("she had a seizure").categories).toContain("seizure");
  });

  it("flags self-harm language as a crisis and gives it top priority", () => {
    const a = assessRisk("I have chest pain and I want to kill myself");
    expect(a.crisis).toBe(true);
    expect(a.primary).toBe("self_harm");
  });

  it("is accent and case insensitive", () => {
    expect(normalizeText("Douleur Sévère")).toBe("douleur severe");
    expect(isUrgentText("DOULEUR SÉVÈRE")).toBe(true);
  });

  it("handles empty and nullish input", () => {
    expect(assessRisk("").urgent).toBe(false);
    expect(assessRisk(null).urgent).toBe(false);
    expect(assessRisk(undefined).urgent).toBe(false);
  });
});

describe("urgentGuidance", () => {
  it("returns null when nothing is urgent", () => {
    expect(urgentGuidance(assessRisk("hello"), "MA")).toBeNull();
  });

  it("suppresses reassurance and includes a country-aware number", () => {
    const g = urgentGuidance(assessRisk("heavy bleeding"), "MA");
    expect(g).not.toBeNull();
    expect(g!.suppressReassurance).toBe(true);
    expect(g!.emergencyNumber).toBeTruthy();
  });

  it("falls back to a safe generic message for unmapped countries", () => {
    const g = urgentGuidance(assessRisk("heavy bleeding"), "ZZ");
    expect(g!.emergencyNumber).toBeNull();
    expect(g!.emergencyMessage).toMatch(/emergency/i);
  });
});
