/*
# Multi-category marketplace schema

1. Purpose
FALAH is expanding beyond Islamic apparel into a multi-category online store
(Books, Gadgets, Fashion, Home Essentials, Accessories, plus the existing
apparel categories). This migration adds the database architecture needed to
support flexible, per-product-type attributes so each category can carry its
own metadata (size/color for apparel, author/publisher for books, specs for
electronics, etc.) without altering the core products table for every new
category.

2. New Tables
- `categories`
  - `id` (uuid, primary key)
  - `name` (text, unique, not null) - canonical category name (e.g. "Books")
  - `slug` (text, unique, not null) - URL-safe key
  - `icon` (text) - optional lucide icon name for the homepage grid
  - `sort_order` (integer, default 0) - ordering for the homepage grid
  - `is_active` (boolean, default true) - hide categories without removing them
  - `created_at` (timestamptz, default now())
- `product_attributes`
  - `id` (uuid, primary key)
  - `product_id` (uuid, not null) - references products(id) ON DELETE CASCADE
  - `name` (text, not null) - attribute key, e.g. "author", "color", "warranty"
  - `value` (text, not null) - attribute value as text
  - `created_at` (timestamptz, default now())
  - Unique constraint on (product_id, name) so each product has one value per key.

3. Modified Tables
- `products`:
  - Adds nullable `category_id uuid REFERENCES categories(id) ON DELETE SET NULL`.
    The existing `category` text column is kept untouched for backwards
    compatibility with the current catalog and admin panel; `category_id` is
    the new structured link. No data is lost or rewritten.

4. Security
- RLS enabled on both new tables.
- This is a no-sign-in storefront: the anon-key browser client must be able to
  read the category grid and product attributes. We grant SELECT to
  `anon, authenticated` on both new tables.
- Writes (insert/update/delete) are admin-only and flow through service-role
  API routes, so NO insert/update/delete policies are granted to anon. This
  matches the existing products table pattern.
- `USING (true)` on the SELECT policies is intentional: categories and
  product attributes are public catalog data shared across all visitors.

5. Notes
- Idempotent: uses IF NOT EXISTS for tables/indexes/constraints and
  DROP POLICY IF EXISTS before (re)creating policies.
- Seed rows are inserted for the existing apparel categories plus the new
  marketplace categories, using ON CONFLICT DO NOTHING so re-runs are safe.
- An index on products.category_id supports per-category browsing.
- A composite unique index on product_attributes(product_id, name) backs the
  unique constraint.
*/

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  icon text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_categories" ON categories;
CREATE POLICY "anon_select_categories" ON categories FOR SELECT
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS product_attributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name text NOT NULL,
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE product_attributes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_product_attributes" ON product_attributes;
CREATE POLICY "anon_select_product_attributes" ON product_attributes FOR SELECT
  TO anon, authenticated USING (true);

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_attributes_product_name
  ON product_attributes (product_id, name);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE products ADD COLUMN category_id uuid REFERENCES categories(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_category_id ON products (category_id);

INSERT INTO categories (name, slug, icon, sort_order) VALUES
  ('Abaya', 'abaya', 'Shirt', 1),
  ('Abaya Set', 'abaya-set', 'ShoppingBag', 2),
  ('Hijab', 'hijab', 'Scarf', 3),
  ('Khimar Set', 'khimar-set', 'Scarf', 4),
  ('Cotton Borkha', 'cotton-borkha', 'Shirt', 5),
  ('Fashion', 'fashion', 'Sparkles', 10),
  ('Accessories', 'accessories', 'Watch', 11),
  ('Books', 'books', 'BookOpen', 12),
  ('Gadgets', 'gadgets', 'Cpu', 13),
  ('Home Essentials', 'home-essentials', 'Home', 14)
ON CONFLICT (name) DO NOTHING;
