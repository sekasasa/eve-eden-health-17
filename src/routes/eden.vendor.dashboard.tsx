import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PenLine } from "lucide-react";
import { EdenShell } from "@/components/shells/EdenShell";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { CoordinationPanels } from "@/components/CoordinationPanels";
import { toast } from "sonner";

export const Route = createFileRoute("/eden/vendor/dashboard")({
  component: VendorDashboard,
});

type Order = {
  id: string;
  product_id: string;
  status: string;
  amount_mad: number;
  mother_city: string | null;
  created_at: string;
  product_name?: string;
};

const STATUS_COLOR: Record<string, string> = {
  new: "bg-eve-teal/15 text-eve-teal-dark",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-amber-100 text-amber-800",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const COMMISSION = 0.1;

function VendorDashboard() {
  const [business, setBusiness] = useState("");
  const [products, setProducts] = useState(0);
  const [sold30, setSold30] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { data: v } = await supabase
      .from("vendors")
      .select("id,business_name")
      .eq("user_id", auth.user.id)
      .maybeSingle();
    if (!v) return;
    setBusiness(v.business_name ?? "vendor");

    const since = new Date(Date.now() - 30 * 86400000).toISOString();
    const [pRes, oRes, sRes] = await Promise.all([
      supabase.from("products").select("id", { count: "exact", head: true }).eq("vendor_id", v.id),
      supabase
        .from("orders")
        .select("id,product_id,status,amount_mad,mother_city,created_at")
        .eq("vendor_id", v.id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("orders")
        .select("amount_mad,status")
        .eq("vendor_id", v.id)
        .gte("created_at", since),
    ]);
    setProducts(pRes.count ?? 0);
    const recent = (oRes.data ?? []) as Order[];
    const pids = [...new Set(recent.map((o) => o.product_id))];
    if (pids.length) {
      const { data: prods } = await supabase.from("products").select("id,name").in("id", pids);
      const map = new Map((prods ?? []).map((p) => [p.id, p.name]));
      recent.forEach((o) => (o.product_name = map.get(o.product_id) ?? "—"));
    }
    setOrders(recent);
    const sold = (sRes.data ?? []).filter((o) => o.status !== "cancelled");
    setSold30(sold.length);
    setRevenue(sold.reduce((s, o) => s + Number(o.amount_mad ?? 0), 0));
  }

  async function markShipped(id: string) {
    await supabase.from("orders").update({ status: "shipped" }).eq("id", id);
    setOrders((rows) => rows.map((o) => (o.id === id ? { ...o, status: "shipped" } : o)));
    toast.success("Order marked as shipped");
  }

  return (
    <EdenShell variant="vendor">
      <h1 className="font-sans text-2xl font-semibold text-eve-teal-dark">Welcome, {business}</h1>
      <p className="mt-1 font-sans text-sm text-gray-500">Your marketplace at a glance.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <Kpi label="Products listed" value={products} />
        <Kpi label="Sold (30d)" value={sold30} />
        <Kpi label="Revenue MAD (30d)" value={`${revenue.toFixed(0)}`} />
        <Kpi label="Commission owed" value={`${(revenue * COMMISSION).toFixed(0)}`} accent="amber" />
      </div>

      <Link
        to="/eden/vendor/content"
        className="mt-6 flex items-start gap-4 rounded-xl border border-eve-teal/30 bg-eve-teal-light/30 p-5 transition hover:bg-eve-teal-light/50"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-eve-teal text-white">
          <PenLine className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="font-sans text-sm font-semibold text-eve-teal-dark">Content Studio</p>
          <p className="mt-0.5 font-sans text-xs text-gray-600">
            Publish articles, videos, tips, events, and promotions to reach more women and families.
          </p>
        </div>
        <span className="font-sans text-xs font-medium text-eve-teal">Open →</span>
      </Link>


      <div className="mt-8 overflow-hidden rounded-xl border border-gray-100 bg-white">
        <div className="border-b border-gray-100 px-5 py-3">
          <h2 className="font-sans text-sm font-semibold text-gray-900">Recent orders</h2>
        </div>
        <table className="w-full text-left font-sans text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-500">No orders yet.</td></tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-gray-100">
                <td className="px-4 py-3 font-mono text-xs text-gray-600">#{o.id.slice(0, 8)}</td>
                <td className="px-4 py-3 text-gray-900">{o.product_name}</td>
                <td className="px-4 py-3 text-gray-600">Mother in {o.mother_city ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600">{new Date(o.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <span className={cn("rounded-full px-2 py-0.5 font-sans text-[10px] capitalize", STATUS_COLOR[o.status] ?? "bg-gray-100 text-gray-700")}>
                    {o.status}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">{Number(o.amount_mad).toFixed(0)} MAD</td>
                <td className="px-4 py-3 text-right">
                  {o.status === "new" && (
                    <button onClick={() => markShipped(o.id)} className="rounded-md border border-gray-200 px-3 py-1 font-sans text-xs hover:bg-gray-50">
                      Mark shipped
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </EdenShell>
  );
}

function Kpi({ label, value, accent }: { label: string; value: number | string; accent?: "amber" }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5">
      <p className="font-sans text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
      <p className={cn("mt-2 font-sans text-3xl font-semibold", accent === "amber" ? "text-amber-600" : "text-eve-teal-dark")}>
        {value}
      </p>
    </div>
  );
}
