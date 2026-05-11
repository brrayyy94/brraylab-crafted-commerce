import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Lock, ShieldCheck, Truck, ChevronLeft, Loader2, UserCircle2, CreditCard, Banknote, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { formatPrice } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { usePaymentSettings, normalizeCity } from "@/hooks/usePaymentSettings";
import { buildWompiCheckoutUrl } from "@/lib/wompi";

const COLOMBIA_DEPTS = [
  "Amazonas","Antioquia","Arauca","Atlántico","Bolívar","Boyacá","Caldas","Caquetá","Casanare","Cauca",
  "Cesar","Chocó","Córdoba","Cundinamarca","Bogotá D.C.","Guainía","Guaviare","Huila","La Guajira","Magdalena",
  "Meta","Nariño","Norte de Santander","Putumayo","Quindío","Risaralda","San Andrés y Providencia","Santander",
  "Sucre","Tolima","Valle del Cauca","Vaupés","Vichada",
];

type PaymentChoice = "wompi_full" | "cod";

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
  2: "Envío y pago",
  3: "Confirmación",
};

const Checkout = () => {
  const navigate = useNavigate();
  const { items, subtotal, clear } = useCart();
  const { user } = useAuth();
  const { data: payments } = usePaymentSettings();

  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [guestMode, setGuestMode] = useState(false);
  const [paymentChoice, setPaymentChoice] = useState<PaymentChoice>("wompi_full");

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

  const isLocalCity = useMemo(() => {
    if (!payments || !form.city) return false;
    return normalizeCity(form.city) === normalizeCity(payments.local_city);
  }, [form.city, payments]);

  const shippingCost = useMemo(() => {
    if (!payments || items.length === 0) return 0;
    return isLocalCity ? payments.shipping_local : payments.shipping_national;
  }, [payments, isLocalCity, items.length]);

  const total = subtotal + shippingCost;

  // Montos según método
  const codEnabled = payments?.cod_enabled ?? true;
  const amounts = useMemo(() => {
    if (paymentChoice === "wompi_full") {
      return { paidOnline: total, dueOnDelivery: 0 };
    }
    // COD
    return isLocalCity
      ? { paidOnline: 0, dueOnDelivery: total }
      : { paidOnline: shippingCost, dueOnDelivery: subtotal };
  }, [paymentChoice, total, isLocalCity, shippingCost, subtotal]);

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
    if (!payments) {
      toast.error("Configuración de pagos no disponible");
      return;
    }
    setSubmitting(true);
    try {
      const usingWompi = paymentChoice === "wompi_full" || (paymentChoice === "cod" && !isLocalCity);

      // SECURITY: server-side RPC computes prices/shipping authoritatively from the DB.
      // The client only sends product IDs + quantities and the address; it cannot manipulate prices.
      const itemsPayload = items.map((it) => ({
        product_id: it.product.id,
        quantity: it.quantity,
      }));
      const addressPayload = {
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim().toLowerCase(),
        department: form.department,
        city: form.city.trim(),
        address: form.address.trim(),
        notes: form.notes.trim() || null,
      };

      const { data: rpcData, error: rpcErr } = await supabase.rpc("place_order", {
        _items: itemsPayload,
        _address: addressPayload,
        _payment_choice: paymentChoice,
        _guest_email: user ? null : form.email.trim().toLowerCase(),
      });
      if (rpcErr) throw rpcErr;
      const order = Array.isArray(rpcData) ? rpcData[0] : rpcData;
      if (!order?.id || !order?.order_number) {
        throw new Error("No se pudo crear la orden");
      }

      // Si requiere Wompi, generar firma y redirigir
      if (usingWompi) {
        if (!payments.wompi_public_key) {
          toast.error("Wompi no está configurado", { description: "Pídele al administrador que configure la llave pública." });
          setSubmitting(false);
          return;
        }
        const { data: tx, error: txErr } = await supabase.functions.invoke("wompi-create-transaction", {
          body: {
            orderId: order.id,
            guestEmail: user ? undefined : form.email.trim().toLowerCase(),
          },
        });
        if (txErr || !tx?.signature) throw txErr ?? new Error("No se pudo iniciar el pago");

        const redirectUrl = `${window.location.origin}/orden/${order.order_number}`;
        const url = buildWompiCheckoutUrl({
          publicKey: payments.wompi_public_key,
          amountInCents: tx.amountInCents,
          reference: tx.reference,
          signature: tx.signature,
          redirectUrl,
          customerEmail: form.email.trim().toLowerCase(),
        });
        clear();
        window.location.href = url;
        return;
      }

      // COD local: ir directo a confirmación
      clear();
      toast.success("Pedido creado", { description: `Orden ${order.order_number}` });
      navigate(`/orden/${order.order_number}`);
    } catch (err) {
      console.error("[checkout] error", err);
      toast.error("No se pudo procesar el pedido", { description: err instanceof Error ? err.message : "Intenta de nuevo." });
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
                    <Field label="Nombre completo" value={form.full_name} onChange={(v) => update("full_name", v)} error={errors.full_name} placeholder="Andrés Martínez" />
                    <Field label="Email" type="email" value={form.email} onChange={(v) => update("email", v)} error={errors.email} placeholder="tu@email.com" />
                    <Field label="Teléfono / WhatsApp" value={form.phone} onChange={(v) => update("phone", v)} error={errors.phone} placeholder="3001234567" />
                  </>
                )}
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="font-display font-bold text-xl">Dirección de envío</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">Departamento</label>
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
                  <Field label="Ciudad" value={form.city} onChange={(v) => update("city", v)} error={errors.city} placeholder={payments?.local_city ?? "Cali"} />
                </div>
                <Field label="Dirección" value={form.address} onChange={(v) => update("address", v)} error={errors.address} placeholder="Calle 10 #4-25, apto 502" />
                <div>
                  <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">Notas (opcional)</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => update("notes", e.target.value)}
                    rows={3}
                    placeholder="Indicaciones para entrega…"
                    className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-subtle text-sm focus:outline-none focus:border-primary-glow focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                {form.city.trim() && (
                  <div className="rounded-lg border border-subtle bg-surface-elevated p-4 text-sm">
                    <p className="text-muted-foreground">
                      {isLocalCity
                        ? <>Entrega local en <b>{payments?.local_city}</b>. Domicilio: <b>{formatPrice(shippingCost)}</b>.</>
                        : <>Envío nacional. Costo: <b>{formatPrice(shippingCost)}</b>.</>}
                    </p>
                  </div>
                )}

                <div className="space-y-3 pt-2">
                  <h3 className="font-display font-bold text-lg">Método de pago</h3>

                  <PaymentOption
                    selected={paymentChoice === "wompi_full"}
                    onClick={() => setPaymentChoice("wompi_full")}
                    icon={CreditCard}
                    title="Pagar todo con Wompi"
                    desc={`Paga ${formatPrice(total)} ahora con tarjeta, PSE o Nequi.`}
                  />

                  {codEnabled && (
                    <PaymentOption
                      selected={paymentChoice === "cod"}
                      onClick={() => setPaymentChoice("cod")}
                      icon={Banknote}
                      title="Contraentrega"
                      desc={
                        isLocalCity
                          ? `Pagas ${formatPrice(total)} al recibir (producto + domicilio).`
                          : `Anticipa el envío de ${formatPrice(shippingCost)} con Wompi · pagas ${formatPrice(subtotal)} al recibir el producto.`
                      }
                    />
                  )}

                  {paymentChoice === "cod" && !isLocalCity && form.city.trim() && (
                    <div className="rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm flex gap-3">
                      <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                      <p>Para envíos fuera de {payments?.local_city} debes pagar el domicilio anticipado para garantizar el envío.</p>
                    </div>
                  )}
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
                  {paymentChoice === "wompi_full" && (
                    <p className="text-muted-foreground">Pagas <b className="text-foreground">{formatPrice(total)}</b> ahora con Wompi.</p>
                  )}
                  {paymentChoice === "cod" && isLocalCity && (
                    <p className="text-muted-foreground">Contraentrega · pagas <b className="text-foreground">{formatPrice(total)}</b> al recibir.</p>
                  )}
                  {paymentChoice === "cod" && !isLocalCity && (
                    <>
                      <p className="text-muted-foreground">Anticipas <b className="text-foreground">{formatPrice(shippingCost)}</b> (envío) con Wompi.</p>
                      <p className="text-muted-foreground">Pagas <b className="text-foreground">{formatPrice(subtotal)}</b> al recibir el producto.</p>
                    </>
                  )}
                </div>
                <ul className="divide-y divide-subtle">
                  {items.map((it) => {
                    const img = it.product.images?.[0] || it.product.image;
                    return (
                      <li key={it.product.slug} className="flex items-center gap-3 py-3 text-sm">
                        <img src={img} alt={it.product.name} width={64} height={64} onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/placeholder.svg"; }} className="h-16 w-16 rounded-lg object-cover bg-surface-elevated shrink-0" />
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
                  {paymentChoice === "wompi_full" || (paymentChoice === "cod" && !isLocalCity) ? "Pagar con Wompi" : "Confirmar pedido"}
                </button>
              )}
            </div>
          </div>

          <aside className="self-start lg:sticky lg:top-24 space-y-5 p-6 rounded-xl bg-surface border border-subtle">
            <h2 className="font-display font-bold text-lg">Resumen</h2>
            <ul className="space-y-3 max-h-60 overflow-y-auto text-sm">
              {items.map((it) => {
                const img = it.product.images?.[0] || it.product.image;
                return (
                  <li key={it.product.slug} className="flex gap-3">
                    <img src={img} alt={it.product.name} width={64} height={64} onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/placeholder.svg"; }} className="h-16 w-16 rounded-lg object-cover bg-surface-elevated shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate">{it.product.name}</p>
                      <p className="text-xs text-muted-foreground">x{it.quantity}</p>
                    </div>
                    <span className="text-sm font-medium">{formatPrice(it.product.price * it.quantity)}</span>
                  </li>
                );
              })}
            </ul>
            <div className="border-t border-subtle pt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(subtotal)}</span></div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Envío</span>
                <span>{shippingCost === 0 ? <span className="text-success">—</span> : formatPrice(shippingCost)}</span>
              </div>
            </div>
            <div className="border-t border-subtle pt-4 flex justify-between items-baseline">
              <span className="text-sm">Total</span>
              <span className="font-display font-extrabold text-2xl text-primary-glow">{formatPrice(total)}</span>
            </div>
            {step >= 2 && (
              <div className="text-xs text-muted-foreground border-t border-subtle pt-3 space-y-1">
                <div className="flex justify-between"><span>Pagas ahora</span><span className="text-foreground">{formatPrice(amounts.paidOnline)}</span></div>
                <div className="flex justify-between"><span>Al recibir</span><span className="text-foreground">{formatPrice(amounts.dueOnDelivery)}</span></div>
              </div>
            )}
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

const PaymentOption = ({
  selected, onClick, icon: Icon, title, desc,
}: {
  selected: boolean; onClick: () => void; icon: React.ComponentType<{ className?: string }>; title: string; desc: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "w-full text-left rounded-xl border p-4 flex gap-3 transition-all",
      selected ? "border-primary bg-primary/5 ring-2 ring-primary/30" : "border-subtle bg-surface-elevated hover:border-primary-glow"
    )}
  >
    <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", selected ? "bg-primary text-primary-foreground" : "bg-surface text-primary-glow")}>
      <Icon className="h-5 w-5" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-medium text-sm">{title}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
    </div>
  </button>
);

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
