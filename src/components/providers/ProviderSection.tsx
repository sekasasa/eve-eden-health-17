import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Generic profile section wrapper: heading + body, with a single truthful
 * empty state when the section has no real data to show.
 */
export function ProviderSection({
  title,
  emptyText,
  isEmpty = false,
  children,
  className,
}: {
  title: string;
  emptyText?: string;
  isEmpty?: boolean;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("mt-6 rtl:text-right", className)}>
      <h2 className="font-serif text-lg text-eve-forest">{title}</h2>
      {isEmpty ? (
        <p className="mt-2 font-sans text-[14px] leading-relaxed text-eve-teal-dark/75">
          {emptyText}
        </p>
      ) : (
        children
      )}
    </section>
  );
}

/** Label/value rows rendered only for fields that actually exist. */
export function ProviderFactList({ items }: { items: { label: string; value: string }[] }) {
  if (items.length === 0) return null;
  return (
    <dl className="mt-3 grid gap-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-eve-sand bg-white p-3 rtl:text-right"
        >
          <dt className="font-sans text-[13px] font-semibold text-eve-forest">{item.label}</dt>
          <dd className="mt-0.5 font-sans text-[14px] leading-relaxed text-eve-teal-dark/80">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
