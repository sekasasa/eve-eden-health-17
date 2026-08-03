import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Users, Sparkles, HeartHandshake, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { t } = useTranslation();

  const left = [
    { to: "/eve/home", label: t("nav.home"), icon: Home },
    { to: "/eve/community", label: t("nav.community"), icon: Users },
  ];
  const right = [
    { to: "/eve/care", label: t("nav.care"), icon: HeartHandshake },
    { to: "/eve/profile", label: t("nav.you"), icon: User },
  ];

  const isActive = (to: string) => pathname === to || pathname.startsWith(to + "/");

  return (
    <nav
      aria-label={t("nav.primary")}
      className="fixed bottom-0 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 px-3"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
    >
      <div className="relative flex items-center justify-around rounded-2xl bg-eve-cream px-2 py-2 shadow-[0_-2px_20px_rgba(0,0,0,0.06)] rtl:flex-row-reverse">
        {left.map((item) => (
          <NavItem key={item.to} {...item} active={isActive(item.to)} />
        ))}

        <Link
          to="/eve/ask"
          aria-label={t("nav.ask")}
          aria-current={isActive("/eve/ask") ? "page" : undefined}
          className={cn(
            "relative -mt-8 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-eve-teal text-white shadow-lg transition-transform active:scale-95",
            isActive("/eve/ask") && "ring-4 ring-eve-teal/25",
          )}
        >
          <Sparkles className="h-6 w-6" />
        </Link>

        {right.map((item) => (
          <NavItem key={item.to} {...item} active={isActive(item.to)} />
        ))}
      </div>
    </nav>
  );
}

function NavItem({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5 py-1 text-center font-sans text-[11px] leading-tight",
        active ? "font-semibold text-eve-teal" : "text-eve-teal-dark/70",
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="truncate px-0.5">{label}</span>
    </Link>
  );
}
