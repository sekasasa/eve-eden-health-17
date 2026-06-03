
-- Helper: is the caller the owner of this vendor row?
CREATE OR REPLACE FUNCTION public.is_vendor_owner(_vendor_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.vendors
    WHERE id = _vendor_id AND user_id = auth.uid()
  );
$$;

-- ============ leads ============
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  customer_user_id uuid,
  customer_display_name text,
  life_stage text,
  need text,
  location text,
  language text,
  payment_preference text,
  source text NOT NULL DEFAULT 'search',
  source_content_id uuid REFERENCES public.vendor_content(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'new',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vendor owner manages leads" ON public.leads
  FOR ALL TO authenticated
  USING (public.is_vendor_owner(vendor_id))
  WITH CHECK (public.is_vendor_owner(vendor_id));
CREATE POLICY "customer can create own lead" ON public.leads
  FOR INSERT TO authenticated
  WITH CHECK (customer_user_id = auth.uid());
CREATE POLICY "customer can read own leads" ON public.leads
  FOR SELECT TO authenticated
  USING (customer_user_id = auth.uid());

-- ============ referrals ============
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  to_vendor_id uuid REFERENCES public.vendors(id) ON DELETE SET NULL,
  to_partner_name text,
  to_category text,
  customer_user_id uuid NOT NULL,
  reason text,
  urgency text NOT NULL DEFAULT 'normal',
  notes text,
  documents_requested jsonb NOT NULL DEFAULT '[]'::jsonb,
  permission_requested boolean NOT NULL DEFAULT true,
  follow_up_due date,
  status text NOT NULL DEFAULT 'draft',
  customer_consent_share_completion boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "from vendor manages referral" ON public.referrals
  FOR ALL TO authenticated
  USING (public.is_vendor_owner(from_vendor_id))
  WITH CHECK (public.is_vendor_owner(from_vendor_id));
CREATE POLICY "to vendor reads and updates referral" ON public.referrals
  FOR SELECT TO authenticated
  USING (to_vendor_id IS NOT NULL AND public.is_vendor_owner(to_vendor_id));
CREATE POLICY "to vendor updates status" ON public.referrals
  FOR UPDATE TO authenticated
  USING (to_vendor_id IS NOT NULL AND public.is_vendor_owner(to_vendor_id))
  WITH CHECK (to_vendor_id IS NOT NULL AND public.is_vendor_owner(to_vendor_id));
CREATE POLICY "customer reads own referrals" ON public.referrals
  FOR SELECT TO authenticated
  USING (customer_user_id = auth.uid());
CREATE POLICY "customer updates own referral status" ON public.referrals
  FOR UPDATE TO authenticated
  USING (customer_user_id = auth.uid())
  WITH CHECK (customer_user_id = auth.uid());

-- ============ trusted_partners ============
CREATE TABLE public.trusted_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  partner_vendor_id uuid REFERENCES public.vendors(id) ON DELETE SET NULL,
  partner_name text NOT NULL,
  category text NOT NULL,
  location text,
  languages text[] NOT NULL DEFAULT '{}',
  payment_options text[] NOT NULL DEFAULT '{}',
  recommendation_note text,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trusted_partners TO authenticated;
GRANT ALL ON public.trusted_partners TO service_role;
ALTER TABLE public.trusted_partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner manages trusted partners" ON public.trusted_partners
  FOR ALL TO authenticated
  USING (public.is_vendor_owner(owner_vendor_id))
  WITH CHECK (public.is_vendor_owner(owner_vendor_id));

-- ============ care_documents ============
CREATE TABLE public.care_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_user_id uuid NOT NULL,
  doc_type text NOT NULL,
  title text NOT NULL,
  file_url text,
  notes text,
  sensitive boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.care_documents TO authenticated;
GRANT ALL ON public.care_documents TO service_role;
ALTER TABLE public.care_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customer manages own care documents" ON public.care_documents
  FOR ALL TO authenticated
  USING (customer_user_id = auth.uid())
  WITH CHECK (customer_user_id = auth.uid());

-- ============ document_shares ============
CREATE TABLE public.document_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.care_documents(id) ON DELETE CASCADE,
  customer_user_id uuid NOT NULL,
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  reviewed_at timestamptz,
  follow_up_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_shares TO authenticated;
GRANT ALL ON public.document_shares TO service_role;
ALTER TABLE public.document_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customer manages shares" ON public.document_shares
  FOR ALL TO authenticated
  USING (customer_user_id = auth.uid())
  WITH CHECK (customer_user_id = auth.uid());
CREATE POLICY "vendor reads shares scoped to them" ON public.document_shares
  FOR SELECT TO authenticated
  USING (public.is_vendor_owner(vendor_id));
CREATE POLICY "vendor updates shares scoped to them" ON public.document_shares
  FOR UPDATE TO authenticated
  USING (public.is_vendor_owner(vendor_id))
  WITH CHECK (public.is_vendor_owner(vendor_id));

-- Allow vendors to read a care document when an active share exists
CREATE POLICY "vendor reads shared care document" ON public.care_documents
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.document_shares ds
    WHERE ds.document_id = care_documents.id
      AND ds.revoked_at IS NULL
      AND public.is_vendor_owner(ds.vendor_id)
  ));

-- ============ passport_shares ============
CREATE TABLE public.passport_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_user_id uuid NOT NULL,
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  scope jsonb NOT NULL DEFAULT '{}'::jsonb,
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.passport_shares TO authenticated;
GRANT ALL ON public.passport_shares TO service_role;
ALTER TABLE public.passport_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customer manages passport shares" ON public.passport_shares
  FOR ALL TO authenticated
  USING (customer_user_id = auth.uid())
  WITH CHECK (customer_user_id = auth.uid());
CREATE POLICY "vendor reads passport shares scoped to them" ON public.passport_shares
  FOR SELECT TO authenticated
  USING (public.is_vendor_owner(vendor_id));

-- ============ vendor_content analytics extension ============
ALTER TABLE public.vendor_content
  ADD COLUMN IF NOT EXISTS referrals_generated integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS new_leads integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_bookings integer NOT NULL DEFAULT 0;

-- ============ updated_at triggers ============
CREATE TRIGGER trg_leads_updated BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_referrals_updated BEFORE UPDATE ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_trusted_partners_updated BEFORE UPDATE ON public.trusted_partners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_care_documents_updated BEFORE UPDATE ON public.care_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_document_shares_updated BEFORE UPDATE ON public.document_shares
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_passport_shares_updated BEFORE UPDATE ON public.passport_shares
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
