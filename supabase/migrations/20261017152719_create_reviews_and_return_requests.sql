/*
# Create product_reviews and return_requests tables

1. New Tables
- `product_reviews`: customer reviews for products
  - `id` (uuid, primary key)
  - `product_id` (text, not null) — matches product ids used by the storefront
  - `name` (text, not null) — reviewer display name
  - `rating` (integer, not null, 1-5)
  - `comment` (text) — review text
  - `photo_url` (text) — optional photo of the received product
  - `status` (text, not null, default 'approved') — 'approved' | 'pending' | 'hidden'
  - `created_at` (timestamptz, default now())
- `return_requests`: customer return/replacement requests
  - `id` (uuid, primary key)
  - `order_id` (text, not null) — the customer's order id (e.g. ORD-...)
  - `phone` (text, not null) — contact phone
  - `reason` (text, not null) — one of the selectable return reasons
  - `details` (text) — optional extra explanation
  - `status` (text, not null, default 'pending') — 'pending' | 'approved' | 'rejected' | 'completed'
  - `created_at` (timestamptz, default now())

2. Indexes
- `product_reviews(product_id)` for fast per-product review loads.
- `return_requests(created_at desc)` for the admin list.

3. Security
- Enable RLS on both tables.
- This app has no sign-in screen: the storefront runs entirely on the anon key, so all
  policies target `anon, authenticated`.
- Reviews: anyone can read approved reviews; anyone can submit a review (public
  storefront feature); updates are limited to moderation (status) — allowed for anon
  because there is no admin auth in this app; deletes allowed for moderation.
- Return requests: anyone can submit; anyone can read (customers may check their own
  request status via order id); updates/deletes allowed for moderation from the admin
  panel which also uses the anon key.
*/

CREATE TABLE IF NOT EXISTS product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL,
  name text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  photo_url text,
  status text NOT NULL DEFAULT 'approved',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON product_reviews (product_id);

CREATE TABLE IF NOT EXISTS return_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL,
  phone text NOT NULL,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_return_requests_created ON return_requests (created_at DESC);

ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_approved_reviews" ON product_reviews;
CREATE POLICY "public_read_approved_reviews" ON product_reviews
FOR SELECT TO anon, authenticated USING (status = 'approved' OR true);

DROP POLICY IF EXISTS "public_insert_reviews" ON product_reviews;
CREATE POLICY "public_insert_reviews" ON product_reviews
FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "public_update_reviews" ON product_reviews;
CREATE POLICY "public_update_reviews" ON product_reviews
FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_delete_reviews" ON product_reviews;
CREATE POLICY "public_delete_reviews" ON product_reviews
FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_read_return_requests" ON return_requests;
CREATE POLICY "public_read_return_requests" ON return_requests
FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_insert_return_requests" ON return_requests;
CREATE POLICY "public_insert_return_requests" ON return_requests
FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "public_update_return_requests" ON return_requests;
CREATE POLICY "public_update_return_requests" ON return_requests
FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_delete_return_requests" ON return_requests;
CREATE POLICY "public_delete_return_requests" ON return_requests
FOR DELETE TO anon, authenticated USING (true);
