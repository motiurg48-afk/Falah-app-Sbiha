/*
# Create courier_configs table for multi-courier API management

1. New Tables
- `courier_configs` — stores API credentials for each courier
  - `id` (uuid, primary key)
  - `courier_slug` (text, unique, not null) — e.g. "delhivery", "shiprocket", "steadfast"
  - `api_key` (text)
  - `api_secret` (text)
  - `is_enabled` (boolean, default false)
  - `extra_config` (jsonb, default '{}') — courier-specific settings (endpoint URLs, etc.)
  - `created_at` (timestamp)
  - `updated_at` (timestamp)

2. Security
- Enable RLS on courier_configs
- Allow anon + authenticated CRUD (single-tenant admin app)
*/

CREATE TABLE IF NOT EXISTS courier_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_slug text UNIQUE NOT NULL,
  api_key text,
  api_secret text,
  is_enabled boolean NOT NULL DEFAULT false,
  extra_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE courier_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_courier_configs" ON courier_configs;
CREATE POLICY "anon_select_courier_configs" ON courier_configs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_courier_configs" ON courier_configs;
CREATE POLICY "anon_insert_courier_configs" ON courier_configs FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_courier_configs" ON courier_configs;
CREATE POLICY "anon_update_courier_configs" ON courier_configs FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_courier_configs" ON courier_configs;
CREATE POLICY "anon_delete_courier_configs" ON courier_configs FOR DELETE
  TO anon, authenticated USING (true);