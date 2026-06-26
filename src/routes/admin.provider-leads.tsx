import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/shells/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/admin/provider-leads")({
  component: AdminProviderLeads,
});

type Lead = {
  id: string;
  lead_ref: string | null;
  display_name: string | null;
  business_name: string | null;
  provider_type: string;
  credential_text: string | null;
  doula_services: string[] | null;
  region: string | null;
  country: string | null;
  state_or_province: string | null;
  city: string | null;
  service_area: string | null;
  languages: string[] | null;
  specialties: string[] | null;
  fee_or_rate_public_text: string | null;
  source_name: string | null;
  source_url: string | null;
  certification_source: string | null;
  last_checked_at: string | null;
  verification_status: string;
  outreach_status: string | null;
  display_in_app: boolean;
  internal_notes: string | null;
};

const STATUSES = [
  "public_directory_reference",
  "needs_verification",
  "outreach_started",
  "contacted",
  "claimed_profile",
  "verified_partner",
  "rejected",
  "inactive",
] as const;

const STATUS_COLORS: Record<string, string> = {
  public_directory_reference: "bg-gray-100 text-gray-700",
  needs_verification: "bg-amber-100 text-amber-800",
  outreach_started: "bg-blue-100 text-blue-800",
  contacted: "bg-indigo-100 text-indigo-800",
  claimed_profile: "bg-eve-teal/15 text-eve-teal-dark",
  verified_partner: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  inactive: "bg-gray-200 text-gray-600",
};

function AdminProviderLeads() {
  const [rows, setRows] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [fType, setFType] = useState("all");
  const [fCountry, setFCountry] = useState("all");
  const [fRegion, setFRegion] = useState("all");
  const [fCity, setFCity] = useState("all");
  const [fSource, setFSource] = useState("all");
  const [fStatus, setFStatus] = useState("all");
  const [fLang, setFLang] = useState("all");
  const [fSpecialty, setFSpecialty] = useState("all");
  const [selected, setSelected] = useState<Lead | null>(null);
  const [notesDraft, setNotesDraft] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("provider_leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data ?? []) as Lead[]);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const uniq = (xs: (string | null | undefined)[]) =>
    Array.from(new Set(xs.filter((x): x is string => !!x))).sort();

  const types = useMemo(() => uniq(rows.map((r) => r.provider_type)), [rows]);
  const countries = useMemo(() => uniq(rows.map((r) => r.country)), [rows]);
  const regions = useMemo(() => uniq(rows.map((r) => r.region)), [rows]);
  const cities = useMemo(() => uniq(rows.map((r) => r.city)), [rows]);
  const sources = useMemo(() => uniq(rows.map((r) => r.source_name)), [rows]);
  const languages = useMemo(
    () => uniq(rows.flatMap((r) => r.languages ?? [])),
    [rows],
  );
  const specialties = useMemo(
    () => uniq(rows.flatMap((r) => [...(r.doula_services ?? []), ...(r.specialties ?? [])])),
    [rows],
  );

  const filtered = rows.filter((r) => {
    if (fType !== "all" && r.provider_type !== fType) return false;
    if (fCountry !== "all" && r.country !== fCountry) return false;
    if (fRegion !== "all" && r.region !== fRegion) return false;
    if (fCity !== "all" && r.city !== fCity) return false;
    if (fSource !== "all" && r.source_name !== fSource) return false;
    if (fStatus !== "all" && r.verification_status !== fStatus) return false;
    if (fLang !== "all" && !(r.languages ?? []).includes(fLang)) return false;
    if (
      fSpecialty !== "all" &&
      !(r.doula_services ?? []).includes(fSpecialty) &&
      !(r.specialties ?? []).includes(fSpecialty)
    )
      return false;
    if (q) {
      const hay = [
        r.display_name,
        r.business_name,
        r.credential_text,
        r.source_name,
        r.city,
        r.country,
        r.internal_notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  const setStatus = async (
    lead: Lead,
    patch: Partial<Pick<Lead, "verification_status" | "outreach_status" | "display_in_app">>,
  ) => {
    const { error } = await supabase
      .from("provider_leads")
      .update({ ...patch, last_checked_at: new Date().toISOString() })
      .eq("id", lead.id);
    if (error) return toast.error(error.message);
    toast.success("Lead updated");
    load();
  };

  const saveNotes = async () => {
    if (!selected) return;
    const { error } = await supabase
      .from("provider_leads")
      .update({ internal_notes: notesDraft })
      .eq("id", selected.id);
    if (error) return toast.error(error.message);
    toast.success("Notes saved");
    setSelected(null);
    load();
  };

  return (
    <AdminShell>
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-eve-teal-dark">Provider Leads</h1>
        <p className="mt-1 font-sans text-sm text-eve-muted">
          Internal acquisition queue. These records are sourced from public
          directories and are <strong>not</strong> Eve &amp; Eden verified providers
          until manually contacted, verified, and converted.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-eve-muted/15 bg-white p-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, business, notes…"
          className="min-w-[200px] flex-1 rounded-md border border-gray-200 px-3 py-1.5 text-sm"
        />
        <Select label="Type" value={fType} setValue={setFType} options={types} />
        <Select label="Country" value={fCountry} setValue={setFCountry} options={countries} />
        <Select label="Region" value={fRegion} setValue={setFRegion} options={regions} />
        <Select label="City" value={fCity} setValue={setFCity} options={cities} />
        <Select label="Source" value={fSource} setValue={setFSource} options={sources} />
        <Select label="Status" value={fStatus} setValue={setFStatus} options={[...STATUSES]} />
        <Select label="Language" value={fLang} setValue={setFLang} options={languages} />
        <Select label="Specialty" value={fSpecialty} setValue={setFSpecialty} options={specialties} />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-eve-muted/15 bg-white">
        <table className="w-full min-w-[1100px] text-sm">
          <thead className="bg-eve-cream/50 text-eve-muted">
            <tr>
              <th className="px-3 py-2 text-left font-sans font-medium">Name</th>
              <th className="px-3 py-2 text-left font-sans font-medium">Type</th>
              <th className="px-3 py-2 text-left font-sans font-medium">Location</th>
              <th className="px-3 py-2 text-left font-sans font-medium">Source</th>
              <th className="px-3 py-2 text-left font-sans font-medium">Status</th>
              <th className="px-3 py-2 text-left font-sans font-medium">In app</th>
              <th className="px-3 py-2 text-left font-sans font-medium">Last checked</th>
              <th className="px-3 py-2 text-left font-sans font-medium">Notes</th>
              <th className="px-3 py-2 text-right font-sans font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-eve-muted">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-eve-muted">
                  No leads match these filters.
                </td>
              </tr>
            )}
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-eve-muted/10 align-top">
                <td className="px-3 py-2">
                  <div className="font-sans text-eve-forest">{r.display_name ?? "—"}</div>
                  {r.business_name && (
                    <div className="font-sans text-xs text-eve-muted">{r.business_name}</div>
                  )}
                  {r.credential_text && (
                    <div className="font-sans text-[11px] text-eve-muted">{r.credential_text}</div>
                  )}
                </td>
                <td className="px-3 py-2 font-sans text-xs capitalize text-eve-muted">
                  {r.provider_type}
                </td>
                <td className="px-3 py-2 font-sans text-xs text-eve-muted">
                  {[r.city, r.state_or_province, r.country].filter(Boolean).join(", ") || "—"}
                </td>
                <td className="px-3 py-2 font-sans text-xs text-eve-muted">
                  <div>{r.source_name ?? "—"}</div>
                  {r.source_url && (
                    <a
                      href={r.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-eve-teal underline"
                    >
                      open ↗
                    </a>
                  )}
                  <div className="mt-1 text-[10px] italic text-eve-muted">
                    Source: {r.source_name}. Eve &amp; Eden verification required before display.
                  </div>
                </td>
                <td className="px-3 py-2">
                  <span
                    className={
                      "rounded-full px-2 py-0.5 font-sans text-[11px] " +
                      (STATUS_COLORS[r.verification_status] ?? "bg-gray-100 text-gray-700")
                    }
                  >
                    {r.verification_status.replaceAll("_", " ")}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => setStatus(r, { display_in_app: !r.display_in_app })}
                    className={
                      "rounded-full px-2 py-0.5 font-sans text-[11px] " +
                      (r.display_in_app
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-gray-100 text-gray-600")
                    }
                  >
                    {r.display_in_app ? "Visible" : "Hidden"}
                  </button>
                </td>
                <td className="px-3 py-2 font-sans text-[11px] text-eve-muted">
                  {r.last_checked_at ? new Date(r.last_checked_at).toLocaleDateString() : "—"}
                </td>
                <td className="px-3 py-2 max-w-[220px] font-sans text-[11px] text-eve-muted">
                  {r.internal_notes ?? "—"}
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="flex flex-wrap justify-end gap-1">
                    <ActionBtn onClick={() => setStatus(r, { verification_status: "outreach_started" })}>
                      Outreach
                    </ActionBtn>
                    <ActionBtn onClick={() => setStatus(r, { verification_status: "contacted" })}>
                      Contacted
                    </ActionBtn>
                    <ActionBtn onClick={() => setStatus(r, { verification_status: "claimed_profile" })}>
                      Claimed
                    </ActionBtn>
                    <ActionBtn
                      tone="primary"
                      onClick={() =>
                        setStatus(r, {
                          verification_status: "verified_partner",
                          display_in_app: true,
                        })
                      }
                    >
                      Verify
                    </ActionBtn>
                    <ActionBtn
                      tone="danger"
                      onClick={() => setStatus(r, { verification_status: "rejected", display_in_app: false })}
                    >
                      Reject
                    </ActionBtn>
                    <ActionBtn onClick={() => setStatus(r, { verification_status: "inactive", display_in_app: false })}>
                      Inactive
                    </ActionBtn>
                    <ActionBtn
                      onClick={() => {
                        setSelected(r);
                        setNotesDraft(r.internal_notes ?? "");
                      }}
                    >
                      Notes
                    </ActionBtn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Internal notes — {selected?.display_name}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
            rows={6}
            placeholder="Internal-only notes about outreach, verification, consent…"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Cancel
            </Button>
            <Button onClick={saveNotes} className="bg-eve-teal text-white hover:bg-eve-teal-dark">
              Save notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}

function Select({
  label,
  value,
  setValue,
  options,
}: {
  label: string;
  value: string;
  setValue: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="flex items-center gap-1 font-sans text-xs text-eve-muted">
      <span>{label}</span>
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="rounded-md border border-gray-200 px-2 py-1 text-xs"
      >
        <option value="all">All</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o.replaceAll("_", " ")}
          </option>
        ))}
      </select>
    </label>
  );
}

function ActionBtn({
  children,
  onClick,
  tone = "default",
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone?: "default" | "primary" | "danger";
}) {
  const cls =
    tone === "primary"
      ? "bg-eve-teal text-white hover:bg-eve-teal-dark"
      : tone === "danger"
        ? "bg-red-50 text-red-700 hover:bg-red-100"
        : "bg-gray-50 text-gray-700 hover:bg-gray-100";
  return (
    <button
      onClick={onClick}
      className={"rounded-md px-2 py-1 font-sans text-[11px] " + cls}
    >
      {children}
    </button>
  );
}
