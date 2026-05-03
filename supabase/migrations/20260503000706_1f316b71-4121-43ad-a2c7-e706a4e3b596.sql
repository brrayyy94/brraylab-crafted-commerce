DROP POLICY IF EXISTS "Anyone can create order" ON public.orders;
CREATE POLICY "Customers and guests can create orders"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (
  (auth.uid() = user_id)
  OR (auth.uid() IS NULL AND user_id IS NULL AND guest_email IS NOT NULL)
);

DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;
CREATE POLICY "Customers and guests can create order items"
ON public.order_items
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND (
        auth.uid() = o.user_id
        OR (auth.uid() IS NULL AND o.user_id IS NULL AND o.guest_email IS NOT NULL)
      )
  )
);

DROP POLICY IF EXISTS "Anyone can insert order addresses" ON public.order_addresses;
CREATE POLICY "Customers and guests can create order addresses"
ON public.order_addresses
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_addresses.order_id
      AND (
        auth.uid() = o.user_id
        OR (auth.uid() IS NULL AND o.user_id IS NULL AND o.guest_email IS NOT NULL)
      )
  )
);

DROP POLICY IF EXISTS "Product images are publicly readable" ON storage.objects;