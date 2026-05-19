import { Link, useRouterState } from "@tanstack/react-router";
import { Home, BookOpen, Sparkles, Calendar, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const left = [
  { to: "/eve/home", key: "home", icon: Home },
  { to: "/eve/guidance", key: "guidance", icon: BookOpen },
] as const;

const right = [
  { to: "/eve/appointments", key: "appointments", icon: Calendar },
  { to: "/eve/profile", key: "profile", icon: User },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { t } = useTranslation();

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 px-3 pb-3">
      <div className="relative flex items-center justify-around rounded-2xl bg-eve-cream px-2 py-2 shadow-[0_-2px_20px_rgba(0,0,0,0.04)]">
        {left.map((item) => (
          <NavItem
            key={item.to}
            to={item.to}
            label={t(`nav.${item.key}`)}
            icon={item.icon}
            active={pathname === item.to}
          />
        ))}

        <Link
          to="/eve/ask"
          className="relative -mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-eve-teal text-white shadow-lg transition-transform active:scale-95"
          aria-label={t("nav.ask")}
        >
          <Sparkles className="h-6 w-6" />
        </Link>

        {right.map((item) => (
          <NavItem
            key={item.to}
            to={item.to}
            label={t(`nav.${item.key}`)}
            icon={item.icon}
            active={pathname.startsWith(item.to)}
          />
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
      className={cn(
        "flex flex-1 flex-col items-center gap-1 py-1 font-sans text-[10px]",
        active ? "text-eve-teal" : "text-eve-muted",
      )}
    >
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  );
}
