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

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!number) return;
      const { data: o } = await supabase
        .from("orders")
        .select("id, order_number, status, payment_status, payment_method, subtotal, shipping_cost, total, notes, created_at, user_id, guest_email")
        .eq("order_number", number)
        .maybeSingle();
      if (cancelled) return;
      if (!o) { setNotFound(true); setLoading(false); return; }
      setOrder(o as OrderRow);
      const [{ data: its }, { data: ad }] = await Promise.all([
        supabase.from("order_items").select("id, name, price, quantity, image_url").eq("order_id", o.id),
        supabase.from("order_addresses").select("full_name, phone, email, department, city, address, notes").eq("order_id", o.id).maybeSingle(),
      ]);
      if (cancelled) return;
      setItems((its ?? []) as ItemRow[]);
      setAddr((ad ?? null) as AddrRow | null);
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [number]);

  if (loading) return <section className="container py-24 text-center text-muted-foreground">Cargando pedido…</section>;
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
          <p className="text-xs uppercase tracking-widest text-primary-glow">Pedido confirmado</p>
          <h1 className="font-display font-extrabold text-3xl md:text-5xl">¡Gracias por tu compra!</h1>
          <p className="text-muted-foreground max-w-md">
            Hemos recibido tu pedido <span className="font-semibold text-foreground">{order.order_number}</span>.
            Te contactaremos pronto para coordinar el envío.
          </p>
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
          </div>
        </div>

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
