"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getMesaPorSlug } from "@/lib/api";
import { useAuth } from "@/lib/store";
import { Loader2, Wine } from "lucide-react";

export default function MesaRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const resSlug = params?.slug as string;
  const mesaSlug = params?.mesa_slug as string;
  const { setMesa, setRestaurante } = useAuth();

  useEffect(() => {
    async function resolveMesa() {
      if (!mesaSlug) return;
      try {
        const mesaData = await getMesaPorSlug(mesaSlug);
        console.log("Mesa resuelta:", mesaData);
        
        if (mesaData) {
          setMesa(mesaData);
          if (mesaData.restaurante) {
            setRestaurante(mesaData.restaurante);
          }
          // Redirigir al menú ya con la mesa seteada
          router.replace(`/${resSlug}/menu`);
        }
      } catch (err) {
        console.error("Error resolviendo mesa:", err);
      }
    }
    resolveMesa();
  }, [mesaSlug, resSlug, setMesa, setRestaurante, router]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 20, background: "#0C0B0E" }}>
      <Wine size={48} color="#C5A059" className="animate-pulse" />
      <div style={{ textAlign: "center" }}>
        <h2 style={{ color: "#F0E6D0", fontSize: 20, margin: "0 0 8px" }}>Identificando mesa...</h2>
        <p style={{ color: "#B8A98C", fontSize: 13, margin: 0 }}>Preparando tu experiencia digital</p>
      </div>
      <Loader2 size={24} color="#C5A059" className="spin-icon" style={{ marginTop: 20 }} />
    </div>
  );
}
