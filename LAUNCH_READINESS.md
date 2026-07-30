# Launch readiness — Eve & Eden Health

Status: **pre-launch**. This document records what is on, what is deliberately
off, and what still depends on an external approval. Nothing below should be
described to users as available unless the flag is ON in the deployed build.

## Feature flags (`src/lib/flags.ts`)

All flags default **OFF**. A flag turns on only when its environment variable
is set to `on` / `true` / `1` at build time.

| Flag | Env var | Default | Blocks until |
| --- | --- | --- | --- |
| `askEveAi` | `VITE_FLAG_ASK_EVE_AI` | OFF | Clinical safety review of assistant replies signed off |
| `communityPosting` | `VITE_FLAG_COMMUNITY_POSTING` | OFF | Moderation staffing + persisted posts verified |
| `communityModeration` | `VITE_FLAG_COMMUNITY_MODERATION` | OFF | Report queue and moderator tooling live |
| `insuranceVerification` | `VITE_FLAG_INSURANCE_VERIFICATION` | OFF | Insurer integration/agreement confirmed |
| `carePassportSharing` | `VITE_FLAG_CARE_PASSPORT_SHARING` | OFF | Signed URLs, audit log, consent + revocation proven end to end |
| `eventRegistration` | `VITE_FLAG_EVENT_REGISTRATION` | OFF | Venue confirmed and registration backend verified |

While a flag is OFF the UI must say so plainly (`FLAG_OFF_COPY`) and must not
simulate success.

## Safety

- Deterministic high-risk classifier: `src/lib/urgent-safety.ts` (EN/FR/AR),
  covering reduced fetal movement, severe bleeding, severe headache/vision
  change, chest pain, breathing trouble, seizure, loss of consciousness, and
  self-harm / immediate-danger language.
- High-risk input shows country-aware emergency guidance, suppresses generic
  reassurance, and never claims clinician review.
- Emergency numbers by country: `src/lib/personalization.ts`.

## Care Passport

- Route requires an authenticated session; all reads/writes are RLS-scoped to
  the signed-in user (`src/routes/eve.passport.tsx`).
- Document links validated by `src/lib/passport-safety.ts`: https only,
  allow-listed extensions, 10 MB ceiling for future direct uploads.
- Sharing UI is gated OFF with an explicit list of prerequisites shown to the
  user. Do not enable before all three are independently verified.

## CTA truthfulness

Reviewed and corrected in this batch:

- Provider zero state "Notify me" now says it is saved on this device only —
  there is no outbound notification channel.
- Payment options on match results: co-pay and monthly prices are labelled as
  estimates; coverage check and self-pay setup are disabled pending insurer
  confirmation.
- Admin verify/reject toasts no longer claim an email was queued; no email
  sending backend is connected.
- `Add patient` (provider patients) and `Export PDF` (program reports) are
  disabled with "coming soon" copy instead of no-op or toast-only success.

## Environment validation

`src/lib/env-check.ts` validates `VITE_SUPABASE_URL` and
`VITE_SUPABASE_PUBLISHABLE_KEY`, and reports which flag variables are unset.

## Commands

```
npm run typecheck   # tsgo --noEmit
npm run lint        # eslint .
npm run test        # vitest run
npm run build       # production build
```

## Unresolved external dependencies

1. Clinical sign-off on assistant responses (blocks `askEveAi`).
2. Moderation staffing and escalation policy (blocks community posting).
3. Insurer agreements and real copay/coverage data (blocks insurance).
4. Signed-URL storage, audit logging and consent records (blocks passport sharing).
5. Venue, speakers and registration backend for the Casablanca launch event.
6. Approved Terms, Privacy and medical disclaimer text — current routes are
   clearly marked drafts.
7. Transactional email/SMS provider — no outbound messaging exists today.
