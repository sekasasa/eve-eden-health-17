import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Stethoscope, Sparkles, ClipboardList, User } from "lucide-react";
import { cn } from "@/lib/utils";

const left = [
  { to: "/eve/home", label: "Home", icon: Home },
  { to: "/eve/providers", label: "Find care", icon: Stethoscope },
] as const;

const right = [
  { to: "/eve/match/results", label: "My plan", icon: ClipboardList },
  { to: "/eve/profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 px-3"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
    >
      <div className="relative flex items-center justify-around rounded-2xl bg-eve-cream px-2 py-2 shadow-[0_-2px_20px_rgba(0,0,0,0.04)]">
        {left.map((item) => (
          <NavItem
            key={item.to}
            to={item.to}
            label={item.label}
            icon={item.icon}
            active={pathname === item.to || pathname.startsWith(item.to + "/")}
          />
        ))}

        <Link
          to="/eve/ask"
          className="relative -mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-eve-teal text-white shadow-lg transition-transform active:scale-95"
          aria-label="Ask Eve"
        >
          <Sparkles className="h-6 w-6" />
        </Link>

        {right.map((item) => (
          <NavItem
            key={item.to}
            to={item.to}
            label={item.label}
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
        "flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center gap-1 py-1 font-sans text-[10px]",
        active ? "text-eve-teal" : "text-eve-muted",
      )}
    >
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  );
}
