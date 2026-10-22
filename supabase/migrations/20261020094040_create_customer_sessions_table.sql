CREATE TABLE IF NOT EXISTS customer_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  token text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

ALTER TABLE customer_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_customer_sessions" ON customer_sessions FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "anon_insert_customer_sessions" ON customer_sessions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE POLICY "anon_delete_customer_sessions" ON customer_sessions FOR DELETE
  TO anon, authenticated USING (true);