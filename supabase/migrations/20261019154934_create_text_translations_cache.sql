/*
# Translation cache for product descriptions and store pages

1. New Tables
- `text_translations`
  - `source_hash` (text) - SHA-256 hash of the original text
  - `lang` (text) - target language code (bn, en, hi, ur)
  - `translated` (text) - translated text
  - `created_at` (timestamptz)
  - Primary key (source_hash, lang)
2. Security
- RLS enabled.
- Public (anon + authenticated) SELECT: translations are non-sensitive public shop content.
- No insert/update/delete policies: only the translate-text edge function (service role) writes.
*/

CREATE TABLE IF NOT EXISTS text_translations (
  source_hash text NOT NULL,
  lang text NOT NULL CHECK (lang IN ('bn','en','hi','ur')),
  translated text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source_hash, lang)
);

ALTER TABLE text_translations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_text_translations" ON text_translations;
CREATE POLICY "public_read_text_translations" ON text_translations FOR SELECT
  TO anon, authenticated USING (true);
