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
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   VIEW — Mesero Dashboard
   Solo renderizado. Lógica en useMeseroDashboard.
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
        {/* Items */}
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

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {vm.itemsFiltrados.map((item) => (
              <div key={item.id} className="animate-slide-right" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: item.estado === "ENTREGADO" ? "var(--surface)" : "var(--surface-hover)", border: `1px solid ${item.estado === "LISTO" ? "rgba(74,222,128,0.2)" : "var(--border)"}`, borderRadius: "var(--radius-md)", opacity: item.estado === "ENTREGADO" ? 0.5 : 1, transition: "all var(--duration-normal) var(--ease-out)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  {item.esBebida ? <Coffee size={22} color="var(--tertiary)" /> : <UtensilsCrossed size={22} color="var(--primary)" />}
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text)", margin: 0 }}>{item.nombre}</p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "2px 0 0" }}>Mesa {item.mesa} · {formatHora(item.hora)}</p>
                  </div>
                </div>
                {item.estado === "LISTO" ? (
                  <button onClick={() => vm.marcarEntregado(item)} className="btn btn-primary btn-sm" disabled={vm.updating === item.id} style={{ opacity: vm.updating === item.id ? 0.6 : 1, display: "flex", alignItems: "center", gap: 4 }}>
                    {vm.updating === item.id ? "..." : <><CheckCircle2 size={14} /> Entregar</>}
                  </button>
                ) : (
                  <span className="badge badge-delivered" style={{ display: "flex", alignItems: "center", gap: 4 }}><CheckCircle2 size={10} /> Entregado</span>
                )}
              </div>
            ))}
            {vm.itemsFiltrados.length === 0 && (
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
