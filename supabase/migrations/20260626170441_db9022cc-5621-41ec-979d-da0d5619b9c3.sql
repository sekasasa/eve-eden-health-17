CREATE TABLE IF NOT EXISTS public.provider_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_ref text UNIQUE,
  display_name text,
  business_name text,
  provider_type text NOT NULL DEFAULT 'doula',
  credential_text text,
  doula_services text[] DEFAULT '{}',
  region text,
  country text,
  state_or_province text,
  city text,
  service_area text,
  languages text[] DEFAULT '{}',
  specialties text[] DEFAULT '{}',
  cultural_fit_tags text[] DEFAULT '{}',
  birth_preference_tags text[] DEFAULT '{}',
  fee_or_rate_public_text text,
  source_name text,
  source_type text NOT NULL DEFAULT 'public_directory_reference',
  certification_source text,
  source_url text,
  last_checked_at timestamptz,
  verification_status text NOT NULL DEFAULT 'public_directory_reference'
    CHECK (verification_status IN ('public_directory_reference','needs_verification','outreach_started','contacted','claimed_profile','verified_partner','rejected','inactive')),
  outreach_status text,
  display_in_app boolean NOT NULL DEFAULT false,
  internal_notes text,
  converted_provider_id uuid REFERENCES public.providers(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.provider_leads TO authenticated;
GRANT ALL ON public.provider_leads TO service_role;
ALTER TABLE public.provider_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage provider_leads" ON public.provider_leads
  FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_provider_leads_updated BEFORE UPDATE ON public.provider_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX IF NOT EXISTS provider_leads_dedupe_idx
  ON public.provider_leads (lower(coalesce(display_name,'')), lower(coalesce(city,'')), lower(coalesce(country,'')), coalesce(source_url,''));

INSERT INTO public.provider_leads
  (lead_ref, display_name, business_name, provider_type, credential_text, doula_services, region, country, state_or_province, city, service_area, languages, fee_or_rate_public_text, source_name, source_type, certification_source, source_url, last_checked_at, verification_status, display_in_app, internal_notes)
VALUES ('DONA-LEAD-001', 'Rachel Carbonneau', 'Family Ways', 'doula', 'DONA certification indicated by source', ARRAY['Birth','Postpartum']::text[], 'North America', 'United States', 'Maryland', 'Not specified', 'Maryland', '{}'::text[], 'Birth fee $950-$2500; postpartum $45-$55', 'DONA International', 'public_directory_reference', 'DoulaMatch - Maryland DONA verified list', 'https://doulamatch.net/certifieddoulalist/19/md', '2026-06-26'::timestamptz, 'public_directory_reference', FALSE, 'Public lead only; verify directly with doula before display.'),
('DONA-LEAD-002', 'Nathalie Grolleman CD/PCD(DONA) HCHD CVD (TVL) ICU nurse', 'Doula Nathalie & Associates', 'doula', 'CD/PCD(DONA) indicated by source', ARRAY['Birth','Postpartum']::text[], 'North America', 'United States', 'Maryland', 'Not specified', 'Maryland', '{}'::text[], 'Birth fee $1400-$2500; postpartum $45-$55', 'DONA International', 'public_directory_reference', 'DoulaMatch - Maryland DONA verified list', 'https://doulamatch.net/certifieddoulalist/19/md', '2026-06-26'::timestamptz, 'public_directory_reference', FALSE, 'Public lead only; verify directly with doula before display.'),
('DONA-LEAD-003', 'Amy Lentner CD(DONA), HCHD', 'Birth You Desire, LLC', 'doula', 'DONA International - Certified Birth Doula indicated by source', ARRAY['Birth','Postpartum']::text[], 'North America', 'United States', 'District of Columbia', 'Washington', '25 miles', '{}'::text[], 'Postpartum rate $50-$55; birth fee not specified', 'DONA International', 'public_directory_reference', 'DoulaMatch profile', 'https://doulamatch.net/profile/10591/amy-lentner-cd-dona-hchd', '2026-06-26'::timestamptz, 'public_directory_reference', FALSE, 'Public lead only; verify directly with doula before display.'),
('DONA-LEAD-004', 'Alisha Faison', 'Alisha The Doula', 'doula', 'CD/PCD(DONA) indicated by source', ARRAY['Birth','Postpartum']::text[], 'North America', 'United States', 'Maryland', 'Baltimore', 'Baltimore, Maryland', '{}'::text[], NULL, 'DONA International', 'public_directory_reference', 'BornBir profile', 'https://www.bornbir.com/alisha-faison', '2026-06-26'::timestamptz, 'public_directory_reference', FALSE, 'Public lead only; verify directly with doula before display.'),
('DONA-LEAD-005', 'Shannon Serrano, CD(DONA)', 'Shannon Your Doula, LLC', 'doula', 'CD(DONA) indicated by source', ARRAY['Birth','Postpartum','Infertility/Fertility']::text[], 'North America', 'United States', 'Maryland', 'Burtonsville', 'Washington, DC area', '{}'::text[], NULL, 'DONA International', 'public_directory_reference', 'Motherfigure profile', 'https://motherfigure.com/directory/doula/shannon-serrano/', '2026-06-26'::timestamptz, 'public_directory_reference', FALSE, 'Public lead only; verify directly with doula before display.'),
('DONA-LEAD-006', 'Rachael Konechne', 'Rachael Konechne', 'doula', 'DONA certified birth doula indicated by source', ARRAY['Birth','Prenatal coaching','Breastfeeding support']::text[], 'North America', 'United States', 'Maryland', 'Manchester', 'Maryland', '{}'::text[], NULL, 'DONA International', 'public_directory_reference', 'Cascade Christian Childbirth - Maryland listing', 'https://christianchildbirth.org/maryland', '2026-06-26'::timestamptz, 'public_directory_reference', FALSE, 'Public lead only; verify directly with doula before display. Contact details intentionally omitted from upload pack.'),
('DONA-LEAD-007', 'Dominique Jones', 'M.A.M.A. Mom’s Advocate & Maternal Advisor Birth Services', 'doula', 'DONA Certified Birth Doula indicated by source', ARRAY['Full-spectrum','Pregnancy','Postpartum']::text[], 'North America', 'United States', 'Maryland', 'Clinton', 'Maryland/DC area', '{}'::text[], NULL, 'DONA International', 'public_directory_reference', 'BornBir profile', 'https://www.bornbir.com/dominique-jones', '2026-06-26'::timestamptz, 'public_directory_reference', FALSE, 'Public lead only; verify directly with doula before display.'),
('DONA-LEAD-008', 'Jessica Helsper', 'Not specified', 'doula', 'Certified Birth Doula, DONA (2024) indicated by source', ARRAY['Birth','Fertility']::text[], 'North America', 'United States', 'District of Columbia', 'Washington', 'Washington, DC', ARRAY['Spanish indicated by education background but verify']::text[], NULL, 'DONA International', 'public_directory_reference', 'BornBir profile', 'https://www.bornbir.com/jessica-helsper', '2026-06-26'::timestamptz, 'public_directory_reference', FALSE, 'Public lead only; verify directly with doula before display.'),
('DONA-LEAD-009', 'Elizabeth Oldham CD(DONA), HCHD, HBCE', 'Not specified', 'doula', 'CD(DONA) indicated by source', ARRAY['Birth']::text[], 'North America', 'United States', 'District of Columbia', 'Washington', 'Washington, DC', '{}'::text[], NULL, 'DONA International', 'public_directory_reference', 'DoulaMatch profile', 'https://doulamatch.net/profile/6352/elizabeth-oldham-cd-dona-hchd-hbce', '2026-06-26'::timestamptz, 'public_directory_reference', FALSE, 'Public lead only; verify directly with doula before display.'),
('DONA-LEAD-010', 'Kerry Reynolds CD(DONA), HBCD', 'Birth in Bloom', 'doula', 'CD(DONA) indicated by source', ARRAY['Birth']::text[], 'North America', 'United States', 'Not specified', 'Not specified', 'Not specified', '{}'::text[], 'Full birth doula support $3000 indicated by source', 'DONA International', 'public_directory_reference', 'Birth in Bloom profile', 'https://www.birthinbloom.com/birth-doula-services', '2026-06-26'::timestamptz, 'public_directory_reference', FALSE, 'Public lead only; verify directly with doula before display.')
ON CONFLICT (lead_ref) DO UPDATE SET
  last_checked_at = EXCLUDED.last_checked_at,
  internal_notes = EXCLUDED.internal_notes,
  source_url = EXCLUDED.source_url;

INSERT INTO public.directory_resources (resource_name, category, region, country, city_scope, language_support, display_section, source_url, notes)
SELECT 'DONA International Doula Directory', 'doula_directory', 'Global', 'United States', 'Global',
  'English', 'external_resources_providers',
  'https://dona.org/find-a-dona-certified-doula/',
  'Search DONA-certified birth and postpartum doulas by location and support type. External resource — not an Eve & Eden verified provider list.'
WHERE NOT EXISTS (
  SELECT 1 FROM public.directory_resources WHERE source_url = 'https://dona.org/find-a-dona-certified-doula/'
);