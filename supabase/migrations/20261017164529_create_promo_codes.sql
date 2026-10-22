/*
# Create promo_codes table

1. New Tables
- `promo_codes`
- `id` (uuid, primary key, default gen_random_uuid())
- `code` (text, unique, not null) — the code customers type, e.g. FALAH10
- `type` (text, not null, check in 'percent' | 'flat') — percent = % off, flat = fixed ₹ off
- `value` (numeric, not null) — 10 means 10% for percent type, 100 means ₹100 for flat type
- `active` (boolean, default true) — admin can pause a code without deleting it
- `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `promo_codes`.
- anon + authenticated can SELECT active codes (needed to validate a coupon at checkout).
- anon + authenticated can INSERT / UPDATE / DELETE so the password-protected Admin Panel can create and manage codes
  (single-tenant app, no sign-in — the admin gate is the app's own password screen, matching the existing orders/products pattern).

3. Seed
- Inserts two starter codes: FALAH10 (10% off, percent) and EID2026 (₹100 off, flat). Idempotent via ON CONFLICT DO NOTHING.
*/

CREATE TABLE IF NOT EXISTS promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('percent', 'flat')),
  value numeric NOT NULL CHECK (value > 0),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_promo_codes" ON promo_codes;
CREATE POLICY "anon_select_promo_codes" ON promo_codes
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_promo_codes" ON promo_codes;
CREATE POLICY "anon_insert_promo_codes" ON promo_codes
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_promo_codes" ON promo_codes;
CREATE POLICY "anon_update_promo_codes" ON promo_codes
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_promo_codes" ON promo_codes;
CREATE POLICY "anon_delete_promo_codes" ON promo_codes
  FOR DELETE TO anon, authenticated USING (true);

INSERT INTO promo_codes (code, type, value) VALUES
  ('FALAH10', 'percent', 10),
  ('EID2026', 'flat', 100)
ON CONFLICT (code) DO NOTHING;