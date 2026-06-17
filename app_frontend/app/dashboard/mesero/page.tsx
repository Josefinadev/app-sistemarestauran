"use client";

import { useState } from "react";
import { formatHora } from "@/lib/utils";
import { useMeseroDashboard } from "@/viewmodels/useMeseroDashboard";
import { NoUsuariosAsignados } from "@/components/NoUsuariosAsignados";
import {
  CheckCircle2,
  UtensilsCrossed,
  Coffee,
  Truck,
  Package,
  PartyPopper,
  LayoutGrid,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   MESERO — Wine Design (2-column layout)
   Left: mesa groups with items | Right: queue summary + activity
   ═══════════════════════════════════════════════════════════ */

export default function MeseroDashboard() {
  const vm = useMeseroDashboard();
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const toggleExpand = (mesaNumero: number) => {
    setExpanded((prev) => ({ ...prev, [mesaNumero]: !prev[mesaNumero] }));
  };

  if (vm.noUsuariosAsignados) return <NoUsuariosAsignados rolLabel="Mesero" rol="mesero" />;

  if (vm.loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
          {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 90, borderRadius: 16 }} />)}
        </div>
        {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 140, borderRadius: 12 }} />)}
      </div>
    );
  }

  // Compute queue summary
  const platosListos = vm.mesasFiltradas.reduce((s, m) => s + (m.platosListos || 0), 0);
  const bebidasListas = vm.mesasFiltradas.reduce((s, m) => s + (m.bebidasListas || 0), 0);
  const enPrep = vm.mesasFiltradas.reduce((s, m) =>
    s + m.pedidos.flatMap(p => p.items).filter(i => i.estado === "LISTO").length, 0
  );
  const total = platosListos + bebidasListas + enPrep;

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
        {[
          { label: "Por servir", value: vm.listosCount, sub: "items listos", iconBg: "rgba(197,160,89,0.1)", iconColor: "var(--primary)", Icon: Truck, trend: "+20% vs ayer" },
          { label: "Bebidas pendientes", value: vm.bebidasCount, sub: "bebidas", iconBg: "rgba(74,108,247,0.1)", iconColor: "var(--tertiary)", Icon: Coffee, trend: "+12% vs ayer" },
          { label: "Mesas activas", value: vm.mesasActivasCount, sub: "mesas", iconBg: "rgba(22,163,74,0.1)", iconColor: "var(--success)", Icon: Package, trend: "+1 mesa vs ayer" },
        ].map((s) => (
          <div key={s.label} className="dash-stat-card">
            <div className="dash-stat-icon" style={{ background: s.iconBg }}>
              <s.Icon size={22} color={s.iconColor} />
            </div>
            <div className="dash-stat-body">
              <p className="dash-stat-label">{s.label}</p>
              <p className="dash-stat-value" style={{ color: "var(--text)" }}>{s.value} <span style={{ fontSize: 14, fontWeight: 400, color: "var(--text-muted)" }}>{s.sub}</span></p>
              <p className="dash-stat-trend"><CheckCircle2 size={10} /> {s.trend}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main 2-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, alignItems: "flex-start" }}>
        {/* Left: mesa list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Filter chips */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {(["todos", "platos", "bebidas"] as const).map((f) => (
              <button key={f} onClick={() => vm.setFiltro(f)} className={`wine-chip ${vm.filtro === f ? "wine-chip--active" : ""}`} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                {f === "todos" ? <><LayoutGrid size={12} /> Todos</> : f === "platos" ? <><UtensilsCrossed size={12} /> Platos</> : <><Coffee size={12} /> Bebidas</>}
              </button>
            ))}
          </div>

          {/* Mesa groups */}
          {vm.mesasFiltradas.map((mesa) => {
            const isExpanded = Boolean(expanded[mesa.numero]);
            const hasReady = (mesa.platosListos + mesa.bebidasListas) > 0;
            const totalReady = mesa.platosListos + mesa.bebidasListas;

            return (
              <div key={mesa.numero} className="card-flat" style={{ overflow: "hidden" }}>
                {/* Mesa header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", margin: 0 }}>Mesa {mesa.numero}</h3>
                    {totalReady > 0 && (
                      <span style={{ fontSize: 11, padding: "2px 8px", background: "rgba(197,160,89,0.1)", borderRadius: 99, color: "var(--primary)", fontWeight: 600 }}>
                        {totalReady} items por servir
                      </span>
                    )}
                    {hasReady ? (
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--success)" }} />
                    ) : (
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--text-muted)" }} />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleExpand(mesa.numero)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}
                  >
                    {isExpanded ? "▲" : "▼"}
                  </button>
                </div>

                {/* Items (always show if has ready items) */}
                {(isExpanded || hasReady) && (
                  <div style={{ borderTop: "1px solid var(--border)", padding: "12px 20px" }}>
                    {mesa.pedidos.map((pedido) => {
                      const platos = pedido.items.filter((item) => !item.esBebida);
                      const bebidas = pedido.items.filter((item) => item.esBebida);

                      return (
                        <div key={pedido.id} style={{ marginBottom: 14 }}>
                          {/* Two-column grid: platos | bebidas */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            {/* Platos */}
                            {platos.length > 0 && (
                              <div>
                                <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 8px" }}>Platos</p>
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                  {platos.map((item) => (
                                    <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                      <div style={{ width: 44, height: 44, borderRadius: 8, overflow: "hidden", flexShrink: 0, background: "var(--surface-hover)", border: "1px solid var(--border)" }}>
                                        {item.imagenUrl ? (
                                          <img src={item.imagenUrl} alt={item.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        ) : (
                                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><UtensilsCrossed size={16} color="var(--text-muted)" /></div>
                                        )}
                                      </div>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.nombre}</p>
                                        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                                          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>x{item.cantidad}</span>
                                          <span style={{ color: "var(--text-muted)", fontSize: 10 }}>·</span>
                                          <span style={{ fontSize: 10, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 3 }}>
                                            ⏱ {formatHora(item.hora)}
                                          </span>
                                        </div>
                                      </div>
                                      {item.estado === "LISTO" ? (
                                        <button
                                          onClick={() => vm.marcarEntregado(item)}
                                          className="deliver-btn"
                                          disabled={vm.updating === item.id}
                                          style={{ opacity: vm.updating === item.id ? 0.6 : 1 }}
                                        >
                                          {vm.updating === item.id ? "..." : "Entregar"}
                                        </button>
                                      ) : item.estado === "ENTREGADO" ? (
                                        <span className="delivered-badge">
                                          <CheckCircle2 size={11} /> Entregado
                                        </span>
                                      ) : (
                                        <span style={{ fontSize: 11, color: "var(--text-muted)", padding: "4px 8px", background: "var(--surface-hover)", borderRadius: 6 }}>
                                          En prep.
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Bebidas */}
                            {bebidas.length > 0 && (
                              <div>
                                <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 8px" }}>Bebidas</p>
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                  {bebidas.map((item) => (
                                    <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                      <div style={{ width: 44, height: 44, borderRadius: 8, overflow: "hidden", flexShrink: 0, background: "rgba(74,108,247,0.06)", border: "1px solid rgba(74,108,247,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        {item.imagenUrl ? (
                                          <img src={item.imagenUrl} alt={item.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        ) : (
                                          <Coffee size={18} color="var(--tertiary)" />
                                        )}
                                      </div>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.nombre}</p>
                                        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                                          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>x{item.cantidad}</span>
                                          <span style={{ color: "var(--text-muted)", fontSize: 10 }}>·</span>
                                          <span style={{ fontSize: 10, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 3 }}>
                                            ⏱ {formatHora(item.hora)}
                                          </span>
                                        </div>
                                      </div>
                                      {item.estado === "LISTO" ? (
                                        <button
                                          onClick={() => vm.marcarEntregado(item)}
                                          className="deliver-btn"
                                          disabled={vm.updating === item.id}
                                          style={{ opacity: vm.updating === item.id ? 0.6 : 1 }}
                                        >
                                          {vm.updating === item.id ? "..." : "Entregar"}
                                        </button>
                                      ) : item.estado === "ENTREGADO" ? (
                                        <span className="delivered-badge">
                                          <CheckCircle2 size={11} /> Entregado
                                        </span>
                                      ) : (
                                        <span style={{ fontSize: 11, color: "var(--text-muted)", padding: "4px 8px", background: "var(--surface-hover)", borderRadius: 6 }}>
                                          En prep.
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {vm.mesasFiltradas.length === 0 && (
            <div className="card-flat" style={{ padding: 40, textAlign: "center" }}>
              <PartyPopper size={32} color="var(--text-muted)" style={{ margin: "0 auto 12px", display: "block" }} />
              <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Sin mesas pendientes por servir</p>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Queue summary */}
          <div className="dash-panel-card">
            <p className="dash-panel-title">Resumen de cola</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "Platos listos", value: platosListos, icon: <UtensilsCrossed size={14} color="var(--primary)" />, color: "var(--primary)" },
                { label: "Bebidas listas", value: bebidasListas, icon: <Coffee size={14} color="var(--tertiary)" />, color: "var(--tertiary)" },
                { label: "En preparación", value: enPrep, icon: <span style={{ fontSize: 14 }}>⏳</span>, color: "var(--warning)" },
              ].map((s) => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {s.icon}
                    <span style={{ fontSize: 13, color: "var(--text)" }}>{s.label}</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.value}</span>
                </div>
              ))}
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Total</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: "var(--primary)" }}>{total}</span>
              </div>
            </div>
          </div>

          {/* Actividad en tiempo real */}
          <div className="dash-panel-card">
            <p className="dash-panel-title">Actividad en tiempo real</p>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {vm.mesasFiltradas.slice(0, 5).flatMap((mesa) =>
                mesa.pedidos.slice(0, 1).flatMap((pedido) =>
                  pedido.items.slice(0, 1).map((item, i) => {
                    const isPlato = !item.esBebida;
                    return (
                      <div key={`${mesa.numero}-${i}`} className="dash-activity-item">
                        <div className="dash-activity-dot" style={{ background: isPlato ? "rgba(22,163,74,0.1)" : "rgba(74,108,247,0.1)" }}>
                          {isPlato ? <UtensilsCrossed size={12} color="var(--success)" /> : <Coffee size={12} color="var(--tertiary)" />}
                        </div>
                        <div className="dash-activity-body">
                          <p className="dash-activity-title">Mesa {mesa.numero}</p>
                          <p className="dash-activity-desc">{item.nombre} listo para servir</p>
                        </div>
                        <span className="dash-activity-time">Hace {(i + 1) * 2} min</span>
                      </div>
                    );
                  })
                )
              )}
              {vm.mesasFiltradas.length === 0 && (
                <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: "16px 0", margin: 0 }}>Sin actividad reciente</p>
              )}
            </div>
            <button className="btn btn-ghost" style={{ width: "100%", marginTop: 8, fontSize: 12, color: "var(--text-muted)", border: "1px solid var(--border)" }}>
              ≡ Ver toda la actividad
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
