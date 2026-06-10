"use client";

import { useState } from "react";
import { getEstadoTexto, formatHora } from "@/lib/utils";
import { useCocinaDashboard } from "@/viewmodels/useCocinaDashboard";
import { NoUsuariosAsignados } from "@/components/NoUsuariosAsignados";
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
  const [expandedMesas, setExpandedMesas] = useState<Set<string>>(new Set());

  const toggleMesa = (id: string) => {
    setExpandedMesas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (vm.noUsuariosAsignados) {
    return <NoUsuariosAsignados rolLabel="Cocina" rol="cocina" />;
  }

  if (vm.loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 80, borderRadius: 16 }} />
          ))}
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton" style={{ height: 70, borderRadius: 16 }} />
        ))}
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
        {(["PENDIENTE", "EN_PREPARACION", "LISTO"] as const).map((est) => {
          const c = estadoConfig[est];
          const Icon = c.Icon;
          return (
            <div key={est} className="card-flat" style={{ padding: "16px 20px" }}>
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
        <div className="card-flat" style={{ padding: "16px 20px" }}>
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

      {/* Filtros */}
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

      {/* Lista vertical de mesas */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {vm.mesasFiltradas.map((mesa) => {
          const isExpanded = expandedMesas.has(mesa.id);
          return (
            <div key={mesa.id} className="card-flat" style={{ overflow: "hidden" }}>
              {/* Row header */}
              <div
                onClick={() => toggleMesa(mesa.id)}
                style={{ display: "flex", alignItems: "center", padding: "14px 20px", cursor: "pointer", gap: 14 }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--primary-ghost)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: "var(--primary)", flexShrink: 0 }}>
                  {mesa.mesa}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", margin: 0 }}>Mesa {mesa.mesa}</p>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "2px 0 0" }}>
                    {mesa.cantidadPlatos} platos · {mesa.cantidadPedidos} pedido{mesa.cantidadPedidos !== 1 ? "s" : ""} · {formatHora(mesa.hora)}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  {mesa.pendientesCount > 0 && (
                    <span className="badge badge-pending" style={{ fontSize: 9 }}>{mesa.pendientesCount} pend.</span>
                  )}
                  <span style={{ padding: "4px 10px", borderRadius: 999, background: "var(--primary-ghost)", color: "var(--primary)", fontSize: 11, fontWeight: 700 }}>
                    <Package size={10} style={{ marginRight: 4, verticalAlign: "middle" }} />
                    {mesa.cantidadPedidos}
                  </span>
                  <div style={{ color: "var(--text-muted)" }}>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>
              </div>

              {/* Acciones rapidas (siempre visibles si hay items) */}
              {(mesa.pendientesCount > 0 || mesa.lineas.some((l) => l.estado === "EN_PREPARACION")) && (
                <div style={{ padding: "0 20px 14px", display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {mesa.pendientesCount > 0 && (
                    <button
                      onClick={() => vm.empezarPreparacionMesa(mesa)}
                      className="btn btn-primary btn-sm"
                      disabled={vm.updating === mesa.id}
                      style={{ display: "flex", alignItems: "center", gap: 6, opacity: vm.updating === mesa.id ? 0.6 : 1 }}
                    >
                      {vm.updating === mesa.id ? "..." : <><Flame size={14} /> Preparar mesa</>}
                    </button>
                  )}
                  {mesa.lineas.some((l) => l.estado === "EN_PREPARACION") && (
                    <button
                      onClick={() => vm.marcarTodosListoMesa(mesa)}
                      className="btn btn-sm btn-secondary"
                      disabled={vm.updating === mesa.id}
                      style={{ display: "flex", alignItems: "center", gap: 6, opacity: vm.updating === mesa.id ? 0.6 : 1 }}
                    >
                      {vm.updating === mesa.id ? "..." : <><CheckCircle2 size={14} /> Todo listo</>}
                    </button>
                  )}
                </div>
              )}

              {/* Contenido expandido */}
              {isExpanded && (
                <div style={{ padding: "0 20px 20px", borderTop: "1px solid var(--border)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                  {mesa.pedidosRecientes.map((pedido) => (
                    <div key={pedido.id} style={{ padding: 12, background: "var(--surface-hover)", borderRadius: 12 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", margin: "0 0 8px" }}>
                        {pedido.numeroPedido} · {pedido.cantidadPlatos} platos · {formatHora(pedido.hora)}
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {pedido.lineas.map((plato) => {
                          const c = estadoConfig[plato.estado] || estadoConfig.PENDIENTE;
                          const StatusIcon = c.Icon;
                          return (
                            <div key={plato.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "var(--bg-elevated)", borderRadius: 10, border: "1px solid var(--border)" }}>
                              <div style={{ flex: 1 }}>
                                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: 0 }}>
                                  {plato.cantidad}x {plato.nombre}
                                </p>
                                {plato.notas && (
                                  <p style={{ fontSize: 10, color: "var(--text-muted)", margin: "2px 0 0", fontStyle: "italic" }}>
                                    <StickyNote size={9} style={{ verticalAlign: "middle", marginRight: 3 }} />{plato.notas}
                                  </p>
                                )}
                                {plato.agregados.length > 0 && (
                                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                                    {plato.agregados.map((a, i) => (
                                      <span key={i} style={{ fontSize: 9, padding: "2px 6px", background: "var(--primary-ghost)", borderRadius: 99, color: "var(--primary)" }}>
                                        <Plus size={7} style={{ verticalAlign: "middle" }} /> {a}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                                <span className={`badge ${plato.estado === "PENDIENTE" ? "badge-pending" : plato.estado === "EN_PREPARACION" ? "badge-preparing" : plato.estado === "LISTO" ? "badge-ready" : "badge-delivered"}`} style={{ fontSize: 9 }}>
                                  <StatusIcon size={9} style={{ marginRight: 3 }} />
                                  {getEstadoTexto(plato.estado)}
                                </span>
                                {plato.estado === "EN_PREPARACION" && (
                                  <button
                                    onClick={() => vm.marcarPlatoListo(plato)}
                                    className="btn btn-primary btn-sm"
                                    disabled={vm.updating === plato.id}
                                    style={{ padding: "4px 10px", fontSize: 9, opacity: vm.updating === plato.id ? 0.6 : 1 }}
                                  >
                                    Listo
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
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
