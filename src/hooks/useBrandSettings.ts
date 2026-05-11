import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type BrandSettings = {
  logo_url: string | null;
};

export const defaultBrandSettings: BrandSettings = {
  logo_url: null,
};

export const useBrandSettings = () =>
  useQuery({
    queryKey: ["site-settings", "brand"],
    queryFn: async (): Promise<BrandSettings> => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "brand")
        .maybeSingle();
      if (error) throw error;
      const v = (data?.value ?? {}) as Partial<BrandSettings>;
      return { logo_url: v.logo_url ?? null };
    },
    staleTime: 60_000,
  });
