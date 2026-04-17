"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getMesaPorSlug } from "@/lib/api";
import { useAuth } from "@/lib/store";
import { Wine, Loader2 } from "lucide-react";

export default function SlugLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const slug = params?.slug as string;
  const { setRestaurante, setMesa } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function resolve() {
      try {
        const data = await getMesaPorSlug(slug);
        if (data?.restaurante) {
          setRestaurante(data.restaurante);
        }
        setMesa(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message || "Mesa no encontrada");
      } finally {
        setLoading(false);
      }
    }
    if (slug) resolve();
  }, [slug, setRestaurante, setMesa]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--bg)" }}>
        <Loader2 size={32} color="var(--primary)" className="spin-icon" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 16, background: "var(--bg)", padding: 24, textAlign: "center" }}>
        <Wine size={48} color="var(--text-muted)" />
        <h2 style={{ fontSize: 18, color: "var(--text)", margin: 0 }}>Mesa no encontrada</h2>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>{error}</p>
      </div>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", maxWidth: 780, margin: "0 auto", padding: "0 20px 100px" }}>
      <header style={{ padding: "20px 0 12px", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 14, background: "linear-gradient(135deg, var(--primary), var(--primary-dark))", display: "grid", placeItems: "center" }}>
                <Wine size={18} color="var(--text-inverse)" />
              </div>
              <div>
                <p className="label">Menú del cliente</p>
                <h1 style={{ fontSize: 24, margin: 0, color: "var(--text)", fontFamily: "var(--font-noto-serif), 'Noto Serif', serif", fontWeight: 400 }}>
                  {slug.replace(/-/g, " ")}
                </h1>
              </div>
            </div>
            <p className="section-note">Usa tu celular para navegar, seleccionar y pagar desde la mesa. Escanear QR debe ser simple y rápido.</p>
          </div>
        </div>
      </header>
      {children}
    </main>
  );
}
