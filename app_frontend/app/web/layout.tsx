import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Menú Digital & Reservas de Restaurante",
  description: "Descubre la mejor gastronomía. Reserva tu mesa, explora combos exclusivos y disfruta de una experiencia culinaria única.",
  keywords: "restaurante, reservas, combos, gastronomía, menú digital, eventos",
};

export default function WebLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
