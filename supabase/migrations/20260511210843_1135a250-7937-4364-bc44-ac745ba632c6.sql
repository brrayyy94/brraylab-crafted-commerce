CREATE OR REPLACE FUNCTION public.handle_email_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'net'
AS $function$
DECLARE
  v_name text;
  v_url text := 'https://nkxlubotsjnbarzzguaf.supabase.co/functions/v1/send-email';
  v_anon text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5reGx1Ym90c2puYmFyenpndWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMTQxOTUsImV4cCI6MjA5MzU5MDE5NX0.hoLs8iOMVaUi4cJPnemIROSgNB0g4qrmXXSvx_l7vRg';
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    BEGIN
      SELECT COALESCE(p.name, NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', '')
        INTO v_name
        FROM public.profiles p
        WHERE p.id = NEW.id;

      PERFORM net.http_post(
        url := v_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || v_anon,
          'apikey', v_anon
        ),
        body := jsonb_build_object(
          'type', 'welcome',
          'email', NEW.email,
          'name', COALESCE(v_name, '')
        )
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'handle_email_confirmed failed: %', SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.handle_email_confirmed() FROM PUBLIC, anon, authenticated;