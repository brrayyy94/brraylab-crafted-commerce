import { MessageCircle } from "lucide-react";

const WHATSAPP_URL = "https://wa.me/message/XR4F5RKSB53KP1";

export const WhatsAppFab = () => (
  <a
    href={WHATSAPP_URL}
    target="_blank"
    rel="noreferrer"
    aria-label="Escríbenos por WhatsApp"
    className="group fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground h-14 w-14 hover:w-auto hover:px-5 justify-center shadow-purple transition-all duration-500 ease-out overflow-hidden"
  >
    <MessageCircle className="h-6 w-6 shrink-0" />
    <span className="hidden group-hover:inline-block whitespace-nowrap text-sm font-medium">
      ¿Tienes dudas? Escríbenos
    </span>
  </a>
);
