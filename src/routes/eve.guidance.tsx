import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronRight, Sparkles, Share2 } from "lucide-react";
import { EveShell } from "@/components/shells/EveShell";
import { GuidanceCard } from "@/components/ui/GuidanceCard";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { TrustBadge } from "@/components/ui/TrustBadge";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/eve/guidance")({
  component: EveGuidance,
});

type Guidance = {
  id: string;
  title: string;
  body: string | null;
  category: string | null;
  week_min: number | null;
  week_max: number | null;
  reviewed_by: string | null;
};

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "nutrition", label: "Nutrition" },
  { key: "symptoms", label: "Symptoms" },
  { key: "exercise", label: "Exercise" },
  { key: "preparation", label: "Preparation" },
  { key: "mental_health", label: "Mental health" },
] as const;

const CATEGORY_COLOR: Record<string, string> = {
  nutrition: "bg-eve-terra/15 text-eve-terra",
  symptoms: "bg-eve-rose/15 text-eve-rose",
  exercise: "bg-eve-teal/15 text-eve-teal",
  preparation: "bg-eve-forest/15 text-eve-forest",
  mental_health: "bg-eve-rose/15 text-eve-rose",
};

function EveGuidance() {
  const [week, setWeek] = useState(1);
  const [language, setLanguage] = useState("fr");
  const [category, setCategory] = useState<string>("all");
  const [items, setItems] = useState<Guidance[]>([]);
  const [reviewers, setReviewers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [openEarlier, setOpenEarlier] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return;
      const { data: m } = await supabase
        .from("mothers")
        .select("pregnancy_week, language")
        .eq("user_id", uid)
        .maybeSingle();
      if (cancelled) return;
      const w = m?.pregnancy_week ?? 1;
      const lang = m?.language ?? "fr";
      setWeek(w);
      setLanguage(lang);

      let q = supabase
        .from("guidance_content")
        .select("id, title, body, category, week_min, week_max, reviewed_by")
        .eq("is_published", true)
        .eq("language", lang);
      const { data } = await q;
      if (cancelled) return;
      const list = (data ?? []) as Guidance[];
      setItems(list);

      const reviewerIds = Array.from(
        new Set(list.map((i) => i.reviewed_by).filter(Boolean) as string[]),
      );
      if (reviewerIds.length) {
        const { data: provs } = await supabase
          .from("providers")
          .select("id, full_name")
          .in("id", reviewerIds);
        if (!cancelled && provs) {
          const map: Record<string, string> = {};
          for (const p of provs as { id: string; full_name: string | null }[]) {
            if (p.full_name) map[p.id] = p.full_name;
          }
          setReviewers(map);
        }
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const matchesCategory = (g: Guidance) =>
    category === "all" || g.category === category;

  const currentWeekItems = useMemo(
    () =>
      items.filter(
        (g) =>
          (g.week_min ?? 0) <= week &&
          (g.week_max ?? 40) >= week &&
          matchesCategory(g),
      ),
    [items, week, category],
  );

  const earlierByWeek = useMemo(() => {
    const buckets = new Map<number, Guidance[]>();
    for (const g of items) {
      if (!matchesCategory(g)) continue;
      const wMax = g.week_max ?? 40;
      if (wMax >= week) continue;
      const bucket = wMax;
      if (!buckets.has(bucket)) buckets.set(bucket, []);
      buckets.get(bucket)!.push(g);
    }
    return Array.from(buckets.entries()).sort((a, b) => b[0] - a[0]);
  }, [items, week, category]);

  return (
    <EveShell>
      <div className="px-3">
        <SectionLabel>Guidance library</SectionLabel>
        <h1
          className="mt-1 font-serif text-eve-forest"
          style={{ fontSize: "26px" }}
        >
          Week {week} Guide
        </h1>
      </div>

      {/* Category filter */}
      <div className="mt-4 -mx-1 overflow-x-auto px-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-2">
          {CATEGORIES.map((c) => {
            const active = category === c.key;
            return (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 font-sans transition-colors",
                  active
                    ? "border-eve-teal bg-eve-teal text-white"
                    : "border-eve-muted/30 bg-white text-eve-muted",
                )}
                style={{ fontSize: "12px" }}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="mt-4 space-y-2 px-3">
        {loading ? (
          <>
            <div className="h-24 w-full animate-pulse rounded-r-xl bg-eve-muted/20" />
            <div className="h-24 w-full animate-pulse rounded-r-xl bg-eve-muted/20" />
          </>
        ) : currentWeekItems.length === 0 ? (
          <EmptyState />
        ) : (
          currentWeekItems.map((g) => (
            <GuidanceItem
              key={g.id}
              item={g}
              reviewer={g.reviewed_by ? reviewers[g.reviewed_by] : null}
              expanded={expanded === g.id}
              onToggle={() =>
                setExpanded((cur) => (cur === g.id ? null : g.id))
              }
            />
          ))
        )}
      </div>

      {/* Earlier weeks */}
      {earlierByWeek.length > 0 && (
        <div className="mt-6 px-3">
          <button
            onClick={() => setOpenEarlier((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl border border-eve-muted/20 bg-white px-4 py-3"
          >
            <span className="font-sans text-sm font-medium text-eve-teal-dark">
              Earlier weeks
            </span>
            <ChevronRight
              className={cn(
                "h-4 w-4 text-eve-muted transition-transform",
                openEarlier && "rotate-90",
              )}
            />
          </button>
          {openEarlier && (
            <div className="mt-2 space-y-3">
              {earlierByWeek.map(([wk, list]) => (
                <div key={wk}>
                  <SectionLabel className="px-1">Week {wk}</SectionLabel>
                  <div className="mt-1 space-y-2">
                    {list.map((g) => (
                      <GuidanceItem
                        key={g.id}
                        item={g}
                        reviewer={
                          g.reviewed_by ? reviewers[g.reviewed_by] : null
                        }
                        expanded={expanded === g.id}
                        onToggle={() =>
                          setExpanded((cur) => (cur === g.id ? null : g.id))
                        }
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </EveShell>
  );
}

function GuidanceItem({
  item,
  reviewer,
  expanded,
  onToggle,
}: {
  item: Guidance;
  reviewer: string | null;
  expanded: boolean;
  onToggle: () => void;
}) {
  const cat = item.category ?? "";
  const catColor = CATEGORY_COLOR[cat] ?? "bg-eve-muted/15 text-eve-muted";
  const catLabel = cat ? cat.replace("_", " ") : "guidance";

  const shareWa = () => {
    const text = `${item.title}\n\n${item.body ?? ""}\n\nvia Eve & Eden`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <GuidanceCard>
      <button
        type="button"
        onClick={onToggle}
        className="block w-full text-left"
      >
        <div className="flex items-start justify-between gap-2">
          <span
            className={cn(
              "inline-flex rounded-full px-2 py-0.5 font-sans capitalize",
              catColor,
            )}
            style={{ fontSize: "10px" }}
          >
            {catLabel}
          </span>
          <ChevronRight
            className={cn(
              "h-4 w-4 shrink-0 text-eve-muted transition-transform",
              expanded && "rotate-90",
            )}
          />
        </div>
        <p
          className="mt-1.5 font-sans font-medium text-eve-teal-dark"
          style={{ fontSize: "14px" }}
        >
          {item.title}
        </p>
        {item.body && (
          <p
            className={cn(
              "mt-1 font-sans text-eve-muted",
              !expanded && "line-clamp-2",
            )}
            style={{ fontSize: "12px" }}
          >
            {item.body}
          </p>
        )}
        {reviewer && (
          <div className="mt-2 flex items-center justify-between">
            <TrustBadge />
            <span
              className="font-sans text-eve-muted"
              style={{ fontSize: "10px" }}
            >
              Reviewed by Dr. {reviewer}
            </span>
          </div>
        )}
      </button>
      {expanded && (
        <button
          onClick={shareWa}
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 font-sans text-xs font-medium text-white active:scale-95"
        >
          <Share2 className="h-3.5 w-3.5" />
          Share to WhatsApp
        </button>
      )}
    </GuidanceCard>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-eve-muted/30 bg-white py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-eve-teal-light">
        <Sparkles className="h-5 w-5 text-eve-teal" />
      </div>
      <p className="mt-3 font-sans text-sm text-eve-teal-dark">
        More guidance coming soon.
      </p>
      <p
        className="mt-1 font-sans text-eve-muted"
        style={{ fontSize: "11px" }}
      >
        Try another category in the meantime.
      </p>
    </div>
  );
}
