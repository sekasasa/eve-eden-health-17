import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { EdenShell } from "@/components/shells/EdenShell";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { CoordinationPanels } from "@/components/CoordinationPanels";
import { ANALYTICS_EVENTS, track } from "@/lib/analytics";
import {
  ProviderGrowthOverview,
  type GrowthMetric,
} from "@/components/provider-dashboard/ProviderGrowthOverview";
import {
  ProviderPriorityActions,
  type PriorityAction,
  type PriorityActionKey,
} from "@/components/provider-dashboard/ProviderPriorityActions";
import {
  ProviderOpportunityList,
  type OpportunityItem,
} from "@/components/provider-dashboard/ProviderOpportunityList";
import { ProviderPracticeLinks } from "@/components/provider-dashboard/ProviderPracticeLinks";

export const Route = createFileRoute("/eden/dashboard")({
  component: EdenDashboard,
});

type Appt = {
  id: string;
  scheduled_at: string;
  status: string | null;
  type: string | null;
  mother_id: string;
  notes: string | null;
  mother: { id: string; full_name: string | null; pregnancy_week: number | null } | null;
};

type AccountState = {
  isVerified: boolean;
  hasServices: boolean;
  profileComplete: boolean;
};

function initials(n?: string | null) {
  if (!n) return "·";
  return n
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

type ProfileStrength = {
  hasLanguages: boolean;
  hasBio: boolean;
  hasFee: boolean;
  hasClinic: boolean;
  hasSpecialty: boolean;
  hasPhone: boolean;
  accepting: boolean;
};

function EdenDashboard() {
  const [name, setName] = useState<string>("");
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState<GrowthMetric[]>([
    { key: "pendingRequests", value: 0 },
    { key: "upcomingConfirmed", value: 0 },
    { key: "peopleSeen30d", value: 0 },
  ]);
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([]);
  const [account, setAccount] = useState<AccountState | null>(null);
  const [today, setToday] = useState<Appt[]>([]);
  const [recent, setRecent] = useState<
    { id: string; full_name: string | null; pregnancy_week: number | null; last_visit: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [strength, setStrength] = useState<ProfileStrength | null>(null);

  useEffect(() => {
    track(ANALYTICS_EVENTS.providerDashboardOpened);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data: p } = await supabase
        .from("providers")
        .select(
          "id,full_name,specialty,clinic_name,bio,languages,consultation_fee_mad,phone,accepting_patients,is_verified,services",
        )
        .eq("user_id", auth.user.id)
        .maybeSingle();
      if (!p) {
        setLoading(false);
        return;
      }
      setName(p.full_name ?? "");
      setAccount({
        isVerified: p.is_verified === true,
        hasServices: !!(p.services && p.services.trim()),
        profileComplete: !!(
          p.specialty &&
          p.clinic_name &&
          p.bio &&
          p.bio.trim().length > 30 &&
          p.languages &&
          p.languages.length
        ),
      });
      setStrength({
        hasLanguages: !!(p.languages && p.languages.length),
        hasBio: !!(p.bio && p.bio.trim().length > 30),
        hasFee: p.consultation_fee_mad != null,
        hasClinic: !!(p.clinic_name && p.clinic_name.trim()),
        hasSpecialty: !!(p.specialty && p.specialty.trim()),
        hasPhone: !!(p.phone && p.phone.trim()),
        accepting: !!p.accepting_patients,
      });

      const now = new Date();
      const startToday = new Date(now);
      startToday.setHours(0, 0, 0, 0);
      const endToday = new Date(startToday);
      endToday.setDate(endToday.getDate() + 1);
      const weekStart = new Date(startToday);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const last30 = new Date(now.getTime() - 30 * 86400000);

      const { data: all } = await supabase
        .from("appointments")
        .select(
          "id,scheduled_at,status,type,mother_id,notes,mother:mothers(id,full_name,pregnancy_week)",
        )
        .eq("provider_id", p.id)
        .order("scheduled_at", { ascending: true });

      const list = (all as unknown as Appt[]) ?? [];

      const peopleSeen30d = new Set(
        list.filter((a) => new Date(a.scheduled_at) >= last30).map((a) => a.mother_id),
      ).size;

      const pendingList = list.filter(
        (a) => a.status === "pending" && new Date(a.scheduled_at) >= now,
      );
      const upcomingConfirmed = list.filter(
        (a) => a.status === "confirmed" && new Date(a.scheduled_at) >= now,
      ).length;

      setMetrics([
        { key: "pendingRequests", value: pendingList.length },
        { key: "upcomingConfirmed", value: upcomingConfirmed },
        { key: "peopleSeen30d", value: peopleSeen30d },
      ]);

      setOpportunities(
        pendingList.slice(0, 5).map((a) => ({
          id: a.id,
          scheduledAt: a.scheduled_at,
          status: a.status,
          type: a.type,
        })),
      );

      setToday(
        list.filter((a) => {
          const d = new Date(a.scheduled_at);
          return d >= startToday && d < endToday;
        }),
      );

      // recent patients: distinct mothers from past appointments, latest first
      const seen = new Set<string>();
      const recents: typeof recent = [];
      for (const a of [...list].reverse()) {
        if (new Date(a.scheduled_at) > now) continue;
        if (!a.mother || seen.has(a.mother.id)) continue;
        seen.add(a.mother.id);
        recents.push({
          id: a.mother.id,
          full_name: a.mother.full_name,
          pregnancy_week: a.mother.pregnancy_week,
          last_visit: a.scheduled_at,
        });
        if (recents.length >= 5) break;
      }
      setRecent(recents);
      setLoading(false);
    })();
  }, []);

  const greet = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  })();
  const todayStr = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  async function markComplete(id: string) {
    await supabase.from("appointments").update({ status: "completed" }).eq("id", id);
    setToday((xs) => xs.map((a) => (a.id === id ? { ...a, status: "completed" } : a)));
  }

  const priorityActions: PriorityAction[] = account
    ? [
        { key: "getVerified" as const, to: "/eden/profile", done: account.isVerified },
        { key: "completeProfile" as const, to: "/eden/onboarding", done: account.profileComplete },
        { key: "addServices" as const, to: "/eden/profile", done: account.hasServices },
        {
          key: "respondRequests" as const,
          to: "/eden/appointments",
          done: opportunities.length === 0,
        },
        { key: "publishContent" as const, to: "/eden/vendor/content", done: false },
      ].filter((a) => !a.done || a.key === "getVerified")
    : [];

  return (
    <EdenShell>
      <div className="rtl:text-right">
        <h1 className="font-sans text-2xl font-medium text-gray-900">
          {greet}, {name ? `Dr. ${name.split(" ").slice(-1)[0]}` : "Doctor"}
        </h1>
        <p className="mt-1 font-sans text-[14px] text-gray-500">
          {t("providerDashboard.headerSubtitle")} — {todayStr}
        </p>
      </div>

      <ProviderGrowthOverview metrics={metrics} loading={loading} />

      <ProviderPriorityActions
        actions={priorityActions}
        onSelect={(action: PriorityActionKey) =>
          track(ANALYTICS_EVENTS.providerDashboardActionSelected, { action })
        }
      />

      <ProviderOpportunityList items={opportunities} loading={loading} />

      <ProviderPracticeLinks
        onSelect={(action) => track(ANALYTICS_EVENTS.providerDashboardActionSelected, { action })}
      />

      {/* Profile strength */}
      {strength && <ProfileStrengthCard strength={strength} />}

      <CoordinationPanels />

      {/* Today's schedule */}
      <section className="mt-8 rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-sans text-base font-medium text-gray-900">Today's schedule</h2>
          <Link to="/eden/appointments" className="font-sans text-xs text-eve-teal hover:underline">
            View all
          </Link>
        </div>
        {loading ? (
          <div className="p-5">
            <div className="h-24 animate-pulse rounded-lg bg-gray-100" />
          </div>
        ) : today.length === 0 ? (
          <p className="px-5 py-8 text-center font-sans text-sm text-gray-500">
            No appointments today.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full font-sans text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3 font-medium">Time</th>
                  <th className="px-5 py-3 font-medium">Patient</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {today.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">
                      {fmtTime(a.scheduled_at)}
                    </td>
                    <td className="px-5 py-3 text-gray-700">{a.mother?.full_name ?? "—"}</td>
                    <td className="px-5 py-3 text-gray-600">{a.type ?? "Visit"}</td>
                    <td className="px-5 py-3">
                      <StatusPill status={a.status} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        to="/eden/patients/$id"
                        params={{ id: a.mother?.id ?? "" }}
                        className="mr-3 text-xs text-eve-teal hover:underline"
                      >
                        View patient
                      </Link>
                      {a.status !== "completed" && (
                        <button
                          onClick={() => markComplete(a.id)}
                          className="text-xs text-gray-600 hover:text-eve-teal-dark hover:underline"
                        >
                          Mark complete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Recent patients */}
      <section className="mt-6 rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-sans text-base font-medium text-gray-900">Recent patients</h2>
          <Link to="/eden/patients" className="font-sans text-xs text-eve-teal hover:underline">
            View all
          </Link>
        </div>
        {loading ? (
          <div className="p-5">
            <div className="h-32 animate-pulse rounded-lg bg-gray-100" />
          </div>
        ) : recent.length === 0 ? (
          <p className="px-5 py-8 text-center font-sans text-sm text-gray-500">
            No recent patients.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recent.map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-eve-teal/10 font-sans text-sm font-medium text-eve-teal-dark">
                  {initials(r.full_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-sans text-sm font-medium text-gray-900 truncate">
                    {r.full_name ?? "Patient"}
                  </p>
                  <p className="font-sans text-xs text-gray-500">
                    Last visit{" "}
                    {new Date(r.last_visit).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    · Week {r.pregnancy_week ?? "—"}
                  </p>
                </div>
                <Link
                  to="/eden/patients/$id"
                  params={{ id: r.id }}
                  className="font-sans text-xs text-eve-teal hover:underline"
                >
                  View
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </EdenShell>
  );
}

function StatusPill({ status }: { status: string | null }) {
  const map: Record<string, string> = {
    confirmed: "bg-eve-teal/10 text-eve-teal-dark",
    pending: "bg-amber-100 text-amber-800",
    completed: "bg-gray-100 text-gray-600",
    cancelled: "bg-red-100 text-red-700",
  };
  const s = status ?? "pending";
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 font-sans text-[11px] capitalize",
        map[s] ?? map.pending,
      )}
    >
      {s}
    </span>
  );
}

function ProfileStrengthCard({ strength }: { strength: ProfileStrength }) {
  const items: { key: keyof ProfileStrength; label: string }[] = [
    { key: "hasSpecialty", label: "Confirm your specialty" },
    { key: "hasClinic", label: "Add your clinic name" },
    { key: "hasLanguages", label: "Add languages you speak" },
    { key: "hasBio", label: "Write a short bio (30+ chars)" },
    { key: "hasFee", label: "Set your consultation fee" },
    { key: "hasPhone", label: "Add a phone number" },
    { key: "accepting", label: "Mark whether you're accepting patients" },
  ];
  const done = items.filter((i) => strength[i.key]).length;
  const pct = Math.round((done / items.length) * 100);
  return (
    <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-sans text-base font-medium text-gray-900">Profile strength</h2>
          <p className="mt-0.5 font-sans text-xs text-gray-500">
            Complete your profile to help more mothers find and trust your care.
          </p>
        </div>
        <span className="font-sans text-sm font-medium text-eve-teal-dark">{pct}%</span>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-eve-teal transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <ul className="mt-4 space-y-2">
        {items.map((i) => (
          <li key={i.key} className="flex items-center gap-2 font-sans text-sm">
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full text-[10px]",
                strength[i.key] ? "bg-eve-teal text-white" : "bg-gray-100 text-gray-400",
              )}
            >
              {strength[i.key] ? "✓" : "•"}
            </span>
            <span className={cn(strength[i.key] ? "text-gray-500 line-through" : "text-gray-800")}>
              {i.label}
            </span>
          </li>
        ))}
      </ul>
      <Link
        to="/eden/onboarding"
        className="mt-4 inline-flex rounded-full bg-eve-teal px-4 py-2 font-sans text-xs font-medium text-white"
      >
        Edit profile
      </Link>
    </section>
  );
}
