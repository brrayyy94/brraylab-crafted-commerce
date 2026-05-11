import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const { orderId, currency = "COP", guestEmail } = await req.json();
    if (!orderId || typeof orderId !== "string") {
      return json({ error: "orderId inválido" }, 400);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Identify caller (if authenticated)
    let callerId: string | null = null;
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7).trim()
      : "";
    if (token && token !== ANON_KEY) {
      const userClient = createClient(SUPABASE_URL, ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data: u } = await userClient.auth.getUser();
      callerId = u?.user?.id ?? null;
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, order_number, amount_paid_online, payment_status, user_id, guest_email")
      .eq("id", orderId)
      .maybeSingle();
    if (orderErr || !order) return json({ error: "Pedido no encontrado" }, 404);

    // SECURITY: enforce ownership — caller must own the order or match guest email.
    const isOwner = callerId && order.user_id === callerId;
    const isGuestMatch =
      !order.user_id &&
      typeof guestEmail === "string" &&
      order.guest_email &&
      guestEmail.trim().toLowerCase() === String(order.guest_email).toLowerCase();
    if (!isOwner && !isGuestMatch) {
      return json({ error: "No autorizado" }, 403);
    }

    const dbAmount = Number(order.amount_paid_online);
    if (!Number.isFinite(dbAmount) || dbAmount <= 0) {
      return json({ error: "Monto del pedido inválido" }, 400);
    }
    if (order.payment_status === "paid") {
      return json({ error: "El pedido ya fue pagado" }, 409);
    }

    const integritySecret = (Deno.env.get("WOMPI_INTEGRITY_SECRET") ?? "").trim();
    if (!integritySecret) return json({ error: "WOMPI_INTEGRITY_SECRET no configurado" }, 500);

    const reference = String(order.order_number).trim();
    const amount = Math.round(dbAmount * 100);
    const curr = String(currency).trim().toUpperCase();
    const concatenated = `${reference}${amount}${curr}${integritySecret}`;
    const signature = await sha256Hex(concatenated);

    await supabase
      .from("orders")
      .update({ payment_reference: reference })
      .eq("id", orderId);

    return json({ reference, amountInCents: amount, currency: curr, signature });
  } catch (e) {
    console.error("[wompi-create-transaction]", e);
    return json({ error: e instanceof Error ? e.message : "Error" }, 500);
  }
});
