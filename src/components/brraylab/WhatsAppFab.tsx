import { MessageCircle } from "lucide-react";

export const WhatsAppFab = () => (
  <a
    href="https://wa.me/573000000000?text=Hola%20BrrayLab,%20me%20interesa%20saber%20m%C3%A1s%20de%20sus%20productos"
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
