-- ============================================================
-- Fix 1: Rotate the internal email secret WITHOUT a plaintext literal in the migration.
-- Generates a fresh random secret and stores it in vault.
-- ============================================================
DO $$
DECLARE
  v_new_secret text := encode(gen_random_bytes(32), 'hex');
BEGIN
  IF EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'send_email_internal_secret') THEN
    PERFORM vault.update_secret(
      (SELECT id FROM vault.secrets WHERE name = 'send_email_internal_secret'),
      v_new_secret
    );
  ELSE
    PERFORM vault.create_secret(v_new_secret, 'send_email_internal_secret', 'Internal secret used by DB triggers to authenticate calls to the send-email edge function.');
  END IF;
END
$$;

-- ============================================================
-- Fix 2: Server-side authoritative order creation (price-injection prevention).
-- Replaces direct client inserts on orders/order_items/order_addresses.
-- ============================================================
CREATE OR REPLACE FUNCTION public.place_order(
  _items jsonb,
  _address jsonb,
  _payment_choice text,
  _guest_email text DEFAULT NULL
)
RETURNS TABLE (id uuid, order_number text, amount_paid_online numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_user_id uuid := auth.uid();
  v_payments jsonb;
  v_local_city text;
  v_shipping_local numeric;
  v_shipping_national numeric;
  v_cod_enabled boolean;
  v_wompi_env text;
  v_is_local boolean;
  v_subtotal numeric := 0;
  v_shipping numeric;
  v_total numeric;
  v_paid_online numeric;
  v_due_on_delivery numeric;
  v_payment_status public.payment_status;
  v_payment_method text;
  v_order_id uuid;
  v_order_number text;
  v_item jsonb;
  v_product record;
  v_qty int;
  v_email text;
BEGIN
  IF _items IS NULL OR jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items) = 0 THEN
    RAISE EXCEPTION 'Carrito vacío';
  END IF;
  IF _address IS NULL THEN RAISE EXCEPTION 'Dirección requerida'; END IF;

  v_email := lower(trim(COALESCE(_address->>'email', _guest_email, '')));
  IF v_email = '' OR position('@' in v_email) = 0 THEN
    RAISE EXCEPTION 'Email inválido';
  END IF;
  IF v_user_id IS NULL AND COALESCE(trim(_guest_email), '') = '' THEN
    RAISE EXCEPTION 'Sesión o email de invitado requerido';
  END IF;

  -- Required address fields
  IF COALESCE(trim(_address->>'full_name'),'') = ''
     OR COALESCE(trim(_address->>'phone'),'') = ''
     OR COALESCE(trim(_address->>'department'),'') = ''
     OR COALESCE(trim(_address->>'city'),'') = ''
     OR COALESCE(trim(_address->>'address'),'') = '' THEN
    RAISE EXCEPTION 'Datos de dirección incompletos';
  END IF;

  -- Load payment settings (authoritative)
  SELECT value INTO v_payments FROM public.site_settings WHERE key = 'payments';
  IF v_payments IS NULL THEN RAISE EXCEPTION 'Configuración de pagos faltante'; END IF;
  v_local_city := COALESCE(v_payments->>'local_city', 'Cali');
  v_shipping_local := COALESCE((v_payments->>'shipping_local')::numeric, 0);
  v_shipping_national := COALESCE((v_payments->>'shipping_national')::numeric, 0);
  v_cod_enabled := COALESCE((v_payments->>'cod_enabled')::boolean, true);
  v_wompi_env := COALESCE(v_payments->>'wompi_environment', 'sandbox');

  v_is_local := lower(trim(_address->>'city')) = lower(trim(v_local_city));
  v_shipping := CASE WHEN v_is_local THEN v_shipping_local ELSE v_shipping_national END;

  IF _payment_choice NOT IN ('wompi_full', 'cod') THEN
    RAISE EXCEPTION 'Método de pago inválido';
  END IF;
  IF _payment_choice = 'cod' AND NOT v_cod_enabled THEN
    RAISE EXCEPTION 'Contraentrega no disponible';
  END IF;

  -- Compute subtotal from authoritative product prices
  FOR v_item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    v_qty := COALESCE((v_item->>'quantity')::int, 0);
    IF v_qty <= 0 OR v_qty > 1000 THEN RAISE EXCEPTION 'Cantidad inválida'; END IF;
    SELECT p.id, p.name, p.price, COALESCE(p.images->>0, '') AS image
      INTO v_product
      FROM public.products p
      WHERE p.id = (v_item->>'product_id')::uuid AND p.active = true;
    IF NOT FOUND THEN RAISE EXCEPTION 'Producto no encontrado o inactivo'; END IF;
    v_subtotal := v_subtotal + (v_product.price * v_qty);
  END LOOP;

  v_total := v_subtotal + v_shipping;

  IF _payment_choice = 'wompi_full' THEN
    v_paid_online := v_total; v_due_on_delivery := 0;
    v_payment_status := 'pending';
    v_payment_method := 'wompi_full';
  ELSE
    IF v_is_local THEN
      v_paid_online := 0; v_due_on_delivery := v_total;
      v_payment_status := 'cod_pending';
      v_payment_method := 'cash_on_delivery';
    ELSE
      v_paid_online := v_shipping; v_due_on_delivery := v_subtotal;
      v_payment_status := 'pending';
      v_payment_method := 'wompi_shipping_cod_product';
    END IF;
  END IF;

  INSERT INTO public.orders (
    user_id, guest_email, subtotal, shipping_cost, total,
    amount_paid_online, amount_due_on_delivery,
    status, payment_status, payment_method, payment_environment, notes
  ) VALUES (
    v_user_id,
    CASE WHEN v_user_id IS NULL THEN v_email ELSE NULL END,
    v_subtotal, v_shipping, v_total,
    v_paid_online, v_due_on_delivery,
    'pending', v_payment_status, v_payment_method, v_wompi_env,
    NULLIF(trim(COALESCE(_address->>'notes','')), '')
  ) RETURNING orders.id, orders.order_number INTO v_order_id, v_order_number;

  FOR v_item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    v_qty := (v_item->>'quantity')::int;
    SELECT p.id, p.name, p.price, COALESCE(p.images->>0, '') AS image
      INTO v_product FROM public.products p WHERE p.id = (v_item->>'product_id')::uuid;
    INSERT INTO public.order_items (order_id, product_id, name, price, quantity, image_url)
    VALUES (v_order_id, v_product.id, v_product.name, v_product.price, v_qty, v_product.image);
  END LOOP;

  INSERT INTO public.order_addresses (
    order_id, full_name, phone, email, department, city, address, notes
  ) VALUES (
    v_order_id,
    trim(_address->>'full_name'),
    trim(_address->>'phone'),
    v_email,
    _address->>'department',
    trim(_address->>'city'),
    trim(_address->>'address'),
    NULLIF(trim(COALESCE(_address->>'notes','')), '')
  );

  RETURN QUERY SELECT v_order_id, v_order_number, v_paid_online;
END;
$fn$;

REVOKE EXECUTE ON FUNCTION public.place_order(jsonb, jsonb, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_order(jsonb, jsonb, text, text) TO anon, authenticated;

-- ============================================================
-- Tighten RLS: forbid direct client inserts on orders/order_items/order_addresses.
-- Only the SECURITY DEFINER function place_order may insert (it bypasses RLS).
-- ============================================================
DROP POLICY IF EXISTS "Customers and guests can create orders" ON public.orders;
DROP POLICY IF EXISTS "Customers and guests can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Customers and guests can create order addresses" ON public.order_addresses;
