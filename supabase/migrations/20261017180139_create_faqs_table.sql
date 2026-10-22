/*
# Create faqs table

1. New Tables
- `faqs`
- `id` (uuid, primary key, default gen_random_uuid())
- `question` (text, not null) — the customer question
- `answer` (text, not null) — Matiur's reply
- `keywords` (text, null) — optional comma-separated keywords for matching; falls back to question text
- `sort_order` (integer, default 0) — display order in chat
- `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `faqs`.
- anon + authenticated can SELECT / INSERT / UPDATE / DELETE so the password-protected Admin Panel can manage FAQs
  and the storefront chat can read them (single-tenant app, no sign-in — the admin gate is the app's own
  password screen, matching the existing promo_codes pattern).

3. Seed
- No seed; admin adds their own Q&A pairs.
*/

CREATE TABLE IF NOT EXISTS faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  keywords text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_faqs" ON faqs;
CREATE POLICY "anon_select_faqs" ON faqs
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_faqs" ON faqs;
CREATE POLICY "anon_insert_faqs" ON faqs
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_faqs" ON faqs;
CREATE POLICY "anon_update_faqs" ON faqs
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_faqs" ON faqs;
CREATE POLICY "anon_delete_faqs" ON faqs
  FOR DELETE TO anon, authenticated USING (true);