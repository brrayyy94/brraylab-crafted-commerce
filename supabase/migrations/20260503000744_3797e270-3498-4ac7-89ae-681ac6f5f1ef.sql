DROP POLICY IF EXISTS "Public read product-images by path" ON storage.objects;
DROP POLICY IF EXISTS "Admins upload product-images" ON storage.objects;
DROP POLICY IF EXISTS "Admins update product-images" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete product-images" ON storage.objects;
DROP POLICY IF EXISTS "Product images are publicly readable" ON storage.objects;