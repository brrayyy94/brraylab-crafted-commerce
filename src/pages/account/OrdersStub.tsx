import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Package, ShoppingBag, Truck, CheckCircle2, XCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { formatPrice } from "@/data/products";
import type { Database, Tables } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

type OrderStatus = Database["public"]["Enums"]["order_status"];
type OrderRow = Tables<"orders">;
type OrderItemRow = Tables<"order_items">;
type OrderAddressRow = Tables<"order_addresses">;

const statusLabels: Record<OrderStatus, string> = {
  pending: "Pendiente",
  processing: "En preparación",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const statusOrder: OrderStatus[] = ["pending", "processing", "shipped", "delivered"];

const statusIcons: Record<OrderStatus, typeof Clock> = {
  pending: Clock,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle2,
  cancelled: XCircle,
};

const formatDate = (v: string) =>
  new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(v));

const Orders = () => {
  const { user } = useAuth();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OrderRow[];
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 skeleton-shimmer rounded-2xl" />
        ))}
      </div>
    );
  }

  if (selectedId) {
    return <OrderDetail orderId={selectedId} onBack={() => setSelectedId(null)} />;
  }

  if (orders.length === 0) {
    return (
      <div className="bg-surface border border-subtle rounded-2xl p-12 text-center">
        <div className="mx-auto h-14 w-14 rounded-full bg-primary/15 flex items-center justify-center mb-4">
          <ShoppingBag className="h-6 w-6 text-primary-glow" />
        </div>
        <h2 className="font-display text-xl font-bold mb-2">Aún sin pedidos</h2>
        <p className="text-sm text-muted-foreground mb-6">Cuando hagas tu primera compra, aparecerá aquí.</p>
        <Link to="/tienda" className="inline-flex h-11 items-center px-5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary-glow transition-colors">
          Explorar tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h1 className="font-display text-2xl font-bold mb-4">Mis pedidos</h1>
      {orders.map((o) => {
        const Icon = statusIcons[o.status];
        return (
          <button
            key={o.id}
            onClick={() => setSelectedId(o.id)}
            className="w-full text-left bg-surface border border-subtle rounded-2xl p-5 hover:border-primary/40 transition-colors flex items-center gap-4"
          >
            <div className="h-11 w-11 rounded-xl bg-primary/15 text-primary-glow flex items-center justify-center shrink-0">
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium">{o.order_number}</p>
              <p className="text-xs text-muted-foreground">{formatDate(o.created_at)}</p>
            </div>
            <div className="text-right">
              <p className="font-display font-bold text-primary-glow">{formatPrice(Number(o.total))}</p>
              <p className="text-xs text-muted-foreground">{statusLabels[o.status]}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
};

const OrderDetail = ({ orderId, onBack }: { orderId: string; onBack: () => void }) => {
  const { data, isLoading } = useQuery({
    queryKey: ["my-order", orderId],
    queryFn: async () => {
      const [{ data: order }, { data: items }, { data: address }] = await Promise.all([
        supabase.from("orders").select("*").eq("id", orderId).maybeSingle(),
        supabase.from("order_items").select("*").eq("order_id", orderId),
        supabase.from("order_addresses").select("*").eq("order_id", orderId).maybeSingle(),
      ]);
      return {
        order: order as OrderRow | null,
        items: (items ?? []) as OrderItemRow[],
        address: address as OrderAddressRow | null,
      };
    },
  });

  if (isLoading || !data?.order) {
    return <div className="h-64 skeleton-shimmer rounded-2xl" />;
  }

  const { order, items, address } = data;
  const isCancelled = order.status === "cancelled";
  const currentIdx = isCancelled ? -1 : statusOrder.indexOf(order.status);

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary-glow">
        <ArrowLeft className="h-4 w-4" /> Volver a pedidos
      </button>

      <div className="bg-surface border border-subtle rounded-2xl p-6">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Pedido</p>
            <h2 className="font-display text-2xl font-bold">{order.order_number}</h2>
            <p className="text-xs text-muted-foreground mt-1">{formatDate(order.created_at)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="font-display font-bold text-2xl text-primary-glow">{formatPrice(Number(order.total))}</p>
          </div>
        </div>

        {/* Timeline */}
        {isCancelled ? (
          <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-4 text-sm text-destructive flex items-center gap-2">
            <XCircle className="h-5 w-5" /> Este pedido fue cancelado.
          </div>
        ) : (
          <div className="relative">
            <div className="flex justify-between gap-2">
              {statusOrder.map((s, i) => {
                const Icon = statusIcons[s];
                const reached = i <= currentIdx;
                return (
                  <div key={s} className="flex-1 flex flex-col items-center gap-2 relative z-10">
                    <div className={cn(
                      "h-10 w-10 rounded-full border-2 flex items-center justify-center transition-colors",
                      reached ? "bg-primary border-primary text-primary-foreground" : "bg-surface border-subtle text-muted-foreground"
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className={cn("text-[11px] text-center", reached ? "text-foreground" : "text-muted-foreground")}>
                      {statusLabels[s]}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="absolute top-5 left-[10%] right-[10%] h-0.5 bg-subtle -z-0" />
            <div
              className="absolute top-5 left-[10%] h-0.5 bg-primary -z-0 transition-all"
              style={{ width: `${Math.max(0, currentIdx) / (statusOrder.length - 1) * 80}%` }}
            />
          </div>
        )}

        {order.tracking_number && (
          <div className="mt-5 rounded-lg bg-surface-elevated border border-subtle p-3 text-sm">
            <span className="text-muted-foreground">Seguimiento: </span>
            <span className="font-medium">{order.tracking_number}</span>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-surface border border-subtle rounded-2xl p-5">
          <h3 className="font-display font-bold mb-3">Productos</h3>
          <ul className="divide-y divide-subtle">
            {items.map((it) => (
              <li key={it.id} className="flex items-center gap-3 py-3 text-sm">
                <img src={it.image_url ?? "/placeholder.svg"} alt={it.name} className="h-12 w-12 rounded-md object-cover bg-surface-elevated" />
                <div className="flex-1 min-w-0">
                  <p className="truncate">{it.name}</p>
                  <p className="text-xs text-muted-foreground">x{it.quantity}</p>
                </div>
                <span className="font-medium">{formatPrice(Number(it.price) * it.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-subtle pt-3 mt-3 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(Number(order.subtotal))}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Envío</span><span>{Number(order.shipping_cost) === 0 ? "Gratis" : formatPrice(Number(order.shipping_cost))}</span></div>
            <div className="flex justify-between font-bold pt-1"><span>Total</span><span className="text-primary-glow">{formatPrice(Number(order.total))}</span></div>
          </div>
        </div>

        <div className="bg-surface border border-subtle rounded-2xl p-5 text-sm space-y-2">
          <h3 className="font-display font-bold mb-3">Envío</h3>
          {address ? (
            <>
              <p>{address.full_name}</p>
              <p className="text-muted-foreground">{address.address}</p>
              <p className="text-muted-foreground">{address.city}, {address.department}</p>
              <p className="text-muted-foreground">{address.phone}</p>
              {address.notes && <p className="text-muted-foreground italic mt-2">"{address.notes}"</p>}
            </>
          ) : <p className="text-muted-foreground">Sin dirección.</p>}
        </div>
      </div>
    </div>
  );
};

export default Orders;
