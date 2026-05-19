import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { EdenShell } from "@/components/shells/EdenShell";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/eden/vendor/orders")({
  component: VendorOrders,
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

const STATUSES = ["all", "new", "processing", "shipped", "delivered", "cancelled"] as const;
const STATUS_COLOR: Record<string, string> = {
  new: "bg-eve-teal/15 text-eve-teal-dark",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-amber-100 text-amber-800",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

function VendorOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<(typeof STATUSES)[number]>("all");

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { data: v } = await supabase.from("vendors").select("id").eq("user_id", auth.user.id).maybeSingle();
    if (!v) return;
    const { data } = await supabase
      .from("orders")
      .select("id,product_id,status,amount_mad,mother_city,created_at")
      .eq("vendor_id", v.id)
      .order("created_at", { ascending: false });
    const rows = (data ?? []) as Order[];
    const pids = [...new Set(rows.map((r) => r.product_id))];
    if (pids.length) {
      const { data: prods } = await supabase.from("products").select("id,name").in("id", pids);
      const map = new Map((prods ?? []).map((p) => [p.id, p.name]));
      rows.forEach((r) => (r.product_name = map.get(r.product_id) ?? "—"));
    }
    setOrders(rows);
  }

  async function setStatus(id: string, status: string) {
    await supabase.from("orders").update({ status }).eq("id", id);
    setOrders((rows) => rows.map((o) => (o.id === id ? { ...o, status } : o)));
    toast.success(`Order set to ${status}`);
  }

  const list = orders.filter((o) => filter === "all" || o.status === filter);

  return (
    <EdenShell variant="vendor">
      <h1 className="font-sans text-2xl font-semibold text-eve-teal-dark">Orders</h1>

      <div className="mt-5 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "rounded-full px-4 py-1.5 font-sans text-xs capitalize",
              filter === s ? "bg-eve-teal text-white" : "bg-white text-gray-600 border border-gray-200",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-gray-100 bg-white">
        <table className="w-full text-left font-sans text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500">No orders.</td></tr>}
            {list.map((o) => (
              <tr key={o.id} className="border-t border-gray-100">
                <td className="px-4 py-3 font-mono text-xs text-gray-600">#{o.id.slice(0, 8)}</td>
                <td className="px-4 py-3 text-gray-900">{o.product_name}</td>
                <td className="px-4 py-3 text-gray-600">Mother in {o.mother_city ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600">{new Date(o.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{Number(o.amount_mad).toFixed(0)} MAD</td>
                <td className="px-4 py-3">
                  <select
                    value={o.status}
                    onChange={(e) => setStatus(o.id, e.target.value)}
                    className={cn("rounded-full border-none px-2 py-1 font-sans text-[11px] capitalize focus:outline-none", STATUS_COLOR[o.status] ?? "bg-gray-100")}
                  >
                    {STATUSES.filter((s) => s !== "all").map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </EdenShell>
  );
}
