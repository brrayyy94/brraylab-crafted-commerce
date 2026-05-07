import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type HeroBgType = "none" | "image" | "video";

export type HeroSettings = {
  type: HeroBgType;
  image_url: string | null;
  video_url: string | null;
  overlay_opacity: number;
};

export const defaultHeroSettings: HeroSettings = {
  type: "none",
  image_url: null,
  video_url: null,
  overlay_opacity: 0.5,
};

export const useHeroSettings = () =>
  useQuery({
    queryKey: ["site-settings", "hero"],
    queryFn: async (): Promise<HeroSettings> => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "hero")
        .maybeSingle();
      if (error) throw error;
      const v = (data?.value ?? {}) as Partial<HeroSettings>;
      return {
        type: (v.type as HeroBgType) ?? "none",
        image_url: v.image_url ?? null,
        video_url: v.video_url ?? null,
        overlay_opacity: typeof v.overlay_opacity === "number" ? v.overlay_opacity : 0.5,
      };
    },
    staleTime: 60_000,
  });
