# Trusted Referral + Care Coordination Network

A lightweight care-coordination + marketing layer added on top of the existing Eve & Eden vendor dashboard, Content Studio, and customer surfaces. No redesign — same warm palette, rounded cards, typography, and spacing.

## What we're building

### Vendor / provider side (`/eden/*`)
1. **Leads** (`/eden/leads`) — incoming customers from search, content, referrals, community, navigator, insurance match. Filter by status (new, contacted, booked, completed, closed). Each lead shows source attribution (e.g. "from article: What to ask before your first IVF consultation"). Manual status updates + "Refer" / "Message" actions.
2. **Referrals** (`/eden/referrals`) — sent + received tabs. Compose a referral (customer, reason, urgency, recommended partner, notes, documents to share, permission requested, follow-up due). Full status timeline: draft → sent → viewed → accepted → appointment requested → confirmed → checked in → completed → follow-up needed → closed / declined.
3. **My Trusted Partners** (`/eden/partners`) — saved preferred OB-GYNs, IVF clinics, labs, pharmacies, therapists, nutritionists, lactation consultants, pediatricians, doulas/midwives, insurance partners, shops. Each card: name, category, verified badge, location, languages, payment options, "Why I recommend", Refer button.
4. **Shared Care Documents** (`/eden/shared-docs`) — list of documents customers have explicitly shared. Actions: view, mark reviewed, add follow-up recommendation, refer, message, ask navigator. Customer-controls privacy note shown prominently.
5. **Appointment + Referral Tracker** integrated into the referrals page and existing `/eden/appointments` — status pills (requested, confirmed, reminder sent, checked in, completed, no-show, rescheduled, follow-up needed) + update actions.
6. **Content Studio analytics extension** — add `referrals_generated`, `new_leads`, `completed_bookings` columns alongside existing per-post analytics.

### Customer side (`/eve/*`)
1. **Care Passport** (`/eve/passport`) — single screen pulling from the user's saved profile (`useSavedProfile`) plus uploaded docs (labs, scans, prescriptions, insurance, appointments, referrals, care plan, family supporters). Granular sharing toggles per provider.
2. **Incoming Referrals** (`/eve/referrals`) — "Your provider recommends this next step" cards. Shows recommended partner, reason, urgency, what to bring, documents to share, payment options. Actions: Accept & book, Save, Decline, Ask for another option, Ask navigator, Share selected passport info.
3. **Document sharing controls** — embedded on Care Passport: share all / selected docs / labs only / Rx only / appointments only / insurance only / referral note only / hide sensitive.
4. **Confirm appointment status** — quick actions on referral cards: I booked, I attended, Need to reschedule, Need help.
5. **Lead source attribution** — when the user contacts a vendor from a content piece, the lead row captures the source content ID.

### Cross-cutting
- **Closed-loop tracking**: referrals notify the referring provider when completed (only if customer consent allows).
- **Safety disclaimers** reused from existing `SafetyDisclaimer` component on all clinical surfaces.
- **Privacy note** ("The customer controls what information is shared.") shown on every provider-side document/passport view.

## Technical details

### Database (one migration)
New tables, all with RLS + GRANTs + `updated_at` triggers:

- `leads` — `vendor_id`, `customer_user_id` (nullable for walk-ins), `customer_display_name`, `life_stage`, `need`, `location`, `language`, `payment_preference`, `source` (enum: search/referral/article/video/community/navigator/insurance), `source_content_id` (fk vendor_content), `status` (new/contacted/booked/completed/closed), `notes`.
- `referrals` — `from_vendor_id`, `to_vendor_id` (nullable, can be free-text suggestion), `to_category`, `customer_user_id`, `reason`, `urgency` (low/normal/urgent), `notes`, `documents_requested` jsonb, `permission_requested` bool, `follow_up_due`, `status` (draft/sent/viewed/accepted/appt_requested/appt_confirmed/checked_in/completed/follow_up/closed/declined), `customer_consent_share_completion` bool.
- `trusted_partners` — `owner_vendor_id`, `partner_vendor_id` (nullable), `partner_name`, `category`, `location`, `languages` text[], `payment_options` text[], `recommendation_note`, `verified` bool.
- `care_documents` — `customer_user_id`, `doc_type` (lab/scan/rx/discharge/insurance/claim/care_note/referral_note), `title`, `file_url`, `notes`, `sensitive` bool.
- `document_shares` — `document_id`, `customer_user_id`, `vendor_id`, `granted_at`, `revoked_at`, `reviewed_at`, `follow_up_note`.
- `passport_shares` — `customer_user_id`, `vendor_id`, `scope` jsonb (`{all, labs, rx, appointments, insurance, referral_note, hide_sensitive}`), `granted_at`, `revoked_at`.

RLS:
- Customers manage their own care_documents, document_shares, passport_shares, and can read referrals where they're the customer.
- Vendors can read leads/referrals/trusted_partners/document_shares scoped to `vendor_id` via existing `vendors.user_id = auth.uid()` join (security definer helper `is_vendor_owner(_vendor_id)`).
- Vendors can read care_documents only via an active `document_shares` row (no revoked_at).

Extend `vendor_content` analytics: add `referrals_generated`, `new_leads`, `completed_bookings` integer columns (default 0).

### Routes (TanStack file-based)

Provider/vendor:
- `src/routes/eden.leads.tsx`
- `src/routes/eden.referrals.tsx` (sent + received tabs; compose modal)
- `src/routes/eden.partners.tsx`
- `src/routes/eden.shared-docs.tsx`

Customer:
- `src/routes/eve.passport.tsx`
- `src/routes/eve.referrals.tsx`

### Sidebar / dashboard wiring
- `src/components/shells/EdenSidebar.tsx` — add Leads, Referrals, Trusted Partners, Shared Docs to both `PROVIDER_NAV` and `VENDOR_NAV`.
- `src/routes/eden.dashboard.tsx` — add 4 quick-action cards mirroring above.
- `src/components/shells/EveShell.tsx` — add Passport + Referrals link.
- `src/routes/eve.home.tsx` — surface latest incoming referrals as a card in the dashboard.

### Components (reused style)
- `ReferralCard`, `LeadRow`, `PartnerCard`, `PassportSection`, `ShareToggleRow`, `StatusPill`. All use existing tokens (`eve-teal`, rounded-2xl, etc.) — no new design system.

### Personalization
Reuse `useSavedProfile()` to prefill Care Passport (stage, language, location, payment preference, current providers from match results).

### Source attribution
When user clicks a vendor's CTA from `eve.content.$id.tsx` or `eve.vendors.$id.tsx`, insert a `leads` row with `source` + `source_content_id` populated (RPC `create_lead_from_source`).

## Out of scope
- Full EHR / clinical records.
- Provider-to-provider messaging beyond referral notes.
- Real file upload UI for documents (we'll accept file_url strings; storage bucket can be added later).
- Insurance claim automation.

## Build order
1. Migration (tables + RLS + GRANTs + content analytics columns).
2. Vendor side: leads, referrals, partners, shared-docs pages + sidebar links + dashboard cards.
3. Customer side: passport + referrals pages + EveShell links + home card.
4. Source attribution hooks on vendor profile + content reader.
5. Content Studio analytics columns rendering.
