// First-class launch event. Every unknown detail is explicitly labeled TBA —
// venue, exact time, capacity, speaker identities, and the registration
// deadline are NOT invented.

export const LAUNCH_EVENT = {
  slug: "launch-casablanca-2026",
  title: "Eve & Eden Maternal Health Launch — Casablanca",
  tagline:
    "An afternoon for women preparing for pregnancy, birth, and family care — with time to ask real questions.",
  /** Confirmed: Saturday, 5 September 2026, afternoon. Exact start time TBA. */
  dateISO: "2026-09-05",
  dateLabel: "Saturday, 5 September 2026",
  timeLabel: "Afternoon — exact start time to be announced",
  city: "Casablanca",
  country: "Morocco",
  venueLabel: "Venue to be announced (Casablanca)",
  capacityLabel: "Capacity to be announced",
  registrationDeadlineLabel: "Registration deadline to be announced",
  priceLabel: "Free",
  languages: ["French", "Arabic", "English"],
  host: "Eve & Eden Health",
  audience: [
    "Expecting mothers in Casablanca and Rabat",
    "Soon-to-be mothers preparing for birth and postpartum",
    "Women trying to conceive",
  ],
  /** Speaker CATEGORIES only — no names are claimed until confirmed. */
  speakerCategories: [
    { label: "OB-GYNs", note: "Speakers to be announced" },
    { label: "Nutritionists", note: "Speakers to be announced" },
    { label: "Midwives", note: "Speakers to be announced" },
  ],
  agenda: [
    { time: "TBA", title: "Welcome and what Eve & Eden is building" },
    { time: "TBA", title: "Panel: questions to ask across pregnancy and birth" },
    { time: "TBA", title: "Nutrition and postpartum recovery conversation" },
    { time: "TBA", title: "Open Q&A and community time" },
  ],
  learnings: [
    "How to prepare questions for appointments across fertility, pregnancy, and postpartum",
    "What to expect from maternity care options in Casablanca and Rabat",
    "How nutrition and recovery support fit into your care plan",
  ],
  safetyNote:
    "This event is educational. It is not medical care and does not replace advice from your clinician. For urgent symptoms, contact local emergency services.",
} as const;

export type LaunchEvent = typeof LAUNCH_EVENT;

/** Relevance for Morocco / Casablanca / Rabat audiences. */
export function isLaunchEventRelevant(input: {
  country?: string | null;
  city?: string | null;
}): boolean {
  const c = (input.country ?? "").trim().toLowerCase();
  const city = (input.city ?? "").trim().toLowerCase();
  if (!c && !city) return true;
  const countryOk = !c || ["ma", "mar", "morocco", "maroc"].includes(c);
  const cityOk = !city || ["casablanca", "rabat", "sale", "salé", "mohammedia"].includes(city);
  return countryOk && cityOk;
}
