/*
# Restrict product image modifications to admins

1. Security
- Replace public UPDATE/DELETE on storage objects in the `product-images` bucket with admin-only policies (uses public.is_admin()).
- Public read and upload remain (customers upload design samples and review photos).
*/

DROP POLICY IF EXISTS "Public delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Public update product images" ON storage.objects;

DROP POLICY IF EXISTS "Admins delete product images" ON storage.objects;
CREATE POLICY "Admins delete product images" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'product-images' AND public.is_admin());

DROP POLICY IF EXISTS "Admins update product images" ON storage.objects;
CREATE POLICY "Admins update product images" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'product-images' AND public.is_admin())
  WITH CHECK (bucket_id = 'product-images' AND public.is_admin());