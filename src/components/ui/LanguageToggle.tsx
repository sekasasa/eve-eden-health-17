import { useEffect } from "react";
import { Globe, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { LANGS, AppLang } from "@/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Globe icon + dropdown with the supported languages. Darija is listed as
 * "coming soon" and is not selectable. Persists the choice to
 * profile.language.
 */
export function LanguageToggle({
  className = "",
}: {
  className?: string;
}) {
  const { lang, changeLanguage } = useLanguage();
  const { t, i18n } = useTranslation();

  useEffect(() => {}, [i18n.language]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("language.label")}
        className={`flex h-9 w-9 items-center justify-center rounded-full bg-eve-cream text-eve-teal-dark ${className}`}
      >
        <Globe className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[200px]">
        {LANGS.map((l) =>
          l.comingSoon ? (
            <DropdownMenuItem
              key={l.code}
              disabled
              className="flex items-center justify-between gap-3 font-sans text-sm opacity-60"
              onSelect={(e) => e.preventDefault()}
            >
              <span>{l.native}</span>
              <span className="rounded-full bg-eve-cream px-2 py-0.5 text-[10px] uppercase tracking-wide text-eve-muted">
                {t("language.comingSoon")}
              </span>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              key={l.code}
              onSelect={() => void changeLanguage(l.code as AppLang)}
              className="flex items-center justify-between gap-3 font-sans text-sm"
            >
              <span>{l.native}</span>
              {lang === l.code && (
                <Check className="h-3.5 w-3.5 text-eve-teal" strokeWidth={3} />
              )}
            </DropdownMenuItem>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
