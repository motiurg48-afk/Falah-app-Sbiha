/*
# Order tracking: courier fields + public order codes

1. Modified Tables
- `orders`
  - `order_code` (text) — customer-facing order id like "ORD-1699..." used for tracking
  - `courier_name` (text) — courier company entered by admin after shipping
  - `awb_number` (text) — AWB / tracking number entered by admin
  - `tracking_url` (text) — clickable courier tracking link entered by admin
  - `shipping_charge` (integer, default 0) — shipping fee computed at checkout
  - `payment_utr` (text) — UTR for prepaid orders
  - `payment_screenshot` (text) — URL of uploaded payment screenshot
  - `payment_method` stored inside customer jsonb (unchanged)

2. Indexes
- unique index on `order_code` for fast tracking lookups.

3. Security
- Table uses RLS. This app has no sign-in: storefront and admin panel both run on the
  anon key, so anon gets SELECT + INSERT (place order) + UPDATE (admin edits status and
  courier fields). This matches the app's existing single-tenant no-auth model.
*/

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL,
  product_title text NOT NULL,
  variant_chosen text,
  size_chosen text,
  custom_measurements jsonb DEFAULT '{}'::jsonb,
  total_amount integer NOT NULL DEFAULT 0,
  customer jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_code text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_name text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS awb_number text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_charge integer NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_utr text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_screenshot text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_code ON orders (order_code);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders (((customer->>'phone')));

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_orders" ON orders;
CREATE POLICY "anon_select_orders" ON orders
FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders" ON orders
FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_orders" ON orders;
CREATE POLICY "anon_update_orders" ON orders
FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
