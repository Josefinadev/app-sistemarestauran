"use client";

import { useState } from "react";
import { formatHora } from "@/lib/utils";
import { useMeseroDashboard } from "@/viewmodels/useMeseroDashboard";
import {
  CheckCircle2,
  UtensilsCrossed,
  Coffee,
  Truck,
  Package,
  PartyPopper,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function MeseroDashboard() {
  const vm = useMeseroDashboard();
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const toggleExpand = (mesaNumero: number) => {
    setExpanded((prev) => ({ ...prev, [mesaNumero]: !prev[mesaNumero] }));
  };

  if (vm.loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
          {[1, 2, 3].map((i) => (<div key={i} className="skeleton" style={{ height: 80, borderRadius: 16 }} />))}
        </div>
        {[1, 2, 3].map((i) => (<div key={i} className="skeleton" style={{ height: 140, borderRadius: 12 }} />))}
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
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
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", margin: 0 }}>Mesas por servir</h3>
          <div style={{ display: "flex", gap: 6 }}>
            {(["todos", "platos", "bebidas"] as const).map((f) => (
              <button key={f} onClick={() => vm.setFiltro(f)} className={`btn btn-sm ${vm.filtro === f ? "btn-primary" : "btn-secondary"}`} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {f === "todos" ? "Todos" : f === "platos" ? <><UtensilsCrossed size={12} /> Platos</> : <><Coffee size={12} /> Bebidas</>}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {vm.mesasFiltradas.map((mesa) => {
            const isExpanded = Boolean(expanded[mesa.numero]);
            const hasReady = mesa.platosListos + mesa.bebidasListas > 0;
            const totalListos = mesa.platosListos + mesa.bebidasListas;

            return (
              <div
                key={mesa.numero}
                className="animate-slide-right"
                style={{
                  background: hasReady ? "rgba(74,222,128,0.06)" : "var(--surface)",
                  border: `1px solid ${hasReady ? "rgba(74,222,128,0.2)" : "var(--border)"}`,
                  borderRadius: "var(--radius-lg)",
                  padding: "18px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: hasReady ? "rgba(74,222,128,0.18)" : "var(--surface-hover)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: hasReady ? "var(--success)" : "var(--text-muted)" }}>
                      {mesa.numero}
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: 0 }}>Mesa {mesa.numero}</p>
                      <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "2px 0 0" }}>
                        {totalListos} listo{totalListos !== 1 ? "s" : ""} · {mesa.pedidos.length} pedido{mesa.pedidos.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span className="badge badge-ready" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <UtensilsCrossed size={10} /> {mesa.platosListos} platos
                    </span>
                    <span className="badge badge-preparing" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Coffee size={10} /> {mesa.bebidasListas} bebidas
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleExpand(mesa.numero)}
                      className="btn btn-secondary btn-sm"
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      {isExpanded ? "Ocultar" : "Desplegar"}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {mesa.pedidos.map((pedido) => {
                      const platos = pedido.items.filter((item) => !item.esBebida);
                      const bebidas = pedido.items.filter((item) => item.esBebida);

                      return (
                        <div key={pedido.id} className="card-flat" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", margin: 0 }}>{pedido.numeroPedido}</p>
                            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "3px 0 0" }}>Recibido a las {formatHora(pedido.hora)}</p>
                          </div>

                          {platos.length > 0 && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", margin: 0 }}>
                                Platos
                              </p>
                              {platos.map((item) => (
                                <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 14px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", background: item.estado === "LISTO" ? "rgba(74,222,128,0.06)" : "var(--surface-hover)" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <UtensilsCrossed size={18} color="var(--primary)" />
                                    <div>
                                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: 0 }}>{item.cantidad} {item.nombre}</p>
                                      <p style={{ fontSize: 10, color: "var(--text-muted)", margin: "2px 0 0" }}>{formatHora(item.hora)}</p>
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
                            </div>
                          )}

                          {bebidas.length > 0 && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", margin: 0 }}>
                                Bebidas
                              </p>
                              {bebidas.map((item) => (
                                <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 14px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", background: item.estado === "LISTO" ? "rgba(151,176,255,0.08)" : "var(--surface-hover)" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <Coffee size={18} color="var(--tertiary)" />
                                    <div>
                                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: 0 }}>{item.cantidad} {item.nombre}</p>
                                      <p style={{ fontSize: 10, color: "var(--text-muted)", margin: "2px 0 0" }}>{formatHora(item.hora)}</p>
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

          {vm.mesasFiltradas.length === 0 && (
            <div className="card-flat" style={{ padding: 40, textAlign: "center" }}>
              <PartyPopper size={32} color="var(--text-muted)" style={{ margin: "0 auto 12px", display: "block" }} />
              <p style={{ color: "var(--text-muted)" }}>Sin mesas pendientes por servir</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
