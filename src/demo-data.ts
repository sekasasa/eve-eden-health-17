// Demo seed constants. Used by both server (seeding) and client (sign-in).
// Demo accounts are publicly known — they only exist on this Lovable project
// for the "View demo" button. Not for production credentials.

export const DEMO_MOTHER = {
  user_id: "11111111-1111-1111-1111-111111111111",
  mother_id: "11111111-1111-1111-1111-1111111111aa",
  email: "demo-mother@eveeden.demo",
  password: "DemoMother!2026",
  full_name: "Imane B.",
  city: "Casablanca",
  language: "fr",
  pregnancy_week: 24,
  is_first_pregnancy: true,
  religious_pref: "muslim",
} as const;

export const DEMO_PROVIDERS = [
  {
    id: "22222222-0000-0000-0000-00000000000a",
    user_id: "22222222-1111-1111-1111-11111111000a",
    full_name: "Aicha Bensouda",
    specialty: "OB-GYN",
    clinic_name: "Clinique Al Inbiat",
    city: "Casablanca",
    fee: 450,
  },
  {
    id: "22222222-0000-0000-0000-00000000000b",
    user_id: "22222222-1111-1111-1111-11111111000b",
    email: "demo-provider@eveeden.demo",
    password: "DemoProvider!2026",
    full_name: "Karim Alaoui",
    specialty: "OB-GYN",
    clinic_name: "Cabinet Alaoui",
    city: "Rabat",
    fee: 380,
  },
  {
    id: "22222222-0000-0000-0000-00000000000c",
    user_id: "22222222-1111-1111-1111-11111111000c",
    full_name: "Hayat Zidane",
    specialty: "Midwife",
    clinic_name: "Maternité Ibn Rochd",
    city: "Casablanca",
    fee: 200,
  },
] as const;

export const DEMO_VENDORS = [
  {
    id: "33333333-0000-0000-0000-00000000000a",
    user_id: "33333333-1111-1111-1111-11111111000a",
    business_name: "Little Nest Morocco",
    category: "Baby gear",
    city: "Casablanca",
    description: "Curated baby gear for new parents in Morocco.",
    featured: false,
  },
  {
    id: "33333333-0000-0000-0000-00000000000b",
    user_id: "33333333-1111-1111-1111-11111111000b",
    business_name: "Mama Maroc",
    category: "Maternity wear",
    city: "Casablanca",
    description: "Maternity wear designed for Moroccan mothers.",
    featured: true,
  },
  {
    id: "33333333-0000-0000-0000-00000000000c",
    user_id: "33333333-1111-1111-1111-11111111000c",
    business_name: "NutriMama",
    category: "Nutrition & meal plans",
    city: "Rabat",
    description: "Personalised nutrition and meal plans for pregnancy.",
    featured: false,
  },
] as const;

// Extra demo mothers tied to Dr. Karim through appointments so the Eden
// provider demo shows realistic patient lists.
export const DEMO_EDEN_PATIENTS = [
  {
    id: "44444444-0000-0000-0000-00000000000a",
    user_id: "44444444-1111-1111-1111-11111111000a",
    full_name: "Salma R.",
    city: "Rabat",
    pregnancy_week: 18,
  },
  {
    id: "44444444-0000-0000-0000-00000000000b",
    user_id: "44444444-1111-1111-1111-11111111000b",
    full_name: "Nadia K.",
    city: "Rabat",
    pregnancy_week: 32,
  },
  {
    id: "44444444-0000-0000-0000-00000000000c",
    user_id: "44444444-1111-1111-1111-11111111000c",
    full_name: "Yasmine T.",
    city: "Salé",
    pregnancy_week: 27,
  },
] as const;

export const DEMO_GUIDANCE_IDS = [
  "55555555-0000-0000-0000-00000000000a",
  "55555555-0000-0000-0000-00000000000b",
  "55555555-0000-0000-0000-00000000000c",
] as const;

export const DEMO_APPT_IDS = {
  motherUpcoming: "66666666-0000-0000-0000-00000000000a",
  motherPast: "66666666-0000-0000-0000-00000000000b",
  // Eden 5 this-week appointments
  eden: [
    "66666666-0000-0000-0000-00000000001a",
    "66666666-0000-0000-0000-00000000001b",
    "66666666-0000-0000-0000-00000000001c",
    "66666666-0000-0000-0000-00000000001d",
    "66666666-0000-0000-0000-00000000001e",
  ],
} as const;

export type DemoRole = "mother" | "provider";
