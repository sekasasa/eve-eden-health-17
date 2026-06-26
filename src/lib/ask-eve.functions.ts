import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const askInput = z.object({
  message: z.string().min(1).max(2000),
  pregnancy_week: z.number().int().min(1).max(45).nullable().optional(),
  language: z.string().max(8).nullable().optional(),
  dietary_pref: z.string().max(200).nullable().optional(),
  country: z.string().max(8).nullable().optional(),
  prefs: z
    .object({
      stage: z.string().max(40).nullable().optional(),
      region: z.string().max(40).nullable().optional(),
      city: z.string().max(80).nullable().optional(),
      dialect: z.string().max(40).nullable().optional(),
      cultural: z.array(z.string().max(80)).max(20).optional(),
      dietary: z.array(z.string().max(80)).max(20).optional(),
      birth: z.array(z.string().max(80)).max(20).optional(),
    })
    .optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(4000),
      }),
    )
    .max(20)
    .optional(),
});

export const askEve = createServerFn({ method: "POST" })
  .inputValidator((input) => askInput.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return {
        reply: null,
        error: "AI is not configured. Please add LOVABLE_API_KEY.",
      };
    }

    const lang = data.language ?? "en";
    const langName =
      lang === "fr"
        ? "French"
        : lang === "ar"
          ? "Arabic"
          : "English";

    const prefs = data.prefs ?? {};
    const culturalList = (prefs.cultural ?? []).join(", ");
    const dietaryList = (prefs.dietary ?? []).join(", ");
    const birthList = (prefs.birth ?? []).join(", ");

    const system = [
      "You are Eve, a warm maternal-care guide for mothers across the world.",
      `Always reply in ${langName}.`,
      "Be concise (under 140 words), kind, and respectful. Use plain language.",
      "Help mothers prepare questions for their care team, understand options, and find supportive care.",
      "Never assume a mother's religion, culture, diet, fasting practice, modesty needs, or birth preferences based on her country, language, dialect, name, race, ethnicity, or stated religion. Only act on preferences the mother has explicitly shared in this conversation or her saved profile.",
      "Never issue religious rulings (e.g. whether someone should or should not fast). If asked, point to a trusted faith leader and to a clinician for medical guidance.",
      "When discussing birth preferences, always include the phrase 'when medically appropriate' and present options neutrally. Do not say natural birth is better than C-section, or vice versa.",
      "Never diagnose. Never prescribe medication or dosages. Always recommend consulting a qualified provider for medical decisions.",
      "If the question hints at an emergency (heavy bleeding, severe pain, no fetal movement, fainting, contractions before 37 weeks), urgently advise contacting a doctor or going to the nearest clinic.",
      "Frame answers as: prepare questions, understand options, find supportive care. Remind the user their preferences are optional and can be updated anytime.",
      data.pregnancy_week ? `User is at week ${data.pregnancy_week} of pregnancy.` : "",
      prefs.stage ? `User-stated life stage: ${prefs.stage}.` : "",
      prefs.region ? `User-stated region: ${prefs.region}. Use only to scope examples to the region; never to infer beliefs.` : "",
      data.country ? `User-stated country: ${data.country}. Do not infer religion, culture, or diet from this.` : "",
      prefs.city ? `User-stated city: ${prefs.city}.` : "",
      prefs.dialect ? `User-stated language/dialect: ${prefs.dialect}. Mirror common terms where natural; never assume culture or religion from this.` : "",
      culturalList ? `User-stated cultural/privacy preferences: ${culturalList}. Honor them. If "female provider preferred" is set and you suggest a provider, suggest finding a female clinician. If "Ramadan support" is set, help prepare questions about fasting during pregnancy without issuing religious rulings. If "family involved" is set, you may suggest sharing a care summary; if "keep care private from family" is set, do not promote family-sharing features.` : "",
      dietaryList ? `User-stated dietary preferences: ${dietaryList}. Tailor nutrition guidance accordingly. Treat as preferences, not beliefs.` : "",
      birthList ? `User-stated birth preferences: ${birthList}. Discuss them neutrally and always include "when medically appropriate". Never claim one type of birth is better than another.` : "",
      data.dietary_pref ? `Additional dietary notes: ${data.dietary_pref}.` : "",
    ]
      .filter(Boolean)
      .join(" ");

    const messages = [
      { role: "system", content: system },
      ...(data.history ?? []).map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: data.message },
    ];

    try {
      const res = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages,
          }),
        },
      );
      if (res.status === 429) {
        return { reply: null, error: "Eve is busy. Please try again in a moment." };
      }
      if (res.status === 402) {
        return { reply: null, error: "AI credits exhausted. Please add credits." };
      }
      if (!res.ok) {
        return { reply: null, error: `AI error (${res.status}).` };
      }
      const json = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const reply = json.choices?.[0]?.message?.content?.trim() ?? "";
      return { reply, error: null as string | null };
    } catch (e) {
      console.error("askEve failed:", e);
      return { reply: null, error: "Eve is unreachable right now." };
    }
  });
