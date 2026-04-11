"use client";

import { useState, useEffect, useCallback } from "react";
import { getEstadoTexto, formatHora } from "@/lib/utils";
import { getPedidos, actualizarEstadoDetalle } from "@/lib/api";
import { useDetallesRealtime, usePedidosRealtime } from "@/lib/realtime";
import { useNotificaciones } from "@/lib/store";
import {
  Clock,
  ChefHat,
  CheckCircle2,
  StickyNote,
  Plus,
  ArrowRight,
  Sparkles,
  PartyPopper,
  Filter,
  Flame,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   COCINA DASHBOARD (FUNCIONAL)
   Íconos Lucide — Sin emojis
   Envía notificaciones a mesero cuando plato → LISTO
   ═══════════════════════════════════════════════════════════ */

const ID_RESTAURANTE = "a0000000-0000-0000-0000-000000000001";

const estadoConfig: Record<string, { bg: string; border: string; text: string; dot: string; Icon: any }> = {
  PENDIENTE: { bg: "rgba(251,191,36,0.06)", border: "rgba(251,191,36,0.2)", text: "var(--warning)", dot: "var(--warning)", Icon: Clock },
  EN_PREPARACION: { bg: "rgba(151,176,255,0.06)", border: "rgba(151,176,255,0.2)", text: "var(--tertiary)", dot: "var(--tertiary)", Icon: ChefHat },
  LISTO: { bg: "rgba(74,222,128,0.06)", border: "rgba(74,222,128,0.2)", text: "var(--success)", dot: "var(--success)", Icon: CheckCircle2 },
};

const filtros = ["TODOS", "PENDIENTE", "EN_PREPARACION", "LISTO"] as const;

interface PlatoCocina {
  id: string;
  nombre: string;
  notas: string;
  estado: "PENDIENTE" | "EN_PREPARACION" | "LISTO";
  mesa: number;
  hora: string;
  agregados: string[];
  pedidoId: string;
}

export default function CocinaDashboard() {
  const [platos, setPlatos] = useState<PlatoCocina[]>([]);
  const [filtro, setFiltro] = useState<string>("TODOS");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const { add: addNotif } = useNotificaciones();

  const loadPlatos = useCallback(async () => {
    try {
      const pedidos = await getPedidos({ id_restaurante: ID_RESTAURANTE });
      const items: PlatoCocina[] = [];

      for (const pedido of pedidos || []) {
        if (pedido.estado === "CANCELADO") continue;
        const mesa = pedido.mesa?.numero || 0;
        for (const det of pedido.detalle_pedido || []) {
          if (det.estado === "ENTREGADO") continue;
          items.push({
            id: det.id,
            nombre: det.producto?.nombre || "Plato",
            notas: det.notas || "",
            estado: det.estado,
            mesa,
            hora: det.created_at,
            agregados: (det.detalle_pedido_agregado || []).map((a: any) => a.agregado?.nombre || "Extra"),
            pedidoId: pedido.id,
          });
        }
      }

      items.sort((a, b) => {
        const order = { PENDIENTE: 0, EN_PREPARACION: 1, LISTO: 2 };
        const diff = (order[a.estado] || 0) - (order[b.estado] || 0);
        if (diff !== 0) return diff;
        return new Date(a.hora).getTime() - new Date(b.hora).getTime();
      });

      setPlatos(items);
    } catch (err) {
      console.error("Error loading kitchen data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPlatos(); }, [loadPlatos]);

  const handleRealtimeChange = useCallback(() => { loadPlatos(); }, [loadPlatos]);
  usePedidosRealtime(ID_RESTAURANTE, handleRealtimeChange, handleRealtimeChange);
  useDetallesRealtime(handleRealtimeChange, handleRealtimeChange);

  const avanzarEstado = async (plato: PlatoCocina) => {
    const nextEstado = plato.estado === "PENDIENTE" ? "EN_PREPARACION" : "LISTO";
    setUpdating(plato.id);

    try {
      await actualizarEstadoDetalle(plato.id, nextEstado);

      // Optimistic update
      setPlatos((prev) =>
        prev.map((p) => p.id === plato.id ? { ...p, estado: nextEstado as any } : p)
      );

      // Send notification when marking as LISTO
      if (nextEstado === "LISTO") {
        addNotif({
          tipo: "success",
          titulo: `Plato listo — Mesa ${plato.mesa}`,
          mensaje: `${plato.nombre} está listo para servir.`,
        });
      }
    } catch (err) {
      console.error("Error updating estado:", err);
    } finally {
      setUpdating(null);
    }
  };

  const platosFiltrados = platos.filter(
    (p) => filtro === "TODOS" || p.estado === filtro
  );

  const conteo = {
    PENDIENTE: platos.filter((p) => p.estado === "PENDIENTE").length,
    EN_PREPARACION: platos.filter((p) => p.estado === "EN_PREPARACION").length,
    LISTO: platos.filter((p) => p.estado === "LISTO").length,
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 80, borderRadius: 16 }} />
          ))}
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16 }} />
        ))}
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        {(["PENDIENTE", "EN_PREPARACION", "LISTO"] as const).map((est) => {
          const c = estadoConfig[est];
          const Icon = c.Icon;
          return (
            <div
              key={est}
              className="card-flat"
              style={{ padding: "16px 20px", borderLeft: `3px solid ${c.dot}` }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
                    {getEstadoTexto(est)}
                  </p>
                  <p style={{ fontSize: 32, fontWeight: 700, color: c.text, margin: "4px 0 0" }}>
                    {conteo[est]}
                  </p>
                </div>
                <Icon size={24} color={c.dot} style={{ opacity: 0.4 }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {filtros.map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`btn btn-sm ${filtro === f ? "btn-primary" : "btn-secondary"}`}
          >
            {f === "TODOS" ? "Todos" : getEstadoTexto(f)}
          </button>
        ))}
      </div>

      {/* Platos Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {platosFiltrados.map((plato) => {
          const c = estadoConfig[plato.estado] || estadoConfig.PENDIENTE;
          const StatusIcon = c.Icon;
          return (
            <div
              key={plato.id}
              className="animate-scale-in"
              style={{
                background: c.bg,
                border: `1px solid ${c.border}`,
                borderRadius: "var(--radius-lg)",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", margin: 0 }}>
                    {plato.nombre}
                  </h3>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "4px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
                    Mesa {plato.mesa} · {formatHora(plato.hora)}
                  </p>
                </div>
                <span
                  className={`badge ${plato.estado === "PENDIENTE" ? "badge-pending" : plato.estado === "EN_PREPARACION" ? "badge-preparing" : "badge-ready"}`}
                  style={{ display: "flex", alignItems: "center", gap: 4 }}
                >
                  <StatusIcon size={10} />
                  {getEstadoTexto(plato.estado)}
                </span>
              </div>

              {/* Notas */}
              {plato.notas && (
                <div
                  style={{
                    padding: "8px 12px",
                    background: "rgba(0,0,0,0.2)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: 12,
                    color: "var(--secondary-light)",
                    fontStyle: "italic",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <StickyNote size={12} />
                  {plato.notas}
                </div>
              )}

              {/* Agregados */}
              {plato.agregados.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {plato.agregados.map((a, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: 10,
                        padding: "3px 8px",
                        background: "rgba(197,160,89,0.1)",
                        borderRadius: "var(--radius-full)",
                        color: "var(--primary-light)",
                        display: "flex",
                        alignItems: "center",
                        gap: 3,
                      }}
                    >
                      <Plus size={8} /> {a}
                    </span>
                  ))}
                </div>
              )}

              {/* Action */}
              {plato.estado !== "LISTO" && (
                <button
                  onClick={() => avanzarEstado(plato)}
                  className="btn btn-primary btn-sm"
                  disabled={updating === plato.id}
                  style={{ width: "100%", marginTop: 4, opacity: updating === plato.id ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                >
                  {updating === plato.id ? (
                    "Actualizando..."
                  ) : plato.estado === "PENDIENTE" ? (
                    <><Flame size={14} /> Empezar a preparar</>
                  ) : (
                    <><CheckCircle2 size={14} /> Marcar como listo</>
                  )}
                </button>
              )}
              {plato.estado === "LISTO" && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "8px",
                    fontSize: 11,
                    color: "var(--success)",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <CheckCircle2 size={14} /> Listo para servir
                </div>
              )}
            </div>
          );
        })}
      </div>

      {platosFiltrados.length === 0 && (
        <div className="card-flat" style={{ padding: "60px", textAlign: "center" }}>
          <PartyPopper size={48} color="var(--text-muted)" style={{ marginBottom: 16, display: "block", margin: "0 auto 16px" }} />
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
            No hay platos con este estado. ¡Todo al día!
          </p>
        </div>
      )}
    </div>
  );
}
