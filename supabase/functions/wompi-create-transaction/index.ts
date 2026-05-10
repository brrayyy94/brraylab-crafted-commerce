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
    const { orderId, amountInCents, currency = "COP" } = await req.json();
    if (!orderId || typeof amountInCents !== "number" || !Number.isFinite(amountInCents) || amountInCents <= 0) {
      return json({ error: "Parámetros inválidos" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, order_number")
      .eq("id", orderId)
      .maybeSingle();
    if (orderErr || !order) return json({ error: "Pedido no encontrado" }, 404);

    const integritySecret = (Deno.env.get("WOMPI_INTEGRITY_SECRET") ?? "").trim();
    if (!integritySecret) return json({ error: "WOMPI_INTEGRITY_SECRET no configurado" }, 500);

    const reference = String(order.order_number).trim();
    const amount = Math.round(Number(amountInCents)); // entero, en centavos
    const curr = String(currency).trim().toUpperCase(); // "COP"
    // Wompi: SHA256(reference + amountInCents + currency + integritySecret)
    const concatenated = `${reference}${amount}${curr}${integritySecret}`;
    const signature = await sha256Hex(concatenated);

    console.log("[wompi-create-transaction] signing", {
      reference,
      amount,
      currency: curr,
      integritySecretLength: integritySecret.length,
      signaturePreview: `${signature.slice(0, 8)}…${signature.slice(-6)}`,
    });

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
