import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const askInput = z.object({
  message: z.string().min(1).max(2000),
  pregnancy_week: z.number().int().min(1).max(45).nullable().optional(),
  language: z.string().max(8).nullable().optional(),
  dietary_pref: z.string().max(200).nullable().optional(),
  country: z.string().max(8).nullable().optional(),
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

    const lang = data.language ?? "fr";
    const langName =
      lang === "en"
        ? "English"
        : lang === "ar"
          ? "Arabic"
          : lang === "ber"
            ? "Tamazight (use French if uncertain)"
            : "French";

    const system = [
      "You are Eve, a warm, knowledgeable pregnancy companion for mothers in Africa (primarily Morocco).",
      `Always reply in ${langName}.`,
      "Be concise (under 140 words), kind, and culturally aware. Use plain language.",
      "Cover nutrition, symptoms, mental health, appointment prep, and connecting to vetted providers.",
      "If the question hints at an emergency (heavy bleeding, severe pain, no fetal movement, fainting, contractions before 37 weeks), urgently advise contacting a doctor or going to the nearest clinic.",
      "Never diagnose. Never prescribe medication or dosages. Always recommend consulting a qualified provider for medical decisions.",
      data.pregnancy_week ? `User is at week ${data.pregnancy_week} of pregnancy.` : "",
      data.dietary_pref ? `Dietary notes: ${data.dietary_pref}.` : "",
      data.country ? `Country: ${data.country}.` : "",
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
