import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "El Mijano — Restaurante & Experiencia Gastronómica",
  description: "Descubre la mejor gastronomía en El Mijano. Reserva tu mesa, explora combos exclusivos y disfruta de una experiencia culinaria única. Comida, piscina, diversión.",
  keywords: "restaurante, reservas, combos, gastronomía, El Mijano, piscina, eventos",
};

export default function WebLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
