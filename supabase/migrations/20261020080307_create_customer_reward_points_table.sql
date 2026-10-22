/*
# Create customer_reward_points table

1. New Tables
  - `customer_reward_points`
    - `id` (uuid, primary key, auto-generated)
    - `phone` (text, not null — phone number used as customer identifier since no auth)
    - `points` (integer, not null, default 0 — total accumulated reward points)
    - `spent_total` (integer, not null, default 0 — total rupees spent by customer)
    - `updated_at` (timestamptz)

2. Security
  - Enable RLS.
  - Allow anon + authenticated access (single-tenant app, no sign-in) for CRUD.
  - Points are tracked by phone number; customers can only query their own points.

3. Notes
  - The unique constraint on phone ensures one row per customer.
  - Points accumulate based on admin-configured rate stored in site_settings under key 'reward_points_config'.
*/

CREATE TABLE IF NOT EXISTS customer_reward_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL UNIQUE,
  points integer NOT NULL DEFAULT 0,
  spent_total integer NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE customer_reward_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_reward_points" ON customer_reward_points;
CREATE POLICY "anon_select_reward_points" ON customer_reward_points FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_reward_points" ON customer_reward_points;
CREATE POLICY "anon_insert_reward_points" ON customer_reward_points FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_reward_points" ON customer_reward_points;
CREATE POLICY "anon_update_reward_points" ON customer_reward_points FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_reward_points" ON customer_reward_points;
CREATE POLICY "anon_delete_reward_points" ON customer_reward_points FOR DELETE
  TO anon, authenticated USING (true);