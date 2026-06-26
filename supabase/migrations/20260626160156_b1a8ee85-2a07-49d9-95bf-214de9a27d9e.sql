ALTER TABLE public.mothers
  ADD COLUMN IF NOT EXISTS secondary_language text,
  ADD COLUMN IF NOT EXISTS language_other text;