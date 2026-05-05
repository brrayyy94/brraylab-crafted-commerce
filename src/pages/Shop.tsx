import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useProducts, useCategories } from "@/hooks/useProducts";
import { ProductCard } from "@/components/brraylab/ProductCard";
import { ProductGridSkeleton } from "@/components/brraylab/Skeletons";
import { cn } from "@/lib/utils";

type Sort = "destacado" | "nuevo" | "menor" | "mayor";

const Shop = () => {
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const [params, setParams] = useSearchParams();
  const initialCat = params.get("cat") ?? "all";
  const [cat, setCat] = useState<string>(initialCat);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("destacado");
  const [min, setMin] = useState<string>("");
  const [max, setMax] = useState<string>("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = [...products];
    if (cat !== "all") list = list.filter((p) => p.categorySlug === cat);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    const minN = Number(min);
    const maxN = Number(max);
    if (min && !isNaN(minN)) list = list.filter((p) => p.price >= minN);
    if (max && !isNaN(maxN)) list = list.filter((p) => p.price <= maxN);
    switch (sort) {
      case "menor": list.sort((a, b) => a.price - b.price); break;
      case "mayor": list.sort((a, b) => b.price - a.price); break;
      case "nuevo": list.sort((a, b) => (b.badge === "Nuevo" ? 1 : 0) - (a.badge === "Nuevo" ? 1 : 0)); break;
      default: list.sort((a, b) => (b.badge === "Más vendido" ? 1 : 0) - (a.badge === "Más vendido" ? 1 : 0));
    }
    return list;
  }, [products, cat, query, sort, min, max]);

  const updateCat = (slug: string) => {
    setCat(slug);
    if (slug === "all") {
      params.delete("cat");
    } else {
      params.set("cat", slug);
    }
    setParams(params, { replace: true });
    setFiltersOpen(false);
  };

  const Filters = (
    <div className="space-y-7">
      <div>
        <h4 className="font-display font-bold text-sm uppercase tracking-wider mb-3">Categoría</h4>
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => updateCat("all")}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                cat === "all" ? "bg-primary/15 text-primary-glow" : "hover:bg-surface-elevated text-foreground/80"
              )}
            >
              Todas
            </button>
          </li>
          {categories.map((c) => (
            <li key={c.slug}>
              <button
                onClick={() => updateCat(c.slug)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                  cat === c.slug ? "bg-primary/15 text-primary-glow" : "hover:bg-surface-elevated text-foreground/80"
                )}
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h4 className="font-display font-bold text-sm uppercase tracking-wider mb-3">Precio</h4>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Mín"
            value={min}
            onChange={(e) => setMin(e.target.value)}
            className="h-10 px-3 rounded-lg bg-surface-elevated border border-subtle text-sm focus:outline-none focus:border-primary-glow focus:ring-2 focus:ring-primary/30 transition-all"
          />
          <input
            type="number"
            placeholder="Máx"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            className="h-10 px-3 rounded-lg bg-surface-elevated border border-subtle text-sm focus:outline-none focus:border-primary-glow focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      <section className="container pt-12 md:pt-20 pb-8">
        <p className="text-xs uppercase tracking-widest text-primary-glow mb-2">Tienda</p>
        <h1 className="font-display font-extrabold text-4xl md:text-6xl">Tienda BrrayLab</h1>
        <p className="text-muted-foreground mt-3 max-w-xl">Solo lo que pasó el filtro.</p>
      </section>

      <section className="container pb-20 grid lg:grid-cols-[260px_1fr] gap-10">
        <aside className="hidden lg:block">{Filters}</aside>

        <div>
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar producto…"
                className="w-full h-11 pl-10 pr-3 rounded-lg bg-surface-elevated border border-subtle text-sm focus:outline-none focus:border-primary-glow focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="h-11 px-3 rounded-lg bg-surface-elevated border border-subtle text-sm focus:outline-none focus:border-primary-glow"
            >
              <option value="destacado">Más vendido</option>
              <option value="nuevo">Nuevo</option>
              <option value="menor">Menor precio</option>
              <option value="mayor">Mayor precio</option>
            </select>
            <button
              onClick={() => setFiltersOpen(true)}
              className="lg:hidden inline-flex items-center justify-center gap-2 h-11 px-4 rounded-lg bg-surface-elevated border border-subtle text-sm"
            >
              <SlidersHorizontal className="h-4 w-4" /> Filtros
            </button>
          </div>

          {isLoading ? (
            <ProductGridSkeleton count={8} />
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">
              <p>{query.trim() ? "No encontramos productos con ese nombre." : "No encontramos productos con ese filtro."}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
              {filtered.map((p, i) => (
                <ProductCard key={p.slug} product={p} eager={i < 4} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Mobile filters drawer */}
      <div
        onClick={() => setFiltersOpen(false)}
        className={cn(
          "fixed inset-0 z-50 bg-background/70 backdrop-blur-sm transition-opacity",
          filtersOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      />
      <div
        className={cn(
          "fixed bottom-0 inset-x-0 z-50 max-h-[85vh] rounded-t-2xl bg-surface border-t border-subtle p-6 transition-transform duration-500 ease-out overflow-y-auto",
          filtersOpen ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-bold text-lg">Filtros</h3>
          <button
            onClick={() => setFiltersOpen(false)}
            className="h-9 w-9 rounded-full hover:bg-surface-elevated flex items-center justify-center"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {Filters}
      </div>
    </>
  );
};

export default Shop;
