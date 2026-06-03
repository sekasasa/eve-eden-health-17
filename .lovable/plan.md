## Vendor Content Studio — Implementation Plan

A new content marketing layer that lets verified vendors/providers publish articles, videos, tips, events, and promotions, with personalized surfacing on vendor profiles, Community & Support, and pathway pages.

### 1. Database (single migration)

New table `vendor_content`:
- `vendor_id` (FK → vendors)
- `title`, `body`, `excerpt`
- `content_type`: enum-like text (`article` | `video` | `tip` | `event` | `promotion`)
- `category` (text — TTC, IVF, pregnancy, postpartum, newborn, pcos, labs, rx, insurance, mood, wellness, family, baby, community)
- `life_stage` (text — matches `LifeStage` keys)
- `related_service`, `language`, `location`, `tags[]`
- `media_url` (image or video), `cta_type`, `cta_url`
- `status`: `draft` | `submitted` | `approved` | `published` | `needs_edits` | `archived`
- `requires_review` (bool — true for clinical categories)
- `event_at` (timestamptz, nullable)
- analytics counters: `views`, `saves`, `profile_visits`, `booking_clicks`, `quote_requests`, `messages`, `event_registrations`, `shop_clicks`
- standard `created_at`, `updated_at`

New table `vendor_content_saves` (user_id, content_id, created_at) for "Save post".

RLS:
- Public can `SELECT` rows where `status = 'published'`.
- Vendor owner (matched via `vendors.user_id = auth.uid()`) can full CRUD their own rows.
- Admins (via existing `is_admin`) can update status (for the review step).
- `vendor_content_saves`: user manages own rows.

Grants: anon SELECT (published only via policy), authenticated full per policy, service_role ALL.

### 2. Vendor Dashboard — Content Studio

New route `src/routes/eden.vendor.content.tsx`:
- Lists vendor's posts grouped by status.
- Action tiles: Create article, Upload video, Post a tip, Share event, Promote service, View performance.
- Each opens a shared composer route.

New route `src/routes/eden.vendor.content.new.tsx` (and `$id.edit.tsx`):
- Form: type, title, category, life stage, language, location, tags, media, body, CTA type + URL, event_at (if event).
- Save Draft / Submit for Review / Publish (publish blocked if `requires_review` is true — sends to `submitted`).
- Disclaimer banner on clinical categories.

Performance view: simple counters per post.

Add **Content Studio** card to existing `eden.vendor.dashboard.tsx`.

### 3. Customer-facing surfaces

Shared `<ContentCard />` component in `src/components/ui/ContentCard.tsx` showing: type badge, category/stage tag, vendor name + verified badge, est. read/watch time, save button, CTA.

Personalization helper `src/lib/content-filter.ts`: given `MatchIntake`, ranks content by life_stage match → category match → language match → location.

Placements:
- **Vendor profile** (`eve.vendors.$id.tsx`): new "Articles & videos from this partner" section showing this vendor's published content.
- **Community & Support** (`eve.community.tsx`): "Helpful guides from trusted partners" — personalized.
- **Pathway pages**: small "Helpful guides" strip on `eve.providers.tsx`, `eve.match.labs.tsx`, `eve.match.insurance.tsx`, `eve.vendors.tsx` filtered by relevant categories.

New route `src/routes/eve.content.$id.tsx`: full reader view with disclaimer for clinical content, vendor CTA, save button, view counter increment.

### 4. Safety / disclaimers

Reusable `<SafetyDisclaimer />` shown on any content where category ∈ {labs, rx, ivf, ttc, pregnant, postpartum, pcos, mood} or `requires_review` is true.

### 5. Out of scope

- Admin moderation UI (status changes can be done by admins via existing admin shell later — not part of this turn unless requested)
- Rich text editor (use textarea + line breaks)
- Video transcoding (store URL only)
- Email notifications

### Files to create
- migration (vendor_content + vendor_content_saves + policies + grants)
- `src/lib/content-filter.ts`
- `src/components/ui/ContentCard.tsx`
- `src/components/ui/SafetyDisclaimer.tsx`
- `src/routes/eden.vendor.content.tsx`
- `src/routes/eden.vendor.content.new.tsx`
- `src/routes/eden.vendor.content.$id.edit.tsx`
- `src/routes/eve.content.$id.tsx`

### Files to edit
- `src/routes/eden.vendor.dashboard.tsx` — add Content Studio entry
- `src/routes/eve.vendors.$id.tsx` — partner content section
- `src/routes/eve.community.tsx` — personalized partner guides
- `src/routes/eve.vendors.tsx`, `eve.providers.tsx`, `eve.match.labs.tsx`, `eve.match.insurance.tsx` — pathway content strips

Approve to proceed.