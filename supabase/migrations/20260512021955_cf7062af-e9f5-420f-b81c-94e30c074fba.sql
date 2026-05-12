CREATE OR REPLACE FUNCTION public.place_order(_items jsonb, _address jsonb, _payment_choice text, _guest_email text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, order_number text, amount_paid_online numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  v_phone_raw text;
  v_phone_clean text;
  v_full_name text;
BEGIN
  IF _items IS NULL OR jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items) = 0 THEN
    RAISE EXCEPTION 'Carrito vacío';
  END IF;
  IF _address IS NULL THEN RAISE EXCEPTION 'Dirección requerida'; END IF;

  -- Email
  v_email := lower(trim(COALESCE(_address->>'email', _guest_email, '')));
  IF v_email !~ '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$' OR length(v_email) > 150 THEN
    RAISE EXCEPTION 'Email inválido';
  END IF;
  IF v_user_id IS NULL AND COALESCE(trim(_guest_email), '') = '' THEN
    RAISE EXCEPTION 'Sesión o email de invitado requerido';
  END IF;

  -- Nombre
  v_full_name := trim(COALESCE(_address->>'full_name',''));
  IF length(v_full_name) < 3 OR length(v_full_name) > 100
     OR v_full_name !~ '^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ''.\- ]+$' THEN
    RAISE EXCEPTION 'Nombre inválido';
  END IF;

  -- Teléfono: celular Colombia 10 dígitos comenzando en 3
  v_phone_raw := COALESCE(_address->>'phone','');
  v_phone_clean := regexp_replace(v_phone_raw, '[^0-9]', '', 'g');
  IF length(v_phone_clean) = 12 AND substring(v_phone_clean,1,2) = '57' THEN
    v_phone_clean := substring(v_phone_clean,3);
  END IF;
  IF v_phone_clean !~ '^3[0-9]{9}$' THEN
    RAISE EXCEPTION 'Celular colombiano inválido (debe tener 10 dígitos y empezar por 3)';
  END IF;

  -- Otros campos requeridos
  IF COALESCE(trim(_address->>'department'),'') = ''
     OR COALESCE(trim(_address->>'city'),'') = ''
     OR length(trim(_address->>'city')) > 80
     OR COALESCE(trim(_address->>'address'),'') = ''
     OR length(trim(_address->>'address')) < 5
     OR length(trim(_address->>'address')) > 200 THEN
    RAISE EXCEPTION 'Datos de dirección incompletos o inválidos';
  END IF;

  -- Settings de pagos
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
    v_payment_status := 'pending';      -- nunca 'paid' aquí; solo el webhook puede marcar como pagado
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
    v_full_name,
    v_phone_clean,                 -- guardamos teléfono normalizado
    v_email,
    _address->>'department',
    trim(_address->>'city'),
    trim(_address->>'address'),
    NULLIF(trim(COALESCE(_address->>'notes','')), '')
  );

  RETURN QUERY SELECT v_order_id, v_order_number, v_paid_online;
END;
$function$;