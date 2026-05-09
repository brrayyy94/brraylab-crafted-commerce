// Wompi Web Checkout helper — redirige al checkout web de Wompi.
// Documentación: https://docs.wompi.co/docs/colombia/widget-checkout-web/

export type WompiCheckoutParams = {
  publicKey: string;
  amountInCents: number; // entero
  reference: string;     // order_number
  signature: string;     // signature:integrity
  redirectUrl: string;
  currency?: string;     // default COP
  customerEmail?: string;
};

export const buildWompiCheckoutUrl = (p: WompiCheckoutParams): string => {
  const params = new URLSearchParams({
    "public-key": p.publicKey,
    currency: p.currency ?? "COP",
    "amount-in-cents": String(p.amountInCents),
    reference: p.reference,
    "signature:integrity": p.signature,
    "redirect-url": p.redirectUrl,
  });
  if (p.customerEmail) params.set("customer-data:email", p.customerEmail);
  return `https://checkout.wompi.co/p/?${params.toString()}`;
};
