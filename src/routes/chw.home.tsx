import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { UserPlus, ClipboardList, Flag, Users } from "lucide-react";
import { CHWShell } from "@/components/shells/CHWShell";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/chw/home")({
  component: ChwHome,
});

function ChwHome() {
  const [name, setName] = useState("");
  const [metrics, setMetrics] = useState({ registered: 0, visitsWeek: 0, highRisk: 0 });

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", auth.user.id)
        .maybeSingle();
      setName(profile?.full_name?.split(" ")[0] ?? "");

      const { data: mothers } = await supabase
        .from("chw_mothers")
        .select("id,risk_level")
        .eq("chw_id", auth.user.id);
      const registered = mothers?.length ?? 0;
      const highRisk = mothers?.filter((m) => m.risk_level === "high").length ?? 0;

      const weekStart = new Date();
      weekStart.setHours(0, 0, 0, 0);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const { count: visitsWeek } = await supabase
        .from("visits")
        .select("id", { count: "exact", head: true })
        .eq("chw_id", auth.user.id)
        .gte("visit_date", weekStart.toISOString().slice(0, 10));

      setMetrics({ registered, visitsWeek: visitsWeek ?? 0, highRisk });
    })();
  }, []);

  const greet = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  })();

  return (
    <CHWShell>
      <h1 className="font-serif text-eve-forest" style={{ fontSize: 20 }}>
        {greet}, {name || "there"}
      </h1>
      <p className="mt-1 font-sans text-xs text-eve-muted">
        Here's your field summary today.
      </p>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <Metric label="Mothers" value={metrics.registered} />
        <Metric label="Visits this week" value={metrics.visitsWeek} />
        <Metric label="High-risk" value={metrics.highRisk} accent="red" />
      </div>

      <div className="mt-6">
        <Link to="/chw/register">
          <PrimaryButton className="w-full">Register a new mother</PrimaryButton>
        </Link>
      </div>

      <div className="mt-3 space-y-2">
        <SecondaryAction to="/chw/mothers" icon={ClipboardList} label="Record a visit" />
        <SecondaryAction to="/chw/flag" icon={Flag} label="Flag a risk" />
        <SecondaryAction to="/chw/mothers" icon={Users} label="View all mothers" />
      </div>
    </CHWShell>
  );
}

function Metric({ label, value, accent }: { label: string; value: number; accent?: "red" }) {
  return (
    <div
      className={
        "rounded-xl border p-3 " +
        (accent === "red" ? "border-red-200 bg-red-50" : "border-gray-100 bg-white")
      }
    >
      <p
        className={
          "font-serif " +
          (accent === "red" ? "text-red-700" : "text-eve-teal-dark")
        }
        style={{ fontSize: 22 }}
      >
        {value}
      </p>
      <p className="mt-0.5 font-sans text-[10px] uppercase tracking-wide text-eve-muted">
        {label}
      </p>
    </div>
  );
}

function SecondaryAction({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: typeof UserPlus;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-eve-teal-light">
        <Icon className="h-4 w-4 text-eve-teal-dark" />
      </span>
      <span className="font-sans text-sm text-gray-900">{label}</span>
    </Link>
  );
}
