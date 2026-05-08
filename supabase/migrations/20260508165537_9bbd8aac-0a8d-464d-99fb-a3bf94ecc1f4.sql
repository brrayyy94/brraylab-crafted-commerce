
-- Replace the broad ALL policy with explicit per-command policies for clarity
DROP POLICY IF EXISTS "Admins manage site settings" ON public.site_settings;

CREATE POLICY "Admins insert site settings"
ON public.site_settings FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update site settings"
ON public.site_settings FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete site settings"
ON public.site_settings FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Ensure unique key for upsert by key
CREATE UNIQUE INDEX IF NOT EXISTS site_settings_key_unique ON public.site_settings(key);

-- Make sure default hero row exists
INSERT INTO public.site_settings (key, value)
VALUES ('hero', '{"type":"none","image_url":null,"video_url":null,"overlay_opacity":0.5}'::jsonb)
ON CONFLICT (key) DO NOTHING;
