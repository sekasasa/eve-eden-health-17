import { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Stethoscope, Store, BookOpen, Users, AlertTriangle, UserPlus } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface Props {
  children: ReactNode;
  wordmark: string;
  items: NavItem[];
  requiredType: "admin";
}

export function SidebarShell({ children, wordmark, items }: Props) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <ProtectedRoute requiredType="admin">
      <div className="flex min-h-screen w-full bg-white">
        <aside className="hidden w-60 flex-col bg-eve-teal-dark text-white md:flex">
          <div className="px-6 pt-8 font-serif text-2xl">{wordmark}</div>
          <nav className="mt-10 flex-1 px-3">
            {items.map((item) => {
              const active = pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "mb-1 flex items-center gap-3 rounded-lg px-3 py-2 font-sans text-sm",
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
        </aside>
        <main className="flex-1 bg-gray-50 p-6 md:p-8">{children}</main>
      </div>
    </ProtectedRoute>
  );
}

const ADMIN_NAV: NavItem[] = [
  { to: "/admin/providers", label: "Providers", icon: Stethoscope },
  { to: "/admin/provider-leads", label: "Provider Leads", icon: UserPlus },
  { to: "/admin/vendors", label: "Vendors", icon: Store },
  { to: "/admin/guidance", label: "Guidance", icon: BookOpen },
  { to: "/admin/alerts", label: "Alerts", icon: AlertTriangle },
  { to: "/admin/users", label: "Users", icon: Users },
];

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <SidebarShell wordmark="admin." items={ADMIN_NAV} requiredType="admin">
      {children}
    </SidebarShell>
  );
}
