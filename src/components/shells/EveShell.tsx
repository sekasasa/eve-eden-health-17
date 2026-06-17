import { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { User } from "lucide-react";
import { BottomNav } from "@/components/ui/BottomNav";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useLanguage } from "@/hooks/useLanguage";

interface Props {
  children: ReactNode;
  /** Hide the bottom nav (e.g. onboarding) */
  hideNav?: boolean;
  /** Skip auth check (rare) */
  unprotected?: boolean;
}

export function EveShell({ children, hideNav, unprotected }: Props) {
  // Initialise language from profile for every Eve page
  useLanguage();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const content = (
    <div className="min-h-screen overflow-x-hidden bg-eve-sand">
      <OfflineBanner />
      <div className="mx-auto max-w-sm">
        <header className="flex items-center justify-between px-5 pt-6 rtl:flex-row-reverse">
          <Link to="/eve/home" className="font-serif text-2xl text-eve-teal">
            eve.
          </Link>
          <div className="flex items-center gap-3 rtl:flex-row-reverse">
            <LanguageToggle />
            {/* Notifications bell hidden until notifications ship. */}
            <Link
              to="/eve/profile"
              aria-label="Profile"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-eve-teal text-white"
            >
              <User className="h-4 w-4" />
            </Link>
          </div>
        </header>
        <main
          key={pathname}
          className={
            (hideNav ? "px-5 pt-4" : "px-5 pt-4") +
            " animate-[eve-fade_220ms_ease-out]"
          }
          style={{
            paddingBottom: hideNav
              ? undefined
              : "calc(env(safe-area-inset-bottom) + 7rem)",
          }}
        >
          {children}
        </main>
      </div>
      {!hideNav && <BottomNav />}
    </div>
  );

  if (unprotected) return content;
  return <ProtectedRoute requiredType="mother">{content}</ProtectedRoute>;
}
