import { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Home, UserPlus, Users, Flag } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { cn } from "@/lib/utils";
import { OfflineBanner } from "@/components/ui/OfflineBanner";

const NAV = [
  { to: "/chw/home", label: "Home", icon: Home },
  { to: "/chw/register", label: "Register", icon: UserPlus },
  { to: "/chw/mothers", label: "Mothers", icon: Users },
  { to: "/chw/flag", label: "Flag", icon: Flag },
];

export function CHWShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <ProtectedRoute requiredType="chw">
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-md">
          <OfflineBanner />
          <header className="border-b border-gray-100 px-5 py-4">
            <span className="font-serif text-xl text-eve-teal">chw.</span>
          </header>
          <main className="px-5 pb-24 pt-4">{children}</main>
        </div>
        <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 border-t border-gray-100 bg-white">
          <div className="flex items-center justify-around py-2">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-1 py-1 font-sans text-[10px]",
                    active ? "text-eve-teal" : "text-eve-muted",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </ProtectedRoute>
  );
}
