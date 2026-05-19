// Server function that idempotently seeds the demo data and ensures the
// demo auth users exist. Returns the credentials so the client can call
// supabase.auth.signInWithPassword and enter the app as that user.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  DEMO_MOTHER,
  DEMO_PROVIDERS,
  DEMO_VENDORS,
  DEMO_EDEN_PATIENTS,
  DEMO_GUIDANCE_IDS,
  DEMO_APPT_IDS,
} from "@/demo-data";

const Input = z.object({ role: z.enum(["mother", "provider"]) });

async function ensureAuthUser(opts: {
  id: string;
  email: string;
  password: string;
  full_name: string;
  user_type: "mother" | "provider";
}) {
  // Try to fetch first
  const { data: existing } = await supabaseAdmin.auth.admin.getUserById(opts.id);
  if (!existing?.user) {
    const { error } = await supabaseAdmin.auth.admin.createUser({
      id: opts.id,
      email: opts.email,
      password: opts.password,
      email_confirm: true,
      user_metadata: { full_name: opts.full_name, user_type: opts.user_type },
    });
    // ignore "already registered" race
    if (error && !/already/i.test(error.message)) {
      throw error;
    }
  } else {
    // Make sure the password is correct (in case it was rotated)
    await supabaseAdmin.auth.admin.updateUserById(opts.id, {
      password: opts.password,
      email_confirm: true,
    });
  }
  // Upsert profile
  await supabaseAdmin.from("profiles").upsert({
    id: opts.id,
    user_type: opts.user_type,
    full_name: opts.full_name,
    language: "fr",
    country: "MA",
  });
}

async function seedDemo() {
  // --- Auth users ---
  await ensureAuthUser({
    id: DEMO_MOTHER.user_id,
    email: DEMO_MOTHER.email,
    password: DEMO_MOTHER.password,
    full_name: DEMO_MOTHER.full_name,
    user_type: "mother",
  });

  const karim = DEMO_PROVIDERS[1];
  await ensureAuthUser({
    id: karim.user_id,
    email: karim.email!,
    password: karim.password!,
    full_name: `Dr. ${karim.full_name}`,
    user_type: "provider",
  });

  // --- Providers ---
  for (const p of DEMO_PROVIDERS) {
    await supabaseAdmin.from("providers").upsert({
      id: p.id,
      user_id: p.user_id,
      full_name: `Dr. ${p.full_name}`,
      specialty: p.specialty,
      clinic_name: p.clinic_name,
      city: p.city,
      country: "MA",
      bio: `${p.specialty} based at ${p.clinic_name}, ${p.city}.`,
      languages: ["French", "Arabic"],
      consultation_fee_mad: p.fee,
      is_verified: true,
      accepting_patients: true,
      avg_rating: 4.8,
      review_count: 42,
    });
  }

  // --- Vendors ---
  for (const v of DEMO_VENDORS) {
    await supabaseAdmin.from("vendors").upsert({
      id: v.id,
      user_id: v.user_id,
      business_name: v.business_name,
      category: v.category,
      city: v.city,
      country: "MA",
      description: v.description,
      is_verified: true,
      is_featured: v.featured,
    });
  }

  // --- Demo mother ---
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 16 * 7);
  await supabaseAdmin.from("mothers").upsert({
    id: DEMO_MOTHER.mother_id,
    user_id: DEMO_MOTHER.user_id,
    full_name: DEMO_MOTHER.full_name,
    city: DEMO_MOTHER.city,
    country: "MA",
    language: DEMO_MOTHER.language,
    due_date: dueDate.toISOString().slice(0, 10),
    pregnancy_week: DEMO_MOTHER.pregnancy_week,
    is_first_pregnancy: DEMO_MOTHER.is_first_pregnancy,
    religious_pref: DEMO_MOTHER.religious_pref,
    preferred_provider_id: DEMO_PROVIDERS[0].id,
    whatsapp_opt_in: true,
  });

  // --- Eden demo patients ---
  for (const m of DEMO_EDEN_PATIENTS) {
    const d = new Date();
    d.setDate(d.getDate() + (40 - m.pregnancy_week) * 7);
    await supabaseAdmin.from("mothers").upsert({
      id: m.id,
      user_id: m.user_id,
      full_name: m.full_name,
      city: m.city,
      country: "MA",
      language: "fr",
      pregnancy_week: m.pregnancy_week,
      due_date: d.toISOString().slice(0, 10),
    });
  }

  // --- Guidance for week 24, French ---
  const guidance = [
    {
      id: DEMO_GUIDANCE_IDS[0],
      category: "nutrition",
      title: "Aliments riches en fer pour le deuxième trimestre",
      body: "Au deuxième trimestre, vos besoins en fer doublent. Privilégiez les lentilles, les épinards cuits, la viande rouge maigre et associez à de la vitamine C pour mieux absorber.",
      reviewed_by: DEMO_PROVIDERS[0].user_id,
    },
    {
      id: DEMO_GUIDANCE_IDS[1],
      category: "exercise",
      title: "Mouvements sûrs au deuxième trimestre",
      body: "Marche quotidienne de 20 minutes, natation, et yoga prénatal doux. Évitez les exercices sur le dos après la semaine 20.",
      reviewed_by: DEMO_PROVIDERS[0].user_id,
    },
    {
      id: DEMO_GUIDANCE_IDS[2],
      category: "preparation",
      title: "Que mettre dans votre valise de maternité",
      body: "Documents d'identité, carnet de grossesse, chemises de nuit confortables, articles de toilette, vêtements pour bébé taille naissance, et une tenue de sortie pour vous.",
      reviewed_by: DEMO_PROVIDERS[0].user_id,
    },
  ];
  for (const g of guidance) {
    await supabaseAdmin.from("guidance_content").upsert({
      ...g,
      language: "fr",
      country: "ALL",
      week_min: 13,
      week_max: 27,
      is_published: true,
    });
  }

  // --- Mother appointments ---
  const nextFriday = new Date();
  const day = nextFriday.getDay();
  const delta = (5 - day + 7) % 7 || 7;
  nextFriday.setDate(nextFriday.getDate() + delta);
  nextFriday.setHours(10, 30, 0, 0);

  const past = new Date();
  past.setDate(past.getDate() - 21);
  past.setHours(14, 0, 0, 0);

  await supabaseAdmin.from("appointments").upsert({
    id: DEMO_APPT_IDS.motherUpcoming,
    mother_id: DEMO_MOTHER.mother_id,
    provider_id: DEMO_PROVIDERS[0].id,
    scheduled_at: nextFriday.toISOString(),
    status: "confirmed",
    type: "scan",
    notes: "Échographie du deuxième trimestre.",
  });
  await supabaseAdmin.from("appointments").upsert({
    id: DEMO_APPT_IDS.motherPast,
    mother_id: DEMO_MOTHER.mother_id,
    provider_id: DEMO_PROVIDERS[1].id,
    scheduled_at: past.toISOString(),
    status: "completed",
    type: "consultation",
    notes: "Visite de suivi.",
  });

  // --- Eden 5 appointments this week with Dr. Karim ---
  const monday = new Date();
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  monday.setHours(9, 0, 0, 0);
  const slots: Array<{ dayOffset: number; hour: number; minute: number; mother: number; type: string; status: string }> = [
    { dayOffset: 0, hour: 9, minute: 0, mother: 0, type: "consultation", status: "completed" },
    { dayOffset: 1, hour: 11, minute: 30, mother: 1, type: "scan", status: "confirmed" },
    { dayOffset: 2, hour: 14, minute: 0, mother: 2, type: "consultation", status: "confirmed" },
    { dayOffset: 3, hour: 10, minute: 0, mother: 0, type: "follow-up", status: "pending" },
    { dayOffset: 4, hour: 16, minute: 0, mother: 1, type: "consultation", status: "confirmed" },
  ];
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    const at = new Date(monday);
    at.setDate(at.getDate() + s.dayOffset);
    at.setHours(s.hour, s.minute, 0, 0);
    await supabaseAdmin.from("appointments").upsert({
      id: DEMO_APPT_IDS.eden[i],
      mother_id: DEMO_EDEN_PATIENTS[s.mother].id,
      provider_id: DEMO_PROVIDERS[1].id,
      scheduled_at: at.toISOString(),
      status: s.status,
      type: s.type,
      notes: null,
    });
  }
}

export const enterDemoServer = createServerFn({ method: "POST" })
  .inputValidator((data) => Input.parse(data))
  .handler(async ({ data }) => {
    await seedDemo();
    if (data.role === "mother") {
      return { email: DEMO_MOTHER.email, password: DEMO_MOTHER.password };
    }
    const k = DEMO_PROVIDERS[1];
    return { email: k.email!, password: k.password! };
  });
