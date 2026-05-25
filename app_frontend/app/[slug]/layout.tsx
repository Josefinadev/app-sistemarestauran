"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getRestaurante } from "@/lib/api";
import { useAuth } from "@/lib/store";
import { Wine, Loader2 } from "lucide-react";
import { applyRestauranteBranding } from "@/lib/branding";
import { useRestauranteRealtime } from "@/lib/realtime";

/* ═══════════════════════════════════════════════════════════
   LAYOUT DEL RESTAURANTE (Público/Cliente)
   Maneja la resolución del restaurante por slug y el branding.
   ═══════════════════════════════════════════════════════════ */

export default function SlugLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const resSlug = params?.slug as string;
  const { setRestaurante, restaurante } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 1. Resolver Restaurante
  useEffect(() => {
    async function resolve() {
      if (!resSlug) return;
      try {
        const data = await getRestaurante(resSlug);
        if (data) {
          setRestaurante(data);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message || "Restaurante no encontrado");
      } finally {
        setLoading(false);
      }
    }
    resolve();
  }, [resSlug, setRestaurante]);

  // 2. Inyectar Branding Dinámico (Heredado por todos los hijos: Menu, Pedido, Estado, etc.)
  useEffect(() => {
    applyRestauranteBranding(restaurante);
  }, [restaurante?.color_primario, restaurante?.color_secundario]);

  // Branding en tiempo real para vistas públicas (si el admin cambia colores, el cliente lo ve al instante)
  useRestauranteRealtime(restaurante?.id || null, (r) => {
    useAuth.getState().setRestaurante({ ...useAuth.getState().restaurante, ...r });
  });

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#0C0B0E" }}>
        <Loader2 size={32} color="#C5A059" className="spin-icon" />
      </div>
    );
  }

  if (error) {
    const wasDeleted = error.toLowerCase().includes("eliminado");
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 16, background: "#0C0B0E", padding: 24, textAlign: "center" }}>
        <Wine size={48} color="#5A4E38" />
        <h2 style={{ fontSize: 18, color: "#F0E6D0", margin: 0 }}>{wasDeleted ? "Restaurante eliminado" : "Restaurante no encontrado"}</h2>
        <p style={{ fontSize: 13, color: "#B8A98C", margin: 0 }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      {children}
    </div>
  );
}
