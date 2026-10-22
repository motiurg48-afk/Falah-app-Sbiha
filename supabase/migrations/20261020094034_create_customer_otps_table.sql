CREATE TABLE IF NOT EXISTS customer_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  otp text NOT NULL,
  expires_at timestamptz NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE customer_otps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert_customer_otps" ON customer_otps FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE POLICY "anon_select_own_otps" ON customer_otps FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "anon_update_customer_otps" ON customer_otps FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);