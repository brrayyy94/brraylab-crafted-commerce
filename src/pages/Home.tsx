import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, Truck, BadgeCheck, Users } from "lucide-react";
import heroImg from "@/assets/hero-airpods.jpg";
import { useProducts, useCategories } from "@/hooks/useProducts";
import { useHeroSettings } from "@/hooks/useHeroSettings";
import { ProductCard } from "@/components/brraylab/ProductCard";
import { TestimonialsCarousel } from "@/components/brraylab/TestimonialsCarousel";

const Home = () => {
  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();
  const { data: hero, isLoading: heroLoading, isFetched: heroFetched } = useHeroSettings();
  const featured = products.slice(0, 4);

  const heroReady = heroFetched && !heroLoading;
  const heroType = hero?.type ?? "none";
  const overlayOpacity = hero?.overlay_opacity ?? 0.5;

  return (
    <>
      {/* HERO */}
      <section data-hero className="relative isolate min-h-svh flex items-center overflow-hidden bg-black -mt-16">
        <div className="absolute inset-0 z-0">
          {!heroReady ? (
            // Dark skeleton placeholder while hero settings are fetched — avoids flashing the default asset
            <div className="absolute inset-0 bg-[#0d0d0d] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 animate-pulse" />
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background to-transparent" />
            </div>
          ) : (
            <>
              {heroType === "video" && hero?.video_url ? (
                <video
                  src={hero.video_url}
                  poster={hero.image_url ?? heroImg}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="h-full w-full object-cover"
                />
              ) : heroType === "image" && hero?.image_url ? (
                <img
                  src={hero.image_url}
                  alt=""
                  className="h-full w-full object-cover bg-fixed"
                  style={{ backgroundAttachment: "fixed" }}
                  width={1920}
                  height={1200}
                />
              ) : (
                <img src={heroImg} alt="" className="h-full w-full object-cover opacity-90" width={1920} height={1200} />
              )}
              {heroType !== "none" ? (
                <>
                  <div className="absolute inset-0 bg-black" style={{ opacity: overlayOpacity }} />
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background/80 to-transparent" />
                </>
              ) : (
                <>
                  <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/30 to-background" />
                  <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-transparent to-background/40" />
                </>
              )}
            </>
          )}
        </div>

        <div className="container relative z-10 pt-24 pb-16">
          <div className="max-w-2xl space-y-7 animate-fade-up">
            <span className="inline-flex h-7 items-center px-3 rounded-full bg-primary/20 backdrop-blur-md border border-primary/30 text-xs font-medium text-primary-glow tracking-wider uppercase">
              Donde nace la tecnología
            </span>
            <h1 className="font-display font-extrabold text-5xl md:text-7xl lg:text-8xl leading-[0.95]">
              Tecnología
              <br />
              <span className="text-primary-glow">a tu nivel</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl font-light">
              No vendemos para todo el mundo. Vendemos para los que ya saben que barato sale caro.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to="/tienda"
                className="group inline-flex items-center gap-2 h-12 px-7 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary-glow transition-all duration-300 active:scale-95 shadow-purple"
              >
                Ver productos
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/nosotros"
                className="inline-flex items-center h-12 px-7 rounded-full border border-foreground/20 backdrop-blur-md hover:bg-foreground/5 hover:border-primary-glow font-medium transition-all duration-300"
              >
                ¿Qué es BrrayLab?
              </Link>
            </div>
          </div>
        </div>

        {/* scroll cue */}
        <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-xs text-muted-foreground tracking-widest uppercase animate-fade-in">
          Desliza
        </div>
      </section>

      {/* CATEGORÍAS */}
      <section className="container py-20 md:py-28">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary-glow mb-2">Categorías</p>
            <h2 className="font-display font-extrabold text-3xl md:text-5xl">Encuentra lo tuyo</h2>
          </div>
          <Link
            to="/tienda"
            className="text-sm text-muted-foreground hover:text-primary-glow transition-colors inline-flex items-center gap-1"
          >
            Ver todo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.slice(0, 4).map((cat) => (
            <Link
              key={cat.slug}
              to={`/tienda?categoria=${cat.slug}`}
              className="group relative aspect-square rounded-xl bg-surface border border-subtle overflow-hidden product-card"
            >
              <img
                src={cat.image}
                alt={cat.name}
                loading="lazy"
                className="product-image absolute inset-0 h-full w-full object-cover opacity-80 group-hover:opacity-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
              <div className="absolute inset-0 p-5 flex flex-col justify-end">
                <h3 className="font-display font-bold text-base md:text-lg leading-tight group-hover:text-primary-glow transition-colors">
                  {cat.name}
                </h3>
                <span className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
                  Explorar <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FAVORITOS */}
      <section className="container py-12 md:py-20">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-widest text-primary-glow mb-2">Lo más pedido</p>
          <h2 className="font-display font-extrabold text-3xl md:text-5xl">Los favoritos de la BrrayGang</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {featured.map((p, i) => (
            <ProductCard key={p.slug} product={p} eager={i < 4} />
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link
            to="/tienda"
            className="inline-flex items-center gap-2 h-11 px-6 rounded-full border border-subtle hover:border-primary-glow hover:bg-primary/10 transition-all"
          >
            Ver toda la tienda <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* TRUST */}
      <section className="container py-16 md:py-24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4 rounded-2xl bg-surface border border-subtle p-8 md:p-10">
          {[
            { icon: BadgeCheck, label: "Productos probados", desc: "Calidad antes que catálogo." },
            { icon: ShieldCheck, label: "Garantía incluida", desc: "Respaldamos lo que vendemos." },
            { icon: Truck, label: "Envío a Colombia", desc: "Bogotá, Cali, Medellín y más." },
            { icon: Users, label: "Miles de clientes", desc: "La BrrayGang sigue creciendo." },
          ].map((t) => (
            <div key={t.label} className="text-center md:text-left flex flex-col items-center md:items-start gap-2">
              <div className="h-11 w-11 rounded-xl bg-primary/15 flex items-center justify-center text-primary-glow">
                <t.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display font-bold text-sm">{t.label}</h3>
              <p className="text-xs text-muted-foreground">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* RESEÑAS */}
      <section className="container py-16 md:py-24">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-widest text-primary-glow mb-2">Reseñas reales</p>
          <h2 className="font-display font-extrabold text-3xl md:text-5xl">Lo que dice la BrrayGang</h2>
        </div>
        <div className="max-w-3xl mx-auto">
          <TestimonialsCarousel />
        </div>
      </section>
    </>
  );
};

export default Home;
