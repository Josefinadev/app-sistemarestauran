import type { Metadata } from "next";
import { Noto_Serif, Manrope } from "next/font/google";
import "./globals.css";

const notoSerif = Noto_Serif({
  variable: "--font-noto-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "El Mijano — Sistema de Restaurante",
  description:
    "Plataforma SaaS para gestión integral de restaurantes. Pedidos en tiempo real, menú digital, dashboards por rol.",
  keywords: ["restaurante", "SaaS", "pedidos", "menú digital", "El Mijano"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
      className={`${notoSerif.variable} ${manrope.variable} h-full antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}
