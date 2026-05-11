import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, ShoppingBag, User, X } from "lucide-react";
import { Logo } from "./Logo";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const leftLinks = [
  { to: "/", label: "Inicio" },
  { to: "/tienda", label: "Tienda" },
];

const rightLinks = [
  { to: "/nosotros", label: "Nosotros" },
  { to: "/contacto", label: "Contacto" },
];

const allLinks = [...leftLinks, ...rightLinks];

export const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [pop, setPop] = useState(false);
  const { count, openMini } = useCart();
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const getThreshold = () => {
      const hero = document.querySelector<HTMLElement>("[data-hero]");
      // If there's no hero on this page, fall back to a small threshold
      return hero ? Math.max(0, hero.offsetHeight - 80) : 20;
    };
    let threshold = getThreshold();
    const onScroll = () => {
      if (window.scrollY === 0) {
        setScrolled(false);
        return;
      }
      setScrolled(window.scrollY > threshold);
    };
    const onResize = () => {
      threshold = getThreshold();
      onScroll();
    };
    // Recompute after layout/images settle
    const r1 = requestAnimationFrame(onResize);
    const t1 = setTimeout(onResize, 300);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(r1);
      clearTimeout(t1);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [location.pathname]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (count === 0) return;
    setPop(true);
    const t = setTimeout(() => setPop(false), 350);
    return () => clearTimeout(t);
  }, [count]);

  const isScrolled = scrolled || open;

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 navbar-premium",
        isScrolled && "scrolled"
      )}
    >
      <div className="container grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-6">
        {/* LEFT: nav links (desktop) / mobile menu button */}
        <div className="flex items-center justify-start">
          <nav className="hidden md:flex items-center gap-8">
            {leftLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "text-sm font-medium tracking-wide transition-colors duration-300 hover:text-primary-glow",
                    isActive ? "text-primary-glow" : "text-white/90"
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full text-white/90 hover:bg-white/10 transition-colors"
            aria-label="Menú"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* CENTER: logo */}
        <div className="flex items-center justify-center">
          <Logo />
        </div>

        {/* RIGHT: nav links + actions */}
        <div className="flex items-center justify-end gap-1">
          <nav className="hidden md:flex items-center gap-8 mr-4">
            {rightLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  cn(
                    "text-sm font-medium tracking-wide transition-colors duration-300 hover:text-primary-glow",
                    isActive ? "text-primary-glow" : "text-white/90"
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          <Link
            to={user ? "/mi-cuenta" : "/auth/login"}
            className="hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-full text-white/90 hover:bg-white/10 transition-colors"
            aria-label={user ? "Mi cuenta" : "Iniciar sesión"}
          >
            <User className="h-5 w-5" />
          </Link>
          <button
            onClick={openMini}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-white/90 hover:bg-white/10 transition-colors"
            aria-label="Abrir carrito"
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span
                className={cn(
                  "absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center",
                  pop && "animate-scale-pop"
                )}
              >
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-white/10 bg-background/85 backdrop-blur-xl animate-fade-in">
          <nav className="container py-4 flex flex-col gap-1">
            {allLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="px-3 py-3 rounded-lg text-base font-medium hover:bg-surface transition-colors"
              >
                {l.label}
              </Link>
            ))}
            <Link
              to={user ? "/mi-cuenta" : "/auth/login"}
              className="px-3 py-3 rounded-lg text-base font-medium hover:bg-surface transition-colors border-t border-subtle mt-2 pt-3 text-primary-glow"
            >
              {user ? "Mi cuenta" : "Iniciar sesión"}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};
