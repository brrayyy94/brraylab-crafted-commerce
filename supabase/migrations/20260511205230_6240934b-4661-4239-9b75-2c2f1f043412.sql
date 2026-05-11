-- Function: send welcome email when user confirms their email
CREATE OR REPLACE FUNCTION public.handle_email_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text;
  v_url text := 'https://nkxlubotsjnbarzzguaf.supabase.co/functions/v1/send-email';
BEGIN
  -- Only fire when email_confirmed_at transitions from NULL to NOT NULL
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    SELECT COALESCE(p.name, NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', '')
      INTO v_name
      FROM public.profiles p
      WHERE p.id = NEW.id;

    PERFORM net.http_post(
      url := v_url,
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object(
        'type', 'welcome',
        'email', NEW.email,
        'name', COALESCE(v_name, '')
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
AFTER UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_email_confirmed();
