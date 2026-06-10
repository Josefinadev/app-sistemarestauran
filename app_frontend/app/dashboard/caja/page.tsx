"use client";

import { useState } from "react";
import { formatPrecio, formatHora } from "@/lib/utils";
import { useCajaDashboard } from "@/viewmodels/useCajaDashboard";
import { NoUsuariosAsignados } from "@/components/NoUsuariosAsignados";
import {
  CreditCard, CheckCircle2, Clock, Receipt, DollarSign,
  X, Smartphone, Banknote, Wallet, Image as ImageIcon,
  ShoppingBag, BarChart3, Monitor, ChefHat,
  Truck, Printer, ChevronDown, ChevronUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const metodoIcons: Record<string, LucideIcon> = {
  YAPE: Smartphone, EFECTIVO: Banknote, PLIN: Smartphone, BCP: CreditCard,
};

const metodoImages: Record<string, string> = {
  YAPE: "/assets/metodos_pago/yape.png",
  PLIN: "/assets/metodos_pago/PLIN.png",
  BCP: "/assets/metodos_pago/BCP.webp",
};

const METODOS_PAGO = ["YAPE", "PLIN", "EFECTIVO", "BCP"];

const tabs = [
  { key: "pedidos", label: "Pedidos", Icon: Receipt },
  { key: "cuadre", label: "Cuadre de caja", Icon: BarChart3 },
  { key: "monitor", label: "Monitor", Icon: Monitor },
] as const;

export default function CajaDashboard() {
  const vm = useCajaDashboard();
  const [expandedMesas, setExpandedMesas] = useState<Set<string | number>>(new Set());

  const toggleMesa = (mesa: string | number) => {
    setExpandedMesas((prev) => {
      const next = new Set(prev);
      if (next.has(mesa)) next.delete(mesa);
      else next.add(mesa);
      return next;
    });
  };

  if (vm.noUsuariosAsignados) {
    return <NoUsuariosAsignados rolLabel="Cajero" rol="caja" />;
  }

  if (vm.loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
          {[1, 2, 3, 4].map((i) => (<div key={i} className="skeleton" style={{ height: 80, borderRadius: 16 }} />))}
        </div>
        <div className="skeleton" style={{ height: 300, borderRadius: 16 }} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
        {[
          { label: "Por cobrar", value: String(vm.pendientes.length), color: "var(--secondary)", Icon: Clock },
          { label: "Pagados", value: String(vm.pagados.length), color: "var(--primary)", Icon: CheckCircle2 },
          { label: "Ingresos hoy", value: formatPrecio(vm.totalDia), color: "var(--primary)", Icon: DollarSign },
          { label: "Total pedidos", value: String(vm.pedidos.length), color: "var(--text-secondary)", Icon: ShoppingBag },
        ].map((s) => (
          <div key={s.label} className="card-flat" style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>{s.label}</p>
                <p style={{ fontSize: 28, fontWeight: 700, color: s.color, margin: "4px 0 0" }}>{s.value}</p>
              </div>
              <s.Icon size={24} color={s.color} style={{ opacity: 0.4 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border)", overflowX: "auto" }}>
        {tabs.map((tab) => {
          const Icon = tab.Icon;
          return (
            <button key={tab.key} onClick={() => vm.setActiveTab(tab.key)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", fontSize: 12, fontWeight: vm.activeTab === tab.key ? 600 : 400, color: vm.activeTab === tab.key ? "var(--primary)" : "var(--text-muted)", background: "transparent", border: "none", borderBottom: vm.activeTab === tab.key ? "2px solid var(--primary)" : "2px solid transparent", cursor: "pointer", marginBottom: -1, whiteSpace: "nowrap" }}>
              <Icon size={14} />{tab.label}
            </button>
          );
        })}
      </div>

      {/* ═══ TAB: PEDIDOS (Lista vertical por mesa) ═══ */}
      {vm.activeTab === "pedidos" && (
        <div className="animate-fade-in">
          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            {(["TODOS", "PENDIENTE", "PAGADO"] as const).map((f) => (
              <button key={f} onClick={() => vm.setFiltro(f)} className={`btn btn-sm ${vm.filtro === f ? "btn-primary" : "btn-secondary"}`}>
                {f === "TODOS" ? "Todas" : f === "PENDIENTE" ? "Pendientes" : "Pagadas"}
              </button>
            ))}
          </div>

          {/* Lista vertical de mesas */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {vm.mesasFiltradas.map((mesa) => {
              const isExpanded = expandedMesas.has(mesa.mesa);
              const isPending = mesa.estadoPago === "PENDIENTE" || mesa.estadoPago === "MIXTO";
              return (
                <div key={mesa.mesa} className="card-flat" style={{ overflow: "hidden" }}>
                  {/* Row header - siempre visible */}
                  <div
                    onClick={() => toggleMesa(mesa.mesa)}
                    style={{ display: "flex", alignItems: "center", padding: "14px 20px", cursor: "pointer", gap: 14 }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--primary-ghost)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: "var(--primary)", flexShrink: 0 }}>
                      {mesa.mesa}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", margin: 0 }}>Mesa {mesa.mesa}</p>
                      <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "2px 0 0" }}>
                        {mesa.pedidos.length} pedido{mesa.pedidos.length !== 1 ? "s" : ""} · {mesa.itemsCount} items · {formatHora(mesa.pedidos[0]?.hora || "")}
                      </p>
                    </div>
                    <div style={{ textAlign: "right", marginRight: 12 }}>
                      <p style={{ fontSize: 16, fontWeight: 700, color: "var(--primary)", margin: 0 }}>{formatPrecio(mesa.total)}</p>
                    </div>
                    <span className={`badge ${isPending ? "badge-pending" : "badge-ready"}`} style={{ fontSize: 9, flexShrink: 0 }}>
                      {mesa.estadoPago === "PAGADO" ? "PAGADO" : "PENDIENTE"}
                    </span>
                    <div style={{ flexShrink: 0, color: "var(--text-muted)" }}>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>

                  {/* Contenido expandido */}
                  {isExpanded && (
                    <div style={{ padding: "0 20px 20px", borderTop: "1px solid var(--border)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                      {mesa.pedidos.map((p) => (
                        <div key={p.id} style={{ padding: 14, background: "var(--surface-hover)", borderRadius: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{p.numeroPedido}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--primary)" }}>{formatPrecio(p.total)}</span>
                              <span className={`badge ${p.estadoPago === "PENDIENTE" ? "badge-pending" : "badge-ready"}`} style={{ fontSize: 8 }}>{p.estadoPago}</span>
                            </div>
                          </div>
                          {/* Items con imagen */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {p.items.map((item, i) => (
                              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ width: 32, height: 32, borderRadius: 8, overflow: "hidden", flexShrink: 0, background: "var(--surface-active)", border: "1px solid var(--border)" }}>
                                  {item.imagenUrl ? <img src={item.imagenUrl} alt={item.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Receipt size={14} color="var(--text-muted)" style={{ margin: "9px auto", display: "block" }} />}
                                </div>
                                <span style={{ flex: 1, fontSize: 12, color: "var(--text-secondary)" }}>{item.cantidad}x {item.nombre}</span>
                                <span style={{ fontSize: 12, color: "var(--text)", fontWeight: 500 }}>{formatPrecio(item.precio)}</span>
                              </div>
                            ))}
                          </div>
                          {/* Pago individual */}
                          {p.estadoPago === "PENDIENTE" && (
                            <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
                              {METODOS_PAGO.map((m) => {
                                const Icon = metodoIcons[m] || CreditCard;
                                const img = metodoImages[m];
                                return (
                                  <button key={m} onClick={() => vm.confirmarPago(p.id, m)} className="btn btn-secondary btn-sm" disabled={vm.procesando} style={{ opacity: vm.procesando ? 0.6 : 1, display: "flex", alignItems: "center", gap: 4, fontSize: 10 }}>
                                    {img ? <img src={img} alt={m} style={{ width: 14, height: 14, objectFit: "contain", borderRadius: 3 }} /> : <Icon size={12} />} {m}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Pagar toda la mesa */}
                      {isPending && (
                        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", margin: "0 0 8px" }}>Pagar toda la mesa ({formatPrecio(mesa.pedidos.filter(p => p.estadoPago === "PENDIENTE").reduce((s, p) => s + p.total, 0))})</p>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {METODOS_PAGO.map((m) => {
                              const Icon = metodoIcons[m] || CreditCard;
                              const img = metodoImages[m];
                              return (
                                <button key={m} onClick={() => vm.pagarTodaLaMesa(mesa, m)} className="btn btn-primary btn-sm" disabled={vm.procesando} style={{ opacity: vm.procesando ? 0.6 : 1, display: "flex", alignItems: "center", gap: 6 }}>
                                  {img ? <img src={img} alt={m} style={{ width: 16, height: 16, objectFit: "contain", borderRadius: 3 }} /> : <Icon size={14} />} {m}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {vm.mesasFiltradas.length === 0 && (
              <div className="card-flat" style={{ padding: 40, textAlign: "center" }}>
                <Receipt size={32} color="var(--text-muted)" style={{ margin: "0 auto 12px", display: "block", opacity: 0.4 }} />
                <p style={{ color: "var(--text-muted)", fontSize: 12 }}>No hay mesas con este filtro</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ TAB: CUADRE DE CAJA ═══ */}
      {vm.activeTab === "cuadre" && (
        <div className="animate-fade-in" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          <div className="card-flat" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", margin: "0 0 20px", display: "flex", alignItems: "center", gap: 8 }}>
              <BarChart3 size={18} color="var(--primary)" /> Resumen del dia
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Total ventas cobradas</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: "var(--primary)" }}>{formatPrecio(vm.cuadre.totalVentas)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Pedidos cobrados</span>
                <span style={{ fontSize: 16, fontWeight: 600, color: "var(--text)" }}>{vm.cuadre.cantidadPedidos}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Ticket promedio</span>
                <span style={{ fontSize: 16, fontWeight: 600, color: "var(--primary)" }}>{formatPrecio(vm.cuadre.ticketPromedio)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Pendientes de cobro</span>
                <span style={{ fontSize: 16, fontWeight: 600, color: "var(--warning)" }}>{vm.cuadre.cantidadPendientes} ({formatPrecio(vm.cuadre.pendientesCobro)})</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 0", borderTop: "2px solid var(--border)" }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>TOTAL CAJA</span>
                <span style={{ fontSize: 24, fontWeight: 700, color: "var(--primary)" }}>{formatPrecio(vm.cuadre.totalVentas)}</span>
              </div>
            </div>
            <button onClick={() => window.print()} className="btn btn-secondary" style={{ width: "100%", marginTop: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Printer size={14} /> Imprimir cuadre
            </button>
          </div>

          <div className="card-flat" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", margin: "0 0 20px", display: "flex", alignItems: "center", gap: 8 }}>
              <Wallet size={18} color="var(--primary)" /> Desglose por metodo
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {Object.entries(vm.cuadre.porMetodo).map(([metodo, data]) => {
                const Icon = metodoIcons[metodo] || CreditCard;
                const img = metodoImages[metodo];
                const pct = vm.cuadre.totalVentas > 0 ? (data.total / vm.cuadre.totalVentas) * 100 : 0;
                return (
                  <div key={metodo}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {img ? <img src={img} alt={metodo} style={{ width: 18, height: 18, objectFit: "contain", borderRadius: 4 }} /> : <Icon size={16} color="var(--text-secondary)" />}
                        <span style={{ fontSize: 13, color: "var(--text)" }}>{metodo}</span>
                        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>({data.cantidad})</span>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--primary)" }}>{formatPrecio(data.total)}</span>
                    </div>
                    <div style={{ width: "100%", height: 6, borderRadius: 3, background: "var(--surface-active)", overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: "var(--primary)", transition: "width 0.5s ease" }} />
                    </div>
                  </div>
                );
              })}
              {Object.keys(vm.cuadre.porMetodo).length === 0 && (
                <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 12, padding: 30 }}>Sin pagos registrados hoy</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB: MONITOR ═══ */}
      {vm.activeTab === "monitor" && (
        <div className="animate-fade-in">
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 16px" }}>Estado en tiempo real por mesa</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {vm.monitorData.map((mesa: any) => {
              const progress = mesa.platosTotal > 0 ? (mesa.platosEntregados / mesa.platosTotal) * 100 : 0;
              return (
                <div key={mesa.mesa} className="card-flat" style={{ padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--primary-ghost)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "var(--primary)" }}>{mesa.mesa}</div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: 0 }}>Mesa {mesa.mesa}</p>
                        <p style={{ fontSize: 10, color: "var(--text-muted)", margin: 0 }}>{mesa.platosTotal} platos</p>
                      </div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)" }}>{Math.round(progress)}%</span>
                  </div>
                  <div style={{ width: "100%", height: 6, borderRadius: 3, background: "var(--surface-active)", overflow: "hidden" }}>
                    <div style={{ width: `${progress}%`, height: "100%", borderRadius: 3, background: "var(--primary)", transition: "width 0.5s ease" }} />
                  </div>
                </div>
              );
            })}
            {vm.monitorData.length === 0 && (
              <div className="card-flat" style={{ padding: 40, textAlign: "center", gridColumn: "1/-1" }}>
                <Monitor size={32} color="var(--text-muted)" style={{ margin: "0 auto 12px", display: "block", opacity: 0.4 }} />
                <p style={{ color: "var(--text-muted)", fontSize: 12 }}>Sin mesas activas</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Comprobante Modal */}
      {vm.showComprobante && (
        <>
          <div className="overlay" onClick={() => vm.setShowComprobante(null)} />
          <div className="modal animate-fade-in" style={{ background: "var(--bg-elevated)", borderRadius: 20, padding: 24, width: "90%", maxWidth: 480, border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", margin: 0 }}><ImageIcon size={16} /> Comprobante</h3>
              <button onClick={() => vm.setShowComprobante(null)} style={{ background: "var(--surface-hover)", border: "none", borderRadius: 6, padding: "6px", cursor: "pointer" }}><X size={14} color="var(--text-muted)" /></button>
            </div>
            <img src={vm.showComprobante} alt="Comprobante" style={{ maxWidth: "100%", maxHeight: 400, borderRadius: 8, objectFit: "contain", display: "block", margin: "0 auto" }} />
          </div>
        </>
      )}
    </div>
  );
}
