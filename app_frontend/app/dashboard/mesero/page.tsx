"use client";

import { formatHora } from "@/lib/utils";
import { useMeseroDashboard } from "@/viewmodels/useMeseroDashboard";
import {
  CheckCircle2,
  UtensilsCrossed,
  Coffee,
  Truck,
  Package,
  PartyPopper,
  Utensils,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   VIEW — Mesero Dashboard
   Agrupado por Pedido · Items agregados (2× Inca Kola)
   ═══════════════════════════════════════════════════════════ */

export default function MeseroDashboard() {
  const vm = useMeseroDashboard();

  if (vm.loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
          {[1, 2, 3].map((i) => (<div key={i} className="skeleton" style={{ height: 80, borderRadius: 16 }} />))}
        </div>
        {[1, 2, 3].map((i) => (<div key={i} className="skeleton" style={{ height: 64, borderRadius: 12 }} />))}
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
        {[
          { label: "Por servir", value: vm.listosCount, color: "var(--success)", Icon: Truck },
          { label: "Bebidas pendientes", value: vm.bebidasCount, color: "var(--tertiary)", Icon: Coffee },
          { label: "Mesas activas", value: vm.mesasActivasCount, color: "var(--primary)", Icon: Package },
        ].map((s) => (
          <div key={s.label} className="card-flat" style={{ padding: "16px 20px", borderLeft: `3px solid ${s.color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>{s.label}</p>
                <p style={{ fontSize: 32, fontWeight: 700, color: s.color, margin: "4px 0 0" }}>{s.value}</p>
              </div>
              <s.Icon size={24} color={s.color} style={{ opacity: 0.4 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr minmax(240px, 300px)", gap: 24 }}>
        {/* Pedidos agrupados */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", margin: 0 }}>Por servir</h3>
            <div style={{ display: "flex", gap: 6 }}>
              {(["todos", "platos", "bebidas"] as const).map((f) => (
                <button key={f} onClick={() => vm.setFiltro(f)} className={`btn btn-sm ${vm.filtro === f ? "btn-primary" : "btn-secondary"}`} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {f === "todos" ? "Todos" : f === "platos" ? <><UtensilsCrossed size={12} /> Platos</> : <><Coffee size={12} /> Bebidas</>}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {vm.pedidoGroups.map((group) => {
              const isExpanded = vm.expandedPedidos.has(group.pedidoId);

              return (
                <div
                  key={group.pedidoId}
                  className="card-flat animate-slide-right"
                  style={{
                    overflow: "hidden",
                    border: group.listosCount > 0 ? "1px solid rgba(74,222,128,0.25)" : "1px solid var(--border)",
                  }}
                >
                  {/* Header — clickable */}
                  <div
                    onClick={() => vm.togglePedido(group.pedidoId)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "14px 20px",
                      background: "var(--surface-hover)",
                      borderBottom: isExpanded ? "1px solid var(--border)" : "none",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 8,
                        background: "var(--primary-ghost)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Utensils size={18} color="var(--primary)" />
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", margin: 0 }}>Mesa {group.mesa}</p>
                        <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
                          Pedido #{group.numeroPedido} · {group.listosCount} listo{group.listosCount !== 1 ? "s" : ""} · {formatHora(group.horaPedido)}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {group.listosCount > 0 && (
                        <span style={{
                          background: "var(--success)", color: "#fff",
                          borderRadius: 12, padding: "2px 8px",
                          fontSize: 11, fontWeight: 600,
                        }}>
                          {group.listosCount}
                        </span>
                      )}
                      {isExpanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                    </div>
                  </div>

                  {/* Expandable content */}
                  {isExpanded && (
                    <div>
                      {/* Entregar todo */}
                      {group.listosCount > 0 && (
                        <div style={{ padding: "8px 20px", background: "var(--success)", display: "flex", justifyContent: "center" }}>
                          <button
                            onClick={() => vm.marcarTodosPedido(group.pedidoId, group.items)}
                            disabled={vm.updating === "pedido-all"}
                            style={{
                              background: "none", border: "none", color: "#fff",
                              fontSize: 12, fontWeight: 600, cursor: "pointer",
                              display: "flex", alignItems: "center", gap: 4,
                              opacity: vm.updating === "pedido-all" ? 0.6 : 1,
                            }}
                          >
                            <CheckCircle2 size={14} />
                            {vm.updating === "pedido-all" ? "..." : "Entregar todo"}
                          </button>
                        </div>
                      )}

                      {/* Items agregados — staggered animation */}
                      {group.aggregated.map((agg, idx) => (
                        <div
                          key={agg.key}
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "12px 20px",
                            borderBottom: "1px solid var(--border)",
                            opacity: agg.estado === "ENTREGADO" ? 0.4 : undefined,
                            animation: `slideInLeft 250ms var(--ease-out) both`,
                            animationDelay: `${idx * 70}ms`,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                            {agg.imagen_url ? (
                              <img
                                src={agg.imagen_url}
                                alt={agg.nombre}
                                style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", flexShrink: 0 }}
                              />
                            ) : (
                              <div style={{
                                width: 44, height: 44, borderRadius: 8, flexShrink: 0,
                                background: agg.esBebida ? "rgba(168,85,247,0.1)" : "var(--primary-ghost)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                              }}>
                                {agg.esBebida ? <Coffee size={18} color="var(--tertiary)" /> : <UtensilsCrossed size={18} color="var(--primary)" />}
                              </div>
                            )}
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <p style={{
                                fontSize: 14, fontWeight: 500, color: "var(--text)", margin: 0,
                                textDecoration: agg.estado === "ENTREGADO" ? "line-through" : "none",
                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                              }}>
                                {agg.nombre}{agg.cantidad > 1 ? ` x${agg.cantidad}` : ""}
                              </p>
                              {agg.notas && (
                                <p style={{ fontSize: 11, color: "var(--tertiary)", margin: "2px 0 0" }}>📝 {agg.notas}</p>
                              )}
                              {agg.agregados.length > 0 && (
                                <p style={{ fontSize: 11, color: "var(--primary)", margin: "2px 0 0" }}>＋ {agg.agregados.join(", ")}</p>
                              )}
                              <p style={{ fontSize: 10, color: "var(--text-muted)", margin: "2px 0 0" }}>{formatHora(agg.hora)}</p>
                            </div>
                          </div>
                          {agg.listosIds.length > 0 ? (
                            <button onClick={() => vm.marcarEntregadoIds(agg.listosIds, agg.key)} className="btn btn-primary btn-sm" disabled={vm.updating === agg.key} style={{ opacity: vm.updating === agg.key ? 0.6 : 1, display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                              {vm.updating === agg.key ? "..." : <><CheckCircle2 size={14} /> Entregar</>}
                            </button>
                          ) : (
                            <span className="badge badge-delivered" style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                              <CheckCircle2 size={10} /> Entregado
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {vm.pedidoGroups.length === 0 && (
              <div className="card-flat" style={{ padding: 40, textAlign: "center" }}>
                <PartyPopper size={32} color="var(--text-muted)" style={{ margin: "0 auto 12px", display: "block" }} />
                <p style={{ color: "var(--text-muted)" }}>Sin platos pendientes</p>
              </div>
            )}
          </div>
        </div>

        {/* Mesas */}
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", margin: "0 0 16px" }}>Estado de mesas</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {vm.mesasEstado.map((mesa) => (
              <div key={mesa.numero} className="card-flat" style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: mesa.pedidoActivo ? "var(--primary-ghost)" : "var(--surface-hover)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: mesa.pedidoActivo ? "var(--primary)" : "var(--text-muted)" }}>{mesa.numero}</div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 500, color: "var(--text)", margin: 0 }}>Mesa {mesa.numero}</p>
                    <p style={{ fontSize: 10, color: "var(--text-muted)", margin: 0 }}>{mesa.pedidoActivo ? `${mesa.platosListos}/${mesa.totalPlatos} listos` : "Sin pedido"}</p>
                  </div>
                </div>
                {mesa.pedidoActivo && (
                  <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--surface-active)", overflow: "hidden" }}>
                    <div style={{ width: `${mesa.totalPlatos ? (mesa.platosListos / mesa.totalPlatos) * 100 : 0}%`, height: "100%", background: "var(--success)", borderRadius: 2, transition: "width 0.3s ease" }} />
                  </div>
                )}
              </div>
            ))}
            {vm.mesasEstado.length === 0 && (
              <div className="card-flat" style={{ padding: 30, textAlign: "center" }}><p style={{ color: "var(--text-muted)", fontSize: 12 }}>Sin mesas activas</p></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
