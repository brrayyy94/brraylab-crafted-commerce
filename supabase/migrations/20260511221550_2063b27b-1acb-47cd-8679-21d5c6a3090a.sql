DO $$
DECLARE
  v_new text := encode(gen_random_bytes(32), 'hex');
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM vault.secrets WHERE name = 'send_email_internal_secret' LIMIT 1;
  IF v_id IS NULL THEN
    PERFORM vault.create_secret(v_new, 'send_email_internal_secret', 'Internal shared secret for send-email edge function');
  ELSE
    PERFORM vault.update_secret(v_id, v_new, 'send_email_internal_secret', 'Internal shared secret for send-email edge function');
  END IF;
END $$;