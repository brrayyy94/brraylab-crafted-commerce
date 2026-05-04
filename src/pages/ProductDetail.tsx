import { Link, useParams, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ChevronRight, Lock, Truck, ShieldCheck, MessageCircle, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/data/products";
import { useProduct, useProducts } from "@/hooks/useProducts";
import { ProductCard } from "@/components/brraylab/ProductCard";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/utils";

const ProductDetail = () => {
  const { slug } = useParams();
  const { data: product, isLoading } = useProduct(slug);
  const { data: allProducts = [] } = useProducts();
  const { add } = useCart();
  const [tab, setTab] = useState<"desc" | "feat" | "rev">("desc");
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  if (isLoading) {
    return (
      <section className="container py-24 text-center text-muted-foreground">Cargando…</section>
    );
  }
  if (!product) return <Navigate to="/tienda" replace />;

  const related = allProducts.filter((p) => p.categorySlug === product.categorySlug && p.slug !== product.slug).slice(0, 4);

  const handleAdd = () => {
    add(product, qty);
    toast.success("Agregado al carrito", { description: product.name });
  };

  const waMessage = encodeURIComponent(`Hola BrrayLab, me interesa el producto: ${product.name}`);

  return (
    <>
      <section className="container pt-10 md:pt-16">
        <nav className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap mb-8">
          <Link to="/" className="hover:text-primary-glow">Inicio</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/tienda" className="hover:text-primary-glow">Tienda</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to={`/tienda?cat=${product.categorySlug}`} className="hover:text-primary-glow">{product.category}</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground/80 truncate">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Galería */}
          <ProductGallery images={product.images} name={product.name} active={activeImage} setActive={setActiveImage} />

          {/* Info */}
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2">
              <span className={cn(
                "inline-flex h-6 items-center px-2.5 rounded-full text-[10px] font-semibold uppercase tracking-wider",
                product.stock > 0 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
              )}>
                {product.stock > 0 ? `En stock · ${product.stock} disponibles` : "Agotado"}
              </span>
            </div>
            <h1 className="font-display font-bold text-3xl md:text-5xl normal-case leading-tight">{product.name}</h1>
            <p className="text-muted-foreground">{product.shortDescription}</p>

            <div className="flex items-baseline gap-3 pt-2">
              <span className="font-display font-extrabold text-4xl md:text-5xl text-primary-glow">{formatPrice(product.price)}</span>
              {product.oldPrice && (
                <span className="text-muted-foreground line-through text-lg">{formatPrice(product.oldPrice)}</span>
              )}
            </div>

            <div className="flex items-center gap-6 text-xs text-muted-foreground border-y border-subtle py-4">
              <span className="inline-flex items-center gap-1.5"><Lock className="h-4 w-4 text-primary-glow" /> Pago seguro</span>
              <span className="inline-flex items-center gap-1.5"><Truck className="h-4 w-4 text-primary-glow" /> Envío rápido</span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary-glow" /> Garantía</span>
            </div>

            {/* Cantidad */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Cantidad</span>
              <div className="inline-flex items-center bg-surface-elevated rounded-lg border border-subtle">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="h-10 w-10 inline-flex items-center justify-center hover:text-primary-glow transition-colors"
                  aria-label="Disminuir"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center text-sm font-medium">{qty}</span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="h-10 w-10 inline-flex items-center justify-center hover:text-primary-glow transition-colors"
                  aria-label="Aumentar"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleAdd}
                className="flex-1 h-13 inline-flex items-center justify-center px-7 py-4 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary-glow transition-all duration-300 active:scale-[0.97] shadow-purple"
              >
                Agregar al carrito
              </button>
              <a
                href={`https://wa.me/573000000000?text=${waMessage}`}
                target="_blank"
                rel="noreferrer"
                className="h-13 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl border border-subtle hover:border-primary-glow hover:bg-primary/10 font-medium transition-all"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-20">
          <div className="flex gap-1 border-b border-subtle">
            {[
              { id: "desc", label: "Descripción" },
              { id: "feat", label: "Características" },
              { id: "rev", label: "Reseñas" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as typeof tab)}
                className={cn(
                  "px-5 h-12 text-sm font-medium border-b-2 -mb-px transition-colors",
                  tab === t.id
                    ? "border-primary-glow text-primary-glow"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="py-8 max-w-3xl">
            {tab === "desc" && <p className="text-foreground/85 leading-relaxed">{product.description}</p>}
            {tab === "feat" && (
              <ul className="grid sm:grid-cols-2 gap-3">
                {product.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary-glow shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            )}
            {tab === "rev" && (
              <div className="space-y-4">
                <p className="text-muted-foreground text-sm">Aún no hay reseñas públicas para este producto.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Relacionados */}
      {related.length > 0 && (
        <section className="container py-16 md:py-24">
          <h2 className="font-display font-extrabold text-2xl md:text-4xl mb-8">Te puede interesar</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
            {related.map((p) => <ProductCard key={p.slug} product={p} />)}
          </div>
        </section>
      )}
    </>
  );
};

export default ProductDetail;
