// Seed data for Care + Vendor Match (prototype, client-side only).

export type LifeStage =
  | "ttc"
  | "pregnant"
  | "postpartum"
  | "newborn"
  | "pcos"
  | "mood"
  | "labs"
  | "rx"
  | "insurance"
  | "family";

export type NeedKey =
  | "doctor"
  | "lab"
  | "pharmacy"
  | "labs_explain"
  | "rx_explain"
  | "postpartum_support"
  | "wellness"
  | "insurance_understand"
  | "insurance_compare"
  | "international"
  | "self_pay"
  | "navigator";

export type PaymentKey =
  | "local_insurance"
  | "international"
  | "qualify"
  | "compare"
  | "self_pay"
  | "family"
  | "unsure";

export type Urgency = "today" | "this_week" | "planning" | "exploring";

export type VerificationTier =
  | "Listed"
  | "Verified"
  | "Preferred Partner"
  | "Clinical Partner";

export type MatchProvider = {
  id: string;
  name: string;
  category: string;
  city: string;
  languages: string[];
  priceRange: string;
  acceptsSelfPay: boolean;
  acceptsInternational: boolean;
  visitTypes: ("in-person" | "telehealth" | "home" | "delivery")[];
  tags: string[];
  tier: VerificationTier;
  bestFor: LifeStage[];
};

export const MATCH_PROVIDERS: MatchProvider[] = [
  {
    id: "mp-1",
    name: "Dr. Aicha Bensouda",
    category: "OB-GYN",
    city: "Casablanca",
    languages: ["Arabic", "French"],
    priceRange: "450 MAD",
    acceptsSelfPay: true,
    acceptsInternational: true,
    visitTypes: ["in-person", "telehealth"],
    tags: ["pregnancy", "postpartum", "speaks Arabic/French", "first-time mothers"],
    tier: "Clinical Partner",
    bestFor: ["pregnant", "postpartum", "ttc"],
  },
  {
    id: "mp-2",
    name: "Hayat Zidane",
    category: "Midwife",
    city: "Casablanca",
    languages: ["Arabic", "French", "Berber"],
    priceRange: "200 MAD",
    acceptsSelfPay: true,
    acceptsInternational: false,
    visitTypes: ["in-person", "home"],
    tags: ["home visit", "postpartum support", "culturally aligned care"],
    tier: "Preferred Partner",
    bestFor: ["postpartum", "newborn", "pregnant"],
  },
  {
    id: "mp-3",
    name: "Nadia Therapy Hub",
    category: "Therapist",
    city: "Rabat",
    languages: ["French", "English"],
    priceRange: "350 MAD",
    acceptsSelfPay: true,
    acceptsInternational: true,
    visitTypes: ["telehealth", "in-person"],
    tags: ["anxiety", "postpartum mood", "private"],
    tier: "Verified",
    bestFor: ["mood", "postpartum"],
  },
  {
    id: "mp-4",
    name: "LabExpress Casablanca",
    category: "Lab",
    city: "Casablanca",
    languages: ["Arabic", "French"],
    priceRange: "From 80 MAD",
    acceptsSelfPay: true,
    acceptsInternational: true,
    visitTypes: ["in-person", "home"],
    tags: ["hormones", "thyroid", "pregnancy panel", "home draw"],
    tier: "Verified",
    bestFor: ["labs", "ttc", "pcos", "pregnant"],
  },
  {
    id: "mp-5",
    name: "Pharmacie Al Amal",
    category: "Pharmacy",
    city: "Casablanca",
    languages: ["Arabic", "French"],
    priceRange: "Varies",
    acceptsSelfPay: true,
    acceptsInternational: true,
    visitTypes: ["in-person", "delivery"],
    tags: ["delivery", "prenatal vitamins", "pharmacy support"],
    tier: "Listed",
    bestFor: ["rx", "pregnant", "postpartum"],
  },
  {
    id: "mp-6",
    name: "Mama Maroc Lactation",
    category: "Lactation consultant",
    city: "Rabat",
    languages: ["Arabic", "French"],
    priceRange: "300 MAD",
    acceptsSelfPay: true,
    acceptsInternational: false,
    visitTypes: ["home", "telehealth"],
    tags: ["breastfeeding", "newborn", "home visit"],
    tier: "Preferred Partner",
    bestFor: ["postpartum", "newborn"],
  },
];

export type InsuranceVendor = {
  id: string;
  name: string;
  coverageType: "Local" | "International" | "Public" | "Employer";
  regions: string[];
  monthly: string;
  bestFor: string[];
  highlights: string[];
  waiting: string;
  network: string;
  international: boolean;
  perks: string[];
  tier: VerificationTier;
};

export const INSURANCE_VENDORS: InsuranceVendor[] = [
  {
    id: "iv-1",
    name: "Saham Maternité+",
    coverageType: "Local",
    regions: ["Morocco"],
    monthly: "350–600 MAD/mo",
    bestFor: ["pregnancy", "postpartum", "newborn"],
    highlights: ["Full maternity package", "Newborn covered 30 days", "Lab discounts"],
    waiting: "3-month waiting period for maternity",
    network: "1,200+ providers in Morocco",
    international: false,
    perks: ["Telehealth", "Pharmacy discounts", "Maternity package"],
    tier: "Preferred Partner",
  },
  {
    id: "iv-2",
    name: "AXA Mama Care",
    coverageType: "Local",
    regions: ["Morocco", "Tunisia"],
    monthly: "420 MAD/mo",
    bestFor: ["pregnancy", "pediatrics", "mental health"],
    highlights: ["Pediatric coverage to age 5", "Mental health visits included"],
    waiting: "None for telehealth",
    network: "Wide private network",
    international: false,
    perks: ["Telehealth", "Mental health support", "Care navigator access"],
    tier: "Verified",
  },
  {
    id: "iv-3",
    name: "Cigna Global Wellbeing",
    coverageType: "International",
    regions: ["Worldwide"],
    monthly: "$180–320 USD/mo",
    bestFor: ["diaspora families", "international births", "labs"],
    highlights: ["Direct billing in 180+ countries", "Reimbursement support"],
    waiting: "10 months for maternity",
    network: "International network",
    international: true,
    perks: ["Telehealth", "Reimbursement docs", "24/7 navigator"],
    tier: "Clinical Partner",
  },
  {
    id: "iv-4",
    name: "Allianz Care MENA",
    coverageType: "International",
    regions: ["MENA", "Europe"],
    monthly: "$140 USD/mo",
    bestFor: ["expat mothers", "telehealth", "prescriptions"],
    highlights: ["Pharmacy network", "Claim docs in French/Arabic"],
    waiting: "12 months for maternity",
    network: "Global + MENA",
    international: true,
    perks: ["Telehealth", "Pharmacy discounts", "Home visits"],
    tier: "Verified",
  },
  {
    id: "iv-5",
    name: "CNSS AMO (Public)",
    coverageType: "Public",
    regions: ["Morocco"],
    monthly: "Payroll-based",
    bestFor: ["employed mothers", "basic maternity"],
    highlights: ["Maternity leave coverage", "Basic care reimbursement"],
    waiting: "Eligibility-based",
    network: "Public hospitals + agreed clinics",
    international: false,
    perks: ["Maternity benefit", "Wide hospital access"],
    tier: "Listed",
  },
];

export const LAB_CATEGORIES = [
  { key: "hormones", label: "Hormones", note: "estrogen, progesterone, LH, FSH" },
  { key: "thyroid", label: "Thyroid", note: "TSH, T3, T4" },
  { key: "iron", label: "Iron", note: "ferritin, hemoglobin" },
  { key: "glucose", label: "Glucose", note: "fasting glucose, HbA1c" },
  { key: "fertility", label: "Fertility", note: "AMH, ovulation panel" },
  { key: "pregnancy", label: "Pregnancy", note: "beta hCG, prenatal panel" },
  { key: "postpartum", label: "Postpartum", note: "iron, thyroid, vitamin D" },
  { key: "vitamins", label: "Vitamin levels", note: "D, B12, folate" },
  { key: "general", label: "General wellness", note: "complete blood count" },
];

export const LAB_GUIDANCE: Record<string, {
  checks: string;
  whyItMatters: string;
  questions: string[];
  urgent: string;
}> = {
  hormones: {
    checks: "Reproductive hormones that regulate cycles and fertility.",
    whyItMatters: "Helpful if you're tracking cycles, navigating PCOS, or trying to conceive.",
    questions: [
      "Is my result within range for my cycle phase?",
      "How might this affect my fertility plans?",
      "Do I need to repeat this test?",
    ],
    urgent: "Severe pelvic pain or heavy bleeding — seek immediate care.",
  },
  thyroid: {
    checks: "How your thyroid is producing key hormones (TSH, T3, T4).",
    whyItMatters: "Thyroid balance matters a lot in pregnancy, postpartum, and mood.",
    questions: [
      "Do I need treatment based on this result?",
      "Should this be retested during pregnancy?",
      "Could this be affecting my mood or energy?",
    ],
    urgent: "Severe palpitations or sudden weight changes — contact a clinician.",
  },
  iron: {
    checks: "Your iron stores and red blood cell health.",
    whyItMatters: "Low iron is common in pregnancy and postpartum and can cause fatigue.",
    questions: [
      "Do I need iron supplementation?",
      "Is my level safe for delivery / breastfeeding?",
      "When should we recheck this?",
    ],
    urgent: "Severe shortness of breath or fainting — seek urgent care.",
  },
  glucose: {
    checks: "Your blood sugar levels.",
    whyItMatters: "Important screen for gestational diabetes and long-term metabolic health.",
    questions: [
      "Is this within range for my stage of pregnancy?",
      "Do I need a glucose tolerance test?",
      "What lifestyle changes do you recommend?",
    ],
    urgent: "Confusion, fainting, or extreme thirst — seek urgent care.",
  },
  fertility: {
    checks: "Markers like AMH that estimate ovarian reserve.",
    whyItMatters: "Useful context when planning conception or fertility treatment.",
    questions: [
      "How should I interpret this number for my age?",
      "Do you recommend further testing?",
      "What are my best next steps?",
    ],
    urgent: "Severe pelvic pain — seek immediate care.",
  },
  pregnancy: {
    checks: "Pregnancy-specific markers and panels.",
    whyItMatters: "Confirms and monitors a healthy pregnancy.",
    questions: [
      "Is this consistent with my dates?",
      "Do I need a repeat or follow-up scan?",
      "Any flags I should know about?",
    ],
    urgent: "Heavy bleeding or severe abdominal pain — go to emergency care.",
  },
  postpartum: {
    checks: "Postpartum recovery markers (iron, thyroid, vitamin D).",
    whyItMatters: "Postpartum recovery can affect mood, energy, and breastfeeding.",
    questions: [
      "Are my levels safe for breastfeeding?",
      "Do I need supplementation?",
      "When should this be rechecked?",
    ],
    urgent: "Severe mood changes or thoughts of self-harm — seek immediate help.",
  },
  vitamins: {
    checks: "Common vitamin levels (D, B12, folate).",
    whyItMatters: "Affects energy, mood, and fetal development if pregnant.",
    questions: [
      "Do I need supplementation?",
      "Is this safe in pregnancy/breastfeeding?",
      "How long should I supplement?",
    ],
    urgent: "Severe weakness or neurological symptoms — seek urgent care.",
  },
  general: {
    checks: "Overall blood health markers.",
    whyItMatters: "Useful annual baseline; flags infections or anemia.",
    questions: [
      "Anything in my result that concerns you?",
      "Do I need any follow-up tests?",
      "When should I retest?",
    ],
    urgent: "Severe symptoms with abnormal results — seek urgent care.",
  },
};

export const RX_LIFE_STAGES = [
  { key: "ttc", label: "Trying to conceive" },
  { key: "pregnant", label: "Pregnant" },
  { key: "postpartum", label: "Postpartum" },
  { key: "breastfeeding", label: "Breastfeeding" },
  { key: "pcos", label: "PCOS / hormones" },
  { key: "general", label: "General care" },
];
