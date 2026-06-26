ALTER TABLE public.mothers
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS dialect text,
  ADD COLUMN IF NOT EXISTS care_setting text,
  ADD COLUMN IF NOT EXISTS personalize_opt text,
  ADD COLUMN IF NOT EXISTS cultural_prefs text[],
  ADD COLUMN IF NOT EXISTS dietary_prefs text[],
  ADD COLUMN IF NOT EXISTS birth_prefs text[],
  ADD COLUMN IF NOT EXISTS dietary_other text,
  ADD COLUMN IF NOT EXISTS cultural_other text;