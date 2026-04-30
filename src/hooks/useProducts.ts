import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Product, Category } from "@/data/products";

type DbProductRow = {
  id: string;
  slug: string;
  name: string;
  price: number;
  compare_price: number | null;
  badge: string | null;
  short_desc: string | null;
  description: string | null;
  images: unknown;
  stock: number;
  featured: boolean;
  active: boolean;
  category_id: string | null;
  categories: { slug: string; name: string } | null;
};

const PLACEHOLDER = "/placeholder.svg";

const parseImages = (raw: unknown): string[] => {
  if (Array.isArray(raw)) return raw.filter((v): v is string => typeof v === "string");
  return [];
};

const extractFeatures = (description: string | null): string[] => {
  if (!description) return [];
  return description
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("•"))
    .map((l) => l.replace(/^•\s*/, ""));
};

const stripFeatures = (description: string | null): string => {
  if (!description) return "";
  // Cortamos en "Características:" si existe.
  const idx = description.indexOf("Características:");
  return (idx >= 0 ? description.slice(0, idx) : description).trim();
};

const mapProduct = (row: DbProductRow): Product => {
  const images = parseImages(row.images);
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    price: Number(row.price),
    oldPrice: row.compare_price ? Number(row.compare_price) : undefined,
    category: row.categories?.name ?? "",
    categorySlug: row.categories?.slug ?? "",
    badge: row.badge ?? undefined,
    image: images[0] ?? PLACEHOLDER,
    images: images.length ? images : [PLACEHOLDER],
    shortDescription: row.short_desc ?? "",
    description: stripFeatures(row.description),
    features: extractFeatures(row.description),
    stock: row.stock,
    featured: row.featured,
  };
};

const SELECT = "id, slug, name, price, compare_price, badge, short_desc, description, images, stock, featured, active, category_id, categories(slug, name)";

export const useProducts = () => {
  return useQuery({
    queryKey: ["products"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select(SELECT)
        .eq("active", true)
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as DbProductRow[]).map(mapProduct);
    },
  });
};

export const useProduct = (slug: string | undefined) => {
  return useQuery({
    queryKey: ["product", slug],
    enabled: !!slug,
    queryFn: async (): Promise<Product | null> => {
      const { data, error } = await supabase
        .from("products")
        .select(SELECT)
        .eq("slug", slug!)
        .eq("active", true)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return mapProduct(data as unknown as DbProductRow);
    },
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, slug, name, image_url, order")
        .eq("active", true)
        .order("order", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        image: c.image_url ?? PLACEHOLDER,
      }));
    },
  });
};
