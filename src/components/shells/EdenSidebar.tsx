import { Link, useRouterState } from "@tanstack/react-router";
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
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const PROVIDER_NAV = [
  { to: "/eden/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/eden/patients", label: "Patients", icon: Users },
  { to: "/eden/appointments", label: "Appointments", icon: Calendar },
  { to: "/eden/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/eden/profile", label: "My Profile", icon: UserCircle },
];

const VENDOR_NAV = [
  { to: "/eden/vendor/products", label: "Products", icon: Package },
  { to: "/eden/vendor/orders", label: "Orders", icon: ShoppingBag },
  { to: "/eden/vendor/listing", label: "My Listing", icon: Star },
];

export function EdenSidebar({ variant = "provider" }: { variant?: "provider" | "vendor" }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = variant === "vendor" ? VENDOR_NAV : PROVIDER_NAV;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:bg-eve-teal-dark md:text-white">
      <div className="px-6 pt-8">
        <Link to="/eden/dashboard" className="font-serif text-2xl">
          eden.
        </Link>
      </div>
      <nav className="mt-10 flex-1 px-3">
        {items.map((item) => {
          const active = pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "mb-1 flex items-center gap-3 rounded-lg px-3 py-2 font-sans text-sm transition-colors",
                active
                  ? "bg-white/15 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-4">
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
