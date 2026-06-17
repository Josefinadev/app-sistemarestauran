"use client";

import { useState } from "react";
import { getEstadoTexto, formatHora } from "@/lib/utils";
import { useCocinaDashboard } from "@/viewmodels/useCocinaDashboard";
import { NoUsuariosAsignados } from "@/components/NoUsuariosAsignados";
import {
  Clock, ChefHat, CheckCircle2, StickyNote, Plus,
  PartyPopper, Truck, ChevronDown, ChevronUp, ImageIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   COCINA — Wine Design
   Stats, filtros por chip, grupos de mesa expandibles
   ═══════════════════════════════════════════════════════════ */

const estadoConfig: Record<string, { bg: string; color: string; Icon: LucideIcon; label: string }> = {
  PENDIENTE: { bg: "rgba(251,191,36,0.08)", color: "var(--warning)", Icon: Clock, label: "Por preparar" },
  EN_PREPARACION: { bg: "rgba(74,108,247,0.08)", color: "var(--tertiary)", Icon: ChefHat, label: "En preparación" },
  LISTO: { bg: "rgba(22,163,74,0.08)", color: "var(--success)", Icon: CheckCircle2, label: "Listo" },
  ENTREGADO: { bg: "rgba(197,160,89,0.06)", color: "var(--primary)", Icon: Truck, label: "Entregado" },
};

const statCards = [
  { key: "PENDIENTE" as const, label: "Por preparar", sub: "Pedidos pendientes", iconBg: "rgba(251,191,36,0.1)", iconColor: "var(--warning)" },
  { key: "EN_PREPARACION" as const, label: "En preparación", sub: "En cocina", iconBg: "rgba(74,108,247,0.1)", iconColor: "var(--tertiary)" },
  { key: "LISTO" as const, label: "Listos", sub: "Listos para entregar", iconBg: "rgba(22,163,74,0.1)", iconColor: "var(--success)" },
];

const chipLabels: Record<string, string> = {
  TODOS: "Activos",
  PENDIENTE: "En espera",
  EN_PREPARACION: "En Preparación",
  LISTO: "Listo",
  ENTREGADO: "Entregados",
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

  if (vm.noUsuariosAsignados) return <NoUsuariosAsignados rolLabel="Cocina" rol="cocina" />;

  if (vm.loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ height: 90, borderRadius: 16 }} />)}
        </div>
        {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16 }} />)}
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
        {statCards.map((s) => {
          const Icon = estadoConfig[s.key].Icon;
          return (
            <div key={s.key} className="dash-stat-card">
              <div className="dash-stat-icon" style={{ background: s.iconBg }}>
                <Icon size={22} color={s.iconColor} />
              </div>
              <div className="dash-stat-body">
                <p className="dash-stat-label">{s.label}</p>
                <p className="dash-stat-value" style={{ color: s.iconColor }}>{vm.conteo[s.key]}</p>
                <p className="dash-stat-sub">{s.sub}</p>
              </div>
            </div>
          );
        })}
        <div className="dash-stat-card">
          <div className="dash-stat-icon" style={{ background: "rgba(74,108,247,0.1)" }}>
            <CheckCircle2 size={22} color="var(--tertiary)" />
          </div>
          <div className="dash-stat-body">
            <p className="dash-stat-label">Entregados (24h)</p>
            <p className="dash-stat-value" style={{ color: "var(--tertiary)" }}>{vm.entregadosCount}</p>
            <p className="dash-stat-sub">Pedidos entregados</p>
          </div>
        </div>
      </div>

      {/* Filter chips + sort */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {filtros.map((f) => {
            const count = f === "TODOS"
              ? vm.conteo.PENDIENTE + vm.conteo.EN_PREPARACION + vm.conteo.LISTO
              : f === "ENTREGADO" ? vm.entregadosCount : vm.conteo[f];
            return (
              <button
                key={f}
                onClick={() => vm.setFiltro(f)}
                className={`wine-chip ${vm.filtro === f ? "wine-chip--active" : ""}`}
              >
                {chipLabels[f]} {count > 0 && <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.85 }}>{count}</span>}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-muted)" }}>
          <span>Ordenar por:</span>
          <select className="input" style={{ padding: "4px 10px", fontSize: 12, width: "auto" }}>
            <option>Más recientes</option>
            <option>Más antiguos</option>
          </select>
        </div>
      </div>

      {/* Mesa groups */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {vm.mesasFiltradas.map((mesa) => {
          const isExpanded = expandedMesas.has(mesa.id);
          const hasPending = mesa.pendientesCount > 0;
          const hasPrep = mesa.lineas.some((l) => l.estado === "EN_PREPARACION");
          const isListo = mesa.lineas.every((l) => l.estado === "LISTO" || l.estado === "ENTREGADO");

          let mesaStatus = "NUEVO";
          let statusStyle = { bg: "rgba(197,160,89,0.1)", color: "var(--primary)" };
          if (!hasPending && hasPrep) { mesaStatus = "EN PREPARACIÓN"; statusStyle = { bg: "rgba(74,108,247,0.1)", color: "var(--tertiary)" }; }
          if (isListo) { mesaStatus = "LISTO"; statusStyle = { bg: "rgba(22,163,74,0.1)", color: "var(--success)" }; }

          return (
            <div key={mesa.id} className="card-flat" style={{ overflow: "hidden" }}>
              {/* Mesa header */}
              <div style={{ display: "flex", alignItems: "center", padding: "16px 20px", gap: 12 }}>
                <button
                  onClick={() => toggleMesa(mesa.id)}
                  style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}
                >
                  <ChevronDown size={16} color="var(--text-muted)" style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }} />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Mesa {mesa.mesa}</span>
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: statusStyle.bg, color: statusStyle.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        {mesaStatus}
                      </span>
                    </div>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "2px 0 0" }}>
                      Hace {Math.floor(Math.random() * 10) + 2} min
                      {isListo ? <span style={{ color: "var(--success)", marginLeft: 8 }}>●</span> : <span style={{ color: "var(--warning)", marginLeft: 8 }}>●</span>}
                    </p>
                  </div>
                </button>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  {hasPending && (
                    <button
                      onClick={() => vm.empezarPreparacionMesa(mesa)}
                      disabled={vm.updating === mesa.id}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "8px 16px", border: "1.5px solid var(--primary)",
                        borderRadius: 8, background: "transparent", cursor: "pointer",
                        fontSize: 12, fontWeight: 600, color: "var(--primary)",
                        opacity: vm.updating === mesa.id ? 0.6 : 1,
                      }}
                    >
                      <ChefHat size={14} /> Preparar mesa
                    </button>
                  )}
                  <button
                    onClick={() => vm.marcarTodosListoMesa(mesa)}
                    disabled={vm.updating === mesa.id}
                    className="btn btn-primary btn-sm"
                    style={{ display: "flex", alignItems: "center", gap: 6, opacity: vm.updating === mesa.id ? 0.6 : 1 }}
                  >
                    <CheckCircle2 size={14} /> Todo listo
                  </button>
                </div>
                <ChevronDown size={16} color="var(--text-muted)" style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} onClick={() => toggleMesa(mesa.id)} />
              </div>

              {/* Expanded items */}
              {isExpanded && (
                <div style={{ borderTop: "1px solid var(--border)" }}>
                  {/* Table header */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 1fr 140px 120px", gap: 8, padding: "8px 20px", background: "var(--surface-hover)" }}>
                    {["Producto", "Cantidad", "Notas / Extras", "Estado", "Acciones"].map((h) => (
                      <span key={h} style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</span>
                    ))}
                  </div>
                  {mesa.pedidosRecientes.map((pedido) =>
                    pedido.lineas.map((plato) => {
                      const ec = estadoConfig[plato.estado] || estadoConfig.PENDIENTE;
                      const StatusIcon = ec.Icon;
                      return (
                        <div key={plato.id} style={{ display: "grid", gridTemplateColumns: "1fr 80px 1fr 140px 120px", gap: 8, padding: "12px 20px", alignItems: "center", borderBottom: "1px solid var(--border-subtle)" }}>
                          {/* Product */}
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 8, overflow: "hidden", background: "var(--surface-hover)", border: "1px solid var(--border)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <ImageIcon size={14} color="var(--text-muted)" />
                            </div>
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: 0 }}>{plato.nombre}</p>
                              {plato.agregados?.length > 0 && (
                                <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginTop: 3 }}>
                                  {plato.agregados.map((a: string, i: number) => (
                                    <span key={i} style={{ fontSize: 9, padding: "1px 5px", background: "var(--primary-ghost)", borderRadius: 99, color: "var(--primary)" }}>+{a}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          {/* Quantity */}
                          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{plato.cantidad}</span>
                          {/* Notes */}
                          <div>
                            {plato.notas ? (
                              <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0, fontStyle: "italic" }}>
                                <StickyNote size={10} style={{ verticalAlign: "middle", marginRight: 3 }} />{plato.notas}
                              </p>
                            ) : (
                              <span style={{ fontSize: 12, color: "var(--border)" }}>—</span>
                            )}
                          </div>
                          {/* State badge */}
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 6, background: ec.bg, color: ec.color, fontSize: 11, fontWeight: 600, width: "fit-content" }}>
                            <StatusIcon size={11} /> {ec.label}
                          </span>
                          {/* Action */}
                          <div>
                            {plato.estado !== "LISTO" && plato.estado !== "ENTREGADO" ? (
                              <button
                                onClick={() => vm.marcarPlatoListo(plato)}
                                disabled={vm.updating === plato.id}
                                style={{
                                  display: "flex", alignItems: "center", gap: 5,
                                  padding: "6px 14px",
                                  background: "rgba(22,163,74,0.08)",
                                  border: "1px solid rgba(22,163,74,0.3)",
                                  borderRadius: 8,
                                  color: "var(--success)",
                                  fontSize: 12, fontWeight: 600,
                                  cursor: vm.updating === plato.id ? "wait" : "pointer",
                                  opacity: vm.updating === plato.id ? 0.6 : 1,
                                }}
                              >
                                <CheckCircle2 size={13} /> Listo
                              </button>
                            ) : (
                              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--success)", fontWeight: 600 }}>
                                <CheckCircle2 size={13} /> Listo
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
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
            {vm.filtro === "ENTREGADO" ? "No hay platos entregados en las últimas 24 horas." : "No hay platos con este estado."}
          </p>
        </div>
      )}

      {/* Auto-update indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--success)" }} />
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Actualización automática cada 10 segundos</span>
      </div>
    </div>
  );
}
