-- Tabla contact_messages
CREATE TABLE public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Cualquiera (anon o autenticado) puede crear mensajes
CREATE POLICY "Anyone can submit contact messages"
ON public.contact_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Solo admin puede ver/actualizar
CREATE POLICY "Admins view contact messages"
ON public.contact_messages
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update contact messages"
ON public.contact_messages
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete contact messages"
ON public.contact_messages
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_contact_messages_created ON public.contact_messages (created_at DESC);
CREATE INDEX idx_contact_messages_unread ON public.contact_messages (read) WHERE read = false;