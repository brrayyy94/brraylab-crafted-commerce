import pAirpods from "@/assets/p-airpods-pro.jpg";
import pSmartwatch from "@/assets/p-smartwatch.jpg";
import pHeadphones from "@/assets/p-headphones.jpg";
import pPowerbank from "@/assets/p-powerbank.jpg";
import pKitMovil from "@/assets/p-kit-movil.jpg";
import pKitStudio from "@/assets/p-kit-studio.jpg";
import pCable from "@/assets/p-cable-usbc.jpg";
import pCharger from "@/assets/p-charger.jpg";

import cAudifonos from "@/assets/cat-audifonos.jpg";
import cSmartwatch from "@/assets/cat-smartwatch.jpg";
import cCargadores from "@/assets/cat-cargadores.jpg";
import cCreadores from "@/assets/cat-creadores.jpg";
import cCables from "@/assets/cat-cables.jpg";

export type Category = {
  slug: string;
  name: string;
  image: string;
};

export type Product = {
  slug: string;
  name: string;
  price: number;
  oldPrice?: number;
  category: string;
  categorySlug: string;
  badge?: "Más vendido" | "Nuevo" | "Oferta";
  image: string;
  shortDescription: string;
  description: string;
  features: string[];
  stock: number;
};

export const categories: Category[] = [
  { slug: "audifonos", name: "Audífonos & AirPods", image: cAudifonos },
  { slug: "smartwatches", name: "Smartwatches", image: cSmartwatch },
  { slug: "cargadores", name: "Cargadores & PowerBank", image: cCargadores },
  { slug: "kits-creadores", name: "Kits Creadores", image: cCreadores },
  { slug: "cables", name: "Cables & Conectividad", image: cCables },
];

export const products: Product[] = [
  {
    slug: "airpods-pro-premium-replica",
    name: "AirPods Pro Premium Replica",
    price: 89000,
    category: "Audífonos & AirPods",
    categorySlug: "audifonos",
    badge: "Más vendido",
    image: pAirpods,
    shortDescription: "Sonido limpio, cancelación de ruido activa y encaje cómodo.",
    description:
      "Diseñados para los que escuchan en serio. Drivers afinados, ANC real y latencia mínima. El sonido que esperabas, sin pagar lo que cobran las marcas grandes.",
    features: [
      "Cancelación de ruido activa (ANC)",
      "Bluetooth 5.3 estable",
      "Hasta 30h con estuche",
      "Carga inalámbrica",
      "Resistencia IPX4",
    ],
    stock: 24,
  },
  {
    slug: "smartwatch-series-9-style",
    name: "Smartwatch Series 9 Style",
    price: 145000,
    category: "Smartwatches",
    categorySlug: "smartwatches",
    badge: "Nuevo",
    image: pSmartwatch,
    shortDescription: "Pantalla AMOLED, llamadas Bluetooth y monitoreo 24/7.",
    description:
      "Un reloj que se ve serio sin parecerlo. Pantalla nítida, batería que aguanta, y todas las métricas que importan: ritmo cardíaco, oxígeno, sueño y entrenamientos.",
    features: [
      "Pantalla AMOLED 2.0\"",
      "Llamadas por Bluetooth",
      "Monitor cardíaco y SpO2",
      "Más de 100 modos deportivos",
      "Resistencia IP68",
    ],
    stock: 18,
  },
  {
    slug: "audifonos-diadema-anc-pro",
    name: "Audífonos Diadema ANC Pro",
    price: 120000,
    category: "Audífonos & AirPods",
    categorySlug: "audifonos",
    image: pHeadphones,
    shortDescription: "Over-ear con ANC y graves potentes.",
    description:
      "Para los que necesitan silencio. ANC efectivo, almohadillas cómodas y un perfil de sonido balanceado para música y trabajo.",
    features: ["ANC híbrido", "Hasta 40h de batería", "Conexión multipunto", "Plegables", "Cable AUX incluido"],
    stock: 12,
  },
  {
    slug: "powerbank-20000mah-ultra",
    name: "PowerBank 20.000mAh Ultra",
    price: 75000,
    category: "Cargadores & PowerBank",
    categorySlug: "cargadores",
    image: pPowerbank,
    shortDescription: "Carga rápida 22.5W, display digital y triple salida.",
    description:
      "20.000mAh reales, no inventados. Carga rápida, display de batería y suficiente potencia para sostener tu día completo sin enchufes.",
    features: ["22.5W carga rápida", "Display digital", "USB-C in/out", "2x USB-A", "Apta para llevar en avión"],
    stock: 30,
  },
  {
    slug: "kit-creador-en-movimiento",
    name: "Kit Creador en Movimiento",
    price: 189000,
    category: "Kits Creadores",
    categorySlug: "kits-creadores",
    badge: "Más vendido",
    image: pKitMovil,
    shortDescription: "Trípode, ring light recargable, mic lavalier y soporte.",
    description:
      "El kit que arma tu setup de creador en menos de 5 minutos. Pesa poco, se guarda fácil y graba con calidad real.",
    features: ["Ring light 6\" recargable", "Trípode extensible 1m", "Micrófono lavalier", "Soporte para celular", "Estuche incluido"],
    stock: 9,
  },
  {
    slug: "kit-creador-estudio-fijo",
    name: "Kit Creador Estudio Fijo",
    price: 279000,
    category: "Kits Creadores",
    categorySlug: "kits-creadores",
    image: pKitStudio,
    shortDescription: "Ring light grande, micrófono condensador y boom arm.",
    description:
      "Para el creador que ya pasó la fase amateur. Iluminación constante, audio condensador y un boom arm que aguanta.",
    features: ["Ring light 12\" 3 temperaturas", "Micrófono condensador USB", "Boom arm acero", "Filtro pop", "Adaptador phantom"],
    stock: 6,
  },
  {
    slug: "cable-usb-c-100w-titanio",
    name: "Cable USB-C 100W Titanio",
    price: 25000,
    category: "Cables & Conectividad",
    categorySlug: "cables",
    image: pCable,
    shortDescription: "Trenzado, 100W PD, transferencia 480Mbps, 1.5m.",
    description:
      "Un cable que no se daña a la semana. Trenzado de aramida, conectores reforzados y carga real de 100W. El último cable que vas a comprar este año.",
    features: ["100W Power Delivery", "Trenzado aramida", "1.5 metros", "USB-C a USB-C", "Garantía 1 año"],
    stock: 50,
  },
  {
    slug: "cargador-rapido-65w-gan",
    name: "Cargador Rápido 65W GaN",
    price: 55000,
    category: "Cargadores & PowerBank",
    categorySlug: "cargadores",
    badge: "Nuevo",
    image: pCharger,
    shortDescription: "GaN 65W, dos puertos USB-C + USB-A, ultra compacto.",
    description:
      "El tamaño de un cargador de celular, la potencia de uno de laptop. Tecnología GaN para máxima eficiencia y mínimo calor.",
    features: ["65W Power Delivery", "Tecnología GaN", "2x USB-C + 1 USB-A", "Carga 3 dispositivos", "Compatible con MacBook"],
    stock: 22,
  },
];

export const reviews = [
  {
    name: "Andrés M.",
    city: "Bogotá",
    rating: 5,
    comment: "Pedí los AirPods Pro y llegaron en 2 días a Bogotá. Calidad real, no es paja. Ya pedí los segundos.",
  },
  {
    name: "Valentina R.",
    city: "Medellín",
    rating: 5,
    comment: "El smartwatch es brutal. Batería que aguanta 5 días y se ve elegante. Recomendado 100%.",
  },
  {
    name: "Camilo S.",
    city: "Cali",
    rating: 5,
    comment: "El kit de creador me cambió las grabaciones. Por el precio que tiene es un robo, pero a mi favor.",
  },
];

export const formatPrice = (price: number) =>
  `$${price.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;

export const getProductBySlug = (slug: string) => products.find((p) => p.slug === slug);
export const getProductsByCategory = (categorySlug: string) =>
  products.filter((p) => p.categorySlug === categorySlug);
