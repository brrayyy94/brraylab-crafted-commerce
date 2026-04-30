import { Link } from "react-router-dom";
import { X, Trash2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/data/products";
import { cn } from "@/lib/utils";

export const MiniCart = () => {
  const { items, miniOpen, closeMini, subtotal, remove } = useCart();

  return (
    <>
      <div
        onClick={closeMini}
        className={cn(
          "fixed inset-0 z-50 bg-background/70 backdrop-blur-sm transition-opacity duration-300",
          miniOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      />
      <aside
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-full max-w-md bg-surface border-l border-subtle shadow-elevated transition-transform duration-500 ease-out flex flex-col",
          miniOpen ? "translate-x-0" : "translate-x-full"
        )}
        aria-hidden={!miniOpen}
      >
        <div className="flex items-center justify-between p-5 border-b border-subtle">
          <h3 className="font-display font-bold text-lg">Tu carrito</h3>
          <button
            onClick={closeMini}
            className="h-9 w-9 rounded-full hover:bg-surface-elevated flex items-center justify-center transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-12">
              <div className="h-20 w-20 rounded-full bg-surface-elevated flex items-center justify-center">
                <span className="text-3xl">🛍️</span>
              </div>
              <div>
                <p className="font-medium">Tu carrito está vacío</p>
                <p className="text-sm text-muted-foreground mt-1">Empieza a llenarlo con lo que pasó el filtro.</p>
              </div>
              <Link
                to="/tienda"
                onClick={closeMini}
                className="mt-2 inline-flex h-11 items-center px-5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary-glow transition-colors"
              >
                Ver productos
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((it) => (
                <li key={it.product.slug} className="flex gap-3">
                  <Link
                    to={`/producto/${it.product.slug}`}
                    onClick={closeMini}
                    className="h-20 w-20 rounded-lg overflow-hidden bg-surface-elevated shrink-0"
                  >
                    <img src={it.product.image} alt={it.product.name} className="h-full w-full object-cover" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/producto/${it.product.slug}`}
                      onClick={closeMini}
                      className="font-medium text-sm line-clamp-2 hover:text-primary-glow transition-colors"
                    >
                      {it.product.name}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-1">Cant: {it.quantity}</p>
                    <p className="text-sm font-semibold text-primary-glow mt-1">
                      {formatPrice(it.product.price * it.quantity)}
                    </p>
                  </div>
                  <button
                    onClick={() => remove(it.product.slug)}
                    className="h-9 w-9 rounded-full hover:bg-surface-elevated flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-subtle p-5 space-y-4">
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="font-display font-bold text-xl">{formatPrice(subtotal)}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/carrito"
                onClick={closeMini}
                className="h-11 inline-flex items-center justify-center rounded-lg border border-subtle bg-surface-elevated hover:bg-surface text-sm font-medium transition-colors"
              >
                Ver carrito
              </Link>
              <Link
                to="/checkout"
                onClick={closeMini}
                className="h-11 inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary-glow text-sm font-medium transition-colors"
              >
                Pagar ahora
              </Link>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
