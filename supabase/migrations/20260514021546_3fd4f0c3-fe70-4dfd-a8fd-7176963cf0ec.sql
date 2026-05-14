-- Tabla de testimonios del home
CREATE TABLE public.home_testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating IS NULL OR (rating BETWEEN 1 AND 5)),
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_home_testimonials_active_order
  ON public.home_testimonials (active, display_order);

ALTER TABLE public.home_testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active testimonials"
  ON public.home_testimonials FOR SELECT
  USING (active = true OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins insert testimonials"
  ON public.home_testimonials FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins update testimonials"
  ON public.home_testimonials FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins delete testimonials"
  ON public.home_testimonials FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER update_home_testimonials_updated_at
  BEFORE UPDATE ON public.home_testimonials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Datos iniciales (puedes borrarlos luego desde el admin)
INSERT INTO public.home_testimonials (name, role, content, rating, display_order, active) VALUES
  ('Andrés M.', 'Cliente en Bogotá', 'Pedí los AirPods Pro y llegaron en 2 días a Bogotá. Calidad real, no es paja. Ya pedí los segundos.', 5, 1, true),
  ('Valentina R.', 'Cliente en Medellín', 'El smartwatch es brutal. Batería que aguanta 5 días y se ve elegante. Recomendado 100%.', 5, 2, true),
  ('Camilo S.', 'Cliente en Cali', 'El kit de creador me cambió las grabaciones. Por el precio que tiene es un robo, pero a mi favor.', 5, 3, true);