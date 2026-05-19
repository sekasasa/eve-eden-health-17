// Baby size comparisons by week (fr/en mixed cultural references)
export const BABY_SIZE: Record<number, string> = {
  1: "a poppy seed",
  2: "a poppy seed",
  3: "a poppy seed",
  4: "a grain of couscous",
  5: "a sesame seed",
  6: "a lentil",
  7: "a blueberry",
  8: "a kidney bean",
  9: "a green olive",
  10: "a date",
  11: "a fig",
  12: "a lime",
  13: "a lemon",
  14: "a peach",
  15: "an apple",
  16: "an avocado",
  17: "a pomegranate",
  18: "a sweet potato",
  19: "a mango",
  20: "a small banana",
  21: "a carrot",
  22: "a papaya",
  23: "a large mango",
  24: "an ear of corn",
  25: "a cauliflower",
  26: "a head of lettuce",
  27: "a small melon",
  28: "an eggplant",
  29: "a butternut squash",
  30: "a large cabbage",
  31: "a coconut",
  32: "a jicama",
  33: "a pineapple",
  34: "a cantaloupe",
  35: "a honeydew melon",
  36: "a romaine lettuce",
  37: "a bunch of swiss chard",
  38: "a leek",
  39: "a small watermelon",
  40: "a small pumpkin",
};

export function babySizeFor(week: number): string {
  const w = Math.max(1, Math.min(40, Math.round(week)));
  return BABY_SIZE[w] ?? "a tiny seed";
}

export function trimesterFor(week: number): string {
  if (week <= 13) return "First trimester";
  if (week <= 27) return "Second trimester";
  return "Third trimester";
}

const GREETINGS: Record<string, string> = {
  fr: "Bonjour",
  ar: "مرحبا",
  en: "Hello",
  ber: "Azul",
};

export function greetingFor(language?: string | null): string {
  if (!language) return "Marhaban";
  return GREETINGS[language] ?? "Marhaban";
}

export function askSuggestionFor(week: number): string {
  const suggestions = [
    "What is safe to eat this week?",
    "When should I call my doctor?",
    `What happens at week ${week}?`,
    "Is this symptom normal?",
  ];
  return suggestions[week % suggestions.length];
}
