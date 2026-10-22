/*
# Review photos/videos and abandoned cart recovery

1. Modified Tables
- `product_reviews`: new `media` jsonb column (default empty array) holding a list of
  `{ "type": "image" | "video", "url": text }` items uploaded by the reviewer (max 6).

2. New Storage Bucket
- `review-media` (public read): customer review photos and short videos.
  - 25 MB per file; only jpeg/png/webp/gif images and mp4/webm/quicktime video.
  - Anyone may upload into the `reviews/` folder; nobody but admins may update or delete.

3. New Tables
- `abandoned_carts`: carts left without checking out.
  - `id` uuid pk, `token` uuid unique (random id generated in the shopper's browser)
  - `name`, `phone` (optional, captured from the checkout form)
  - `items` jsonb, `subtotal` integer, `item_count` integer
  - `status` text: 'open' | 'reminded' | 'recovered'
  - `reminded_at`, `created_at`, `updated_at`

4. Security
- RLS enabled on `abandoned_carts`; only admins (public.is_admin()) can read, update or delete.
- Shoppers never read the table. They write only through two SECURITY DEFINER functions
  keyed by their own unguessable token:
  - `track_abandoned_cart(...)` validates sizes and upserts the cart.
  - `mark_cart_recovered(token)` flags the cart as recovered after an order.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'product_reviews' AND column_name = 'media') THEN
    ALTER TABLE product_reviews ADD COLUMN media jsonb NOT NULL DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_reviews_media_limit') THEN
    ALTER TABLE product_reviews ADD CONSTRAINT product_reviews_media_limit
      CHECK (jsonb_typeof(media) = 'array' AND jsonb_array_length(media) <= 6);
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('review-media', 'review-media', true, 26214400,
        ARRAY['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read review media" ON storage.objects;
CREATE POLICY "Public read review media" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'review-media');

DROP POLICY IF EXISTS "Public upload review media" ON storage.objects;
CREATE POLICY "Public upload review media" ON storage.objects FOR INSERT
  TO anon, authenticated WITH CHECK (bucket_id = 'review-media' AND (storage.foldername(name))[1] = 'reviews');

DROP POLICY IF EXISTS "Admins update review media" ON storage.objects;
CREATE POLICY "Admins update review media" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'review-media' AND public.is_admin())
  WITH CHECK (bucket_id = 'review-media' AND public.is_admin());

DROP POLICY IF EXISTS "Admins delete review media" ON storage.objects;
CREATE POLICY "Admins delete review media" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'review-media' AND public.is_admin());

CREATE TABLE IF NOT EXISTS abandoned_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token uuid UNIQUE NOT NULL,
  name text,
  phone text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal integer NOT NULL DEFAULT 0,
  item_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','reminded','recovered')),
  reminded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_abandoned_carts_status_updated ON abandoned_carts (status, updated_at DESC);

ALTER TABLE abandoned_carts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read abandoned carts" ON abandoned_carts;
CREATE POLICY "Admins read abandoned carts" ON abandoned_carts FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Admins insert abandoned carts" ON abandoned_carts;
CREATE POLICY "Admins insert abandoned carts" ON abandoned_carts FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins update abandoned carts" ON abandoned_carts;
CREATE POLICY "Admins update abandoned carts" ON abandoned_carts FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins delete abandoned carts" ON abandoned_carts;
CREATE POLICY "Admins delete abandoned carts" ON abandoned_carts FOR DELETE
  TO authenticated USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.track_abandoned_cart(
  p_token uuid, p_name text, p_phone text, p_items jsonb, p_subtotal integer, p_item_count integer
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_token IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) > 50
     OR length(p_items::text) > 20000 THEN
    RAISE EXCEPTION 'invalid cart';
  END IF;
  INSERT INTO abandoned_carts (token, name, phone, items, subtotal, item_count, status, updated_at)
  VALUES (p_token, left(nullif(trim(p_name), ''), 100), left(nullif(trim(p_phone), ''), 20), p_items,
          greatest(0, least(p_subtotal, 10000000)), greatest(0, least(p_item_count, 1000)), 'open', now())
  ON CONFLICT (token) DO UPDATE SET
    name = coalesce(EXCLUDED.name, abandoned_carts.name),
    phone = coalesce(EXCLUDED.phone, abandoned_carts.phone),
    items = EXCLUDED.items,
    subtotal = EXCLUDED.subtotal,
    item_count = EXCLUDED.item_count,
    status = CASE WHEN abandoned_carts.status = 'recovered' THEN 'open' ELSE abandoned_carts.status END,
    updated_at = now();
END $$;

CREATE OR REPLACE FUNCTION public.mark_cart_recovered(p_token uuid) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE abandoned_carts SET status = 'recovered', updated_at = now() WHERE token = p_token;
$$;

REVOKE ALL ON FUNCTION public.track_abandoned_cart(uuid, text, text, jsonb, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_cart_recovered(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_abandoned_cart(uuid, text, text, jsonb, integer, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_cart_recovered(uuid) TO anon, authenticated;
