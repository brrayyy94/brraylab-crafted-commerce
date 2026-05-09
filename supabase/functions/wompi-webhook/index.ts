import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
};

const ok = (body: unknown = { received: true }) =>
  new Response(JSON.stringify(body), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const fail = (msg: string, status = 400) =>
  new Response(JSON.stringify({ error: msg }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const getByPath = (obj: unknown, path: string): unknown =>
  path.split(".").reduce<unknown>((acc, key) => (acc && typeof acc === "object" ? (acc as Record<string, unknown>)[key] : undefined), obj);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return fail("Method not allowed", 405);

  try {
    const body = await req.json();
    const eventsSecret = Deno.env.get("WOMPI_EVENTS_SECRET");
    if (!eventsSecret) return fail("WOMPI_EVENTS_SECRET no configurado", 500);

    const sig = body?.signature ?? {};
    const props: string[] = Array.isArray(sig?.properties) ? sig.properties : [];
    const checksum: string | undefined = sig?.checksum;
    const timestamp = body?.timestamp;

    if (!props.length || !checksum || timestamp === undefined) return fail("Firma faltante", 400);

    const concat = props.map((p) => String(getByPath(body?.data ?? {}, p) ?? "")).join("") + String(timestamp) + eventsSecret;
    const expected = (await sha256Hex(concat)).toUpperCase();
    if (expected !== String(checksum).toUpperCase()) {
      console.warn("[wompi-webhook] checksum mismatch");
      return fail("Firma inválida", 401);
    }

    const tx = body?.data?.transaction;
    if (!tx) return ok({ ignored: true });

    const reference: string | undefined = tx.reference;
    const status: string | undefined = tx.status; // APPROVED | DECLINED | VOIDED | ERROR | PENDING
    if (!reference) return ok({ ignored: true });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: order } = await supabase
      .from("orders")
      .select("id, payment_status, amount_due_on_delivery")
      .eq("order_number", reference)
      .maybeSingle();
    if (!order) return ok({ ignored: true, reason: "order not found" });

    let paymentStatus: string | null = null;
    let orderStatus: string | null = null;

    if (status === "APPROVED") {
      // Si queda saldo por cobrar (anticipo de envío), marcamos parcial; si no, pagado.
      const due = Number(order.amount_due_on_delivery ?? 0);
      paymentStatus = due > 0 ? "partial_paid" : "paid";
      orderStatus = "processing";
    } else if (status === "DECLINED" || status === "ERROR" || status === "VOIDED") {
      paymentStatus = "failed";
    }

    if (paymentStatus) {
      const update: Record<string, unknown> = { payment_status: paymentStatus, payment_reference: tx.id ?? reference };
      if (orderStatus) update.status = orderStatus;
      await supabase.from("orders").update(update).eq("id", order.id);
    }

    return ok();
  } catch (e) {
    console.error("[wompi-webhook]", e);
    return fail(e instanceof Error ? e.message : "Error", 500);
  }
});
