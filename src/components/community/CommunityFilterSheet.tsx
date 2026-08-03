import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Check, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORIES, FILTER_GROUPS, type CategoryKey } from "@/lib/community-seed";

/**
 * Compact topic filter. Replaces the long pill row with one control that
 * opens a grouped sheet. Category keys are unchanged.
 */
export function CommunityFilterSheet({
  value,
  onChange,
  open,
  onOpenChange,
}: {
  value: CategoryKey;
  onChange: (key: CategoryKey) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const activeLabel =
    value === "all"
      ? t("community.filterAll")
      : (CATEGORIES.find((c) => c.key === value)?.label ?? t("community.filterAll"));

  return (
    <>
      <div className="flex items-center gap-2 rtl:flex-row-reverse">
        <button
          type="button"
          onClick={() => onOpenChange(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-eve-teal/40 bg-white px-4 text-[14px] font-medium text-eve-teal-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eve-teal focus-visible:ring-offset-2"
        >
          <SlidersHorizontal className="h-4 w-4 text-eve-teal" />
          {t("community.filterCta")}
        </button>
        <span className="truncate text-[13px] text-eve-teal-dark/70">{activeLabel}</span>
        {value !== "all" && (
          <button
            type="button"
            onClick={() => onChange("all")}
            className="ms-auto min-h-11 shrink-0 text-[13px] font-medium text-eve-teal underline-offset-2 hover:underline"
          >
            {t("community.filterClear")}
          </button>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("community.filterTitle")}
            className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-3xl"
          >
            <div className="flex items-start justify-between rtl:flex-row-reverse">
              <h2 className="font-serif text-xl font-semibold text-eve-teal-dark">
                {t("community.filterTitle")}
              </h2>
              <button
                ref={closeRef}
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label={t("common.cancel")}
                className="flex h-11 w-11 items-center justify-center rounded-full text-eve-teal-dark/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eve-teal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                onChange("all");
                onOpenChange(false);
              }}
              className={cn(
                "mt-3 flex min-h-11 w-full items-center justify-between rounded-2xl border px-4 text-[14px] rtl:flex-row-reverse",
                value === "all"
                  ? "border-eve-teal bg-eve-teal-light text-eve-teal-dark"
                  : "border-eve-sand text-eve-teal-dark/80",
              )}
            >
              {t("community.filterAll")}
              {value === "all" && <Check className="h-4 w-4 text-eve-teal" />}
            </button>

            {FILTER_GROUPS.map((group) => (
              <section key={group.id} className="mt-5">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-eve-teal-dark/60">
                  {t(`community.groups.${group.id}`)}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {group.keys.map((key) => {
                    const cat = CATEGORIES.find((c) => c.key === key);
                    if (!cat) return null;
                    const isActive = value === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          onChange(key);
                          onOpenChange(false);
                        }}
                        aria-pressed={isActive}
                        className={cn(
                          "min-h-11 rounded-full border px-4 text-[14px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eve-teal focus-visible:ring-offset-2",
                          isActive
                            ? "border-eve-teal bg-eve-teal text-white"
                            : "border-eve-sand bg-eve-cream text-eve-teal-dark/80",
                        )}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
