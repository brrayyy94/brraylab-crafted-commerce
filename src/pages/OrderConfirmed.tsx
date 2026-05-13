import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, Package, MapPin, Receipt, UserPlus, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/data/products";
import { useAuth } from "@/context/AuthContext";
import { usePaymentSettings } from "@/hooks/usePaymentSettings";
import { buildOrderWhatsappMessage, buildWhatsappLink } from "@/lib/whatsapp";

type OrderRow = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string | null;
  subtotal: number;
  shipping_cost: number;
  total: number;
  amount_paid_online: number | null;
  amount_due_on_delivery: number | null;
  notes: string | null;
  created_at: string;
  user_id: string | null;
  guest_email: string | null;
};
type ItemRow = { id: string; name: string; price: number; quantity: number; image_url: string | null };
type AddrRow = { full_name: string; phone: string; email: string; department: string; city: string; address: string; notes: string | null };

const OrderConfirmed = () => {
  const { number } = useParams();
  const { user } = useAuth();
  const { data: payments } = usePaymentSettings();
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [addr, setAddr] = useState<AddrRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [needsEmail, setNeedsEmail] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

  const fetchOrder = async (email?: string) => {
    if (!number) return;
    setLoading(true);
    setEmailError(null);
    const { data, error } = await supabase.rpc("get_order_for_confirmation", {
      _order_number: number,
      _email: email ?? null,
    });
    if (error || !data) {
      // If logged in, just not found. Otherwise prompt for email.
      if (!user && !email) {
        setNeedsEmail(true);
        setLoading(false);
        return;
      }
      if (email) setEmailError("No encontramos un pedido con ese correo.");
      else setNotFound(true);
      setLoading(false);
      return;
    }
    const payload = data as { order: OrderRow; items: ItemRow[]; address: AddrRow | null };
    setOrder(payload.order);
    setItems(payload.items ?? []);
    setAddr(payload.address ?? null);
    setNeedsEmail(false);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [number, user?.id]);

  if (loading) return <section className="container py-24 text-center text-muted-foreground">Cargando pedido…</section>;

  if (needsEmail && !order) {
    return (
      <section className="container py-20 max-w-md mx-auto text-center">
        <h1 className="font-display font-extrabold text-2xl md:text-3xl mb-3">Confirma tu pedido</h1>
        <p className="text-muted-foreground mb-6 text-sm">
          Por seguridad, ingresa el correo con el que realizaste el pedido <span className="font-semibold text-foreground">{number}</span>.
        </p>
        <form
          onSubmit={(e) => { e.preventDefault(); fetchOrder(emailInput.trim()); }}
          className="space-y-3 text-left"
        >
          <input
            type="email"
            required
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="tu@correo.com"
            className="w-full h-11 px-4 rounded-lg bg-surface border border-subtle focus:outline-none focus:border-primary"
          />
          {emailError && <p className="text-sm text-destructive">{emailError}</p>}
          <button
            type="submit"
            className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary-glow transition-colors"
          >
            Ver pedido
          </button>
        </form>
      </section>
    );
  }

  if (notFound || !order) {
    return (
      <section className="container py-24 text-center">
        <h1 className="font-display font-extrabold text-3xl mb-3">Pedido no encontrado</h1>
        <p className="text-muted-foreground mb-6">Verifica el número de pedido.</p>
        <Link to="/tienda" className="inline-flex h-11 items-center px-6 rounded-full bg-primary text-primary-foreground hover:bg-primary-glow transition-colors">
          Volver a la tienda
        </Link>
      </section>
    );
  }

  return (
    <section className="container py-12 md:py-20">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col items-center text-center gap-4 mb-12">
          <div className="h-20 w-20 rounded-full bg-success/15 flex items-center justify-center text-success">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          {order.payment_method === "whatsapp_manual" ? (
            <>
              <p className="text-xs uppercase tracking-widest text-primary-glow">Pedido enviado</p>
              <h1 className="font-display font-extrabold text-3xl md:text-5xl">¡Pedido enviado! 🎉</h1>
              <p className="text-muted-foreground max-w-md">
                Tu pedido <span className="font-semibold text-foreground">{order.order_number}</span> fue registrado.
                Continúa la conversación en WhatsApp para confirmar disponibilidad y coordinar el pago.
              </p>
            </>
          ) : (
            <>
              <p className="text-xs uppercase tracking-widest text-primary-glow">Pedido confirmado</p>
              <h1 className="font-display font-extrabold text-3xl md:text-5xl">¡Gracias por tu compra!</h1>
              <p className="text-muted-foreground max-w-md">
                Hemos recibido tu pedido <span className="font-semibold text-foreground">{order.order_number}</span>.
                Te contactaremos pronto para coordinar el envío.
              </p>
            </>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <Card icon={Receipt} title="Pedido">
            <p>Nº <span className="font-semibold text-foreground">{order.order_number}</span></p>
            <p>Estado: <span className="capitalize text-foreground">{order.status}</span></p>
            <p>Pago: <span className="capitalize text-foreground">{order.payment_method ?? "—"}</span></p>
          </Card>
          {addr && (
            <Card icon={MapPin} title="Envío">
              <p>{addr.full_name}</p>
              <p>{addr.address}</p>
              <p>{addr.city}, {addr.department}</p>
              <p>{addr.phone}</p>
            </Card>
          )}
        </div>

        <div className="rounded-xl bg-surface border border-subtle p-6 md:p-8">
          <h2 className="font-display font-bold text-lg mb-4 inline-flex items-center gap-2">
            <Package className="h-5 w-5 text-primary-glow" /> Productos
          </h2>
          <ul className="divide-y divide-subtle">
            {items.map((it) => (
              <li key={it.id} className="flex items-center gap-4 py-4">
                {it.image_url && <img src={it.image_url} alt={it.name} className="h-14 w-14 rounded-lg object-cover bg-surface-elevated" />}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{it.name}</p>
                  <p className="text-xs text-muted-foreground">Cant: {it.quantity}</p>
                </div>
                <span className="font-medium">{formatPrice(Number(it.price) * it.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-subtle pt-4 mt-2 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(Number(order.subtotal))}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Envío</span><span>{Number(order.shipping_cost) === 0 ? <span className="text-success">Gratis</span> : formatPrice(Number(order.shipping_cost))}</span></div>
            <div className="flex justify-between items-baseline pt-2 border-t border-subtle">
              <span>Total</span>
              <span className="font-display font-extrabold text-2xl text-primary-glow">{formatPrice(Number(order.total))}</span>
            </div>
            {(Number(order.amount_paid_online ?? 0) > 0 || Number(order.amount_due_on_delivery ?? 0) > 0) && (
              <div className="pt-3 mt-2 border-t border-subtle space-y-1">
                <div className="flex justify-between text-muted-foreground"><span>Pagado en línea</span><span className="text-foreground">{formatPrice(Number(order.amount_paid_online ?? 0))}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>A pagar al recibir</span><span className="text-foreground">{formatPrice(Number(order.amount_due_on_delivery ?? 0))}</span></div>
              </div>
            )}
          </div>
        </div>

        {payments?.whatsapp_notifications && addr && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                const msg = buildOrderWhatsappMessage({
                  orderNumber: order.order_number,
                  customerName: addr.full_name,
                  city: `${addr.city}, ${addr.department}`,
                  address: addr.address,
                  total: Number(order.total),
                  paidOnline: Number(order.amount_paid_online ?? 0),
                  dueOnDelivery: Number(order.amount_due_on_delivery ?? 0),
                  paymentLabel: order.payment_method ?? "—",
                });
                const url = buildWhatsappLink(payments.whatsapp_notifications, msg);
                window.open(url, "_blank", "noopener,noreferrer");
              }}
              className="inline-flex h-11 items-center gap-2 px-5 rounded-full bg-success text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <MessageCircle className="h-4 w-4" />
              Notificar por WhatsApp
            </button>
          </div>
        )}

        {!user && order.guest_email && (
          <div className="mt-10 rounded-xl border border-primary/30 bg-primary/5 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center text-primary-glow shrink-0">
              <UserPlus className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="font-medium">¿Quieres hacer seguimiento de tu pedido?</p>
              <p className="text-sm text-muted-foreground">
                Crea tu cuenta gratis con <span className="text-foreground">{order.guest_email}</span> y consulta tu historial cuando quieras.
              </p>
            </div>
            <Link
              to={`/auth/registro?redirect=/mi-cuenta/pedidos`}
              className="inline-flex h-11 items-center px-5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-glow transition-colors shrink-0"
            >
              Crear cuenta
            </Link>
          </div>
        )}

        <div className="text-center mt-10">
          <Link to="/tienda" className="inline-flex h-12 items-center px-7 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary-glow transition-colors shadow-purple">
            Seguir comprando
          </Link>
        </div>
      </div>
    </section>
  );
};

const Card = ({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) => (
  <div className="rounded-xl bg-surface border border-subtle p-5 text-sm space-y-1">
    <p className="text-xs uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1.5">
      <Icon className="h-4 w-4 text-primary-glow" /> {title}
    </p>
    <div className="space-y-0.5 pt-1">{children}</div>
  </div>
);

export default OrderConfirmed;
