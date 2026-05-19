import { ReactNode } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  HeartHandshake,
  AlertTriangle,
  FileBarChart,
  Settings,
  LogOut,
} from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/program/overview", label: "Overview", icon: LayoutDashboard },
  { to: "/program/mothers", label: "Mothers", icon: Users },
  { to: "/program/chw", label: "CHW Workers", icon: HeartHandshake },
  { to: "/program/alerts", label: "Risk Alerts", icon: AlertTriangle },
  { to: "/program/reports", label: "Reports", icon: FileBarChart },
  { to: "/program/settings", label: "Settings", icon: Settings },
];

export function ProgramShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  return (
    <ProtectedRoute requiredType="admin">
      <div className="flex min-h-screen w-full bg-white">
        <aside className="hidden w-60 flex-col bg-eve-teal-dark text-white md:sticky md:top-0 md:flex md:h-screen">
          <div className="px-6 pt-8 font-sans text-[22px] font-bold tracking-tight">
            program.
          </div>
          <nav className="mt-10 flex-1 px-3">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "mb-1 flex items-center gap-3 rounded-lg px-4 py-2.5 font-sans text-sm",
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
              onClick={signOut}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 font-sans text-sm text-white/70 hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </aside>
        <main className="flex-1 bg-gray-50 p-6 md:p-8">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
