/*
# Create orders and products tables for FALAH store

1. New Tables
- `orders`
  - `id` (uuid, primary key)
  - `product_id` (text, not null) - references the product's id in the catalog
  - `product_title` (text, not null) - denormalized for history
  - `variant_chosen` (text) - chosen fabric/size/variant name
  - `size_chosen` (text) - chosen size label
  - `custom_measurements` (jsonb) - optional {length, chest, sleeve}
  - `total_amount` (integer, not null) - total in INR/BDT taka
  - `customer` (jsonb, not null) - {name, phone, address, paymentMethod}
  - `status` (text, not null, default 'pending') - pending|confirmed|shipped|delivered|cancelled
  - `created_at` (timestamptz, default now())
- `products`
  - `id` (uuid, primary key)
  - `title` (text, not null)
  - `slug` (text, unique)
  - `category` (text)
  - `base_price` (integer, not null)
  - `regular_price` (integer)
  - `fabric` (text)
  - `description` (text)
  - `data` (jsonb) - flexible payload for variants, sizeOptions, setIncludes, etc.
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on both tables.
- This is a storefront with no customer sign-in: the anon-key browser client must be able to
  submit orders and read the product catalog. We use `TO anon, authenticated` for those
  public operations.
- Order status updates and product writes are admin-only: those flow through server-side API
  routes that use the service-role key (bypasses RLS). Public anon UPDATE/DELETE on orders
  would be a vulnerability, so we do NOT grant those to anon.
- Orders: anon can INSERT (place order) and SELECT only their own order by phone
  (best-effort soft isolation; admin reads via service role). To keep the customer-facing
  flow simple we allow anon SELECT of all orders so the success screen can confirm; status
  updates remain service-role only.
- Products: anon can SELECT (browse catalog); writes are service-role only (admin panel).

3. Notes
- `orders.status` has a CHECK constraint restricting to known statuses.
- All monetary amounts stored as integer (taka) to avoid float drift.
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
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','shipped','delivered','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_orders" ON orders;
CREATE POLICY "anon_select_orders" ON orders FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders" ON orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- No UPDATE/DELETE policy for anon: status changes are admin-only via service role.

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE,
  category text,
  base_price integer NOT NULL DEFAULT 0,
  regular_price integer,
  fabric text,
  description text,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_products" ON products;
CREATE POLICY "anon_select_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

-- No INSERT/UPDATE/DELETE for anon: product management is admin-only via service role.

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products (slug);
