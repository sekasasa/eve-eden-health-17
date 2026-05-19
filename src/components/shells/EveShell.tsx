import { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, User } from "lucide-react";
import { BottomNav } from "@/components/ui/BottomNav";
import { ProtectedRoute } from "@/components/ProtectedRoute";

interface Props {
  children: ReactNode;
  /** Hide the bottom nav (e.g. onboarding) */
  hideNav?: boolean;
  /** Skip auth check (rare) */
  unprotected?: boolean;
}

export function EveShell({ children, hideNav, unprotected }: Props) {
  const content = (
    <div className="min-h-screen bg-eve-sand">
      <div className="mx-auto max-w-sm">
        <header className="flex items-center justify-between px-5 pt-6">
          <Link to="/eve/home" className="font-serif text-2xl text-eve-teal">
            eve.
          </Link>
          <div className="flex items-center gap-3">
            <button
              aria-label="Notifications"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-eve-cream text-eve-teal-dark"
            >
              <Bell className="h-4 w-4" />
            </button>
            <Link
              to="/eve/profile"
              aria-label="Profile"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-eve-teal text-white"
            >
              <User className="h-4 w-4" />
            </Link>
          </div>
        </header>
        <main className={hideNav ? "px-5 pt-4" : "px-5 pb-28 pt-4"}>
          {children}
        </main>
      </div>
      {!hideNav && <BottomNav />}
    </div>
  );

  if (unprotected) return content;
  return <ProtectedRoute requiredType="mother">{content}</ProtectedRoute>;
}
