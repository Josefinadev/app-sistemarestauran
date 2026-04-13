"use client";

import { formatPrecio, formatHora } from "@/lib/utils";
import { useCajaDashboard } from "@/viewmodels/useCajaDashboard";
import {
  CreditCard, CheckCircle2, Clock, Receipt, DollarSign, Eye,
  X, Smartphone, Banknote, Wallet, Image as ImageIcon,
  AlertCircle, ShoppingBag, BarChart3, Monitor, ChefHat,
  Truck, Bell, Printer,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   VIEW — Caja Dashboard
   Tabs: Pedidos | Cuadre de caja | Monitor cocina/mesero
   Incluye voucher visible y notificaciones mesero.
   ═══════════════════════════════════════════════════════════ */

const metodoIcons: Record<string, any> = {
  YAPE: Smartphone, EFECTIVO: Banknote, PLIN: Smartphone, TARJETA: CreditCard,
};

const tabs = [
  { key: "pedidos", label: "Pedidos", Icon: Receipt },
  { key: "cuadre", label: "Cuadre de caja", Icon: BarChart3 },
  { key: "monitor", label: "Monitor", Icon: Monitor },
] as const;

export default function CajaDashboard() {
  const vm = useCajaDashboard();

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
          { label: "Pagados", value: String(vm.pagados.length), color: "var(--success)", Icon: CheckCircle2 },
          { label: "Ingresos hoy", value: formatPrecio(vm.totalDia), color: "var(--primary)", Icon: DollarSign },
          { label: "Total pedidos", value: String(vm.pedidos.length), color: "var(--tertiary)", Icon: ShoppingBag },
        ].map((s) => (
          <div key={s.label} className="card-flat" style={{ padding: "16px 20px", borderLeft: `3px solid ${s.color}` }}>
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
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", fontSize: 12, fontWeight: vm.activeTab === tab.key ? 600 : 400, color: vm.activeTab === tab.key ? "var(--primary)" : "var(--text-muted)", background: "transparent", border: "none", borderBottom: vm.activeTab === tab.key ? "2px solid var(--primary)" : "2px solid transparent", cursor: "pointer", transition: "all 0.15s", marginBottom: -1, whiteSpace: "nowrap" }}>
              <Icon size={14} />{tab.label}
            </button>
          );
        })}
      </div>

      {/* ═══ TAB: PEDIDOS ═══ */}
      {vm.activeTab === "pedidos" && (
        <div style={{ display: "grid", gridTemplateColumns: vm.selectedPedido ? "1fr 400px" : "1fr", gap: 24 }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", gap: 6 }}>
                {(["TODOS", "PENDIENTE", "PAGADO"] as const).map((f) => {
                  const icons = { TODOS: Receipt, PENDIENTE: Clock, PAGADO: CheckCircle2 };
                  const Icon = icons[f];
                  return (
                    <button key={f} onClick={() => vm.setFiltro(f)} className={`btn btn-sm ${vm.filtro === f ? "btn-primary" : "btn-secondary"}`} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Icon size={12} />{f === "TODOS" ? "Todos" : f === "PENDIENTE" ? "Pendientes" : "Pagados"}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="table-container">
              <table>
                <thead><tr><th>Pedido</th><th>Mesa</th><th>Items</th><th>Total</th><th>Estado</th><th>Método</th><th>Hora</th></tr></thead>
                <tbody>
                  {vm.pedidosFiltrados.map((p) => (
                    <tr key={p.id} onClick={() => vm.setSelectedPedido(p.id === vm.selectedPedido ? null : p.id)} style={{ cursor: "pointer", background: vm.selectedPedido === p.id ? "var(--primary-ghost)" : undefined }}>
                      <td style={{ fontWeight: 600, color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>{p.numeroPedido}</td>
                      <td>Mesa {p.mesa}</td>
                      <td>{p.items.length} platos</td>
                      <td style={{ fontWeight: 600, color: "var(--primary)", fontVariantNumeric: "tabular-nums" }}>{formatPrecio(p.total)}</td>
                      <td><span className={`badge ${p.estadoPago === "PENDIENTE" ? "badge-pending" : "badge-ready"}`} style={{ display: "flex", alignItems: "center", gap: 4, width: "fit-content" }}>{p.estadoPago === "PENDIENTE" ? <Clock size={10} /> : <CheckCircle2 size={10} />}{p.estadoPago}</span></td>
                      <td style={{ color: "var(--text-muted)" }}>{p.metodoPago || "—"}</td>
                      <td style={{ fontVariantNumeric: "tabular-nums", color: "var(--text-muted)" }}>{formatHora(p.hora)}</td>
                    </tr>
                  ))}
                  {vm.pedidosFiltrados.length === 0 && (<tr><td colSpan={7} style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>No hay pedidos con este filtro</td></tr>)}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail Panel with VOUCHER */}
          {vm.pedidoSeleccionado && (
            <div className="card-flat animate-slide-right" style={{ padding: "24px", alignSelf: "start" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--text)", margin: "0 0 4px" }}>{vm.pedidoSeleccionado.numeroPedido}</h3>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>Mesa {vm.pedidoSeleccionado.mesa} · {formatHora(vm.pedidoSeleccionado.hora)}</p>
                </div>
                <button onClick={() => vm.setSelectedPedido(null)} style={{ background: "var(--surface-hover)", border: "none", borderRadius: 6, padding: "6px 10px", cursor: "pointer", color: "var(--text-muted)" }}><X size={14} /></button>
              </div>

              {/* Voucher / Comprobante section */}
              {vm.pedidoSeleccionado.comprobanteUrl && (
                <div style={{ marginBottom: 16 }}>
                  <p className="label" style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><ImageIcon size={12} /> Comprobante del cliente</p>
                  <div style={{ borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid var(--border)", background: "var(--surface)" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={vm.pedidoSeleccionado.comprobanteUrl} alt="Comprobante" style={{ width: "100%", maxHeight: 240, objectFit: "contain", display: "block" }} />
                  </div>
                  <button onClick={() => vm.setShowComprobante(vm.pedidoSeleccionado!.comprobanteUrl)} className="btn btn-ghost btn-sm" style={{ width: "100%", marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                    <Eye size={12} /> Ver en grande
                  </button>
                </div>
              )}

              {/* Items detail */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                {vm.pedidoSeleccionado.items.map((item: any, i: number) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{item.nombre}</span>
                      {item.estado && (
                        <span className={`badge ${item.estado === "PENDIENTE" ? "badge-pending" : item.estado === "EN_PREPARACION" ? "badge-preparing" : item.estado === "LISTO" ? "badge-ready" : "badge-delivered"}`} style={{ fontSize: 8, padding: "2px 6px" }}>
                          {item.estado}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>{formatPrecio(item.precio)}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderTop: "2px solid var(--border)" }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Total</span>
                <span style={{ fontSize: 22, fontWeight: 700, color: "var(--primary)" }}>{formatPrecio(vm.pedidoSeleccionado.total)}</span>
              </div>

              {vm.pedidoSeleccionado.estadoPago === "PENDIENTE" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
                  <p className="label" style={{ marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}><Wallet size={12} /> Registrar pago</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {["YAPE", "EFECTIVO", "PLIN", "TARJETA"].map((m) => {
                      const Icon = metodoIcons[m] || CreditCard;
                      return (<button key={m} onClick={() => vm.confirmarPago(vm.pedidoSeleccionado!.id, m)} className="btn btn-secondary btn-sm" disabled={vm.procesando} style={{ opacity: vm.procesando ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Icon size={14} /> {m}</button>);
                    })}
                  </div>
                </div>
              )}

              {vm.pedidoSeleccionado.estadoPago === "PAGADO" && (
                <>
                  <div style={{ marginTop: 16, textAlign: "center", padding: "12px", background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: "var(--radius-md)", fontSize: 12, fontWeight: 600, color: "var(--success)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <CheckCircle2 size={14} /> Pagado vía {vm.pedidoSeleccionado.metodoPago}
                  </div>
                  {/* Notify mesero button */}
                  <button onClick={() => vm.marcarPedidoListo(vm.pedidoSeleccionado!.id)} className="btn btn-secondary btn-sm" style={{ width: "100%", marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <Bell size={14} /> Notificar al mesero
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: CUADRE DE CAJA ═══ */}
      {vm.activeTab === "cuadre" && (
        <div className="animate-fade-in" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* Resumen */}
          <div className="card-flat" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", margin: "0 0 20px", display: "flex", alignItems: "center", gap: 8 }}>
              <BarChart3 size={18} color="var(--primary)" /> Resumen del día
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Total ventas cobradas</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: "var(--success)" }}>{formatPrecio(vm.cuadre.totalVentas)}</span>
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

          {/* Por método de pago */}
          <div className="card-flat" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", margin: "0 0 20px", display: "flex", alignItems: "center", gap: 8 }}>
              <Wallet size={18} color="var(--tertiary)" /> Desglose por método
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {Object.entries(vm.cuadre.porMetodo).map(([metodo, data]) => {
                const Icon = metodoIcons[metodo] || CreditCard;
                const pct = vm.cuadre.totalVentas > 0 ? (data.total / vm.cuadre.totalVentas) * 100 : 0;
                return (
                  <div key={metodo}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Icon size={16} color="var(--text-secondary)" />
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
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 16px" }}>Estado en tiempo real de cocina y meseros por mesa</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {vm.monitorData.map((mesa) => {
              const progress = mesa.platosTotal > 0 ? (mesa.platosEntregados / mesa.platosTotal) * 100 : 0;
              return (
                <div key={mesa.mesa} className="card-flat" style={{ padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--primary-ghost)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "var(--primary)" }}>{mesa.mesa}</div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: 0 }}>Mesa {mesa.mesa}</p>
                        <p style={{ fontSize: 10, color: "var(--text-muted)", margin: 0 }}>{mesa.platosTotal} platos total</p>
                      </div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: progress === 100 ? "var(--success)" : "var(--primary)" }}>{Math.round(progress)}%</span>
                  </div>

                  {/* Progress bar */}
                  <div style={{ width: "100%", height: 6, borderRadius: 3, background: "var(--surface-active)", overflow: "hidden", marginBottom: 12 }}>
                    <div style={{ width: `${progress}%`, height: "100%", borderRadius: 3, background: progress === 100 ? "var(--success)" : "var(--primary)", transition: "width 0.5s ease" }} />
                  </div>

                  {/* Estado counts */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
                    {[
                      { label: "Pend.", value: mesa.platosPendientes, color: "var(--warning)", Icon: Clock },
                      { label: "Prep.", value: mesa.platosPreparando, color: "var(--tertiary)", Icon: ChefHat },
                      { label: "Listo", value: mesa.platosListos, color: "var(--success)", Icon: Truck },
                      { label: "Serv.", value: mesa.platosEntregados, color: "var(--primary)", Icon: CheckCircle2 },
                    ].map((s) => (
                      <div key={s.label} style={{ textAlign: "center", padding: "6px 4px", background: `${s.color}08`, borderRadius: 6 }}>
                        <s.Icon size={12} color={s.color} style={{ margin: "0 auto 2px", display: "block" }} />
                        <p style={{ fontSize: 14, fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
                        <p style={{ fontSize: 8, color: "var(--text-muted)", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</p>
                      </div>
                    ))}
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
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}><ImageIcon size={16} /> Comprobante de pago</h3>
              <button onClick={() => vm.setShowComprobante(null)} style={{ background: "var(--surface-hover)", border: "none", borderRadius: 6, padding: "6px", cursor: "pointer" }}><X size={14} color="var(--text-muted)" /></button>
            </div>
            <div style={{ background: "var(--surface)", borderRadius: "var(--radius-md)", padding: 16, textAlign: "center", border: "1px solid var(--border)", minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={vm.showComprobante} alt="Comprobante" style={{ maxWidth: "100%", maxHeight: 400, borderRadius: 8, objectFit: "contain" }} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
