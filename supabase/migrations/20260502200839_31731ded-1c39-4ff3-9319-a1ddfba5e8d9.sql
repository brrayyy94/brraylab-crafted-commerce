-- Simplificar RLS de orders/order_items/order_addresses para permitir invitados y registrados
DROP POLICY IF EXISTS "Anyone can create order" ON public.orders;
CREATE POLICY "Anyone can create order"
ON public.orders FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;
CREATE POLICY "Anyone can insert order items"
ON public.order_items FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can insert order addresses" ON public.order_addresses;
CREATE POLICY "Anyone can insert order addresses"
ON public.order_addresses FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Permitir consulta pública de la confirmación por order_number (usado en /orden/:number)
DROP POLICY IF EXISTS "Public can view order by number" ON public.orders;
CREATE POLICY "Public can view order by number"
ON public.orders FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Public can view order items" ON public.order_items;
CREATE POLICY "Public can view order items"
ON public.order_items FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Public can view order addresses" ON public.order_addresses;
CREATE POLICY "Public can view order addresses"
ON public.order_addresses FOR SELECT
TO anon, authenticated
USING (true);