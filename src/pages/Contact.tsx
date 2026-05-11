import { useState } from "react";
import { MessageCircle, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    const message = form.message.trim();

    if (!name || !email || !message) {
      toast.error("Completa los campos requeridos");
      return;
    }
    if (name.length > 100) {
      toast.error("El nombre no puede superar 100 caracteres");
      return;
    }
    if (email.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast.error("Ingresa un email válido");
      return;
    }
    if (phone && phone.length > 30) {
      toast.error("El teléfono no puede superar 30 caracteres");
      return;
    }
    if (message.length > 2000) {
      toast.error("El mensaje no puede superar 2000 caracteres");
      return;
    }

    setSending(true);
    const { error } = await supabase.from("contact_messages").insert({
      name,
      email,
      phone: phone || null,
      message,
    });
    setSending(false);
    if (error) {
      toast.error("No se pudo enviar el mensaje. Intenta de nuevo.");
      return;
    }
    toast.success("Mensaje enviado", { description: "Te responderemos pronto." });
    setForm({ name: "", email: "", phone: "", message: "" });
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
              maxLength={100}
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
              maxLength={254}
              className="w-full h-11 px-3 rounded-lg bg-surface-elevated border border-subtle text-sm focus:outline-none focus:border-primary-glow focus:ring-2 focus:ring-primary/30 transition-all"
              placeholder="tucorreo@dominio.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-2">Teléfono <span className="text-muted-foreground">(opcional)</span></label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              maxLength={30}
              className="w-full h-11 px-3 rounded-lg bg-surface-elevated border border-subtle text-sm focus:outline-none focus:border-primary-glow focus:ring-2 focus:ring-primary/30 transition-all"
              placeholder="+57 ..."
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-2">Mensaje</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={5}
              maxLength={2000}
              className="w-full px-3 py-3 rounded-lg bg-surface-elevated border border-subtle text-sm focus:outline-none focus:border-primary-glow focus:ring-2 focus:ring-primary/30 transition-all resize-none"
              placeholder="¿En qué podemos ayudarte?"
            />
          </div>
          <button
            type="submit"
            disabled={sending}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary-glow transition-all active:scale-[0.97] shadow-purple disabled:opacity-50"
          >
            {sending ? "Enviando…" : "Enviar mensaje"}
          </button>
        </form>

        <aside className="space-y-4">
          <a
            href="https://wa.me/message/XR4F5RKSB53KP1"
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
