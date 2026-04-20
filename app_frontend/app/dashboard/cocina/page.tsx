"use client";

import { useState } from "react";
import { getEstadoTexto, formatHora } from "@/lib/utils";
import { useCocinaDashboard } from "@/viewmodels/useCocinaDashboard";
import {
  Clock, ChefHat, CheckCircle2, StickyNote, Plus,
  PartyPopper, Flame, Truck, ChevronDown, ChevronUp, Package,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const estadoConfig: Record<string, { bg: string; border: string; text: string; dot: string; Icon: LucideIcon }> = {
  PENDIENTE: { bg: "rgba(251,191,36,0.06)", border: "rgba(251,191,36,0.2)", text: "var(--warning)", dot: "var(--warning)", Icon: Clock },
  EN_PREPARACION: { bg: "rgba(151,176,255,0.06)", border: "rgba(151,176,255,0.2)", text: "var(--tertiary)", dot: "var(--tertiary)", Icon: ChefHat },
  LISTO: { bg: "rgba(74,222,128,0.06)", border: "rgba(74,222,128,0.2)", text: "var(--success)", dot: "var(--success)", Icon: CheckCircle2 },
  ENTREGADO: { bg: "rgba(197,160,89,0.04)", border: "rgba(197,160,89,0.15)", text: "var(--primary)", dot: "var(--primary)", Icon: Truck },
};

const filtros = ["TODOS", "PENDIENTE", "EN_PREPARACION", "LISTO", "ENTREGADO"] as const;

export default function CocinaDashboard() {
  const vm = useCocinaDashboard();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (mesaId: string) => {
    setExpanded((prev) => ({ ...prev, [mesaId]: !prev[mesaId] }));
  };

  if (vm.loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 80, borderRadius: 16 }} />
          ))}
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton" style={{ height: 200, borderRadius: 16 }} />
        ))}
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
        {(["PENDIENTE", "EN_PREPARACION", "LISTO"] as const).map((est) => {
          const c = estadoConfig[est];
          const Icon = c.Icon;
          return (
            <div key={est} className="card-flat" style={{ padding: "16px 20px", borderLeft: `3px solid ${c.dot}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
                    {getEstadoTexto(est)}
                  </p>
                  <p style={{ fontSize: 32, fontWeight: 700, color: c.text, margin: "4px 0 0" }}>
                    {vm.conteo[est]}
                  </p>
                </div>
                <Icon size={24} color={c.dot} style={{ opacity: 0.4 }} />
              </div>
            </div>
          );
        })}
        <div className="card-flat" style={{ padding: "16px 20px", borderLeft: "3px solid var(--primary)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
                Entregados (24h)
              </p>
              <p style={{ fontSize: 32, fontWeight: 700, color: "var(--primary)", margin: "4px 0 0" }}>
                {vm.entregadosCount}
              </p>
            </div>
            <Truck size={24} color="var(--primary)" style={{ opacity: 0.4 }} />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {filtros.map((f) => (
          <button
            key={f}
            onClick={() => vm.setFiltro(f)}
            className={`btn btn-sm ${vm.filtro === f ? "btn-primary" : "btn-secondary"}`}
          >
            {f === "TODOS" ? "Activos" : f === "ENTREGADO" ? `Entregados (${vm.entregadosCount})` : getEstadoTexto(f)}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 16 }}>
        {vm.mesasFiltradas.map((mesa) => {
          const isExpanded = Boolean(expanded[mesa.id]);
          return (
            <div
              key={mesa.id}
              className="animate-scale-in"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>Mesa</p>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", margin: "4px 0 2px" }}>
                    Mesa {mesa.mesa}
                  </h3>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
                    {mesa.cantidadPlatos} platos · {mesa.cantidadPedidos} pedido{mesa.cantidadPedidos !== 1 ? "s" : ""} · {formatHora(mesa.hora)}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ padding: "6px 10px", borderRadius: 999, background: "var(--primary-ghost)", color: "var(--primary)", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                    <Package size={12} />
                    {mesa.cantidadPedidos} pedido{mesa.cantidadPedidos !== 1 ? "s" : ""}
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleExpand(mesa.id)}
                    className="btn btn-secondary btn-sm"
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {isExpanded ? "Ocultar" : "Ver detalle"}
                  </button>
                </div>
              </div>

              {mesa.pendientesCount > 0 && (
                <button
                  onClick={() => vm.empezarPreparacionMesa(mesa)}
                  className="btn btn-primary btn-sm"
                  disabled={vm.updating === mesa.id}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: vm.updating === mesa.id ? 0.6 : 1 }}
                >
                  {vm.updating === mesa.id ? "Actualizando..." : <><Flame size={14} /> Empezar a preparar mesa completa</>}
                </button>
              )}

              {isExpanded && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {mesa.pedidosRecientes.map((pedido) => (
                    <div key={pedido.id} style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", margin: 0 }}>{pedido.numeroPedido}</p>
                          <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "3px 0 0" }}>
                            Pedido reciente · {pedido.cantidadPlatos} platos · {formatHora(pedido.hora)}
                          </p>
                        </div>
                      </div>

                      {pedido.lineas.map((plato) => {
                        const c = estadoConfig[plato.estado] || estadoConfig.PENDIENTE;
                        const StatusIcon = c.Icon;
                        return (
                          <div
                            key={plato.id}
                            style={{
                              background: c.bg,
                              border: `1px solid ${c.border}`,
                              borderRadius: "var(--radius-md)",
                              padding: "14px 16px",
                              display: "flex",
                              flexDirection: "column",
                              gap: 10,
                              opacity: plato.estado === "ENTREGADO" ? 0.75 : 1,
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                              <div>
                                <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: 0 }}>
                                  {plato.cantidad} {plato.nombre}
                                </p>
                                <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "3px 0 0" }}>
                                  {plato.estado === "PENDIENTE" ? "Pendiente de cocina" : formatHora(plato.hora)}
                                </p>
                              </div>
                              <span
                                className={`badge ${plato.estado === "PENDIENTE" ? "badge-pending" : plato.estado === "EN_PREPARACION" ? "badge-preparing" : "badge-ready"}`}
                                style={{ display: "flex", alignItems: "center", gap: 4 }}
                              >
                                <StatusIcon size={10} />
                                {plato.estado === "ENTREGADO" ? "Entregado" : getEstadoTexto(plato.estado)}
                              </span>
                            </div>

                            {plato.notas && (
                              <div style={{ padding: "8px 12px", background: "rgba(0,0,0,0.16)", borderRadius: "var(--radius-sm)", fontSize: 12, color: "var(--secondary-light)", fontStyle: "italic", display: "flex", alignItems: "center", gap: 6 }}>
                                <StickyNote size={12} /> {plato.notas}
                              </div>
                            )}

                            {plato.agregados.length > 0 && (
                              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                {plato.agregados.map((a, i) => (
                                  <span key={`${plato.id}-${i}`} style={{ fontSize: 10, padding: "3px 8px", background: "rgba(197,160,89,0.1)", borderRadius: "var(--radius-full)", color: "var(--primary-light)", display: "flex", alignItems: "center", gap: 3 }}>
                                    <Plus size={8} /> {a}
                                  </span>
                                ))}
                              </div>
                            )}

                            {plato.estado === "PENDIENTE" && (
                              <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 10, padding: "10px", fontWeight: 600, fontSize: 12, color: "var(--warning)", letterSpacing: "0.03em" }}>
                                <Clock size={14} /> Esperando inicio general de preparacion
                              </div>
                            )}
                            {plato.estado === "EN_PREPARACION" && (
                              <button
                                onClick={() => vm.marcarPlatoListo(plato)}
                                className="btn btn-primary btn-sm"
                                disabled={vm.updating === plato.id}
                                style={{ width: "100%", opacity: vm.updating === plato.id ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                              >
                                {vm.updating === plato.id ? "Actualizando..." : <><CheckCircle2 size={14} /> Marcar plato como listo</>}
                              </button>
                            )}
                            {plato.estado === "LISTO" && (
                              <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 10, padding: "10px", fontWeight: 600, fontSize: 12, color: "var(--success)", letterSpacing: "0.03em" }}>
                                <CheckCircle2 size={14} /> Listo - Mesero notificado
                              </div>
                            )}
                            {plato.estado === "ENTREGADO" && (
                              <div style={{ textAlign: "center", padding: "8px", fontSize: 11, color: "var(--primary)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                                <Truck size={14} /> Entregado al mesero
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {vm.mesasFiltradas.length === 0 && (
        <div className="card-flat" style={{ padding: "60px", textAlign: "center" }}>
          <PartyPopper size={48} color="var(--text-muted)" style={{ marginBottom: 16, display: "block", margin: "0 auto 16px" }} />
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
            {vm.filtro === "ENTREGADO" ? "No hay platos entregados en las ultimas 24 horas." : "No hay platos con este estado."}
          </p>
        </div>
      )}
    </div>
  );
}
