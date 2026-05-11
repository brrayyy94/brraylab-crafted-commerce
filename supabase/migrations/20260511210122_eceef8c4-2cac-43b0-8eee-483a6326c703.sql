
-- Enable pg_net so the trigger can call the edge function
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Recreate trigger function: tolerate missing net schema and never block confirmation
CREATE OR REPLACE FUNCTION public.handle_email_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_name text;
  v_url text := 'https://nkxlubotsjnbarzzguaf.supabase.co/functions/v1/send-email';
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    BEGIN
      SELECT COALESCE(p.name, NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', '')
        INTO v_name
        FROM public.profiles p
        WHERE p.id = NEW.id;

      PERFORM extensions.http_post(
        url := v_url,
        headers := jsonb_build_object('Content-Type', 'application/json'),
        body := jsonb_build_object(
          'type', 'welcome',
          'email', NEW.email,
          'name', COALESCE(v_name, '')
        )
      );
    EXCEPTION WHEN OTHERS THEN
      -- Never block email confirmation if the email send fails
      RAISE WARNING 'handle_email_confirmed failed: %', SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$function$;

-- Ensure trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
AFTER UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_email_confirmed();

REVOKE EXECUTE ON FUNCTION public.handle_email_confirmed() FROM PUBLIC, anon, authenticated;
