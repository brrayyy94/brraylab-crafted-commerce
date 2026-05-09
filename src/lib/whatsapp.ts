// Helpers para abrir WhatsApp con el resumen del pedido.

export const sanitizePhoneForWhatsapp = (raw: string): string => {
  const digits = raw.replace(/\D+/g, "");
  if (!digits) return "";
  // Asume Colombia si vienen 10 dígitos sin código país.
  return digits.length === 10 ? `57${digits}` : digits;
};

export type WhatsappOrderPayload = {
  orderNumber: string;
  customerName: string;
  city: string;
  address: string;
  total: number;
  paidOnline: number;
  dueOnDelivery: number;
  paymentLabel: string;
};

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

export const buildOrderWhatsappMessage = (p: WhatsappOrderPayload): string => {
  const lines = [
    `*Nuevo pedido* ${p.orderNumber}`,
    `Cliente: ${p.customerName}`,
    `Ciudad: ${p.city}`,
    `Dirección: ${p.address}`,
    `Método: ${p.paymentLabel}`,
    `Total: ${fmt(p.total)}`,
    `Pagado en línea: ${fmt(p.paidOnline)}`,
    `A pagar al recibir: ${fmt(p.dueOnDelivery)}`,
  ];
  return lines.join("\n");
};

export const buildWhatsappLink = (phone: string, message: string): string => {
  const p = sanitizePhoneForWhatsapp(phone);
  return `https://wa.me/${p}?text=${encodeURIComponent(message)}`;
};
