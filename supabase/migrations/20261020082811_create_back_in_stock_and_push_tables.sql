/*
# Create back_in_stock_alerts and push_notification_broadcasts tables

1. New Tables
- `back_in_stock_alerts` — stores customer requests to be notified when a product is back in stock
  - `id` (uuid, primary key)
  - `product_id` (text, not null)
  - `customer_phone` (text)
  - `customer_email` (text)
  - `notified` (boolean, default false)
  - `created_at` (timestamp)

- `push_notification_broadcasts` — admin-sent promotional push alerts
  - `id` (uuid, primary key)
  - `title` (text, not null)
  - `body` (text, not null)
  - `created_at` (timestamp)

2. Security
- Enable RLS on both tables
- Allow anon + authenticated CRUD because the app has no sign-in (single-tenant, shared data)
*/

CREATE TABLE IF NOT EXISTS back_in_stock_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL,
  customer_phone text,
  customer_email text,
  notified boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE back_in_stock_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_back_in_stock_alerts" ON back_in_stock_alerts;
CREATE POLICY "anon_select_back_in_stock_alerts" ON back_in_stock_alerts FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_back_in_stock_alerts" ON back_in_stock_alerts;
CREATE POLICY "anon_insert_back_in_stock_alerts" ON back_in_stock_alerts FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_back_in_stock_alerts" ON back_in_stock_alerts;
CREATE POLICY "anon_update_back_in_stock_alerts" ON back_in_stock_alerts FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS push_notification_broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE push_notification_broadcasts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_push_notification_broadcasts" ON push_notification_broadcasts;
CREATE POLICY "anon_select_push_notification_broadcasts" ON push_notification_broadcasts FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_push_notification_broadcasts" ON push_notification_broadcasts;
CREATE POLICY "anon_insert_push_notification_broadcasts" ON push_notification_broadcasts FOR INSERT
  TO anon, authenticated WITH CHECK (true);