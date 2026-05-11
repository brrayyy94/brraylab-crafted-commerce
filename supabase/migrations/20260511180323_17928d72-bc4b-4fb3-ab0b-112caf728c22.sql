
-- Replace the broad public SELECT policy on product-images with no API-level
-- list/select access. Public bucket files remain accessible via their direct
-- public URL (served by the storage CDN, which doesn't go through RLS).
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;

-- Allow only admins to list/inspect product image objects via the API.
CREATE POLICY "Admins can list product images"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));
