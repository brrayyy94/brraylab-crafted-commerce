import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Testimonial = {
  id: string;
  name: string;
  role: string | null;
  content: string;
  rating: number | null;
  image_url: string | null;
  display_order: number;
};

const AUTOPLAY_MS = 5500;

export const TestimonialsCarousel = () => {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["home-testimonials"],
    queryFn: async (): Promise<Testimonial[]> => {
      const { data, error } = await (supabase as any)
        .from("home_testimonials")
        .select("id, name, role, content, rating, image_url, display_order")
        .eq("active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number | null>(null);

  const count = items.length;

  useEffect(() => {
    if (count < 2 || paused) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [count, paused]);

  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [count, index]);

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-surface border border-subtle p-10 text-center text-sm text-muted-foreground">
        Cargando reseñas…
      </div>
    );
  }
  if (count === 0) return null;

  const go = (dir: 1 | -1) => setIndex((i) => (i + dir + count) % count);

  const onTouchStart = (e: React.TouchEvent) => (startX.current = e.touches[0].clientX);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (startX.current == null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    startX.current = null;
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="overflow-hidden rounded-2xl"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          ref={trackRef}
          className="flex transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {items.map((t) => (
            <article
              key={t.id}
              className="min-w-full px-1 md:px-2"
              aria-hidden={items[index].id !== t.id}
            >
              <div className="rounded-2xl bg-surface border border-subtle p-8 md:p-12 flex flex-col gap-6 md:min-h-[280px]">
                {t.rating ? (
                  <div className="flex gap-0.5 text-primary-glow">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                ) : null}
                <p className="text-base md:text-xl text-foreground/90 leading-relaxed font-light">
                  "{t.content}"
                </p>
                <div className="mt-auto pt-4 border-t border-subtle flex items-center gap-3">
                  {t.image_url ? (
                    <img
                      src={t.image_url}
                      alt={t.name}
                      className="h-11 w-11 rounded-full object-cover border border-subtle"
                    />
                  ) : (
                    <div className="h-11 w-11 rounded-full bg-primary/20 text-primary-glow flex items-center justify-center font-display font-bold">
                      {t.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-sm">{t.name}</p>
                    {t.role && <p className="text-xs text-muted-foreground">{t.role}</p>}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Anterior"
            className="absolute left-2 md:-left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-surface/90 backdrop-blur border border-subtle hover:border-primary-glow hover:text-primary-glow flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Siguiente"
            className="absolute right-2 md:-right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-surface/90 backdrop-blur border border-subtle hover:border-primary-glow hover:text-primary-glow flex items-center justify-center transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="mt-6 flex justify-center gap-2">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Ir al testimonio ${i + 1}`}
                onClick={() => setIndex(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index ? "w-8 bg-primary-glow" : "w-1.5 bg-foreground/20 hover:bg-foreground/40",
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
