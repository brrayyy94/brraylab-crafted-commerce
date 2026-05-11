-- Tighten reviews INSERT policy: require verified purchase (delivered order containing the product)
DROP POLICY IF EXISTS "Authenticated users create reviews" ON public.reviews;

CREATE POLICY "Users review only purchased products"
ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND order_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.orders o
    JOIN public.order_items oi ON oi.order_id = o.id
    WHERE o.id = reviews.order_id
      AND o.user_id = auth.uid()
      AND o.status = 'delivered'
      AND oi.product_id = reviews.product_id
  )
);