import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { type Product, formatPrice } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/utils";

const badgeStyles: Record<string, string> = {
  "Más vendido": "bg-primary text-primary-foreground",
  "Nuevo": "bg-primary-glow text-accent-foreground",
  "Oferta": "bg-destructive text-destructive-foreground",
};

const SELECT = "id, slug, name, price, compare_price, badge, short_desc, description, images, stock, featured, active, category_id, categories(slug, name)";

export const ProductCard = ({
  product,
  eager = false,
}: {
  product: Product;
  eager?: boolean;
}) => {
  const { add } = useCart();
  const qc = useQueryClient();

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.stock <= 0) {
      toast.error("Producto agotado");
      return;
    }
    add(product, 1);
    toast.success(`${product.name} agregado`, { description: "Ya está en tu carrito." });
  };

  const prefetch = () => {
    qc.prefetchQuery({
      queryKey: ["product", product.slug],
      queryFn: async () => {
        const { data } = await supabase.from("products").select(SELECT).eq("slug", product.slug).eq("active", true).maybeSingle();
        return data;
      },
      staleTime: 5 * 60 * 1000,
    });
  };

  const soldOut = product.stock <= 0;

  return (
    <Link
      to={`/producto/${product.slug}`}
      onMouseEnter={prefetch}
      onFocus={prefetch}
      className="product-card group relative flex flex-col rounded-xl bg-surface border border-subtle overflow-hidden"
    >
      <div className="relative aspect-square overflow-hidden bg-surface-elevated">
        {product.badge && !soldOut && (
          <span
            className={cn(
              "absolute top-3 left-3 z-10 inline-flex h-6 items-center px-2.5 rounded-full text-[10px] font-semibold uppercase tracking-wider",
              badgeStyles[product.badge]
            )}
          >
            {product.badge}
          </span>
        )}
        {soldOut && (
          <span className="absolute top-3 left-3 z-10 inline-flex h-6 items-center px-2.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-destructive text-destructive-foreground">
            Agotado
          </span>
        )}
        <img
          src={product.image}
          alt={product.name}
          width={600}
          height={600}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          className="product-image h-full w-full object-cover"
        />
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{product.category}</p>
        <h3 className="font-display font-bold text-base leading-tight line-clamp-2 group-hover:text-primary-glow transition-colors">
          {product.name}
        </h3>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="font-display font-bold text-lg text-primary-glow">{formatPrice(product.price)}</span>
          <button
            onClick={handleAdd}
            disabled={soldOut}
            className="inline-flex items-center gap-1 h-9 px-3 rounded-lg bg-surface-elevated text-foreground hover:bg-primary hover:text-primary-foreground text-xs font-medium transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:hover:bg-surface-elevated disabled:hover:text-foreground disabled:cursor-not-allowed"
            aria-label={`Agregar ${product.name}`}
          >
            <Plus className="h-3.5 w-3.5" />
            Agregar
          </button>
        </div>
      </div>
    </Link>
  );
};
