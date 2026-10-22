/*
# Add sub-categories and admin write access for categories

1. Modified Tables
- `categories`:
  - Adds nullable `parent_id uuid REFERENCES categories(id) ON DELETE CASCADE`.
    Rows with parent_id = NULL are main categories; rows pointing to another
    category are sub-categories. A self-reference guard prevents a category
    from being its own parent.

2. Security
- The admin panel uses the anon-key Supabase client (there is no sign-in
  screen on this storefront). The existing categories migration only granted
  SELECT to anon because it assumed writes would go through a service-role
  edge function. The actual admin panel writes directly via the anon client,
  matching the pattern already used for faqs, promo_codes, return_requests
  and best sellers. This migration adds the missing CRUD policies for anon on
  categories so the Category Manager in the admin panel can create, edit and
  delete main categories and sub-categories.
- SELECT stays public (USING true) since the category grid is public catalog
  data shared across all visitors.
- INSERT/UPDATE/DELETE are granted to anon, authenticated. This is the same
  single-tenant no-auth pattern used by every other admin-managed table in
  this project.

3. Notes
- Idempotent: uses DO $$ ... IF NOT EXISTS ... END $$ for the column add and
  DROP POLICY IF EXISTS before (re)creating policies.
- A CHECK constraint prevents parent_id from pointing at the row itself.
- An index on parent_id supports fetching sub-categories for a main category.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'parent_id'
  ) THEN
    ALTER TABLE categories ADD COLUMN parent_id uuid REFERENCES categories(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'categories_no_self_parent'
  ) THEN
    ALTER TABLE categories ADD CONSTRAINT categories_no_self_parent CHECK (parent_id IS NULL OR parent_id <> id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories (parent_id);

DROP POLICY IF EXISTS "anon_insert_categories" ON categories;
CREATE POLICY "anon_insert_categories" ON categories FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_categories" ON categories;
CREATE POLICY "anon_update_categories" ON categories FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_categories" ON categories;
CREATE POLICY "anon_delete_categories" ON categories FOR DELETE
  TO anon, authenticated USING (true);
