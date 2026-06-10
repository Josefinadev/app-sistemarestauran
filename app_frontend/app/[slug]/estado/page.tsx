"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { getEstadoTexto } from "@/lib/utils";
import { getPedido } from "@/lib/api";
import { useDetallesPedidoRealtime, usePedidoRealtime } from "@/lib/realtime";
import { useAuth } from "@/lib/store";
import {
  Clock,
  ChefHat,
  CheckCircle2,
  UtensilsCrossed,
  StickyNote,
  Plus,
  Receipt,
  Search,
  ArrowLeft,
  Check,
  ShoppingCart,
  ChevronRight,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

/* ═══════════════════════════════════════════════════════════
   ESTADO DEL PEDIDO — Seguimiento en TIEMPO REAL
   Lucide icons — responsive — Supabase Realtime
   ═══════════════════════════════════════════════════════════ */

const estadoOrden: Record<string, number> = {
  PENDIENTE: 0,
  EN_PREPARACION: 1,
  LISTO: 2,
  ENTREGADO: 3,
};

const estadoIconos: Record<string, any> = {
  PENDIENTE: Clock,
  EN_PREPARACION: ChefHat,
  LISTO: CheckCircle2,
  ENTREGADO: UtensilsCrossed,
};

const estadoColores: Record<string, string> = {
  PENDIENTE: "var(--text-muted)",
  EN_PREPARACION: "var(--secondary)",
  LISTO: "var(--primary)",
  ENTREGADO: "var(--primary)",
};

export default function EstadoPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params?.slug as string;
  const { activePedidoId, setActivePedido, clearActivePedido, restaurante } = useAuth();
  const pedidoId = searchParams?.get("pedido") || activePedidoId || null;
  const heroImage = restaurante?.hero_banner_url;

  const [pedido, setPedido] = useState<any>(null);
  const [detalles, setDetalles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [numeroPedido, setNumeroPedido] = useState("");

  useEffect(() => {
    if (!pedidoId) {
      setError("No se encontro un pedido para rastrear.");
      setLoading(false);
      return;
    }

    async function load() {
      try {
        setLoading(true);
        const data = await getPedido(pedidoId!);
        setPedido(data);
        setDetalles(data.detalle_pedido || []);
        setNumeroPedido(`PED-${String(data.numero_pedido).padStart(3, "0")}`);
        if (["ENTREGADO", "CANCELADO"].includes(data.estado)) {
          clearActivePedido();
        } else {
          setActivePedido(data.id, data.estado);
        }
      } catch (err: any) {
        setError(err.message || "No se pudo cargar el pedido.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [pedidoId, clearActivePedido, setActivePedido]);

  const handlePedidoUpdate = useCallback((updated: any) => {
    setPedido((prev: any) => (prev ? { ...prev, ...updated } : updated));
    if (!updated?.id || !updated?.estado) return;
    if (["ENTREGADO", "CANCELADO"].includes(updated.estado)) {
      clearActivePedido();
      return;
    }
    setActivePedido(updated.id, updated.estado);
  }, [clearActivePedido, setActivePedido]);
  usePedidoRealtime(pedidoId, handlePedidoUpdate);

  const handleDetalleUpdate = useCallback((updated: any) => {
    setDetalles((prev) =>
      prev.map((d) => (d.id === updated.id ? { ...d, ...updated } : d))
    );
  }, []);
  useDetallesPedidoRealtime(pedidoId, handleDetalleUpdate);

  if (loading) {
    return (
      <main className="order-page">
        <div className="order-panel" style={{ display: "flex", flexDirection: "column", gap: 16, padding: "20px 0" }}>
          <div className="skeleton" style={{ width: "60%", height: 28, margin: "0 auto" }} />
          <div className="skeleton" style={{ width: "100%", height: 60 }} />
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ width: "100%", height: 72 }} />
          ))}
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="order-page">
        <ThemeToggle floating />
        <div className="order-panel animate-fade-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", gap: 16, textAlign: "center" }}>
          <Search size={48} color="var(--text-muted)" />
          <h2 style={{ fontSize: 18, fontWeight: 500, color: "var(--text)", margin: 0 }}>{error}</h2>
          <button onClick={() => router.push(`/${slug}/menu`)} className="order-back-button" style={{ maxWidth: 240 }}>
            <ArrowLeft size={16} /> Volver al menu
          </button>
        </div>
      </main>
    );
  }

  const todosListos = detalles.length > 0 && detalles.every((p) => p.estado === "LISTO" || p.estado === "ENTREGADO");
  const maxProgress = detalles.length * 3;
  const currentProgress = detalles.reduce((sum, p) => sum + (estadoOrden[p.estado] || 0), 0);
  const progressPercent = maxProgress > 0 ? Math.round((currentProgress / maxProgress) * 100) : 0;

  return (
    <div style={{ minHeight: "100vh", background: heroImage ? `linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.4) 100%), url(${heroImage}) center/cover no-repeat` : "var(--bg)" }}>
    <main className="animate-fade-in" style={{ maxWidth: 560, margin: "0 auto", padding: "24px 16px" }}>
      <ThemeToggle floating />

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h1 style={{ fontFamily: "var(--font-noto-serif), 'Noto Serif', serif", fontSize: 24, fontWeight: 700, color: "var(--text)", margin: "0 0 4px" }}>
          Estado del Pedido
        </h1>
        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>{numeroPedido} · Seguimiento en tiempo real</p>
      </div>

      {/* Main card */}
      <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 20, overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>

        {/* Progress */}
        <div style={{ padding: "20px 20px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", border: "3px solid var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)" }}>{progressPercent}%</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: "0 0 6px" }}>Progreso general</p>
              <div style={{ width: "100%", height: 6, borderRadius: 3, background: "var(--surface-active)", overflow: "hidden" }}>
                <div style={{ width: `${progressPercent}%`, height: "100%", borderRadius: 3, background: "var(--primary)", transition: "width 0.8s ease" }} />
              </div>
              <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "4px 0 0" }}>{progressPercent}% completado</p>
            </div>
          </div>
        </div>

        {/* Items */}
        <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          {detalles.map((detalle) => {
            const productoNombre = detalle.producto?.nombre || "Plato";
            const productoImg = detalle.producto?.imagen_url;
            return (
              <div key={detalle.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "var(--surface-hover)", borderRadius: 14 }}>
                {/* Image */}
                <div style={{ width: 48, height: 48, borderRadius: 12, overflow: "hidden", flexShrink: 0, background: "var(--surface-active)", border: "1px solid var(--border)" }}>
                  {productoImg ? (
                    <img src={productoImg} alt={productoNombre} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Receipt size={18} color="var(--text-muted)" />
                    </div>
                  )}
                </div>
                {/* Name */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{productoNombre}</p>
                  {detalle.notas && (
                    <p style={{ fontSize: 10, color: "var(--text-muted)", margin: "2px 0 0", fontStyle: "italic" }}>{detalle.notas}</p>
                  )}
                </div>
                {/* Estado badge */}
                <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text-secondary)", padding: "5px 10px", background: "var(--bg-elevated)", borderRadius: 8, border: "1px solid var(--border)", whiteSpace: "nowrap" }}>
                  {getEstadoTexto(detalle.estado)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Timeline */}
        <div style={{ padding: "16px 20px 20px", borderTop: "1px solid var(--border)" }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: "0 0 14px" }}>Linea de tiempo</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            {[
              { label: "Pedido recibido", Icon: Receipt },
              { label: "En preparacion", Icon: ChefHat },
              { label: "Platos listos", Icon: CheckCircle2 },
              { label: "Servido en mesa", Icon: UtensilsCrossed },
            ].map((step, i) => {
              const minEstado = detalles.length > 0 ? Math.min(...detalles.map((d) => estadoOrden[d.estado] || 0)) : 0;
              const isActive = i <= minEstado;
              const Icon = step.Icon;
              return (
                <div key={step.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1, position: "relative" }}>
                  {i < 3 && (
                    <div style={{ position: "absolute", top: 18, left: "calc(50% + 18px)", right: "calc(-50% + 18px)", height: 2, background: isActive ? "var(--primary)" : "var(--border)", borderStyle: isActive ? "solid" : "dashed", borderWidth: isActive ? 0 : "1px 0 0 0", zIndex: 0 }} />
                  )}
                  <div style={{ width: 36, height: 36, borderRadius: "50%", border: `2px solid ${isActive ? "var(--primary)" : "var(--border)"}`, background: isActive ? "var(--primary-ghost)" : "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
                    <Icon size={16} color={isActive ? "var(--primary)" : "var(--text-muted)"} />
                  </div>
                  <span style={{ fontSize: 9, color: isActive ? "var(--text)" : "var(--text-muted)", textAlign: "center", lineHeight: 1.3, maxWidth: 70 }}>{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ marginTop: 16 }}>
        <button
          onClick={() => router.push(`/${slug}/menu`)}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 16, cursor: "pointer", transition: "all 0.15s" }}
        >
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--primary-ghost)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <ShoppingCart size={18} color="var(--primary)" />
          </div>
          <div style={{ flex: 1, textAlign: "left" }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", margin: 0 }}>Volver al menu y anadir mas</p>
            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "2px 0 0" }}>Si agregas mas platos, se enviaran como un nuevo pedido para esta mesa.</p>
          </div>
          <ChevronRight size={18} color="var(--primary)" />
        </button>

        {todosListos && (
          <button
            onClick={() => router.push(`/${slug}/voucher?pedido=${pedidoId}`)}
            style={{ width: "100%", marginTop: 10, padding: "14px", border: "none", borderRadius: 14, background: "var(--primary)", color: "var(--text-inverse)", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}
          >
            <Receipt size={16} /> Ver voucher
          </button>
        )}
      </div>
    </main>
    </div>
  );
}
