## Goal
Make English the default language across the app, gate every signed-in session on an explicit language choice (English, French, Arabic; Darija shown as "Coming soon"), and finish wiring translations so every screen renders in the chosen language.

## 1. Default language = English
- `src/i18n/index.ts`: change `lng: "fr"` → `lng: "en"` and `fallbackLng: "fr"` → `fallbackLng: "en"`.
- `src/hooks/useLanguage.ts`: default unauthenticated/no-profile language to `"en"` instead of `"fr"`.
- `src/routes/eve.onboarding.tsx`: initial `useState("fr")` → `useState("en")`.
- Any place we currently fall back to `"fr"` (greeting, formatters) → fall back to `"en"`.

## 2. Language options
- `LANGS` in `src/i18n/index.ts` becomes:
  - `en` English (active)
  - `fr` Français (active)
  - `ar` العربية (active, RTL)
  - `darija` الدارجة — **disabled, "Coming soon" badge**
- Remove `ber` / `zgh` from the active list. Keep the JSON file for now but stop importing it, and alias any legacy `ber`/`zgh` profile values to `en` on load so existing users aren't stranded.
- `src/components/ui/LanguageToggle.tsx`: render Darija as a disabled row with a "Coming soon" pill; clicking does nothing.

## 3. Post-login language picker
- New route `src/routes/choose-language.tsx`:
  - Full-screen card with the app logo, heading "Choose your language", three large buttons (EN / FR / AR), and a muted "Darija — coming soon" row.
  - On select: `setAppLanguage(code)` + `profiles.update({ language })` + `profiles.update({ language_chosen_at: now() })` → redirect to the destination the user was originally heading to (default `/eve/home` for mothers, `/eden/dashboard` for providers/vendors, etc.).
- Trigger logic (in `src/routes/login.tsx` after successful auth, and in `ProtectedRoute` as a safety net):
  - If `profiles.language_chosen_at` is null → send to `/choose-language?next=<intended path>`.
  - Otherwise apply stored language and continue.
- Keep the header `LanguageToggle` for changing later.

## 4. Complete the translation map
Audit each route file and replace hardcoded English/French strings with `t("…")` keys. Ensure the same key set exists in `en.json`, `fr.json`, `ar.json`.

Scope (existing gaps based on file list):
- Eve customer: `eve.home`, `eve.providers(.id)(.book)`, `eve.vendors(.id)`, `eve.appointments`, `eve.community`, `eve.events`, `eve.guidance`, `eve.ask`, `eve.profile`, `eve.content.$id`, `eve.match.*`, `eve.passport`, `eve.referrals`, `eve.onboarding`.
- Eden provider/vendor: `eden.dashboard`, `eden.vendor.dashboard`, `eden.leads`, `eden.referrals`, `eden.partners`, `eden.shared-docs`, `eden.appointments`, `eden.patients(.id)`, `eden.profile`, `eden.analytics`, `eden.vendor.*`, plus `EdenSidebar`, `CoordinationPanels`.
- Auth + shared: `login`, `signup`, `partner`, `index`, `EveShell`, `BottomNav`, `SafetyDisclaimer`, `OfflineBanner`, `EmptyState`.

Key namespace additions to all 3 locale files:
- `nav.*` (extend with leads, referrals, partners, sharedDocs, passport, content, analytics, patients, orders, products, listing)
- `auth.*` (signIn, signUp, email, password, forgotPassword, googleContinue, errors)
- `chooseLanguage.*` (title, subtitle, comingSoon, continue)
- `eden.dashboard.*`, `eden.leads.*`, `eden.referrals.*`, `eden.partners.*`, `eden.sharedDocs.*` (panel titles, statuses, action labels)
- `coordination.statuses.*` (new, contacted, booked, sent, accepted, completed, follow_up, …)
- `safety.customer`, `safety.provider` (the two disclaimer strings)
- `passport.*`, `referrals.*`, `content.*`, `community.*`, `events.*`, `vendors.*`, `providers.*`, `appointments.*` for missing items.

For each route, the work is: import `useTranslation`, swap literals to `t("…")`, and add the matching keys to all three JSON files. Strings already covered (home greeting, ask, nav, onboarding) stay as-is.

## 5. Out of scope
- Actually translating Darija content.
- Re-translating already-covered keys.
- Visual redesign of any screen.

## Technical notes
- New column needed: `profiles.language_chosen_at timestamptz` (single migration, GRANTed). Used solely to detect first-time language picker.
- RTL handling already exists via `applyDir` — unchanged for Arabic.
- Legacy `ber`/`zgh` profile values: on read, treat as "not chosen" so the user is sent to the picker on next login.
- Build order: (1) migration, (2) i18n config + LanguageToggle + legacy alias, (3) `choose-language` route + login wiring, (4) translation key audit per route group, (5) JSON file updates for en/fr/ar.
