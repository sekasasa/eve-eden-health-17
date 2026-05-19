CREATE TABLE public.patient_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mother_id UUID NOT NULL,
  provider_id UUID NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.patient_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Notes: provider read own"
ON public.patient_notes FOR SELECT TO authenticated
USING (provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid()));

CREATE POLICY "Notes: provider insert own"
ON public.patient_notes FOR INSERT TO authenticated
WITH CHECK (provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid()));

CREATE POLICY "Notes: provider update own"
ON public.patient_notes FOR UPDATE TO authenticated
USING (provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid()));

CREATE POLICY "Notes: provider delete own"
ON public.patient_notes FOR DELETE TO authenticated
USING (provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid()));

CREATE INDEX idx_patient_notes_mother ON public.patient_notes(mother_id, created_at DESC);