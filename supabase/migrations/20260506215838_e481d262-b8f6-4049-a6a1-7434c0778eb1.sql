-- Create hero_slides table
CREATE TABLE public.hero_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  subtitle text,
  cta_text text,
  cta_link text,
  image_url text,
  active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active hero slides"
  ON public.hero_slides FOR SELECT
  USING (active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage hero slides"
  ON public.hero_slides FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_hero_slides_updated_at
  BEFORE UPDATE ON public.hero_slides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();