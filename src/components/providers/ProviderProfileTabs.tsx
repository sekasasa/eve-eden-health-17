import { useState } from "react";
import { ANALYTICS_EVENTS, track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

export type ProviderTabKey = "overview" | "services" | "community" | "events";

const TABS: { key: ProviderTabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "services", label: "Services" },
  { key: "community", label: "Community" },
  { key: "events", label: "Events" },
];

export function ProviderProfileTabs({
  value,
  onChange,
}: {
  value: ProviderTabKey;
  onChange: (key: ProviderTabKey) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Provider profile sections"
      className="-mx-5 mt-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden rtl:flex-row-reverse"
    >
      {TABS.map((t) => {
        const active = t.key === value;
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => {
              onChange(t.key);
              if (t.key === "services") {
                track(ANALYTICS_EVENTS.providerServicesOpened);
              }
            }}
            className={cn(
              "min-h-11 shrink-0 rounded-full px-4 font-sans text-[14px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eve-teal focus-visible:ring-offset-2",
              active
                ? "bg-eve-teal text-white"
                : "border border-eve-sand bg-white text-eve-teal-dark/75",
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

/** Services parsed from the provider's own listing — no invented offerings. */
export function ProviderServices({ services }: { services?: string | null }) {
  const items = (services ?? "")
    .split(/[,;|\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (items.length === 0) {
    return (
      <p className="mt-4 font-sans text-[14px] leading-relaxed text-eve-teal-dark/75">
        This provider has not listed individual services yet. Ask what they offer
        when you contact them.
      </p>
    );
  }

  return (
    <ul className="mt-4 flex flex-wrap gap-2">
      {items.map((s) => (
        <li
          key={s}
          className="rounded-full border border-eve-sand bg-white px-3 py-2 font-sans text-[14px] text-eve-teal-dark"
        >
          {s}
        </li>
      ))}
    </ul>
  );
}

/** Read-more bio block. */
export function ProviderAbout({ bio, name }: { bio: string; name?: string | null }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="mt-4 rtl:text-right">
      <h2 className="font-serif text-lg text-eve-forest">
        About {name?.split(" ")[0] ?? "this provider"}
      </h2>
      <p
        className={cn(
          "mt-2 font-sans text-[15px] leading-relaxed text-eve-teal-dark/85",
          !open && "line-clamp-4",
        )}
      >
        {bio}
      </p>
      {bio.length > 180 && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-1 min-h-11 font-sans text-[14px] font-medium text-eve-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eve-teal focus-visible:ring-offset-2"
        >
          {open ? "Show less" : "Read more"}
        </button>
      )}
    </section>
  );
}
