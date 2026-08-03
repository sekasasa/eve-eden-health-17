import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  getPublicCircles,
  type PublicCircle,
} from "@/features/community/services/circlesService";

/**
 * Compact browse-only preview of up to 3 curated circles.
 * Prioritises a country match only when it is safely derivable from saved
 * preferences; otherwise shows the first three active curated circles and
 * makes no personalization claim.
 */
export function CommunityCirclesPreview({ countryCode }: { countryCode?: string | null }) {
  const { t } = useTranslation();
  const [circles, setCircles] = useState<PublicCircle[]>([]);
  const [matched, setMatched] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await getPublicCircles({ limit: 50 });
      if (cancelled || !result.ok) return;
      const all = result.data;
      const local = countryCode
        ? all.filter((c) => c.country_code === countryCode)
        : [];
      const picked = local.length > 0 ? [...local, ...all].slice(0, 3) : all.slice(0, 3);
      const unique = picked.filter(
        (c, i, arr) => arr.findIndex((x) => x.id === c.id) === i,
      );
      setCircles(unique);
      setMatched(local.length > 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [countryCode]);

  if (circles.length === 0) return null;

  return (
    <section className="mt-5 rounded-2xl border border-eve-sand bg-white p-4 rtl:text-right">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-sans text-sm font-semibold text-eve-teal-dark">
            {t("community.circles.previewTitle")}
          </p>
          <p className="mt-0.5 text-[12px] text-eve-muted">
            {matched
              ? t("community.circles.previewNearYou")
              : t("community.circles.previewGeneric")}
          </p>
        </div>
        <Link
          to="/eve/community/circles"
          className="shrink-0 text-[13px] font-medium text-eve-teal"
        >
          {t("community.circles.explore")}
        </Link>
      </div>

      <ul className="mt-3 space-y-2">
        {circles.map((c) => (
          <li key={c.id}>
            <Link
              to="/eve/community/circle/$slug"
              params={{ slug: c.slug }}
              className="block rounded-xl border border-eve-sand px-3 py-2"
            >
              <span className="block text-[13px] font-medium text-eve-teal-dark">
                {c.name}
              </span>
              <span className="mt-0.5 block text-[12px] text-eve-muted">
                {c.description}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
