import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, Lock, Truck, ShieldCheck, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/data/products";

const Cart = () => {
  const { items, subtotal, update, remove } = useCart();

  if (items.length === 0) {
    return (
      <section className="container py-24 md:py-32 text-center">
        <div className="mx-auto max-w-md flex flex-col items-center gap-6">
          <div className="h-24 w-24 rounded-full bg-surface flex items-center justify-center text-4xl">🛍️</div>
          <h1 className="font-display font-extrabold text-3xl md:text-4xl">Tu carrito está vacío</h1>
          <p className="text-muted-foreground">Empezá a llenarlo con lo que pasó el filtro.</p>
          <Link
            to="/tienda"
            className="inline-flex items-center gap-2 h-12 px-7 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary-glow transition-all shadow-purple"
          >
            Ver productos <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="container py-12 md:py-20">
      <h1 className="font-display font-extrabold text-3xl md:text-5xl mb-10">Tu carrito</h1>

      <div className="grid lg:grid-cols-[1fr_380px] gap-10">
        <ul className="space-y-4">
          {items.map((it) => (
            <li
              key={it.product.slug}
              className="flex gap-4 p-4 rounded-xl bg-surface border border-subtle"
            >
              <Link to={`/producto/${it.product.slug}`} className="h-24 w-24 md:h-28 md:w-28 rounded-lg overflow-hidden bg-surface-elevated shrink-0">
                <img src={it.product.image} alt={it.product.name} className="h-full w-full object-cover" />
              </Link>
              <div className="flex-1 min-w-0 flex flex-col">
                <Link to={`/producto/${it.product.slug}`} className="font-medium hover:text-primary-glow transition-colors line-clamp-2">
                  {it.product.name}
                </Link>
                <p className="text-xs text-muted-foreground">{it.product.category}</p>
                <p className="font-display font-bold text-primary-glow mt-1">{formatPrice(it.product.price)}</p>

                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="inline-flex items-center bg-surface-elevated rounded-lg border border-subtle">
                    <button
                      onClick={() => update(it.product.slug, it.quantity - 1)}
                      className="h-9 w-9 inline-flex items-center justify-center hover:text-primary-glow"
                      aria-label="Disminuir"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center text-sm">{it.quantity}</span>
                    <button
                      onClick={() => update(it.product.slug, it.quantity + 1)}
                      className="h-9 w-9 inline-flex items-center justify-center hover:text-primary-glow"
                      aria-label="Aumentar"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => remove(it.product.slug)}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" /> Eliminar
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="lg:sticky lg:top-24 self-start space-y-5 p-6 rounded-xl bg-surface border border-subtle">
          <h2 className="font-display font-bold text-lg">Resumen</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Envío</span><span className="text-muted-foreground">A calcular</span></div>
          </div>
          <div className="border-t border-subtle pt-4 flex justify-between items-baseline">
            <span className="text-sm">Total</span>
            <span className="font-display font-extrabold text-2xl text-primary-glow">{formatPrice(subtotal)}</span>
          </div>

          <Link
            to="/checkout"
            className="w-full h-12 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary-glow transition-all active:scale-[0.97] shadow-purple"
          >
            Proceder al pago
          </Link>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2">
            <span className="inline-flex items-center gap-1"><Lock className="h-3.5 w-3.5" /> Seguro</span>
            <span className="inline-flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> Rápido</span>
            <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> Garantía</span>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default Cart;
