"use client";

import { useState } from "react";
import { formatHora } from "@/lib/utils";
import { useMeseroDashboard } from "@/viewmodels/useMeseroDashboard";
import { NoUsuariosAsignados } from "@/components/NoUsuariosAsignados";
import {
  CheckCircle2, UtensilsCrossed, Coffee, Truck, Package, PartyPopper, LayoutGrid,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   MESERO — Wine Design — Fixed overflow + auto-hide completed
   ═══════════════════════════════════════════════════════════ */

export default function MeseroDashboard() {
  const vm = useMeseroDashboard();
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const toggleExpand = (n: number) => setExpanded((p) => ({ ...p, [n]: !p[n] }));

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

  /* ── Filter out mesas where ALL items are already ENTREGADO ── */
  const mesasActivas = vm.mesasFiltradas.filter((mesa) =>
    mesa.pedidos.some((pedido) =>
      pedido.items.some((item) => item.estado === "LISTO")
    )
  );

  /* ── Queue summary ── */
  const platosListos = mesasActivas.reduce((s, m) => s + (m.platosListos || 0), 0);
  const bebidasListas = mesasActivas.reduce((s, m) => s + (m.bebidasListas || 0), 0);
  const enPrep = mesasActivas.reduce((s, m) =>
    s + m.pedidos.flatMap((p) => p.items).filter((i) => i.estado === "LISTO").length, 0
  );
  const total = platosListos + bebidasListas + enPrep;

  const itemRow = (item: any, isPlato: boolean) => (
    <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--border-subtle)" }}>
      {/* Thumbnail */}
      <div style={{ width: 40, height: 40, borderRadius: 8, overflow: "hidden", flexShrink: 0, background: isPlato ? "var(--surface-hover)" : "rgba(74,108,247,0.06)", border: `1px solid ${isPlato ? "var(--border)" : "rgba(74,108,247,0.15)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {item.imagenUrl
          ? <img src={item.imagenUrl} alt={item.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : isPlato
            ? <UtensilsCrossed size={15} color="var(--text-muted)" />
            : <Coffee size={15} color="var(--tertiary)" />
        }
      </div>
      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.nombre}</p>
        <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "2px 0 0" }}>x{item.cantidad} · ⏱ {formatHora(item.hora)}</p>
      </div>
      {/* Action */}
      <div style={{ flexShrink: 0 }}>
        {item.estado === "LISTO" ? (
          <button onClick={() => vm.marcarEntregado(item)} className="deliver-btn" disabled={vm.updating === item.id} style={{ opacity: vm.updating === item.id ? 0.6 : 1 }}>
            {vm.updating === item.id ? "..." : "Entregar"}
          </button>
        ) : item.estado === "ENTREGADO" ? (
          <span className="delivered-badge"><CheckCircle2 size={11} /> Entregado</span>
        ) : (
          <span style={{ fontSize: 11, color: "var(--text-muted)", padding: "4px 8px", background: "var(--surface-hover)", borderRadius: 6, whiteSpace: "nowrap" }}>En prep.</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {[
          { label: "Por servir", value: vm.listosCount, iconBg: "rgba(197,160,89,0.1)", iconColor: "var(--primary)", Icon: Truck },
          { label: "Bebidas pendientes", value: vm.bebidasCount, iconBg: "rgba(74,108,247,0.1)", iconColor: "var(--tertiary)", Icon: Coffee },
          { label: "Mesas activas", value: vm.mesasActivasCount, iconBg: "rgba(22,163,74,0.1)", iconColor: "var(--success)", Icon: Package },
        ].map((s) => (
          <div key={s.label} className="dash-stat-card">
            <div className="dash-stat-icon" style={{ background: s.iconBg }}><s.Icon size={17} color={s.iconColor} /></div>
            <div className="dash-stat-body">
              <p className="dash-stat-label">{s.label}</p>
              <p className="dash-stat-value">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main layout: responsive — stacks on mobile */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 260px", gap: 16, alignItems: "flex-start" }}>
        {/* Left: mesas */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
          {/* Filter chips */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {(["todos", "platos", "bebidas"] as const).map((f) => (
              <button key={f} onClick={() => vm.setFiltro(f)} className={`wine-chip ${vm.filtro === f ? "wine-chip--active" : ""}`} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                {f === "todos" ? <><LayoutGrid size={12} /> Todos</> : f === "platos" ? <><UtensilsCrossed size={12} /> Platos</> : <><Coffee size={12} /> Bebidas</>}
              </button>
            ))}
          </div>

          {mesasActivas.length === 0 && (
            <div className="card-flat" style={{ padding: "40px 20px", textAlign: "center" }}>
              <PartyPopper size={32} color="var(--text-muted)" style={{ margin: "0 auto 12px", display: "block" }} />
              <p style={{ color: "var(--text-muted)", fontSize: 14, margin: 0 }}>Todo entregado. Sin pendientes.</p>
            </div>
          )}

          {mesasActivas.map((mesa) => {
            const isExp = Boolean(expanded[mesa.numero]);
            const totalReady = mesa.platosListos + mesa.bebidasListas;
            return (
              <div key={mesa.numero} className="card-flat" style={{ overflow: "hidden" }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", gap: 8, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: 0, whiteSpace: "nowrap" }}>Mesa {mesa.numero}</h3>
                    {totalReady > 0 && (
                      <span style={{ fontSize: 10, padding: "2px 7px", background: "rgba(197,160,89,0.1)", borderRadius: 99, color: "var(--primary)", fontWeight: 600, whiteSpace: "nowrap" }}>
                        {totalReady} por servir
                      </span>
                    )}
                    <div style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: totalReady > 0 ? "var(--success)" : "var(--text-muted)" }} />
                  </div>
                  <button type="button" onClick={() => toggleExpand(mesa.numero)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px 8px", fontSize: 13, flexShrink: 0 }}>
                    {isExp ? "▲" : "▼"}
                  </button>
                </div>

                {/* Items */}
                {(isExp || totalReady > 0) && (
                  <div style={{ borderTop: "1px solid var(--border)", padding: "0 16px 12px" }}>
                    {mesa.pedidos.map((pedido) => {
                      const platos = pedido.items.filter((i) => !i.esBebida && i.estado !== "ENTREGADO");
                      const bebidas = pedido.items.filter((i) => i.esBebida && i.estado !== "ENTREGADO");
                      if (platos.length === 0 && bebidas.length === 0) return null;
                      return (
                        <div key={pedido.id}>
                          {platos.length > 0 && (
                            <div>
                              <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.1em", margin: "12px 0 4px" }}>Platos</p>
                              {platos.map((item) => itemRow(item, true))}
                            </div>
                          )}
                          {bebidas.length > 0 && (
                            <div>
                              <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.1em", margin: "12px 0 4px" }}>Bebidas</p>
                              {bebidas.map((item) => itemRow(item, false))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          <div className="dash-panel-card">
            <p className="dash-panel-title">Resumen de cola</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Platos listos", value: platosListos, icon: <UtensilsCrossed size={13} color="var(--primary)" />, color: "var(--primary)" },
                { label: "Bebidas listas", value: bebidasListas, icon: <Coffee size={13} color="var(--tertiary)" />, color: "var(--tertiary)" },
                { label: "En preparacion", value: enPrep, icon: <span style={{ fontSize: 12 }}>⏳</span>, color: "var(--warning)" },
              ].map((s) => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    {s.icon}
                    <span style={{ fontSize: 12, color: "var(--text)" }}>{s.label}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.value}</span>
                </div>
              ))}
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>Total</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: "var(--primary)" }}>{total}</span>
              </div>
            </div>
          </div>

          <div className="dash-panel-card">
            <p className="dash-panel-title">Actividad reciente</p>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {mesasActivas.slice(0, 4).flatMap((mesa) =>
                mesa.pedidos.slice(0, 1).flatMap((pedido) =>
                  pedido.items.filter((i) => i.estado === "LISTO").slice(0, 1).map((item, i) => (
                    <div key={`${mesa.numero}-${i}`} className="dash-activity-item">
                      <div className="dash-activity-dot" style={{ background: !item.esBebida ? "rgba(22,163,74,0.1)" : "rgba(74,108,247,0.1)" }}>
                        {!item.esBebida ? <UtensilsCrossed size={11} color="var(--success)" /> : <Coffee size={11} color="var(--tertiary)" />}
                      </div>
                      <div className="dash-activity-body" style={{ minWidth: 0 }}>
                        <p className="dash-activity-title">Mesa {mesa.numero}</p>
                        <p className="dash-activity-desc" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.nombre} listo</p>
                      </div>
                    </div>
                  ))
                )
              )}
              {mesasActivas.length === 0 && (
                <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: "12px 0", margin: 0 }}>Sin actividad</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Responsive fix: stack on mobile */}
      <style>{`
        @media (max-width: 900px) {
          .mesero-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
