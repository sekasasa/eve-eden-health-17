
ALTER TABLE public.vendor_content
  ADD COLUMN IF NOT EXISTS speakers jsonb,
  ADD COLUMN IF NOT EXISTS agenda jsonb,
  ADD COLUMN IF NOT EXISTS safety_note text,
  ADD COLUMN IF NOT EXISTS price_label text;
