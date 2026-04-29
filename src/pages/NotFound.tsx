import { Link } from "react-router-dom";

const NotFound = () => (
  <section className="container py-32 text-center flex flex-col items-center gap-6">
    <p className="text-xs uppercase tracking-widest text-primary-glow">Error 404</p>
    <h1 className="font-display font-extrabold text-6xl md:text-8xl">Sin señal</h1>
    <p className="text-muted-foreground max-w-md">
      Esta página no existe o se mudó. Volvamos a lo que importa.
    </p>
    <Link
      to="/"
      className="inline-flex h-12 items-center px-7 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary-glow transition-all shadow-purple"
    >
      Volver al inicio
    </Link>
  </section>
);

export default NotFound;
