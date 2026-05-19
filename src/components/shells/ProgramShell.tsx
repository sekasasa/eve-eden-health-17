import { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Users, HeartHandshake, FileBarChart } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/program/overview", label: "Overview", icon: LayoutDashboard },
  { to: "/program/mothers", label: "Mothers", icon: Users },
  { to: "/program/chw", label: "CHW", icon: HeartHandshake },
  { to: "/program/reports", label: "Reports", icon: FileBarChart },
];

export function ProgramShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <ProtectedRoute requiredType="admin">
      <div className="flex min-h-screen w-full bg-white">
        <aside className="hidden w-60 flex-col bg-eve-teal-dark text-white md:flex">
          <div className="px-6 pt-8 font-serif text-2xl">program.</div>
          <nav className="mt-10 flex-1 px-3">
            {NAV.map((item) => {
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
