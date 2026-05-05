import { useState } from "react";
import { MessageCircle, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error("Completa todos los campos");
      return;
    }
    toast.success("Mensaje enviado", { description: "Te responderemos pronto." });
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <>
      <section className="container pt-16 md:pt-28 pb-8">
        <p className="text-xs uppercase tracking-widest text-primary-glow mb-3">Contacto</p>
        <h1 className="font-display font-extrabold text-5xl md:text-7xl leading-[0.95]">Hablemos</h1>
        <p className="text-muted-foreground mt-4 max-w-xl">
          Escríbenos por el medio que prefieras. Respondemos rápido y de verdad.
        </p>
      </section>

      <section className="container py-12 grid lg:grid-cols-2 gap-10">
        <form onSubmit={submit} className="rounded-2xl bg-surface border border-subtle p-6 md:p-8 space-y-5">
          <div>
            <label className="text-sm font-medium block mb-2">Nombre</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full h-11 px-3 rounded-lg bg-surface-elevated border border-subtle text-sm focus:outline-none focus:border-primary-glow focus:ring-2 focus:ring-primary/30 transition-all"
              placeholder="Tu nombre"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-2">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full h-11 px-3 rounded-lg bg-surface-elevated border border-subtle text-sm focus:outline-none focus:border-primary-glow focus:ring-2 focus:ring-primary/30 transition-all"
              placeholder="tucorreo@dominio.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-2">Mensaje</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={5}
              className="w-full px-3 py-3 rounded-lg bg-surface-elevated border border-subtle text-sm focus:outline-none focus:border-primary-glow focus:ring-2 focus:ring-primary/30 transition-all resize-none"
              placeholder="¿En qué podemos ayudarte?"
            />
          </div>
          <button
            type="submit"
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary-glow transition-all active:scale-[0.97] shadow-purple"
          >
            Enviar mensaje
          </button>
        </form>

        <aside className="space-y-4">
          <a
            href="https://wa.me/573164618006?text=Hola%20BrrayLab"
            target="_blank"
            rel="noreferrer"
            className="block rounded-2xl bg-surface border border-subtle p-6 hover:border-primary/40 transition-colors group"
          >
            <div className="flex items-start gap-4">
              <div className="h-11 w-11 rounded-xl bg-primary/15 flex items-center justify-center text-primary-glow group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display font-bold">WhatsApp directo</h3>
                <p className="text-sm text-muted-foreground mt-1">El canal más rápido. Respondemos en minutos.</p>
                <p className="text-sm text-primary-glow mt-2">Escribir ahora →</p>
              </div>
            </div>
          </a>
          <div className="rounded-2xl bg-surface border border-subtle p-6">
            <div className="flex items-start gap-4">
              <div className="h-11 w-11 rounded-xl bg-primary/15 flex items-center justify-center text-primary-glow">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display font-bold">Ubicación</h3>
                <p className="text-sm text-muted-foreground mt-1">Cali, Colombia · Envíos a todo el país.</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-surface border border-subtle p-6">
            <div className="flex items-start gap-4">
              <div className="h-11 w-11 rounded-xl bg-primary/15 flex items-center justify-center text-primary-glow">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display font-bold">Horario</h3>
                <p className="text-sm text-muted-foreground mt-1">Lun – Sáb · 9:00 am – 7:00 pm</p>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </>
  );
};

export default Contact;
