import { Link } from "react-router-dom";
import { Instagram, MessageCircle, Music2 } from "lucide-react";
import { Logo } from "./Logo";

const categories = [
  { slug: "audifonos", name: "Audífonos & AirPods" },
  { slug: "smartwatches", name: "Smartwatches" },
  { slug: "cargadores", name: "Cargadores & PowerBank" },
  { slug: "kits-creadores", name: "Kits Creadores" },
  { slug: "cables", name: "Cables & Conectividad" },
];

export const Footer = () => (
  <footer className="border-t border-subtle bg-background mt-24">
    <div className="container py-16 grid gap-12 md:grid-cols-4">
      <div className="space-y-4">
        <Logo />
        <p className="text-sm text-muted-foreground max-w-xs">
          Donde nace la tecnología. Accesorios premium para los que ya saben que barato sale caro.
        </p>
        <div className="flex gap-3 pt-2">
          <a
            href="https://instagram.com/brraylab"
            target="_blank"
            rel="noreferrer"
            className="h-9 w-9 rounded-full bg-surface flex items-center justify-center hover:bg-primary transition-colors"
            aria-label="Instagram"
          >
            <Instagram className="h-4 w-4" />
          </a>
          <a
            href="https://tiktok.com/@brraylab"
            target="_blank"
            rel="noreferrer"
            className="h-9 w-9 rounded-full bg-surface flex items-center justify-center hover:bg-primary transition-colors"
            aria-label="TikTok"
          >
            <Music2 className="h-4 w-4" />
          </a>
          <a
            href="https://wa.me/573164618006"
            target="_blank"
            rel="noreferrer"
            className="h-9 w-9 rounded-full bg-surface flex items-center justify-center hover:bg-primary transition-colors"
            aria-label="WhatsApp"
          >
            <MessageCircle className="h-4 w-4" />
          </a>
        </div>
      </div>

      <div>
        <h4 className="font-display font-bold text-sm uppercase tracking-wider mb-4">Navegación</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li><Link to="/" className="hover:text-primary-glow transition-colors">Inicio</Link></li>
          <li><Link to="/tienda" className="hover:text-primary-glow transition-colors">Tienda</Link></li>
          <li><Link to="/nosotros" className="hover:text-primary-glow transition-colors">Nosotros</Link></li>
          <li><Link to="/contacto" className="hover:text-primary-glow transition-colors">Contacto</Link></li>
        </ul>
      </div>

      <div>
        <h4 className="font-display font-bold text-sm uppercase tracking-wider mb-4">Categorías</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link to={`/tienda?categoria=${c.slug}`} className="hover:text-primary-glow transition-colors">
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className="font-display font-bold text-sm uppercase tracking-wider mb-4">Contacto</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>Cali, Colombia</li>
          <li>Lun – Sáb · 9am – 7pm</li>
          <li>
            <a href="https://wa.me/573164618006" className="hover:text-primary-glow transition-colors">
              WhatsApp directo
            </a>
          </li>
        </ul>
      </div>
    </div>
    <div className="border-t border-subtle">
      <div className="container py-6 text-xs text-muted-foreground flex flex-col md:flex-row gap-2 justify-between">
        <span>© 2025 BrrayLab. Todos los derechos reservados.</span>
        <span>Hecho en Colombia.</span>
      </div>
    </div>
  </footer>
);
