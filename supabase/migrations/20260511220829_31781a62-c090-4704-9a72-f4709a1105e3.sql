ALTER TABLE public.contact_messages
  ADD CONSTRAINT contact_name_length CHECK (char_length(name) BETWEEN 1 AND 100),
  ADD CONSTRAINT contact_email_length CHECK (char_length(email) BETWEEN 5 AND 254),
  ADD CONSTRAINT contact_email_format CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  ADD CONSTRAINT contact_message_length CHECK (char_length(message) BETWEEN 1 AND 2000),
  ADD CONSTRAINT contact_phone_length CHECK (phone IS NULL OR char_length(phone) <= 30);