/*
# Add chat logs and admin-controlled Best Seller flags

1. New Tables
- `chat_logs`
  - `id` (uuid, primary key)
  - `session_id` (text, optional) - groups messages from one chat session
  - `question` (text, not null) - the customer's message
  - `answer` (text) - the reply the chatbot gave
  - `source` (text, not null, default 'gemini') - 'gemini' (AI reply) or 'fallback' (offline keyword reply)
  - `created_at` (timestamptz, default now())
- `product_best_sellers`
  - `product_id` (text, primary key) - the product marked as Best Seller by the admin
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on both tables.
- This app has no customer sign-in: the browser talks to Supabase with the anon key.
- `chat_logs`: anon can INSERT (log conversations) and SELECT (admin panel reads logs with
  the same anon key). No anon UPDATE.
- `product_best_sellers`: rows are intentionally public badge data. anon can SELECT (storefront
  reads badges), INSERT and DELETE (admin panel toggles badges on/off with the anon key).
- Both tables use `TO anon, authenticated` with true predicates because the data is
  intentionally shared/public in this single-tenant, no-auth store.

3. Notes
- Index on `chat_logs.created_at` keeps the admin log listing fast.
- Both tables hold additive data only; nothing here drops or rewrites existing records.
*/

CREATE TABLE IF NOT EXISTS chat_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text,
  question text NOT NULL,
  answer text,
  source text NOT NULL DEFAULT 'gemini',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE chat_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_chat_logs" ON chat_logs;
CREATE POLICY "anon_insert_chat_logs" ON chat_logs FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_chat_logs" ON chat_logs;
CREATE POLICY "anon_select_chat_logs" ON chat_logs FOR SELECT
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS product_best_sellers (
  product_id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE product_best_sellers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_product_best_sellers" ON product_best_sellers;
CREATE POLICY "anon_select_product_best_sellers" ON product_best_sellers FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_product_best_sellers" ON product_best_sellers;
CREATE POLICY "anon_insert_product_best_sellers" ON product_best_sellers FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_product_best_sellers" ON product_best_sellers;
CREATE POLICY "anon_delete_product_best_sellers" ON product_best_sellers FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_chat_logs_created_at ON chat_logs (created_at DESC);
