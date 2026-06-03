import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Bookmark, ExternalLink } from "lucide-react";
import { EveShell } from "@/components/shells/EveShell";
import { TrustBadge } from "@/components/ui/TrustBadge";
import { SafetyDisclaimer } from "@/components/ui/SafetyDisclaimer";
import { supabase } from "@/integrations/supabase/client";
import {
  CLINICAL_CATEGORIES,
  estimateReadTime,
  type ContentRow,
} from "@/lib/content-filter";
import { eveToast } from "@/lib/eve-toast";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/eve/content/$id")({
  component: ContentReader,
});

const CTA_LABEL: Record<string, string> = {
  book: "Book appointment",
  quote: "Request quote",
  profile: "View vendor profile",
  message: "Message vendor",
  save: "Save post",
  register: "Register for event",
  shop: "Shop now",
  navigator: "Ask a navigator",
};

function ContentReader() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const [row, setRow] = useState<ContentRow | null>(null);
  const [vendor, setVendor] = useState<{ id: string; business_name: string | null } | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("vendor_content")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (!data) return;
      setRow(data as ContentRow);
      const { data: v } = await supabase
        .from("vendors")
        .select("id,business_name")
        .eq("id", data.vendor_id)
        .maybeSingle();
      setVendor(v ?? null);
      // increment view counter (best effort)
      await supabase
        .from("vendor_content")
        .update({ views: (data.views ?? 0) + 1 })
        .eq("id", id);
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user) {
        const { data: s } = await supabase
          .from("vendor_content_saves")
          .select("id")
          .eq("user_id", auth.user.id)
          .eq("content_id", id)
          .maybeSingle();
        setSaved(!!s);
      }
    })();
  }, [id]);

  async function toggleSave() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return eveToast.info("Sign in to save");
    if (saved) {
      await supabase
        .from("vendor_content_saves")
        .delete()
        .eq("user_id", auth.user.id)
        .eq("content_id", id);
      setSaved(false);
    } else {
      await supabase
        .from("vendor_content_saves")
        .insert({ user_id: auth.user.id, content_id: id });
      setSaved(true);
      eveToast.success("Saved to your care plan");
    }
  }

  async function ctaClick() {
    if (!row) return;
    const r = row as ContentRow & Record<string, number>;
    const updates: Record<string, number> = {};
    if (row.cta_type === "book") updates.booking_clicks = (r.booking_clicks ?? 0) + 1;
    if (row.cta_type === "quote") updates.quote_requests = (r.quote_requests ?? 0) + 1;
    if (row.cta_type === "message") updates.messages = (r.messages ?? 0) + 1;
    if (row.cta_type === "register") updates.event_registrations = (r.event_registrations ?? 0) + 1;
    if (row.cta_type === "shop") updates.shop_clicks = (r.shop_clicks ?? 0) + 1;
    if (row.cta_type === "profile") updates.profile_visits = (r.profile_visits ?? 0) + 1;
    if (Object.keys(updates).length) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await supabase.from("vendor_content").update(updates as any).eq("id", row.id);
    }
    if (row.cta_type === "profile" && vendor) {
      nav({ to: "/eve/vendors/$id", params: { id: vendor.id } });
    } else if (row.cta_type === "navigator") {
      nav({ to: "/eve/ask" });
    } else if (row.cta_url) {
      window.open(row.cta_url, "_blank");
    } else if (vendor) {
      nav({ to: "/eve/vendors/$id", params: { id: vendor.id } });
    }
  }

  if (!row) {
    return (
      <EveShell>
        <p className="text-sm text-eve-muted">Loading…</p>
      </EveShell>
    );
  }

  const clinical = row.category ? CLINICAL_CATEGORIES.has(row.category) : false;

  return (
    <EveShell>
      <button
        onClick={() => nav({ to: "/eve/community" })}
        className="mb-3 inline-flex items-center gap-1 text-xs text-eve-muted"
      >
        <ArrowLeft className="h-3 w-3" /> Back
      </button>

      <div className="flex items-center gap-2 text-[11px] text-eve-muted">
        <span className="rounded-full bg-eve-teal-light px-2 py-0.5 capitalize text-eve-teal">
          {row.content_type}
        </span>
        {row.category && (
          <span className="rounded-full bg-eve-terra-light px-2 py-0.5 text-eve-terra">
            {row.category}
          </span>
        )}
        <span>· {estimateReadTime(row.body, row.content_type)}</span>
      </div>

      <h1 className="mt-3 font-serif text-2xl leading-snug text-eve-forest">{row.title}</h1>

      {vendor && (
        <div className="mt-2 flex items-center gap-2 text-[12px] text-eve-muted">
          <span className="font-medium text-eve-teal-dark">{vendor.business_name}</span>
          <TrustBadge />
          <button
            onClick={() => nav({ to: "/eve/vendors/$id", params: { id: vendor.id } })}
            className="ml-auto inline-flex items-center gap-1 text-eve-teal"
          >
            View profile <ExternalLink className="h-3 w-3" />
          </button>
        </div>
      )}

      {row.media_url && (
        <div className="mt-4 overflow-hidden rounded-2xl bg-eve-cream">
          {row.content_type === "video" ? (
            <video src={row.media_url} controls className="w-full" />
          ) : (
            <img src={row.media_url} alt={row.title} className="w-full" />
          )}
        </div>
      )}

      {clinical && (
        <div className="mt-4">
          <SafetyDisclaimer />
        </div>
      )}

      {row.excerpt && (
        <p className="mt-4 font-sans text-sm italic text-eve-muted">{row.excerpt}</p>
      )}

      {row.body && (
        <div className="mt-4 whitespace-pre-wrap font-sans text-[14px] leading-relaxed text-eve-forest">
          {row.body}
        </div>
      )}

      <div className="mt-6 flex items-center gap-2">
        {row.cta_type && (
          <button
            onClick={ctaClick}
            className="rounded-full bg-eve-teal px-5 py-2 text-sm font-medium text-white"
          >
            {CTA_LABEL[row.cta_type] ?? "Open"}
          </button>
        )}
        <button
          onClick={toggleSave}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-4 py-2 text-sm",
            saved ? "border-eve-teal bg-eve-teal-light text-eve-teal" : "border-eve-muted/30 text-eve-muted",
          )}
        >
          <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
          {saved ? "Saved" : "Save"}
        </button>
      </div>

      <p className="mt-6 text-[11px] italic text-eve-muted">
        If this feels urgent or life-threatening, please seek immediate medical care or contact local emergency services.
      </p>
    </EveShell>
  );
}
