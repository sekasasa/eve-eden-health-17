import { useTranslation } from "react-i18next";

/** Community page header: title + supporting copy. */
export function CommunityHeader() {
  const { t } = useTranslation();
  return (
    <header className="pt-2 rtl:text-right">
      <h1 className="font-serif text-3xl text-eve-teal-dark">{t("community.title")}</h1>
      <p className="mt-1 font-sans text-[14px] leading-relaxed text-eve-teal-dark/75">
        {t("community.intro")}
      </p>
    </header>
  );
}
