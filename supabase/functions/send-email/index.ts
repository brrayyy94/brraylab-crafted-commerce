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

const fmtCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

async function sendViaResend(to: string | string[], subject: string, html: string) {
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
      subject,
      html,
      reply_to: REPLY_TO,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Resend ${res.status}: ${t}`);
  }
  return res.json();
}

const layout = (title: string, body: string) => `
<!doctype html><html lang="es"><head><meta charset="utf-8"/><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#1d1d1f;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e5ea;">
<tr><td style="background:#0a0a0a;padding:22px 28px;text-align:center;">
<a href="${SITE_URL}" style="color:#fff;font-size:22px;font-weight:800;letter-spacing:0.5px;text-decoration:none;">BrrayLab</a>
</td></tr>
<tr><td style="padding:32px 28px;">${body}</td></tr>
<tr><td style="background:#fafafa;padding:18px 28px;text-align:center;font-size:12px;color:#86868b;border-top:1px solid #e5e5ea;">
© ${new Date().getFullYear()} BrrayLab · <a href="${SITE_URL}" style="color:#86868b;">brraylab.com</a><br/>
¿Dudas? Escríbenos a <a href="mailto:${REPLY_TO}" style="color:#86868b;">${REPLY_TO}</a>
</td></tr>
</table>
</td></tr></table>
</body></html>`;

function itemsTable(items: any[]) {
  const rows = items
    .map(
      (it: any) => `
<tr>
  <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
    <strong>${escapeHtml(it.name)}</strong><br/>
    <span style="color:#86868b;font-size:13px;">Cant: ${it.quantity}</span>
  </td>
  <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;text-align:right;white-space:nowrap;">
    ${fmtCOP(Number(it.price) * Number(it.quantity))}
  </td>
</tr>`
    )
    .join("");
  return `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:8px;">${rows}</table>`;
}

function escapeHtml(s: any) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ------- Templates -------
function tplOrderCustomer(o: any, items: any[], addr: any) {
  const body = `
<h1 style="font-size:24px;margin:0 0 8px;">¡Gracias por tu compra! 🎉</h1>
<p style="color:#515154;margin:0 0 20px;">Hemos recibido tu pedido <strong>${escapeHtml(o.order_number)}</strong>. Te contactaremos para coordinar el envío.</p>
<div style="background:#f5f5f7;border-radius:10px;padding:16px 18px;margin:0 0 20px;">
  <div style="font-size:12px;color:#86868b;text-transform:uppercase;letter-spacing:0.5px;">Total</div>
  <div style="font-size:26px;font-weight:800;">${fmtCOP(o.total)}</div>
  ${Number(o.amount_paid_online) > 0 ? `<div style="font-size:13px;color:#515154;margin-top:4px;">Pagado en línea: <strong>${fmtCOP(o.amount_paid_online)}</strong></div>` : ""}
  ${Number(o.amount_due_on_delivery) > 0 ? `<div style="font-size:13px;color:#515154;">A pagar al recibir: <strong>${fmtCOP(o.amount_due_on_delivery)}</strong></div>` : ""}
</div>
<h3 style="font-size:15px;margin:20px 0 4px;">Productos</h3>
${itemsTable(items)}
${addr ? `<h3 style="font-size:15px;margin:24px 0 4px;">Envío</h3>
<p style="color:#515154;margin:0;line-height:1.5;">
  ${escapeHtml(addr.full_name)}<br/>
  ${escapeHtml(addr.address)}<br/>
  ${escapeHtml(addr.city)}, ${escapeHtml(addr.department)}<br/>
  Tel: ${escapeHtml(addr.phone)}
</p>` : ""}
<div style="text-align:center;margin:28px 0 4px;">
  <a href="${SITE_URL}/orden/${escapeHtml(o.order_number)}" style="display:inline-block;background:#0a0a0a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:600;">Ver mi pedido</a>
</div>`;
  return { subject: `Pedido confirmado · ${o.order_number}`, html: layout("Pedido confirmado", body) };
}

function tplOrderAdmin(o: any, items: any[], addr: any) {
  const body = `
<h1 style="font-size:22px;margin:0 0 8px;">🛒 Nuevo pedido</h1>
<p style="color:#515154;margin:0 0 16px;">Pedido <strong>${escapeHtml(o.order_number)}</strong> · Pago: <strong>${escapeHtml(o.payment_method ?? "—")}</strong></p>
<div style="background:#f5f5f7;border-radius:10px;padding:14px 16px;margin:0 0 16px;">
  <div style="font-size:13px;color:#515154;">Total: <strong>${fmtCOP(o.total)}</strong></div>
  <div style="font-size:13px;color:#515154;">Pagado online: ${fmtCOP(o.amount_paid_online)} · Contra entrega: ${fmtCOP(o.amount_due_on_delivery)}</div>
</div>
${itemsTable(items)}
${addr ? `<h3 style="font-size:15px;margin:20px 0 4px;">Cliente</h3>
<p style="color:#515154;margin:0;line-height:1.5;">
  ${escapeHtml(addr.full_name)}<br/>
  ${escapeHtml(addr.email)} · ${escapeHtml(addr.phone)}<br/>
  ${escapeHtml(addr.address)}, ${escapeHtml(addr.city)}, ${escapeHtml(addr.department)}
  ${addr.notes ? `<br/><em>Notas: ${escapeHtml(addr.notes)}</em>` : ""}
</p>` : ""}
<div style="text-align:center;margin:24px 0 0;">
  <a href="${SITE_URL}/admin" style="display:inline-block;background:#0a0a0a;color:#fff;text-decoration:none;padding:11px 22px;border-radius:999px;font-weight:600;">Abrir panel admin</a>
</div>`;
  return { subject: `🛒 Nuevo pedido ${o.order_number} · ${fmtCOP(o.total)}`, html: layout("Nuevo pedido", body) };
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  processing: "En preparación",
  shipped: "Enviado 🚚",
  delivered: "Entregado ✅",
  cancelled: "Cancelado",
};

function tplOrderStatus(o: any, addr: any) {
  const label = STATUS_LABELS[o.status] ?? o.status;
  const body = `
<h1 style="font-size:22px;margin:0 0 8px;">Actualización de tu pedido</h1>
<p style="color:#515154;margin:0 0 18px;">Hola${addr?.full_name ? " " + escapeHtml(addr.full_name.split(" ")[0]) : ""}, tu pedido <strong>${escapeHtml(o.order_number)}</strong> cambió de estado.</p>
<div style="background:#f5f5f7;border-radius:10px;padding:18px;margin:0 0 18px;text-align:center;">
  <div style="font-size:12px;color:#86868b;text-transform:uppercase;letter-spacing:0.5px;">Estado actual</div>
  <div style="font-size:22px;font-weight:800;margin-top:4px;">${escapeHtml(label)}</div>
  ${o.tracking_number ? `<div style="margin-top:10px;font-size:13px;color:#515154;">Guía: <strong>${escapeHtml(o.tracking_number)}</strong></div>` : ""}
</div>
<div style="text-align:center;margin:20px 0 0;">
  <a href="${SITE_URL}/orden/${escapeHtml(o.order_number)}" style="display:inline-block;background:#0a0a0a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:600;">Ver mi pedido</a>
</div>`;
  return { subject: `Tu pedido ${o.order_number}: ${label}`, html: layout("Estado actualizado", body) };
}

function tplWelcome(name: string) {
  const first = (name || "").trim().split(" ")[0] || "";
  const body = `
<h1 style="font-size:24px;margin:0 0 8px;">¡Bienvenid${first ? "@" : "@"} a BrrayLab${first ? `, ${escapeHtml(first)}` : ""}! 💜</h1>
<p style="color:#515154;margin:0 0 16px;line-height:1.55;">Tu cuenta está lista. Ahora puedes hacer seguimiento a tus pedidos, guardar direcciones y recibir novedades de la tienda.</p>
<div style="text-align:center;margin:24px 0;">
  <a href="${SITE_URL}/tienda" style="display:inline-block;background:#0a0a0a;color:#fff;text-decoration:none;padding:12px 26px;border-radius:999px;font-weight:600;">Explorar tienda</a>
</div>
<p style="color:#86868b;font-size:13px;margin:0;">Si tienes preguntas, respóndenos a este correo.</p>`;
  return { subject: "¡Bienvenid@ a BrrayLab!", html: layout("Bienvenida", body) };
}

// ------- Handler -------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, order_number, name, email } = await req.json();
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    if (type === "welcome") {
      if (!email) throw new Error("email requerido");
      const { subject, html } = tplWelcome(name ?? "");
      await sendViaResend(email, subject, html);
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

    if (type === "order_created") {
      if (customerEmail) {
        const { subject, html } = tplOrderCustomer(order, items ?? [], addr);
        await sendViaResend(customerEmail, subject, html);
      }
      const { subject: aSub, html: aHtml } = tplOrderAdmin(order, items ?? [], addr);
      await sendViaResend(ADMIN_EMAIL, aSub, aHtml);
    } else if (type === "order_status") {
      if (!customerEmail) throw new Error("Sin email de cliente");
      const { subject, html } = tplOrderStatus(order, addr);
      await sendViaResend(customerEmail, subject, html);
    } else {
      throw new Error(`type inválido: ${type}`);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[send-email]", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
