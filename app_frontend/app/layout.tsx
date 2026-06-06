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
  title: "Restaurant Platform — Gestión Integral",
  description:
    "Plataforma SaaS para gestión integral de restaurantes. Pedidos en tiempo real, menú digital, dashboards por rol.",
  keywords: ["restaurante", "SaaS", "pedidos", "menú digital", "gastronomía"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${notoSerif.variable} ${manrope.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning>
        {/*
          Bootstrap de tema antes de hidratar React.
          Evita el flash a colores default en recargas.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
  try {
    const raw = sessionStorage.getItem('el-mijano-auth');
    if (!raw) return;
    const parsed = JSON.parse(raw);
    const r = parsed && parsed.state && parsed.state.restaurante;
    if (!r) return;

    const root = document.documentElement;
    const primary = typeof r.color_primario === 'string' ? r.color_primario : null;
    const secondary = typeof r.color_secundario === 'string' ? r.color_secundario : null;

    if (primary && primary.startsWith('#')) {
      root.style.setProperty('--primary', primary);
      root.style.setProperty('--primary-light', primary + 'dd');
      root.style.setProperty('--primary-dark', primary + 'aa');
      root.style.setProperty('--primary-ghost', primary + '15');
      root.style.setProperty('--primary-glow', primary + '25');
    }
    if (secondary && secondary.startsWith('#')) {
      root.style.setProperty('--secondary', secondary);
    }
  } catch {
    /* noop */
  }
})();`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
