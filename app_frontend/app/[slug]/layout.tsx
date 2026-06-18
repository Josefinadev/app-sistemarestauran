"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getRestaurante, verificarAccesoRestaurante } from "@/lib/api";
import { useAuth } from "@/lib/store";
import { Wine, Loader2, AlertTriangle } from "lucide-react";
import { applyRestauranteBranding } from "@/lib/branding";
import { useRestauranteRealtime } from "@/lib/realtime";

/* ═══════════════════════════════════════════════════════════
   LAYOUT DEL RESTAURANTE (Publico/Cliente)
   Maneja la resolucion del restaurante por slug y el branding.
   Tambien verifica si el restaurante tiene acceso activo (pago al dia).
   ═══════════════════════════════════════════════════════════ */

export default function SlugLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const resSlug = params?.slug as string;
  const { setRestaurante, restaurante } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sinAcceso, setSinAcceso] = useState(false);

  // 1. Resolver Restaurante
  useEffect(() => {
    async function resolve() {
      if (!resSlug) return;
      try {
        const data = await getRestaurante(resSlug);
        if (data) {
          setRestaurante(data);
          
          // Verificar si el restaurante tiene acceso activo
          const acceso = await verificarAccesoRestaurante(data.id);
          if (!acceso.tiene_acceso) {
            setSinAcceso(true);
          }
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

  // 2. Inyectar Branding Dinamico (Heredado por todos los hijos: Menu, Pedido, Estado, etc.)
  useEffect(() => {
    applyRestauranteBranding(restaurante);
  }, [restaurante?.color_primario, restaurante?.color_secundario]);

  // Branding en tiempo real para vistas publicas (si el admin cambia colores, el cliente lo ve al instante)
  useRestauranteRealtime(restaurante?.id || null, (r) => {
    useAuth.getState().setRestaurante({ ...useAuth.getState().restaurante, ...r });
  });

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--bg)" }}>
        <Loader2 size={32} color="var(--primary)" className="spin-icon" />
      </div>
    );
  }

  if (error) {
    const wasDeleted = error.toLowerCase().includes("eliminado");
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 16, background: "var(--bg)", padding: 24, textAlign: "center" }}>
        <Wine size={48} color="var(--text-muted)" />
        <h2 style={{ fontSize: 18, color: "var(--text)", margin: 0 }}>{wasDeleted ? "Restaurante eliminado" : "Restaurante no encontrado"}</h2>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>{error}</p>
      </div>
    );
  }

  // Mostrar mensaje si el restaurante no tiene acceso (no ha pagado)
  if (sinAcceso) {
    return (
      <div style={{ 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        justifyContent: "center", 
        minHeight: "100vh", 
        gap: 20, 
        background: "#0C0B0E", 
        padding: 24, 
        textAlign: "center" 
      }}>
        <div style={{
          width: 80,
          height: 80,
          borderRadius: 20,
          background: "rgba(234,179,8,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <AlertTriangle size={40} color="#eab308" />
        </div>
        <h2 style={{ fontSize: 24, color: "#fff", margin: 0, fontWeight: 700 }}>
          Servicio Temporalmente No Disponible
        </h2>
        <p style={{ 
          fontSize: 15, 
          color: "rgba(255,255,255,0.5)", 
          margin: 0, 
          maxWidth: 400,
          lineHeight: 1.6
        }}>
          Este restaurante esta realizando tareas de mantenimiento. 
          Por favor, intenta nuevamente mas tarde.
        </p>
        {restaurante?.nombre && (
          <div style={{
            marginTop: 20,
            padding: "16px 24px",
            background: "rgba(255,255,255,0.03)",
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.05)"
          }}>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0 }}>
              {restaurante.nombre}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      {children}
    </div>
  );
}
