
-- Restrict EXECUTE on SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- Tighten storage public bucket: remove broad listing policy and re-add only read-by-path
DROP POLICY IF EXISTS "Public read product-images" ON storage.objects;

CREATE POLICY "Public read product-images by path"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Mark bucket as not public-listable (still publicly accessible by URL since URLs are signed via path)
UPDATE storage.buckets SET public = true WHERE id = 'product-images';
