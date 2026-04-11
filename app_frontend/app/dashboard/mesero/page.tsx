"use client";

import { useState, useEffect, useCallback } from "react";
import { getEstadoTexto, formatHora } from "@/lib/utils";
import { getPedidos, actualizarEstadoDetalle } from "@/lib/api";
import { useDetallesRealtime, usePedidosRealtime } from "@/lib/realtime";
import { useNotificaciones } from "@/lib/store";
import {
  CheckCircle2,
  UtensilsCrossed,
  Coffee,
  Clock,
  Package,
  Truck,
  Filter,
  PartyPopper,
  CircleDot,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   MESERO DASHBOARD (FUNCIONAL)
   Lucide icons — notificaciones — responsive
   ═══════════════════════════════════════════════════════════ */

const ID_RESTAURANTE = "a0000000-0000-0000-0000-000000000001";

interface ItemServir {
  id: string;
  nombre: string;
  mesa: number;
  hora: string;
  estado: "LISTO" | "ENTREGADO";
  esBebida: boolean;
  pedidoId: string;
}

interface MesaEstado {
  numero: number;
  pedidoActivo: boolean;
  platosListos: number;
  totalPlatos: number;
}

export default function MeseroDashboard() {
  const [items, setItems] = useState<ItemServir[]>([]);
  const [mesasEstado, setMesasEstado] = useState<MesaEstado[]>([]);
  const [filtro, setFiltro] = useState<"todos" | "platos" | "bebidas">("todos");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const { add: addNotif } = useNotificaciones();

  const loadData = useCallback(async () => {
    try {
      const pedidos = await getPedidos({ id_restaurante: ID_RESTAURANTE });
      const allItems: ItemServir[] = [];
      const mesaMap: Record<number, MesaEstado> = {};

      for (const pedido of pedidos || []) {
        if (pedido.estado === "CANCELADO") continue;
        const mesaNum = pedido.mesa?.numero || 0;

        if (!mesaMap[mesaNum]) {
          mesaMap[mesaNum] = { numero: mesaNum, pedidoActivo: true, platosListos: 0, totalPlatos: 0 };
        }

        for (const det of pedido.detalle_pedido || []) {
          if (det.estado === "LISTO" || det.estado === "ENTREGADO") {
            allItems.push({
              id: det.id,
              nombre: det.producto?.nombre || "Plato",
              mesa: mesaNum,
              hora: det.updated_at || det.created_at,
              estado: det.estado,
              esBebida: det.producto?.es_bebida || false,
              pedidoId: pedido.id,
            });
          }

          mesaMap[mesaNum].totalPlatos++;
          if (det.estado === "LISTO" || det.estado === "ENTREGADO") {
            mesaMap[mesaNum].platosListos++;
          }
        }
      }

      allItems.sort((a, b) => {
        if (a.estado === "LISTO" && b.estado !== "LISTO") return -1;
        if (a.estado !== "LISTO" && b.estado === "LISTO") return 1;
        return new Date(b.hora).getTime() - new Date(a.hora).getTime();
      });

      setItems(allItems);
      setMesasEstado(Object.values(mesaMap).sort((a, b) => a.numero - b.numero));
    } catch (err) {
      console.error("Error loading waiter data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRealtimeChange = useCallback(() => { loadData(); }, [loadData]);
  usePedidosRealtime(ID_RESTAURANTE, handleRealtimeChange, handleRealtimeChange);
  useDetallesRealtime(handleRealtimeChange, handleRealtimeChange);

  const marcarEntregado = async (item: ItemServir) => {
    setUpdating(item.id);
    try {
      await actualizarEstadoDetalle(item.id, "ENTREGADO");
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, estado: "ENTREGADO" as const } : i))
      );
      addNotif({
        tipo: "info",
        titulo: `Entregado — Mesa ${item.mesa}`,
        mensaje: `${item.nombre} fue servido correctamente.`,
      });
    } catch (err) {
      console.error("Error marking as delivered:", err);
    } finally {
      setUpdating(null);
    }
  };

  const itemsFiltrados = items.filter((i) => {
    if (filtro === "platos") return !i.esBebida;
    if (filtro === "bebidas") return i.esBebida;
    return true;
  });

  const listosCount = items.filter((i) => i.estado === "LISTO").length;
  const bebidasCount = items.filter((i) => i.esBebida && i.estado === "LISTO").length;

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 80, borderRadius: 16 }} />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton" style={{ height: 64, borderRadius: 12 }} />
        ))}
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
        <div className="card-flat" style={{ padding: "16px 20px", borderLeft: "3px solid var(--success)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
                Por servir
              </p>
              <p style={{ fontSize: 32, fontWeight: 700, color: "var(--success)", margin: "4px 0 0" }}>
                {listosCount}
              </p>
            </div>
            <Truck size={24} color="var(--success)" style={{ opacity: 0.4 }} />
          </div>
        </div>
        <div className="card-flat" style={{ padding: "16px 20px", borderLeft: "3px solid var(--tertiary)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
                Bebidas pendientes
              </p>
              <p style={{ fontSize: 32, fontWeight: 700, color: "var(--tertiary)", margin: "4px 0 0" }}>
                {bebidasCount}
              </p>
            </div>
            <Coffee size={24} color="var(--tertiary)" style={{ opacity: 0.4 }} />
          </div>
        </div>
        <div className="card-flat" style={{ padding: "16px 20px", borderLeft: "3px solid var(--primary)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
                Mesas activas
              </p>
              <p style={{ fontSize: 32, fontWeight: 700, color: "var(--primary)", margin: "4px 0 0" }}>
                {mesasEstado.filter((m) => m.pedidoActivo).length}
              </p>
            </div>
            <Package size={24} color="var(--primary)" style={{ opacity: 0.4 }} />
          </div>
        </div>
      </div>

      {/* Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr minmax(240px, 300px)", gap: 24 }}>
        {/* Left — Items */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", margin: 0 }}>
              Por servir
            </h3>
            <div style={{ display: "flex", gap: 6 }}>
              {(["todos", "platos", "bebidas"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFiltro(f)}
                  className={`btn btn-sm ${filtro === f ? "btn-primary" : "btn-secondary"}`}
                  style={{ display: "flex", alignItems: "center", gap: 4 }}
                >
                  {f === "todos" ? "Todos" : f === "platos" ? <><UtensilsCrossed size={12} /> Platos</> : <><Coffee size={12} /> Bebidas</>}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {itemsFiltrados.map((item) => (
              <div
                key={item.id}
                className="animate-slide-right"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  background: item.estado === "ENTREGADO" ? "var(--surface)" : "var(--surface-hover)",
                  border: `1px solid ${item.estado === "LISTO" ? "rgba(74,222,128,0.2)" : "var(--border)"}`,
                  borderRadius: "var(--radius-md)",
                  opacity: item.estado === "ENTREGADO" ? 0.5 : 1,
                  transition: "all var(--duration-normal) var(--ease-out)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  {item.esBebida ? (
                    <Coffee size={22} color="var(--tertiary)" />
                  ) : (
                    <UtensilsCrossed size={22} color="var(--primary)" />
                  )}
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text)", margin: 0 }}>
                      {item.nombre}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "2px 0 0" }}>
                      Mesa {item.mesa} · {formatHora(item.hora)}
                    </p>
                  </div>
                </div>

                {item.estado === "LISTO" ? (
                  <button
                    onClick={() => marcarEntregado(item)}
                    className="btn btn-primary btn-sm"
                    disabled={updating === item.id}
                    style={{ opacity: updating === item.id ? 0.6 : 1, display: "flex", alignItems: "center", gap: 4 }}
                  >
                    {updating === item.id ? "..." : <><CheckCircle2 size={14} /> Entregar</>}
                  </button>
                ) : (
                  <span className="badge badge-delivered" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <CheckCircle2 size={10} /> Entregado
                  </span>
                )}
              </div>
            ))}

            {itemsFiltrados.length === 0 && (
              <div className="card-flat" style={{ padding: 40, textAlign: "center" }}>
                <PartyPopper size={32} color="var(--text-muted)" style={{ margin: "0 auto 12px", display: "block" }} />
                <p style={{ color: "var(--text-muted)" }}>Sin platos pendientes</p>
              </div>
            )}
          </div>
        </div>

        {/* Right — Mesas */}
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", margin: "0 0 16px" }}>
            Estado de mesas
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {mesasEstado.map((mesa) => (
              <div
                key={mesa.numero}
                className="card-flat"
                style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: mesa.pedidoActivo ? "var(--primary-ghost)" : "var(--surface-hover)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      fontWeight: 700,
                      color: mesa.pedidoActivo ? "var(--primary)" : "var(--text-muted)",
                    }}
                  >
                    {mesa.numero}
                  </div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 500, color: "var(--text)", margin: 0 }}>
                      Mesa {mesa.numero}
                    </p>
                    <p style={{ fontSize: 10, color: "var(--text-muted)", margin: 0 }}>
                      {mesa.pedidoActivo ? `${mesa.platosListos}/${mesa.totalPlatos} listos` : "Sin pedido"}
                    </p>
                  </div>
                </div>
                {mesa.pedidoActivo && (
                  <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--surface-active)", overflow: "hidden" }}>
                    <div style={{
                      width: `${mesa.totalPlatos ? (mesa.platosListos / mesa.totalPlatos) * 100 : 0}%`,
                      height: "100%",
                      background: "var(--success)",
                      borderRadius: 2,
                      transition: "width 0.3s ease",
                    }} />
                  </div>
                )}
              </div>
            ))}

            {mesasEstado.length === 0 && (
              <div className="card-flat" style={{ padding: 30, textAlign: "center" }}>
                <p style={{ color: "var(--text-muted)", fontSize: 12 }}>Sin mesas activas</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
