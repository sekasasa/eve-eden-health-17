
-- visits table
CREATE TABLE public.visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chw_id UUID NOT NULL,
  mother_id UUID NOT NULL,
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  visit_type TEXT NOT NULL DEFAULT 'home',
  duration_minutes INTEGER,
  blood_pressure TEXT,
  weight_kg NUMERIC,
  fundal_height_cm NUMERIC,
  fetal_heartbeat TEXT,
  oedema TEXT,
  feeling_scale INTEGER,
  concerns TEXT,
  medications TEXT,
  services JSONB NOT NULL DEFAULT '{}'::jsonb,
  next_visit_date DATE,
  action_notes TEXT,
  referred BOOLEAN NOT NULL DEFAULT false,
  referral_destination TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visits: chw manage own"
ON public.visits FOR ALL TO authenticated
USING (chw_id = auth.uid())
WITH CHECK (chw_id = auth.uid());

CREATE INDEX visits_chw_idx ON public.visits(chw_id);
CREATE INDEX visits_mother_idx ON public.visits(mother_id);

-- chw_alerts table
CREATE TABLE public.chw_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chw_id UUID NOT NULL,
  mother_id UUID NOT NULL,
  risk_type TEXT NOT NULL,
  note TEXT,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chw_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Alerts: chw manage own"
ON public.chw_alerts FOR ALL TO authenticated
USING (chw_id = auth.uid())
WITH CHECK (chw_id = auth.uid());

CREATE INDEX chw_alerts_chw_idx ON public.chw_alerts(chw_id);

-- updated_at trigger reuse
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_visits_updated
BEFORE UPDATE ON public.visits
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
