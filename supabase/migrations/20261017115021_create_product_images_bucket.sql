/*
# Create public product-images storage bucket

1. Purpose
- The FALAH store admin panel lets the owner upload product photos from a phone.
- Photos must be stored in the cloud so every visitor sees them on all devices.

2. Changes
- Creates a storage bucket named `product-images` (idempotent).
- The bucket is PUBLIC: any visitor can view uploaded product photos via their public URL.
- RLS-style storage policies:
  - Public READ for everyone (anon + authenticated) — product photos must be visible site-wide.
  - Public INSERT/UPDATE/DELETE for anon + authenticated — the admin panel has a simple
    password gate in the app (not Supabase Auth), so uploads happen as the anon role.

3. Security notes
- This bucket intentionally holds only public product photos; nothing private is stored here.
- Write access is open to the anon role because the admin gate is app-level. Acceptable for
  this single-tenant storefront; product photos are non-sensitive public catalog data.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'product-images') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('product-images', 'product-images', true);
  END IF;
END $$;

DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
CREATE POLICY "Public read product images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Public upload product images" ON storage.objects;
CREATE POLICY "Public upload product images"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Public update product images" ON storage.objects;
CREATE POLICY "Public update product images"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Public delete product images" ON storage.objects;
CREATE POLICY "Public delete product images"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'product-images');
