/*
# Admin accounts, live product catalog, hero banners and site settings

Plain-English summary:
The admin panel previously used one shared password stored in the website code, and anyone could
change products, categories, promo codes etc. This migration introduces real admin accounts and
makes all store-management writes admin-only. It also prepares the products table to be the
single live source of the catalog, and adds tables for homepage hero banners and site settings
(like the announcement bar text).

1. New Tables
- `admin_users` - which signed-in accounts are store administrators
  - `user_id` (uuid, PK, references auth.users)
  - `created_at` (timestamptz)
- `hero_banners` - homepage slider banners
  - `id` (uuid, PK), `image_url` (text, required), `title` (text), `subtitle` (text),
    `link_url` (text, where tapping the banner goes), `sort_order` (int), `is_active` (bool),
    `created_at` (timestamptz)
- `site_settings` - simple key/value settings
  - `key` (text, PK), `value` (text), `updated_at` (timestamptz)
  - seeded with `announcement_text` (empty = use default translated text)

2. Modified Tables
- `products`: new columns
  - `product_key` (text, unique) - the id the storefront, reviews, orders and best-sellers use
  - `stock` (integer, nullable) - units in stock; null means not tracked
  - `is_active` (boolean, default true) - hidden from the shop when false
  - `sort_order` (integer, default 0)
  - `updated_at` (timestamptz)

3. Functions
- `is_admin()` - true when the current signed-in user is in admin_users (SECURITY DEFINER,
  fixed search_path, executable only by signed-in users).
- `admin_exists()` - true once any admin has been registered (callable by visitors, so the
  login screen knows whether to offer first-time setup). Returns only a boolean.
- `claim_first_admin()` - makes the caller the admin ONLY if no admin exists yet. Serialized
  with an advisory lock so two people cannot both claim it.

4. Security changes
- New tables: RLS enabled. Public read of active banners and settings; writes admin-only.
- products, categories, faqs, promo_codes, product_best_sellers: insert/update/delete now admin-only
  (public read unchanged).
- orders: update now admin-only (customers can still place orders and track them).
- return_requests: read/update/delete admin-only (customers can still submit requests).
- product_reviews: update/delete admin-only (customers can still post and read reviews).
- chat_logs: read admin-only (chat widget can still log conversations).

5. Notes
- No data is removed. Only policies are replaced.
- Realtime is enabled for products, hero_banners and site_settings so the shop updates instantly.
*/

CREATE TABLE IF NOT EXISTS admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid());
$$;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_exists()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_users);
$$;
REVOKE ALL ON FUNCTION public.admin_exists() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_exists() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.claim_first_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  PERFORM pg_advisory_xact_lock(hashtext('falah_claim_first_admin'));
  IF EXISTS (SELECT 1 FROM public.admin_users) THEN
    RETURN EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid());
  END IF;
  INSERT INTO public.admin_users (user_id) VALUES (auth.uid());
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_first_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_first_admin() TO authenticated;

DROP POLICY IF EXISTS "admin_select_admin_users" ON admin_users;
CREATE POLICY "admin_select_admin_users" ON admin_users FOR SELECT
  TO authenticated USING (public.is_admin());

-- products: new columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='product_key') THEN
    ALTER TABLE products ADD COLUMN product_key text UNIQUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='stock') THEN
    ALTER TABLE products ADD COLUMN stock integer CHECK (stock IS NULL OR stock >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='is_active') THEN
    ALTER TABLE products ADD COLUMN is_active boolean NOT NULL DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='sort_order') THEN
    ALTER TABLE products ADD COLUMN sort_order integer NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='updated_at') THEN
    ALTER TABLE products ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;

DROP POLICY IF EXISTS "anon_insert_products" ON products;
DROP POLICY IF EXISTS "anon_update_products" ON products;
DROP POLICY IF EXISTS "anon_delete_products" ON products;
DROP POLICY IF EXISTS "admin_insert_products" ON products;
CREATE POLICY "admin_insert_products" ON products FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_update_products" ON products;
CREATE POLICY "admin_update_products" ON products FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_delete_products" ON products;
CREATE POLICY "admin_delete_products" ON products FOR DELETE TO authenticated USING (public.is_admin());

-- hero banners
CREATE TABLE IF NOT EXISTS hero_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  title text,
  subtitle text,
  link_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE hero_banners ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_hero_banners_sort ON hero_banners (sort_order);

DROP POLICY IF EXISTS "public_select_hero_banners" ON hero_banners;
CREATE POLICY "public_select_hero_banners" ON hero_banners FOR SELECT
  TO anon, authenticated USING (is_active OR (auth.role() = 'authenticated' AND public.is_admin()));
DROP POLICY IF EXISTS "admin_insert_hero_banners" ON hero_banners;
CREATE POLICY "admin_insert_hero_banners" ON hero_banners FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_update_hero_banners" ON hero_banners;
CREATE POLICY "admin_update_hero_banners" ON hero_banners FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_delete_hero_banners" ON hero_banners;
CREATE POLICY "admin_delete_hero_banners" ON hero_banners FOR DELETE TO authenticated USING (public.is_admin());

-- site settings
CREATE TABLE IF NOT EXISTS site_settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
INSERT INTO site_settings (key, value) VALUES ('announcement_text', '') ON CONFLICT (key) DO NOTHING;

DROP POLICY IF EXISTS "public_select_site_settings" ON site_settings;
CREATE POLICY "public_select_site_settings" ON site_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "admin_insert_site_settings" ON site_settings;
CREATE POLICY "admin_insert_site_settings" ON site_settings FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_update_site_settings" ON site_settings;
CREATE POLICY "admin_update_site_settings" ON site_settings FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_delete_site_settings" ON site_settings;
CREATE POLICY "admin_delete_site_settings" ON site_settings FOR DELETE TO authenticated USING (public.is_admin());

-- categories
DROP POLICY IF EXISTS "anon_insert_categories" ON categories;
DROP POLICY IF EXISTS "anon_update_categories" ON categories;
DROP POLICY IF EXISTS "anon_delete_categories" ON categories;
DROP POLICY IF EXISTS "admin_insert_categories" ON categories;
CREATE POLICY "admin_insert_categories" ON categories FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_update_categories" ON categories;
CREATE POLICY "admin_update_categories" ON categories FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_delete_categories" ON categories;
CREATE POLICY "admin_delete_categories" ON categories FOR DELETE TO authenticated USING (public.is_admin());

-- faqs
DROP POLICY IF EXISTS "anon_insert_faqs" ON faqs;
DROP POLICY IF EXISTS "anon_update_faqs" ON faqs;
DROP POLICY IF EXISTS "anon_delete_faqs" ON faqs;
DROP POLICY IF EXISTS "admin_insert_faqs" ON faqs;
CREATE POLICY "admin_insert_faqs" ON faqs FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_update_faqs" ON faqs;
CREATE POLICY "admin_update_faqs" ON faqs FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_delete_faqs" ON faqs;
CREATE POLICY "admin_delete_faqs" ON faqs FOR DELETE TO authenticated USING (public.is_admin());

-- promo codes
DROP POLICY IF EXISTS "anon_insert_promo_codes" ON promo_codes;
DROP POLICY IF EXISTS "anon_update_promo_codes" ON promo_codes;
DROP POLICY IF EXISTS "anon_delete_promo_codes" ON promo_codes;
DROP POLICY IF EXISTS "admin_insert_promo_codes" ON promo_codes;
CREATE POLICY "admin_insert_promo_codes" ON promo_codes FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_update_promo_codes" ON promo_codes;
CREATE POLICY "admin_update_promo_codes" ON promo_codes FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_delete_promo_codes" ON promo_codes;
CREATE POLICY "admin_delete_promo_codes" ON promo_codes FOR DELETE TO authenticated USING (public.is_admin());

-- best sellers
DROP POLICY IF EXISTS "anon_insert_product_best_sellers" ON product_best_sellers;
DROP POLICY IF EXISTS "anon_delete_product_best_sellers" ON product_best_sellers;
DROP POLICY IF EXISTS "admin_insert_product_best_sellers" ON product_best_sellers;
CREATE POLICY "admin_insert_product_best_sellers" ON product_best_sellers FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_update_product_best_sellers" ON product_best_sellers;
CREATE POLICY "admin_update_product_best_sellers" ON product_best_sellers FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_delete_product_best_sellers" ON product_best_sellers;
CREATE POLICY "admin_delete_product_best_sellers" ON product_best_sellers FOR DELETE TO authenticated USING (public.is_admin());

-- orders: status / courier updates admin-only
DROP POLICY IF EXISTS "anon_update_orders" ON orders;
DROP POLICY IF EXISTS "admin_update_orders" ON orders;
CREATE POLICY "admin_update_orders" ON orders FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_delete_orders" ON orders;
CREATE POLICY "admin_delete_orders" ON orders FOR DELETE TO authenticated USING (public.is_admin());

-- return requests
DROP POLICY IF EXISTS "public_read_return_requests" ON return_requests;
DROP POLICY IF EXISTS "public_update_return_requests" ON return_requests;
DROP POLICY IF EXISTS "public_delete_return_requests" ON return_requests;
DROP POLICY IF EXISTS "admin_select_return_requests" ON return_requests;
CREATE POLICY "admin_select_return_requests" ON return_requests FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "admin_update_return_requests" ON return_requests;
CREATE POLICY "admin_update_return_requests" ON return_requests FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_delete_return_requests" ON return_requests;
CREATE POLICY "admin_delete_return_requests" ON return_requests FOR DELETE TO authenticated USING (public.is_admin());

-- reviews moderation
DROP POLICY IF EXISTS "public_update_reviews" ON product_reviews;
DROP POLICY IF EXISTS "public_delete_reviews" ON product_reviews;
DROP POLICY IF EXISTS "admin_update_reviews" ON product_reviews;
CREATE POLICY "admin_update_reviews" ON product_reviews FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_delete_reviews" ON product_reviews;
CREATE POLICY "admin_delete_reviews" ON product_reviews FOR DELETE TO authenticated USING (public.is_admin());

-- chat logs readable only by admin
DROP POLICY IF EXISTS "anon_select_chat_logs" ON chat_logs;
DROP POLICY IF EXISTS "admin_select_chat_logs" ON chat_logs;
CREATE POLICY "admin_select_chat_logs" ON chat_logs FOR SELECT TO authenticated USING (public.is_admin());

-- realtime
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['products','hero_banners','site_settings'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;
