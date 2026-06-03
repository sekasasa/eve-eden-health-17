import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  PenLine,
  Video,
  Lightbulb,
  CalendarPlus,
  Megaphone,
  BarChart2,
  Plus,
} from "lucide-react";
import { EdenShell } from "@/components/shells/EdenShell";
import { supabase } from "@/integrations/supabase/client";
import { type ContentRow } from "@/lib/content-filter";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/eden/vendor/content")({
  component: VendorContentStudio,
});

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  submitted: "bg-amber-100 text-amber-800",
  approved: "bg-blue-100 text-blue-700",
  published: "bg-green-100 text-green-800",
  needs_edits: "bg-red-100 text-red-700",
  archived: "bg-gray-200 text-gray-600",
};

const ACTIONS = [
  { type: "article", label: "Create article", icon: PenLine },
  { type: "video", label: "Upload video", icon: Video },
  { type: "tip", label: "Post a care tip", icon: Lightbulb },
  { type: "event", label: "Share event", icon: CalendarPlus },
  { type: "promotion", label: "Promote service", icon: Megaphone },
];

function VendorContentStudio() {
  const nav = useNavigate();
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [variant, setVariant] = useState<"provider" | "vendor">("vendor");
  const [rows, setRows] = useState<ContentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { data: prof } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", auth.user.id)
      .maybeSingle();
    setVariant(prof?.user_type === "provider" ? "provider" : "vendor");
    let { data: v } = await supabase
      .from("vendors")
      .select("id")
      .eq("user_id", auth.user.id)
      .maybeSingle();

    // Auto-provision a vendor record for providers (doctors, midwives, etc.)
    // so they can publish content alongside store vendors.
    if (!v) {
      const { data: prov } = await supabase
        .from("providers")
        .select("full_name,specialty,city")
        .eq("user_id", auth.user.id)
        .maybeSingle();
      if (prov) {
        const { data: created } = await supabase
          .from("vendors")
          .insert({
            user_id: auth.user.id,
            business_name: prov.full_name ?? "My Practice",
            category: prov.specialty ?? "provider",
            city: prov.city ?? null,
          })
          .select("id")
          .maybeSingle();
        v = created ?? null;
      }
    }

    if (!v) {
      setLoading(false);
      return;
    }
    setVendorId(v.id);
    const { data } = await supabase
      .from("vendor_content")
      .select("*")
      .eq("vendor_id", v.id)
      .order("created_at", { ascending: false });
    setRows((data ?? []) as ContentRow[]);
    setLoading(false);
  }

  return (
    <EdenShell variant="vendor">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-sans text-2xl font-semibold text-eve-teal-dark">Content Studio</h1>
          <p className="mt-1 font-sans text-sm text-gray-500">
            Educate women and families. Build trust. Reach more customers through helpful content.
          </p>
        </div>
        <button
          onClick={() => nav({ to: "/eden/vendor/content/new", search: { type: "article" } })}
          className="inline-flex items-center gap-1 rounded-full bg-eve-teal px-4 py-2 text-sm font-medium text-white"
        >
          <Plus className="h-4 w-4" /> New post
        </button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {ACTIONS.map((a) => (
          <button
            key={a.type}
            onClick={() => nav({ to: "/eden/vendor/content/new", search: { type: a.type } })}
            className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-4 text-left transition hover:border-eve-teal/40 hover:bg-eve-teal-light/10"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-eve-teal-light text-eve-teal">
              <a.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="font-sans text-sm font-semibold text-eve-teal-dark">{a.label}</p>
              <p className="mt-0.5 font-sans text-xs text-gray-500">Start a new {a.type}.</p>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-gray-100 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
          <h2 className="font-sans text-sm font-semibold text-gray-900">Your content</h2>
          <span className="font-sans text-xs text-gray-500">{rows.length} total</span>
        </div>
        {loading ? (
          <p className="px-5 py-8 text-center text-sm text-gray-500">Loading…</p>
        ) : !vendorId ? (
          <p className="px-5 py-8 text-center text-sm text-gray-500">
            Complete your vendor onboarding before publishing content.
          </p>
        ) : rows.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-500">
            No posts yet. Start with an article or a quick tip.
          </p>
        ) : (
          <table className="w-full text-left font-sans text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Views</th>
                <th className="px-4 py-3">Saves</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 text-gray-900">{r.title}</td>
                  <td className="px-4 py-3 capitalize text-gray-600">{r.content_type}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] capitalize",
                        STATUS_STYLE[r.status] ?? "bg-gray-100",
                      )}
                    >
                      {r.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.views}</td>
                  <td className="px-4 py-3 text-gray-600">{r.saves}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to="/eden/vendor/content/$id/edit"
                      params={{ id: r.id }}
                      className="rounded-md border border-gray-200 px-3 py-1 text-xs hover:bg-gray-50"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-8 rounded-xl border border-gray-100 bg-white p-5">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-eve-teal" />
          <h2 className="font-sans text-sm font-semibold text-gray-900">Content performance</h2>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Total views" value={sum(rows, "views")} />
          <Stat label="Total saves" value={sum(rows, "saves")} />
          <Stat label="Profile visits" value={sum(rows, "profile_visits")} />
          <Stat label="Booking clicks" value={sum(rows, "booking_clicks")} />
          <Stat label="Quote requests" value={sum(rows, "quote_requests")} />
          <Stat label="Messages" value={sum(rows, "messages")} />
          <Stat label="Event sign-ups" value={sum(rows, "event_registrations")} />
          <Stat label="Shop clicks" value={sum(rows, "shop_clicks")} />
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-100 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
          <h2 className="font-sans text-sm font-semibold text-gray-900">Analytics by post</h2>
          <span className="font-sans text-xs text-gray-500">
            Track how each piece converts to actions
          </span>
        </div>
        {rows.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-500">
            Publish content to start collecting analytics.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Post</th>
                  <th className="px-4 py-3 text-right">Views</th>
                  <th className="px-4 py-3 text-right">Saves</th>
                  <th className="px-4 py-3 text-right">Profile</th>
                  <th className="px-4 py-3 text-right">Bookings</th>
                  <th className="px-4 py-3 text-right">Quotes</th>
                  <th className="px-4 py-3 text-right">Msgs</th>
                  <th className="px-4 py-3 text-right">Events</th>
                  <th className="px-4 py-3 text-right">Shop</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-gray-100">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{r.title}</p>
                      <p className="text-[11px] capitalize text-gray-500">{r.content_type}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{r.views ?? 0}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{r.saves ?? 0}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{r.profile_visits ?? 0}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{r.booking_clicks ?? 0}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{r.quote_requests ?? 0}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{r.messages ?? 0}</td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {r.event_registrations ?? 0}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{r.shop_clicks ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </EdenShell>
  );
}

function sum(rows: ContentRow[], key: keyof ContentRow) {
  return rows.reduce((s, r) => s + ((r[key] as number) ?? 0), 0);
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <p className="font-sans text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 font-sans text-xl font-semibold text-eve-teal-dark">{value}</p>
    </div>
  );
}
