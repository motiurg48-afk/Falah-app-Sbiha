/*
# Create private app_secrets table

1. New Tables
- `app_secrets`
  - `name` (text, primary key) — secret identifier, e.g. GEMINI_API_KEY
  - `value` (text, not null) — the secret value
  - `created_at` (timestamp)

2. Security
- RLS is ENABLED with NO policies, so the anon/authenticated roles (browser clients)
  can never read or write any row. Only the server (service role) can access it.
- This table stores the Google Gemini API key used by the motiur-chat edge function.
*/

CREATE TABLE IF NOT EXISTS app_secrets (
  name text PRIMARY KEY,
  value text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE app_secrets ENABLE ROW LEVEL SECURITY;
