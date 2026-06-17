import { useEffect, useState } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Calendar,
  BarChart3,
  UserCircle,
  Package,
  ShoppingBag,
  Star,
  LogOut,
  PenLine,
  Inbox,
  Send,
  FileText,
  Handshake,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const COORD_NAV = [
  { to: "/eden/leads", label: "Leads", icon: Inbox },
  { to: "/eden/referrals", label: "Referrals", icon: Send },
  { to: "/eden/partners", label: "Trusted Partners", icon: Handshake },
  { to: "/eden/shared-docs", label: "Shared Docs", icon: FileText },
];

const PROVIDER_NAV = [
  { to: "/eden/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/eden/patients", label: "Patients", icon: Users },
  { to: "/eden/appointments", label: "Appointments", icon: Calendar },
  { to: "/eden/analytics", label: "Analytics", icon: BarChart3 },
  ...COORD_NAV,
  { to: "/eden/vendor/content", label: "Content Studio", icon: PenLine },
  { to: "/eden/profile", label: "My Profile", icon: UserCircle },
];

const VENDOR_NAV = [
  { to: "/eden/vendor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/eden/vendor/products", label: "Products", icon: Package },
  { to: "/eden/vendor/orders", label: "Orders", icon: ShoppingBag },
  ...COORD_NAV,
  { to: "/eden/vendor/content", label: "Content Studio", icon: PenLine },
  { to: "/eden/vendor/listing", label: "My Listing", icon: Star },
];

export function EdenSidebar({
  variant = "provider",
  mobile = false,
  onNavigate,
}: {
  variant?: "provider" | "vendor";
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = variant === "vendor" ? VENDOR_NAV : PROVIDER_NAV;
  const [me, setMe] = useState<{ name: string; sub: string } | null>(null);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      if (variant === "vendor") {
        const { data } = await supabase
          .from("vendors")
          .select("business_name,category")
          .eq("user_id", auth.user.id)
          .maybeSingle();
        if (data) setMe({ name: data.business_name ?? "Vendor", sub: data.category ?? "" });
      } else {
        const { data } = await supabase
          .from("providers")
          .select("full_name,specialty")
          .eq("user_id", auth.user.id)
          .maybeSingle();
        if (data) setMe({ name: data.full_name ?? "Provider", sub: data.specialty ?? "" });
      }
    })();
  }, [variant]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  // On mobile, render full-height flex without the `hidden md:flex` constraint so
  // the overlay shows real navigation. On desktop, the aside stays hidden below md.
  const asideCls = mobile
    ? "flex h-full w-full flex-col bg-eve-teal-dark text-white"
    : "hidden md:flex md:w-60 md:flex-col md:bg-eve-teal-dark md:text-white md:sticky md:top-0 md:h-screen";

  return (
    <aside className={asideCls}>
      <div className="px-6 pt-8">
        <Link to="/eden/dashboard" className="font-sans text-[22px] font-bold tracking-tight">
          eden.
        </Link>
      </div>
      <nav className="mt-10 flex-1 px-3 overflow-y-auto">
        {items.map((item) => {
          const active = pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "mb-1 flex items-center gap-3 rounded-lg px-4 py-3 font-sans text-sm transition-colors",
                active
                  ? "bg-white/10 text-white"
                  : "text-white/70 hover:bg-white/5 hover:text-white",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-4">
        {me && (
          <div className="mb-3 px-1">
            <p className="font-sans text-sm font-medium text-white">{me.name}</p>
            {me.sub && (
              <p className="font-sans text-xs text-white/60">{me.sub}</p>
            )}
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 font-sans text-sm text-white/70 hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
