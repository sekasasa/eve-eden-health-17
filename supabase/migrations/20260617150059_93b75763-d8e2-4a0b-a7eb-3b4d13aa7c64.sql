ALTER TABLE public.vendors DROP CONSTRAINT IF EXISTS vendors_category_check;
ALTER TABLE public.vendors ADD CONSTRAINT vendors_category_check
  CHECK (category = ANY (ARRAY['maternity_wear','baby_gear','nutrition','pharmacy','services','classes','care_services']));