import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PaymentSettings = {
  wompi_public_key: string;
  wompi_environment: "sandbox" | "production";
  whatsapp_notifications: string;
  cod_enabled: boolean;
  local_city: string;
  shipping_local: number;
  shipping_national: number;
};

export const defaultPaymentSettings: PaymentSettings = {
  wompi_public_key: "",
  wompi_environment: "sandbox",
  whatsapp_notifications: "",
  cod_enabled: true,
  local_city: "Cali",
  shipping_local: 8000,
  shipping_national: 18000,
};

export const normalizeCity = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export const usePaymentSettings = () =>
  useQuery({
    queryKey: ["site-settings", "payments"],
    queryFn: async (): Promise<PaymentSettings> => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "payments")
        .maybeSingle();
      if (error) throw error;
      const v = (data?.value ?? {}) as Partial<PaymentSettings>;
      return { ...defaultPaymentSettings, ...v };
    },
    staleTime: 60_000,
  });
