const About = () => (
  <>
    <section className="container pt-16 md:pt-28 pb-12">
      <p className="text-xs uppercase tracking-widest text-primary-glow mb-3">Nosotros</p>
      <h1 className="font-display font-extrabold text-5xl md:text-7xl leading-[0.95]">Esto es BrrayLab</h1>
    </section>

    <section className="container max-w-3xl pb-16 space-y-8 text-lg md:text-xl text-foreground/85 leading-relaxed font-light">
      <p>
        BrrayLab nació en Cali con una idea simple: la gente buena merece tecnología buena, sin
        pagar lo que cobran las marcas grandes solo por su logo.
      </p>
      <p>
        No vendemos para todo el mundo. Vendemos para los que ya entienden que comprar barato dos
        veces sale más caro que comprar bien una sola vez.
      </p>
      <p>
        Cada producto que entra al catálogo lo probamos. Si no nos lo pondríamos nosotros, no llega
        a ti.
      </p>
    </section>

    <section className="container py-16 md:py-24">
      <h2 className="font-display font-extrabold text-3xl md:text-5xl mb-12">Nuestra filosofía</h2>
      <div className="grid md:grid-cols-3 gap-5">
        {[
          { title: "Calidad antes que catálogo", desc: "Preferimos vender 10 productos que valgan la pena, no 200 que decepcionen." },
          { title: "Honestidad por defecto", desc: "Si no es lo mejor para ti, te lo decimos. Aunque no nos vendamos." },
          { title: "Servicio que respeta", desc: "Respondemos rápido, claro y con respeto. Como nos gustaría que nos atendieran." },
        ].map((v) => (
          <div key={v.title} className="rounded-xl bg-surface border border-subtle p-6 hover:border-primary/40 transition-colors">
            <h3 className="font-display font-bold text-lg mb-2">{v.title}</h3>
            <p className="text-sm text-muted-foreground">{v.desc}</p>
          </div>
        ))}
      </div>
    </section>

    <section className="container py-16 md:py-24 max-w-3xl">
      <h2 className="font-display font-extrabold text-3xl md:text-5xl mb-8">Lo que rechazamos</h2>
      <p className="text-foreground/85 text-lg leading-relaxed font-light">
        Rechazamos las promesas vacías, los productos que se dañan en una semana, las garantías
        imposibles de cobrar y la atención al cliente que parece pensada para que te canses primero.
        Si vienes a BrrayLab, vienes por algo que sí va a funcionar.
      </p>
    </section>
  </>
);

export default About;
