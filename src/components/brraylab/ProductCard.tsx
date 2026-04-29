import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { type Product, formatPrice } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/utils";

const badgeStyles: Record<string, string> = {
  "Más vendido": "bg-primary text-primary-foreground",
  "Nuevo": "bg-primary-glow text-accent-foreground",
  "Oferta": "bg-destructive text-destructive-foreground",
};

export const ProductCard = ({ product }: { product: Product }) => {
  const { add } = useCart();

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    add(product, 1);
    toast.success(`${product.name} agregado`, { description: "Ya está en tu carrito." });
  };

  return (
    <Link
      to={`/producto/${product.slug}`}
      className="product-card group relative flex flex-col rounded-xl bg-surface border border-subtle overflow-hidden"
    >
      <div className="relative aspect-square overflow-hidden bg-surface-elevated">
        {product.badge && (
          <span
            className={cn(
              "absolute top-3 left-3 z-10 inline-flex h-6 items-center px-2.5 rounded-full text-[10px] font-semibold uppercase tracking-wider",
              badgeStyles[product.badge]
            )}
          >
            {product.badge}
          </span>
        )}
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
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
            className="inline-flex items-center gap-1 h-9 px-3 rounded-lg bg-surface-elevated text-foreground hover:bg-primary hover:text-primary-foreground text-xs font-medium transition-all duration-300 active:scale-95"
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
