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
} from "lucide-react";

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
  PENDIENTE: "var(--warning)",
  EN_PREPARACION: "var(--tertiary)",
  LISTO: "var(--success)",
  ENTREGADO: "var(--primary)",
};

export default function EstadoPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params?.slug as string;
  const { activePedidoId, setActivePedido, clearActivePedido } = useAuth();
  const pedidoId = searchParams?.get("pedido") || activePedidoId || null;

  const [pedido, setPedido] = useState<any>(null);
  const [detalles, setDetalles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [numeroPedido, setNumeroPedido] = useState("");

  useEffect(() => {
    if (!pedidoId) {
      setError("No se encontró un pedido para rastrear.");
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
        <div className="order-panel animate-fade-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", gap: 16, textAlign: "center" }}>
          <Search size={48} color="var(--text-muted)" />
          <h2 style={{ fontSize: 18, fontWeight: 500, color: "var(--text)", margin: 0 }}>{error}</h2>
          <button onClick={() => router.push(`/${slug}/menu`)} className="order-back-button" style={{ maxWidth: 240 }}>
            <ArrowLeft size={16} /> Volver al menú
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
    <main className="order-page animate-fade-in">
      <div className="order-panel" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontFamily: "var(--font-noto-serif), 'Noto Serif', serif", fontSize: 22, fontWeight: 400, color: "var(--text)", margin: "0 0 4px" }}>
          Estado del <em style={{ color: "var(--primary)" }}>Pedido</em>
        </h1>
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{numeroPedido} · Seguimiento en tiempo real</p>
      </div>

      {/* Progress Bar */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Progreso general</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--primary)" }}>{progressPercent}%</span>
        </div>
        <div style={{ width: "100%", height: 8, borderRadius: 4, background: "var(--surface-active)", overflow: "hidden" }}>
          <div style={{
            width: `${progressPercent}%`,
            height: "100%",
            borderRadius: 4,
            background: todosListos ? "var(--success)" : "linear-gradient(90deg, var(--primary), var(--primary-light))",
            transition: "width 0.8s var(--ease-out)",
          }} />
        </div>
      </div>

      {/* Platos Status */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {detalles.map((detalle) => {
          const color = estadoColores[detalle.estado] || estadoColores.PENDIENTE;
          const StatusIcon = estadoIconos[detalle.estado] || Clock;
          const productoNombre = detalle.producto?.nombre || "Plato";
          return (
            <div key={detalle.id} style={{
              display: "flex", alignItems: "center", gap: 14, padding: "16px", background: "var(--surface)",
              border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", borderLeft: `3px solid ${color}`,
              transition: "all 0.3s var(--ease-out)",
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10, background: `${color}15`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <StatusIcon size={20} color={color} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", margin: "0 0 2px" }}>{productoNombre}</p>
                {detalle.notas && (
                  <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0, fontStyle: "italic", display: "flex", alignItems: "center", gap: 3 }}>
                    <StickyNote size={9} /> {detalle.notas}
                  </p>
                )}
                {detalle.detalle_pedido_agregado && detalle.detalle_pedido_agregado.length > 0 && (
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                    {detalle.detalle_pedido_agregado.map((dpa: any) => (
                      <span key={dpa.id} style={{
                        fontSize: 9, padding: "2px 6px", background: "var(--primary-ghost)", borderRadius: "var(--radius-full)",
                        color: "var(--primary-light)", display: "flex", alignItems: "center", gap: 2,
                      }}>
                        <Plus size={7} /> {dpa.agregado?.nombre || "extra"}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <span style={{
                fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color,
                padding: "4px 10px", background: `${color}12`, borderRadius: "var(--radius-full)",
                display: "flex", alignItems: "center", gap: 4,
              }}>
                <StatusIcon size={10} />
                {getEstadoTexto(detalle.estado)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Timeline Steps */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "20px" }}>
        <p className="label" style={{ marginBottom: 16 }}>Línea de tiempo</p>
        {["Pedido recibido", "En preparación", "Platos listos", "Servido en mesa"].map((step, i) => {
          const minEstado = detalles.length > 0 ? Math.min(...detalles.map((d) => estadoOrden[d.estado] || 0)) : 0;
          const isActive = i <= minEstado;
          const isCurrent = i === minEstado;
          return (
            <div key={step} style={{ display: "flex", gap: 14, position: "relative" }}>
              {i < 3 && (
                <div style={{
                  position: "absolute", left: 11, top: 24, width: 2, height: 32,
                  background: isActive ? "var(--primary)" : "var(--border)", transition: "background 0.5s",
                }} />
              )}
              <div style={{
                width: 24, height: 24, borderRadius: "50%",
                border: `2px solid ${isActive ? "var(--primary)" : "var(--border)"}`,
                background: isActive ? "var(--primary)" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                transition: "all 0.5s",
              }}>
                {isActive && <Check size={10} color="var(--text-inverse)" />}
              </div>
              <div style={{ paddingBottom: 24 }}>
                <p style={{ fontSize: 13, fontWeight: isCurrent ? 600 : 400, color: isActive ? "var(--text)" : "var(--text-muted)", margin: 0 }}>
                  {step}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          onClick={() => router.push(`/${slug}/menu`)}
          className="order-back-button"
          style={{ width: "100%" }}
        >
          <ArrowLeft size={16} /> Volver al menú y añadir más
        </button>
        <p style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", margin: 0 }}>
          Si agregas más platos, bebidas o guarniciones, se enviarán como un nuevo pedido para esta mesa.
        </p>

        {todosListos && (
          <button
            onClick={() => router.push(`/${slug}/voucher?pedido=${pedidoId}`)}
            className="order-confirm-button animate-fade-in-up"
            style={{ width: "100%" }}
          >
            <Receipt size={16} /> Ver voucher
          </button>
        )}
      </div>
      </div>
    </main>
  );
}
