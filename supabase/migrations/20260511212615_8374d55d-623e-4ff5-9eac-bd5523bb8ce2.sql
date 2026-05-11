-- Seed internal secret into Vault for trigger functions to use as X-Internal-Secret header.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'send_email_internal_secret') THEN
    PERFORM vault.create_secret('<HARD_CODED_SECRET_REMOVED>', 'send_email_internal_secret', 'Internal secret used by DB triggers to authenticate calls to the send-email edge function.');
  ELSE
    UPDATE vault.secrets SET secret = '<HARD_CODED_SECRET_REMOVED>' WHERE name = 'send_email_internal_secret';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public._send_email_internal_secret()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, vault
AS $$ SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'send_email_internal_secret' LIMIT 1; $$;
REVOKE EXECUTE ON FUNCTION public._send_email_internal_secret() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.handle_email_confirmed()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, net
AS $fn$
DECLARE
  v_name text;
  v_url text := 'https://nkxlubotsjnbarzzguaf.supabase.co/functions/v1/send-email';
  v_anon text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5reGx1Ym90c2puYmFyenpndWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMTQxOTUsImV4cCI6MjA5MzU5MDE5NX0.hoLs8iOMVaUi4cJPnemIROSgNB0g4qrmXXSvx_l7vRg';
  v_secret text;
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    BEGIN
      SELECT COALESCE(p.name, NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', '')
        INTO v_name FROM public.profiles p WHERE p.id = NEW.id;
      v_secret := public._send_email_internal_secret();
      PERFORM net.http_post(
        url := v_url,
        headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_anon,'apikey',v_anon,'x-internal-secret',COALESCE(v_secret,'')),
        body := jsonb_build_object('type','welcome','email',NEW.email,'name',COALESCE(v_name,''))
      );
    EXCEPTION WHEN OTHERS THEN RAISE WARNING 'handle_email_confirmed failed: %', SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.handle_order_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, net
AS $fn$
DECLARE
  v_url text := 'https://nkxlubotsjnbarzzguaf.supabase.co/functions/v1/send-email';
  v_anon text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5reGx1Ym90c2puYmFyenpndWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMTQxOTUsImV4cCI6MjA5MzU5MDE5NX0.hoLs8iOMVaUi4cJPnemIROSgNB0g4qrmXXSvx_l7vRg';
  v_secret text;
BEGIN
  BEGIN
    v_secret := public._send_email_internal_secret();
    PERFORM net.http_post(
      url := v_url,
      headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_anon,'apikey',v_anon,'x-internal-secret',COALESCE(v_secret,'')),
      body := jsonb_build_object('type','order_created','order_number',NEW.order_number)
    );
  EXCEPTION WHEN OTHERS THEN RAISE WARNING 'handle_order_created failed: %', SQLERRM;
  END;
  RETURN NEW;
END;
$fn$;
REVOKE EXECUTE ON FUNCTION public.handle_order_created() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.handle_order_status_changed()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, net
AS $fn$
DECLARE
  v_url text := 'https://nkxlubotsjnbarzzguaf.supabase.co/functions/v1/send-email';
  v_anon text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5reGx1Ym90c2puYmFyenpndWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMTQxOTUsImV4cCI6MjA5MzU5MDE5NX0.hoLs8iOMVaUi4cJPnemIROSgNB0g4qrmXXSvx_l7vRg';
  v_secret text;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    BEGIN
      v_secret := public._send_email_internal_secret();
      PERFORM net.http_post(
        url := v_url,
        headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_anon,'apikey',v_anon,'x-internal-secret',COALESCE(v_secret,'')),
        body := jsonb_build_object('type','order_status','order_number',NEW.order_number)
      );
    EXCEPTION WHEN OTHERS THEN RAISE WARNING 'handle_order_status_changed failed: %', SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$fn$;
REVOKE EXECUTE ON FUNCTION public.handle_order_status_changed() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_order_created ON public.orders;
CREATE TRIGGER on_order_created AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_order_created();

DROP TRIGGER IF EXISTS on_order_status_changed ON public.orders;
CREATE TRIGGER on_order_status_changed AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_order_status_changed();