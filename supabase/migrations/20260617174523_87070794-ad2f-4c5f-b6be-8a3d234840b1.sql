
ALTER TABLE public.vendor_content
  ADD COLUMN IF NOT EXISTS event_sections jsonb,
  ADD COLUMN IF NOT EXISTS map_embed_url text;
