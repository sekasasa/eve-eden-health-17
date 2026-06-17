ALTER TABLE public.vendors
ADD COLUMN avg_rating numeric(2,1) CHECK (avg_rating >= 0 AND avg_rating <= 5);