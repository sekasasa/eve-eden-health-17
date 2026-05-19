import { createFileRoute } from "@tanstack/react-router";
import {
  Apple,
  Stethoscope,
  Baby,
  Heart,
  Users,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { EveShell } from "@/components/shells/EveShell";
import { SectionLabel } from "@/components/ui/SectionLabel";

export const Route = createFileRoute("/eve/community")({
  component: EveCommunity,
});

const TOPICS = [
  {
    icon: Apple,
    title: "Nutrition",
    desc: "What to eat, what to avoid, recipes from other mothers.",
    count: 142,
  },
  {
    icon: Stethoscope,
    title: "Finding the right doctor",
    desc: "Recommendations and questions to ask at your first visit.",
    count: 86,
  },
  {
    icon: Baby,
    title: "Birth preparation",
    desc: "Hospital bags, birth plans, breathing techniques.",
    count: 213,
  },
  {
    icon: Heart,
    title: "Postpartum",
    desc: "Recovery, mood, body, partner support after birth.",
    count: 98,
  },
  {
    icon: Users,
    title: "Partners",
    desc: "Bringing your partner into the journey.",
    count: 41,
  },
];

function EveCommunity() {
  return (
    <EveShell>
      <div className="pt-2">
        <SectionLabel>Community</SectionLabel>
        <h1 className="mt-2 font-serif text-3xl text-eve-teal-dark">
          Mothers like you
        </h1>
        <p className="mt-2 font-sans text-sm text-eve-muted">
          Connect anonymously with women in your city and trimester.
        </p>
      </div>

      <div className="mt-6 space-y-3">
        {TOPICS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.title}
              className="flex w-full items-center gap-3 rounded-2xl bg-eve-cream p-4 text-left transition active:scale-[0.99]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-eve-teal">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-sans text-[14px] font-medium text-eve-teal-dark">
                  {t.title}
                </p>
                <p className="truncate font-sans text-xs text-eve-muted">{t.desc}</p>
                <p className="mt-1 font-sans text-[11px] text-eve-muted">
                  {t.count} mothers discussing
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-eve-muted" />
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl bg-eve-rose p-4 text-white">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-1 h-5 w-5 shrink-0" />
          <div>
            <p className="font-serif text-lg leading-snug">
              Are you a trusted voice in your community?
            </p>
            <p className="mt-1 font-sans text-sm opacity-90">
              Become an Eve Ambassador and help mothers near you.
            </p>
            <button className="mt-3 rounded-full bg-white/95 px-4 py-2 font-sans text-xs font-medium text-eve-rose">
              I'm interested
            </button>
          </div>
        </div>
      </div>
    </EveShell>
  );
}
