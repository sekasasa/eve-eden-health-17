import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { EveShell } from "@/components/shells/EveShell";
import { NavigatorHelp } from "@/components/ui/NavigatorHelp";

export const Route = createFileRoute("/eve/coming-soon")({
  validateSearch: (search: Record<string, unknown>) => ({
    feature: typeof search.feature === "string" ? search.feature : undefined,
  }),
  component: ComingSoonPage,
  head: () => ({
    meta: [{ title: "Coming soon — Eve" }],
  }),
});

function ComingSoonPage() {
  const { feature } = useSearch({ from: "/eve/coming-soon" });
  return (
    <EveShell>
      <div className="space-y-6 px-5 py-10">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-eve-cream">
            <Sparkles className="h-6 w-6 text-eve-teal" />
          </span>
          <h1 className="font-serif text-2xl text-eve-forest">
            {feature ? `${feature} — coming soon` : "We're preparing this feature"}
          </h1>
          <p className="font-sans text-sm leading-relaxed text-eve-muted">
            This part of Eve & Eden isn't ready yet. In the meantime, a care
            navigator can help you with the same need.
          </p>
        </div>
        <NavigatorHelp />
        <Link
          to="/eve/home"
          className="block rounded-full bg-eve-forest px-5 py-3 text-center font-sans text-sm text-white"
        >
          Back to home
        </Link>
      </div>
    </EveShell>
  );
}
