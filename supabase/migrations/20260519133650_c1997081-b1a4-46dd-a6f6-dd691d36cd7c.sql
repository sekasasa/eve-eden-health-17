
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type text NOT NULL CHECK (user_type IN ('mother','provider','vendor','chw','admin')),
  full_name text,
  phone text,
  country text DEFAULT 'MA',
  language text DEFAULT 'fr',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles: read own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Profiles: insert own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Profiles: update own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Helper: get user_type without recursive RLS
CREATE OR REPLACE FUNCTION public.get_user_type(_user_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT user_type FROM public.profiles WHERE id = _user_id;
$$;

-- ============ PROVIDERS ============
CREATE TABLE public.providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name text,
  specialty text,
  clinic_name text,
  city text,
  country text DEFAULT 'MA',
  bio text,
  languages text[],
  consultation_fee_mad int,
  is_verified bool DEFAULT false,
  accepting_patients bool DEFAULT true,
  avg_rating decimal,
  review_count int DEFAULT 0,
  lat decimal,
  lng decimal,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers: read verified" ON public.providers FOR SELECT TO authenticated USING (is_verified = true OR user_id = auth.uid());
CREATE POLICY "Providers: insert own" ON public.providers FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Providers: update own" ON public.providers FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Providers: delete own" ON public.providers FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ============ VENDORS ============
CREATE TABLE public.vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name text,
  category text CHECK (category IN ('maternity_wear','baby_gear','nutrition','pharmacy','services','classes')),
  city text,
  country text DEFAULT 'MA',
  description text,
  logo_url text,
  is_verified bool DEFAULT false,
  is_featured bool DEFAULT false,
  commission_rate decimal DEFAULT 0.10,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors: read verified" ON public.vendors FOR SELECT TO authenticated USING (is_verified = true OR user_id = auth.uid());
CREATE POLICY "Vendors: insert own" ON public.vendors FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Vendors: update own" ON public.vendors FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Vendors: delete own" ON public.vendors FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ============ MOTHERS ============
CREATE TABLE public.mothers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  city text,
  country text DEFAULT 'MA',
  due_date date,
  pregnancy_week int,
  is_first_pregnancy bool,
  religious_pref text CHECK (religious_pref IN ('none','muslim','christian')),
  dietary_notes text,
  preferred_provider_id uuid REFERENCES public.providers(id) ON DELETE SET NULL,
  whatsapp_opt_in bool DEFAULT true,
  language text DEFAULT 'fr',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.mothers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mothers: read own" ON public.mothers FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Mothers: insert own" ON public.mothers FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Mothers: update own" ON public.mothers FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Mothers: delete own" ON public.mothers FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ============ PRODUCTS ============
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price_mad decimal,
  category text,
  image_url text,
  pregnancy_week_min int,
  pregnancy_week_max int,
  is_available bool DEFAULT true,
  stock_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products: read available" ON public.products FOR SELECT TO authenticated USING (is_available = true);
CREATE POLICY "Products: vendor manage" ON public.products FOR ALL TO authenticated
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid()))
  WITH CHECK (vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid()));

-- ============ APPOINTMENTS ============
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mother_id uuid NOT NULL REFERENCES public.mothers(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  scheduled_at timestamptz NOT NULL,
  type text CHECK (type IN ('consultation','scan','followup','home_visit')),
  status text DEFAULT 'pending' CHECK (status IN ('pending','confirmed','completed','cancelled')),
  notes text,
  reminder_sent bool DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Appointments: mother read" ON public.appointments FOR SELECT TO authenticated
  USING (mother_id IN (SELECT id FROM public.mothers WHERE user_id = auth.uid()));
CREATE POLICY "Appointments: provider read" ON public.appointments FOR SELECT TO authenticated
  USING (provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid()));
CREATE POLICY "Appointments: mother insert" ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (mother_id IN (SELECT id FROM public.mothers WHERE user_id = auth.uid()));
CREATE POLICY "Appointments: mother update" ON public.appointments FOR UPDATE TO authenticated
  USING (mother_id IN (SELECT id FROM public.mothers WHERE user_id = auth.uid()));
CREATE POLICY "Appointments: provider update" ON public.appointments FOR UPDATE TO authenticated
  USING (provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid()));

-- ============ GUIDANCE CONTENT ============
CREATE TABLE public.guidance_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_min int,
  week_max int,
  title text NOT NULL,
  body text,
  category text CHECK (category IN ('nutrition','exercise','symptoms','preparation','postpartum','mental_health')),
  country text DEFAULT 'ALL',
  language text DEFAULT 'fr',
  reviewed_by uuid REFERENCES public.providers(id) ON DELETE SET NULL,
  is_published bool DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.guidance_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guidance: read published" ON public.guidance_content FOR SELECT TO authenticated USING (is_published = true);

-- ============ CHW MOTHERS ============
CREATE TABLE public.chw_mothers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chw_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mother_name text NOT NULL,
  phone text,
  village text,
  district text,
  country text DEFAULT 'MA',
  due_date date,
  risk_level text DEFAULT 'low' CHECK (risk_level IN ('low','medium','high')),
  last_visit_date date,
  total_visits int DEFAULT 0,
  referred bool DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.chw_mothers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CHW: manage own" ON public.chw_mothers FOR ALL TO authenticated
  USING (chw_id = auth.uid()) WITH CHECK (chw_id = auth.uid());

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text,
  title text NOT NULL,
  body text,
  is_read bool DEFAULT false,
  link text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Notifications: read own" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Notifications: update own" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Indexes for fuzzy search
CREATE INDEX providers_name_trgm ON public.providers USING gin (full_name gin_trgm_ops);
CREATE INDEX vendors_name_trgm ON public.vendors USING gin (business_name gin_trgm_ops);
CREATE INDEX products_name_trgm ON public.products USING gin (name gin_trgm_ops);
