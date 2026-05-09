ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_reference text,
  ADD COLUMN IF NOT EXISTS payment_environment text,
  ADD COLUMN IF NOT EXISTS amount_paid_online numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS amount_due_on_delivery numeric NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'cod_pending' AND enumtypid = 'public.payment_status'::regtype) THEN
    ALTER TYPE public.payment_status ADD VALUE 'cod_pending';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'partial_paid' AND enumtypid = 'public.payment_status'::regtype) THEN
    ALTER TYPE public.payment_status ADD VALUE 'partial_paid';
  END IF;
END $$;

INSERT INTO public.site_settings (key, value)
VALUES ('payments', jsonb_build_object(
  'wompi_public_key', '',
  'wompi_environment', 'sandbox',
  'whatsapp_notifications', '',
  'cod_enabled', true,
  'local_city', 'Cali',
  'shipping_local', 8000,
  'shipping_national', 18000
))
ON CONFLICT (key) DO NOTHING;