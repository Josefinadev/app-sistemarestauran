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
        if (data?.restaurante) setRestaurante(data.restaurante);
        setMesa(data);
      } catch (err: any) {
        setError(err.message || "Mesa no encontrada");
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
    <main style={{
      minHeight: "100vh",
      background: "var(--bg)",
      maxWidth: 780,
      margin: "0 auto",
      padding: "0 20px 80px",
    }}>
      {/* Header */}
      <header style={{
        padding: "20px 0 16px",
        borderBottom: "1px solid var(--border)",
        marginBottom: 24,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
      }}>
        <Wine size={18} color="var(--primary)" />
        <span style={{
          fontFamily: "var(--font-noto-serif), 'Noto Serif', serif",
          fontStyle: "italic",
          fontSize: 18,
          color: "var(--primary)",
          letterSpacing: "0.06em",
        }}>
          El Mijano
        </span>
      </header>
      {children}
    </main>
  );
}
