// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const FROM = "BrrayLab <noreply@brraylab.com>";
const ADMIN_EMAIL = "brraylab@gmail.com";
const REPLY_TO = "hola@brraylab.com";
const SITE_URL = "https://brraylab.com";

// Resend template IDs
const TEMPLATES = {
  welcome: "6cb77846-db68-4d8a-9351-07750cb7d082",
  order_created_customer: "0f700b62-4138-431c-8bc2-6f0687c43c09",
  order_status: "1b3e0a24-afd0-4ba3-aa8a-5bd05fa94e48",
  order_created_admin: "9800cf05-909a-43cd-aec3-9e78ae28218d",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  processing: "En preparación",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const fmtCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

const fmtDate = (d: string | Date) =>
  new Intl.DateTimeFormat("es-CO", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Bogota",
  }).format(new Date(d));

async function sendWithTemplate(
  to: string | string[],
  templateId: string,
  variables: Record<string, any>,
) {
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY no configurada");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: Array.isArray(to) ? to : [to],
      reply_to: REPLY_TO,
      template: { id: templateId, variables },
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Resend ${res.status}: ${t}`);
  }
  return res.json();
}

function formatItems(items: any[]) {
  return (items ?? []).map((it: any) => ({
    name: it.name,
    quantity: it.quantity,
    price: fmtCOP(Number(it.price)),
    subtotal: fmtCOP(Number(it.price) * Number(it.quantity)),
    image_url: it.image_url ?? "",
  }));
}

function formatAddress(addr: any) {
  if (!addr) return "";
  return [
    addr.full_name,
    addr.address,
    `${addr.city}, ${addr.department}`,
    `Tel: ${addr.phone}`,
  ]
    .filter(Boolean)
    .join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, order_number, name, email } = await req.json();
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // -------- WELCOME --------
    if (type === "welcome") {
      if (!email) throw new Error("email requerido");
      await sendWithTemplate(email, TEMPLATES.welcome, {
        customer_name: name ?? "",
      });
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!order_number) throw new Error("order_number requerido");

    const { data: order, error: oe } = await supabase
      .from("orders")
      .select("*")
      .eq("order_number", order_number)
      .maybeSingle();
    if (oe || !order) throw oe ?? new Error("Pedido no encontrado");

    const [{ data: items }, { data: addr }] = await Promise.all([
      supabase.from("order_items").select("*").eq("order_id", order.id),
      supabase.from("order_addresses").select("*").eq("order_id", order.id).maybeSingle(),
    ]);

    const customerEmail = addr?.email ?? order.guest_email;
    const customerName = addr?.full_name ?? "";
    const orderUrl = `${SITE_URL}/orden/${order.order_number}`;
    const shippingAddress = formatAddress(addr);
    const orderItems = formatItems(items ?? []);
    const orderTotal = fmtCOP(order.total);
    const orderDate = fmtDate(order.created_at);

    // -------- ORDER CREATED --------
    if (type === "order_created") {
      // Customer confirmation
      if (customerEmail) {
        await sendWithTemplate(customerEmail, TEMPLATES.order_created_customer, {
          customer_name: customerName,
          order_number: order.order_number,
          order_date: orderDate,
          order_total: orderTotal,
          order_items: orderItems,
          shipping_address: shippingAddress,
          order_url: orderUrl,
        });
      }
      // Admin notification
      await sendWithTemplate(ADMIN_EMAIL, TEMPLATES.order_created_admin, {
        customer_name: customerName,
        customer_email: customerEmail ?? "",
        customer_phone: addr?.phone ?? "",
        shipping_address: shippingAddress,
        order_number: order.order_number,
        order_items: orderItems,
        order_total: orderTotal,
        order_date: orderDate,
      });
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // -------- ORDER STATUS --------
    if (type === "order_status") {
      if (!customerEmail) throw new Error("Sin email de cliente");
      await sendWithTemplate(customerEmail, TEMPLATES.order_status, {
        customer_name: customerName,
        order_number: order.order_number,
        order_status: STATUS_LABELS[order.status] ?? order.status,
        tracking_number: order.tracking_number ?? "",
        order_url: orderUrl,
      });
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`type inválido: ${type}`);
  } catch (err) {
    console.error("[send-email]", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
