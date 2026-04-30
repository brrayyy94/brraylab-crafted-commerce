// Tipos compartidos del dominio de productos.
// Los datos reales viven en Supabase; aquí solo conservamos el tipo, los
// helpers de formato y las reseñas estáticas de la home.

export type Category = {
  id?: string;
  slug: string;
  name: string;
  image: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  price: number;
  oldPrice?: number;
  category: string;
  categorySlug: string;
  badge?: string | null;
  image: string;
  images: string[];
  shortDescription: string;
  description: string;
  features: string[];
  stock: number;
  featured?: boolean;
};

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
  `$${Math.round(price).toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;
