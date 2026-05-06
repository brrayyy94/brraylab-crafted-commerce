import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Lock, ShieldCheck, Truck, ChevronLeft, Loader2, UserCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { formatPrice } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const COLOMBIA_DEPTS = [
  "Amazonas","Antioquia","Arauca","Atlántico","Bolívar","Boyacá","Caldas","Caquetá","Casanare","Cauca",
  "Cesar","Chocó","Córdoba","Cundinamarca","Bogotá D.C.","Guainía","Guaviare","Huila","La Guajira","Magdalena",
  "Meta","Nariño","Norte de Santander","Putumayo","Quindío","Risaralda","San Andrés y Providencia","Santander",
  "Sucre","Tolima","Valle del Cauca","Vaupés","Vichada",
];

const SHIPPING_FREE_THRESHOLD = 150_000;
const SHIPPING_COST = 15_000;

const dataSchema = z.object({
  full_name: z.string().trim().min(3, "Mínimo 3 caracteres").max(100),
  email: z.string().trim().email("Email inválido").max(150),
  phone: z.string().trim().min(7, "Teléfono inválido").max(20),
});

const shippingSchema = z.object({
  department: z.string().min(2, "Selecciona departamento"),
  city: z.string().trim().min(2, "Ciudad requerida").max(80),
  address: z.string().trim().min(5, "Dirección muy corta").max(200),
  notes: z.string().trim().max(300).optional().or(z.literal("")),
});

type Step = 1 | 2 | 3;

const stepLabels: Record<Step, string> = {
  1: "Datos",
  2: "Envío",
  3: "Confirmación",
};

const Checkout = () => {
  const navigate = useNavigate();
  const { items, subtotal, clear } = useCart();
  const { user } = useAuth();

  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [guestMode, setGuestMode] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    department: "",
    city: "",
    address: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Prefill con datos del usuario logueado
  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        full_name: f.full_name || (user.user_metadata?.name as string) || "",
        email: f.email || user.email || "",
        phone: f.phone || (user.user_metadata?.phone as string) || "",
      }));
    }
  }, [user]);

  const shippingCost = subtotal >= SHIPPING_FREE_THRESHOLD ? 0 : items.length > 0 ? SHIPPING_COST : 0;
  const total = subtotal + shippingCost;

  const update = (field: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
  };

  const goNext = () => {
    if (step === 1) {
      const result = dataSchema.safeParse(form);
      if (!result.success) {
        const errs: Record<string, string> = {};
        result.error.issues.forEach((i) => { errs[i.path[0] as string] = i.message; });
        setErrors(errs);
        return;
      }
      setStep(2);
    } else if (step === 2) {
      const result = shippingSchema.safeParse(form);
      if (!result.success) {
        const errs: Record<string, string> = {};
        result.error.issues.forEach((i) => { errs[i.path[0] as string] = i.message; });
        setErrors(errs);
        return;
      }
      setStep(3);
    }
  };

  const placeOrder = async () => {
    if (items.length === 0) return;
    setSubmitting(true);
    try {
      // 1. Crear orden
      const orderPayload = {
        user_id: user?.id ?? null,
        guest_email: user ? null : form.email.toLowerCase().trim(),
        subtotal,
        shipping_cost: shippingCost,
        total,
        status: "pending" as const,
        payment_status: "pending" as const,
        payment_method: "contra_entrega",
        notes: form.notes || null,
      };
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert(orderPayload)
        .select("id, order_number")
        .single();
      if (orderErr || !order) throw orderErr ?? new Error("No se pudo crear la orden");

      // 2. Items
      const itemsPayload = items.map((it) => ({
        order_id: order.id,
        product_id: it.product.id,
        name: it.product.name,
        price: it.product.price,
        quantity: it.quantity,
        image_url: it.product.image,
      }));
      const { error: itemsErr } = await supabase.from("order_items").insert(itemsPayload);
      if (itemsErr) throw itemsErr;

      // 3. Address
      const { error: addrErr } = await supabase.from("order_addresses").insert({
        order_id: order.id,
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim().toLowerCase(),
        department: form.department,
        city: form.city.trim(),
        address: form.address.trim(),
        notes: form.notes.trim() || null,
      });
      if (addrErr) throw addrErr;

      clear();
      toast.success("Pedido creado", { description: `Orden ${order.order_number}` });
      navigate(`/orden/${order.order_number}`);
    } catch (err) {
      console.error("[checkout] error", err);
      toast.error("No se pudo procesar el pedido", { description: "Intenta de nuevo en un momento." });
    } finally {
      setSubmitting(false);
    }
  };

  const stepperItems = useMemo(() => [1, 2, 3] as const, []);

  if (items.length === 0) {
    return <Navigate to="/carrito" replace />;
  }

  return (
    <section className="container py-12 md:py-20">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => (step === 1 ? navigate("/carrito") : setStep((s) => (s - 1) as Step))}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary-glow mb-8 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          {step === 1 ? "Volver al carrito" : "Anterior"}
        </button>

        <h1 className="font-display font-extrabold text-3xl md:text-5xl mb-3">Checkout</h1>
        <p className="text-muted-foreground mb-10">
          {user ? "Compra como cliente registrado." : "Compra como invitado, sin necesidad de registrarte."}
        </p>

        {/* Stepper */}
        <div className="flex items-center gap-2 mb-10">
          {stepperItems.map((n, idx) => (
            <div key={n} className="flex items-center gap-2 flex-1">
              <div
                className={cn(
                  "h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                  step >= n ? "bg-primary text-primary-foreground" : "bg-surface border border-subtle text-muted-foreground"
                )}
              >
                {n}
              </div>
              <span className={cn("text-xs md:text-sm", step >= n ? "text-foreground" : "text-muted-foreground")}>
                {stepLabels[n]}
              </span>
              {idx < stepperItems.length - 1 && (
                <div className={cn("h-px flex-1 mx-1", step > n ? "bg-primary" : "bg-subtle")} />
              )}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-10">
          {/* Form column */}
          <div className="rounded-xl bg-surface border border-subtle p-6 md:p-8 space-y-6">
            {step === 1 && (
              <>
                {!user && !guestMode && (
                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 space-y-3">
                    <div className="flex items-start gap-3">
                      <UserCircle2 className="h-6 w-6 text-primary-glow shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">¿Ya tienes cuenta?</p>
                        <p className="text-sm text-muted-foreground">
                          Inicia sesión para ver tu historial de pedidos y autocompletar tus datos.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      <Link
                        to="/auth/login?redirect=/checkout"
                        className="flex-1 inline-flex items-center justify-center h-11 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-glow transition-colors"
                      >
                        Iniciar sesión
                      </Link>
                      <button
                        type="button"
                        onClick={() => setGuestMode(true)}
                        className="flex-1 inline-flex items-center justify-center h-11 px-5 rounded-lg bg-surface-elevated border border-subtle text-sm font-medium hover:border-primary-glow transition-colors"
                      >
                        Continuar como invitado
                      </button>
                    </div>
                  </div>
                )}
                {(user || guestMode) && (
                  <>
                    <h2 className="font-display font-bold text-xl">Datos de contacto</h2>
                    <Field
                      label="Nombre completo"
                      value={form.full_name}
                      onChange={(v) => update("full_name", v)}
                      error={errors.full_name}
                      placeholder="Andrés Martínez"
                    />
                    <Field
                      label="Email"
                      type="email"
                      value={form.email}
                      onChange={(v) => update("email", v)}
                      error={errors.email}
                      placeholder="tu@email.com"
                    />
                    <Field
                      label="Teléfono / WhatsApp"
                      value={form.phone}
                      onChange={(v) => update("phone", v)}
                      error={errors.phone}
                      placeholder="3001234567"
                    />
                  </>
                )}
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="font-display font-bold text-xl">Dirección de envío</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
                      Departamento
                    </label>
                    <select
                      value={form.department}
                      onChange={(e) => update("department", e.target.value)}
                      className={cn(
                        "w-full h-11 px-3 rounded-lg bg-surface-elevated border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30",
                        errors.department ? "border-destructive" : "border-subtle focus:border-primary-glow"
                      )}
                    >
                      <option value="">Seleccionar…</option>
                      {COLOMBIA_DEPTS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                    {errors.department && <p className="text-xs text-destructive mt-1">{errors.department}</p>}
                  </div>
                  <Field
                    label="Ciudad"
                    value={form.city}
                    onChange={(v) => update("city", v)}
                    error={errors.city}
                    placeholder="Cali"
                  />
                </div>
                <Field
                  label="Dirección"
                  value={form.address}
                  onChange={(v) => update("address", v)}
                  error={errors.address}
                  placeholder="Calle 10 #4-25, apto 502"
                />
                <div>
                  <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
                    Notas (opcional)
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => update("notes", e.target.value)}
                    rows={3}
                    placeholder="Indicaciones para entrega…"
                    className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-subtle text-sm focus:outline-none focus:border-primary-glow focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="font-display font-bold text-xl">Confirma tu pedido</h2>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <Summary title="Datos de contacto">
                    <p>{form.full_name}</p>
                    <p className="text-muted-foreground">{form.email}</p>
                    <p className="text-muted-foreground">{form.phone}</p>
                  </Summary>
                  <Summary title="Envío a">
                    <p>{form.address}</p>
                    <p className="text-muted-foreground">{form.city}, {form.department}</p>
                    {form.notes && <p className="text-muted-foreground italic mt-1">"{form.notes}"</p>}
                  </Summary>
                </div>
                <div className="rounded-lg bg-surface-elevated border border-subtle p-4 text-sm space-y-2">
                  <p className="font-medium">Método de pago</p>
                  <p className="text-muted-foreground">Pago contra entrega · Cobro al recibir el pedido.</p>
                </div>
                <ul className="divide-y divide-subtle">
                  {items.map((it) => {
                    const img = it.product.images?.[0] || it.product.image;
                    return (
                      <li key={it.product.slug} className="flex items-center gap-3 py-3 text-sm">
                        <img
                          src={img}
                          alt={it.product.name}
                          width={64}
                          height={64}
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/placeholder.svg"; }}
                          className="h-16 w-16 rounded-lg object-cover bg-surface-elevated shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="truncate">{it.product.name}</p>
                          <p className="text-xs text-muted-foreground">Cant: {it.quantity}</p>
                        </div>
                        <span className="font-medium">{formatPrice(it.product.price * it.quantity)}</span>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}

            <div className="flex justify-end pt-2">
              {step === 1 && !user && !guestMode ? null : step < 3 ? (
                <button
                  onClick={goNext}
                  className="h-12 px-7 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary-glow transition-all active:scale-[0.97] shadow-purple"
                >
                  Continuar
                </button>
              ) : (
                <button
                  onClick={placeOrder}
                  disabled={submitting}
                  className="h-12 px-7 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary-glow transition-all active:scale-[0.97] shadow-purple disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Confirmar pedido
                </button>
              )}
            </div>
          </div>

          {/* Sidebar resumen */}
          <aside className="self-start lg:sticky lg:top-24 space-y-5 p-6 rounded-xl bg-surface border border-subtle">
            <h2 className="font-display font-bold text-lg">Resumen</h2>
            <ul className="space-y-3 max-h-60 overflow-y-auto text-sm">
              {items.map((it) => (
                <li key={it.product.slug} className="flex gap-3">
                  <img src={it.product.image} alt={it.product.name} className="h-12 w-12 rounded-md object-cover bg-surface-elevated shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{it.product.name}</p>
                    <p className="text-xs text-muted-foreground">x{it.quantity}</p>
                  </div>
                  <span className="text-sm font-medium">{formatPrice(it.product.price * it.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="border-t border-subtle pt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(subtotal)}</span></div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Envío</span>
                <span>{shippingCost === 0 ? <span className="text-success">Gratis</span> : formatPrice(shippingCost)}</span>
              </div>
              {shippingCost > 0 && (
                <p className="text-xs text-muted-foreground">
                  Envío gratis en compras desde {formatPrice(SHIPPING_FREE_THRESHOLD)}.
                </p>
              )}
            </div>
            <div className="border-t border-subtle pt-4 flex justify-between items-baseline">
              <span className="text-sm">Total</span>
              <span className="font-display font-extrabold text-2xl text-primary-glow">{formatPrice(total)}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2">
              <span className="inline-flex items-center gap-1"><Lock className="h-3.5 w-3.5" /> Seguro</span>
              <span className="inline-flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> Rápido</span>
              <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> Garantía</span>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};

const Field = ({
  label, value, onChange, error, placeholder, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void; error?: string; placeholder?: string; type?: string;
}) => (
  <div>
    <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "w-full h-11 px-3 rounded-lg bg-surface-elevated border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all",
        error ? "border-destructive" : "border-subtle focus:border-primary-glow"
      )}
    />
    {error && <p className="text-xs text-destructive mt-1">{error}</p>}
  </div>
);

const Summary = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-lg bg-surface-elevated border border-subtle p-4">
    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{title}</p>
    <div className="space-y-0.5">{children}</div>
  </div>
);

export default Checkout;
