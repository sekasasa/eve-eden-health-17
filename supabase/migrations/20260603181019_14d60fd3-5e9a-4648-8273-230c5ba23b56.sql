
CREATE TABLE public.match_intakes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stage TEXT,
  need TEXT,
  city TEXT,
  language TEXT,
  payment TEXT,
  urgency TEXT,
  extras JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_intakes TO authenticated;
GRANT ALL ON public.match_intakes TO service_role;

ALTER TABLE public.match_intakes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own intakes" ON public.match_intakes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own intakes" ON public.match_intakes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own intakes" ON public.match_intakes
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own intakes" ON public.match_intakes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_match_intakes_updated_at
  BEFORE UPDATE ON public.match_intakes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX match_intakes_user_id_created_at_idx
  ON public.match_intakes (user_id, created_at DESC);
