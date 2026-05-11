-- Admin-only RPC to fetch the internal email secret from vault.
-- Only the service_role (used by edge functions with the service key) may call it.
CREATE OR REPLACE FUNCTION public._send_email_internal_secret_admin()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, vault
AS $$
  SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'send_email_internal_secret' LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public._send_email_internal_secret_admin() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._send_email_internal_secret_admin() TO service_role;
