CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL,
  product_id uuid NOT NULL,
  mother_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'new',
  amount_mad numeric NOT NULL DEFAULT 0,
  mother_city text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Orders: vendor read own" ON public.orders FOR SELECT TO authenticated
USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

CREATE POLICY "Orders: vendor update own" ON public.orders FOR UPDATE TO authenticated
USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

CREATE POLICY "Orders: mother read own" ON public.orders FOR SELECT TO authenticated
USING (mother_id IN (SELECT id FROM mothers WHERE user_id = auth.uid()));

CREATE POLICY "Orders: mother insert own" ON public.orders FOR INSERT TO authenticated
WITH CHECK (mother_id IN (SELECT id FROM mothers WHERE user_id = auth.uid()));

CREATE TRIGGER orders_set_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Product images bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Product images public read" ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Vendors upload product images" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] IN (SELECT id::text FROM vendors WHERE user_id = auth.uid())
);

CREATE POLICY "Vendors update product images" ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] IN (SELECT id::text FROM vendors WHERE user_id = auth.uid())
);

CREATE POLICY "Vendors delete product images" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] IN (SELECT id::text FROM vendors WHERE user_id = auth.uid())
);
