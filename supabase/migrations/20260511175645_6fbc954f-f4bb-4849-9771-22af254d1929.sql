
-- 1) Remove overly permissive public SELECT policies
DROP POLICY IF EXISTS "Public can view order by number" ON public.orders;
DROP POLICY IF EXISTS "Public can view order items" ON public.order_items;
DROP POLICY IF EXISTS "Public can view order addresses" ON public.order_addresses;

-- 2) Revoke EXECUTE on internal SECURITY DEFINER functions from anon/authenticated.
-- These are used internally by RLS / triggers and should not be callable via PostgREST.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;

-- 3) Server-side lookup function for guest order confirmation page.
-- Returns order summary by order_number ONLY when caller provides matching guest_email,
-- or when the caller is the owner / an admin.
CREATE OR REPLACE FUNCTION public.get_order_for_confirmation(_order_number text, _email text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  o public.orders%ROWTYPE;
  result jsonb;
BEGIN
  SELECT * INTO o FROM public.orders WHERE order_number = _order_number LIMIT 1;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Authorization: owner, admin, or guest with matching email
  IF NOT (
    (auth.uid() IS NOT NULL AND o.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR (o.user_id IS NULL AND _email IS NOT NULL AND lower(o.guest_email) = lower(_email))
  ) THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'order', to_jsonb(o) - 'updated_at',
    'items', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', i.id, 'name', i.name, 'price', i.price,
        'quantity', i.quantity, 'image_url', i.image_url
      )) FROM public.order_items i WHERE i.order_id = o.id
    ), '[]'::jsonb),
    'address', (
      SELECT to_jsonb(a) FROM public.order_addresses a WHERE a.order_id = o.id LIMIT 1
    )
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_order_for_confirmation(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_order_for_confirmation(text, text) TO anon, authenticated;
