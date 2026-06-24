"use client";

import Image from "next/image";
import { useState, useMemo } from "react";
import { formatPrecio } from "@/lib/utils";
import { useCajaDashboard } from "@/viewmodels/useCajaDashboard";
import { NoUsuariosAsignados } from "@/components/NoUsuariosAsignados";
import {
  CreditCard, CheckCircle2, DollarSign,
  Smartphone, Banknote,
  ShoppingBag, BarChart3, Monitor, Printer,
  TrendingUp, ChevronDown, ChevronUp, History, Calendar, Clock, Utensils,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   CAJA — Wine Design (2-column layout)
   Left: pending orders | Right: cuadre + monitor
   ═══════════════════════════════════════════════════════════ */

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
  { key: "pedidos", label: "Pedidos", Icon: ShoppingBag },
  { key: "cuadre", label: "Cuadre", Icon: BarChart3 },
  { key: "monitor", label: "Monitor", Icon: Monitor },
  { key: "historial", label: "Historial", Icon: History },
] as const;

const monitorColors: Record<string, string> = {
  Entregado: "var(--success)",
  "En preparación": "var(--tertiary)",
  "En cocina": "var(--warning)",
  Pendiente: "var(--text-muted)",
};

export default function CajaDashboard() {
  const vm = useCajaDashboard();
  const [expandedMesas, setExpandedMesas] = useState<Set<string | number>>(new Set());
  const [efectivoRecibido, setEfectivoRecibido] = useState<number | undefined>();
  const [pagoIndividual, setPagoIndividual] = useState<boolean>(false);
  const [pedidoActivo, setPedidoActivo] = useState<string | null>(null);
  const [detallePagoIds, setDetallePagoIds] = useState<Set<string>>(new Set());
  const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState<string | null>(null);
  const [montoAPagar, setMontoAPagar] = useState<number | undefined>();
  const [montoManual, setMontoManual] = useState<boolean>(false);
  const [historialFiltro, setHistorialFiltro] = useState<"dia" | "semana" | "mes">("dia");

  const toggleMesa = (mesa: string | number) => {
    setExpandedMesas((prev) => {
      const next = new Set(prev);
      if (next.has(mesa)) next.delete(mesa);
      else next.add(mesa);
      return next;
    });
  };

  if (vm.noUsuariosAsignados) return <NoUsuariosAsignados rolLabel="Cajero" rol="caja" />;

  // Historial de pedidos pagados con filtros por período
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const historialPedidos = useMemo(() => {
    const now = new Date();
    let cutoff: Date;
    if (historialFiltro === "dia") {
      cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (historialFiltro === "semana") {
      cutoff = new Date(now.getTime() - 7 * 86400000);
    } else {
      cutoff = new Date(now.getTime() - 30 * 86400000);
    }
    return vm.pagados
      .filter((p) => new Date(p.hora) >= cutoff)
      .sort((a, b) => new Date(b.hora).getTime() - new Date(a.hora).getTime());
  }, [vm.pagados, historialFiltro]);

  if (vm.loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ height: 90, borderRadius: 16 }} />)}
        </div>
        <div className="skeleton" style={{ height: 300, borderRadius: 16 }} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {[
          { label: "Por cobrar", value: formatPrecio(vm.pendientes.reduce((s, p) => s + (p.total || 0), 0)), sub: `${vm.pendientes.length} pedidos pendientes`, iconBg: "rgba(197,160,89,0.1)", iconColor: "var(--primary)", Icon: DollarSign },
          { label: "Pagados", value: formatPrecio(vm.totalDia), sub: `${vm.pagados.length} pedidos cobrados`, iconBg: "rgba(22,163,74,0.1)", iconColor: "var(--success)", Icon: CheckCircle2 },
          { label: "Ingresos hoy", value: formatPrecio(vm.totalDia), sub: "+18% vs ayer", iconBg: "rgba(197,160,89,0.1)", iconColor: "var(--primary)", Icon: TrendingUp },
          { label: "Total pedidos", value: String(vm.pedidos.length), sub: `${vm.pendientes.length} pend. · ${vm.pagados.length} cobrados`, iconBg: "rgba(74,108,247,0.1)", iconColor: "var(--tertiary)", Icon: ShoppingBag },
        ].map((s) => (
          <div key={s.label} className="dash-stat-card">
            <div className="dash-stat-icon" style={{ background: s.iconBg }}>
              <s.Icon size={17} color={s.iconColor} />
            </div>
            <div className="dash-stat-body">
              <p className="dash-stat-label">{s.label}</p>
              <p className="dash-stat-value">{s.value}</p>
              <p className="dash-stat-sub">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs + Imprimir */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className="wine-tab-bar" style={{ border: "none", flex: 1 }}>
          {tabs.map((tab) => {
            const Icon = tab.Icon;
            return (
              <button key={tab.key} onClick={() => vm.setActiveTab(tab.key)} className={`wine-tab-btn ${vm.activeTab === tab.key ? "wine-tab-btn--active" : ""}`} style={{ borderBottom: "2px solid transparent" }}>
                <Icon size={13} />{tab.label}
              </button>
            );
          })}
        </div>
        <button className="btn btn-secondary btn-sm" style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }} onClick={() => window.print()}>
          <Printer size={14} /> Imprimir
        </button>
      </div>

      {/* ═══ PEDIDOS tab — 2-column layout ═══ */}
      {vm.activeTab === "pedidos" && (
        <div className="animate-fade-in" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "flex-start" }}>
          {/* Left: pending orders */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(["TODOS", "PENDIENTE"] as const).map((f) => (
                <button key={f} onClick={() => vm.setFiltro(f)} className={`wine-chip ${vm.filtro === f ? "wine-chip--active" : ""}`}>
                  {f === "TODOS" ? "Todas las activas" : "Pendientes"}
                </button>
              ))}
            </div>

            <h4 style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", margin: 0 }}>Pedidos pendientes de cobro</h4>

            {vm.mesasFiltradas.map((mesa) => {
              const isExpanded = expandedMesas.has(mesa.mesa);
              const isPending = mesa.estadoPago === "PENDIENTE" || mesa.estadoPago === "MIXTO";
              return (
                <div key={mesa.mesa} className="card-flat" style={{ overflow: "hidden" }}>
                  <div onClick={() => toggleMesa(mesa.mesa)} style={{ display: "flex", alignItems: "center", padding: "14px 20px", cursor: "pointer", gap: 12 }}>
                    {/* Mesa icon */}
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: isPending ? "rgba(197,160,89,0.1)" : "rgba(22,163,74,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: isPending ? "var(--primary)" : "var(--success)" }}>⊞</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", margin: 0 }}>Mesa {mesa.mesa}</p>
                      <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "2px 0 0" }}>
                        Pedido #{mesa.pedidos[0]?.numeroPedido || "—"} · {isPending ? "Cobro pendiente" : "Pagado"}
                      </p>
                    </div>
                    {/* Progress bar */}
                    <div style={{ width: 80, flexShrink: 0 }}>
                      <div style={{ height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${isPending ? 40 : 100}%`, background: isPending ? "var(--warning)" : "var(--success)", borderRadius: 2 }} />
                      </div>
                    </div>
                    <div style={{ textAlign: "right", minWidth: 80, flexShrink: 0 }}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: isPending ? "var(--text)" : "var(--success)", margin: 0 }}>
                        {isPending ? "Pendiente" : "Pagado"}
                      </p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--primary)", margin: "2px 0 0" }}>{formatPrecio(mesa.total)}</p>
                    </div>
                    {/* Payment method buttons */}
                    {isPending && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
                        {["YAPE", "PLIN"].map((m) => (
                          <button key={m} onClick={(e) => { e.stopPropagation(); vm.pagarTodaLaMesa(mesa, m); }} className="pay-tag">
                            {metodoImages[m] ? <Image src={metodoImages[m]} alt={m} width={14} height={14} style={{ objectFit: "contain", borderRadius: 2 }} /> : null}
                            {m}
                          </button>
                        ))}
                        {["EFECTIVO", "BCP"].map((m) => (
                          <button key={m} onClick={(e) => { e.stopPropagation(); vm.pagarTodaLaMesa(mesa, m); }} className="pay-tag" style={{ background: m === "BCP" ? "#00529B" : "var(--surface)", color: m === "BCP" ? "#fff" : "var(--text)", borderColor: m === "BCP" ? "#00529B" : "var(--border)" }}>
                            {metodoImages[m] ? <Image src={metodoImages[m]} alt={m} width={14} height={14} style={{ objectFit: "contain", borderRadius: 2 }} /> : null}
                            {m === "BCP" ? `>${m}` : m}
                          </button>
                        ))}
                      </div>
                    )}
                    <div style={{ color: "var(--text-muted)", flexShrink: 0 }}>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ padding: "0 20px 16px", borderTop: "1px solid var(--border)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                      {mesa.pedidos.map((p) => (
                        <div key={p.id} style={{ padding: 12, background: "var(--surface-hover)", borderRadius: 10 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{p.numeroPedido}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)" }}>{formatPrecio(p.total)}</span>
                              <span className={`badge ${p.estadoPago === "PENDIENTE" ? "badge-pending" : "badge-ready"}`} style={{ fontSize: 9 }}>{p.estadoPago}</span>
                            </div>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {p.items.map((item, i) => (
                              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ width: 30, height: 30, borderRadius: 6, overflow: "hidden", flexShrink: 0, background: "var(--surface)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  {item.imagenUrl ? <Image src={item.imagenUrl} alt={item.nombre} width={30} height={30} unoptimized style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <ShoppingBag size={12} color="var(--text-muted)" />}
                                </div>
                                <span style={{ flex: 1, fontSize: 12, color: "var(--text-secondary)" }}>{item.cantidad}x {item.nombre}</span>
                                <span style={{ fontSize: 12, fontWeight: 500 }}>{formatPrecio(item.precio)}</span>
                              </div>
                            ))}
                          </div>
                          {(p.estadoPago === "PENDIENTE" || p.estadoPago === "MIXTO") && (
                            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
                              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                {METODOS_PAGO.map((m) => {
                                  const Icon = metodoIcons[m] || CreditCard;
                                  const selectedItems = p.items.filter((item) => detallePagoIds.has(item.id));
                                  const selectedAmount = selectedItems.reduce((sum, item) => sum + item.precio, 0);
                                  const hasSelection = selectedItems.length > 0;
                                  return (
                                    <button key={m} onClick={() => {
                                      const isSamePedido = p.id === pedidoActivo;
                                      const shouldKeepManual = !hasSelection && isSamePedido && montoManual;
                                      setPedidoActivo(p.id);
                                      setPagoIndividual(true);
                                      setMetodoPagoSeleccionado(m);
                                      setMontoManual(hasSelection ? false : shouldKeepManual);
                                      setDetallePagoIds(hasSelection ? new Set(selectedItems.map((item) => item.id).filter(Boolean)) : new Set());
                                      const montoInicial = hasSelection ? selectedAmount : shouldKeepManual ? montoAPagar : p.montoRestante;
                                      setMontoAPagar(montoInicial);
                                      if (m === "EFECTIVO") {
                                        setEfectivoRecibido(montoInicial);
                                      } else {
                                        setEfectivoRecibido(undefined);
                                      }
                                    }} className="btn btn-secondary btn-sm" disabled={vm.procesando} style={{ fontSize: 10, opacity: vm.procesando ? 0.6 : 1, display: "flex", alignItems: "center", gap: 4 }}>
                                      {metodoImages[m] ? <Image src={metodoImages[m]} alt={m} width={12} height={12} style={{ objectFit: "contain" }} /> : <Icon size={11} />}
                                      {m}
                                    </button>
                                  );
                                })}
                              </div>

                              {p.id === pedidoActivo && pagoIndividual && (
                                <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 12, background: "var(--surface)" }}>
                                  <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                                    Pago parcial en {metodoPagoSeleccionado ? metodoPagoSeleccionado : "método seleccionado"}
                                  </p>
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
                                    <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                                      Total pendiente: {formatPrecio(p.montoRestante)}
                                    </div>
                                    <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                                      Pago por monto: {montoAPagar !== undefined ? formatPrecio(montoAPagar) : "—"}
                                    </div>
                                    {detallePagoIds.size > 0 && (
                                      <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                                        Selección: {formatPrecio(p.items.filter((item) => detallePagoIds.has(item.id)).reduce((sum, item) => sum + item.precio, 0))}
                                      </div>
                                    )}
                                  </div>
                                  {p.items.some((item) => item.pagado) && (
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>Platos ya pagados:</span>
                                      {p.items.filter((item) => item.pagado).map((item) => (
                                        <span key={item.id} style={{ padding: "4px 8px", borderRadius: 999, background: "rgba(22,163,74,0.12)", color: "var(--success)", fontSize: 11, fontWeight: 600 }}>
                                          {item.nombre}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                                    {p.items.map((item) => {
                                      const idDetalle = item.id;
                                      const selected = detallePagoIds.has(idDetalle);
                                      const isLocked = Boolean(item.pagado) || item.estado === "CANCELADO";
                                      const selectionDisabled = montoManual || isLocked;
                                      return (
                                        <button
                                          key={idDetalle}
                                          type="button"
                                          onClick={() => {
                                            if (selectionDisabled) return;
                                            const next = new Set(detallePagoIds);
                                            if (selected) next.delete(idDetalle);
                                            else next.add(idDetalle);
                                            setDetallePagoIds(next);
                                            const selectedItems = p.items.filter((item) => next.has(item.id));
                                            const selectedAmount = selectedItems.reduce((sum, item) => sum + item.precio, 0);
                                            if (selectedItems.length > 0) {
                                              setMontoAPagar(selectedAmount);
                                              setMontoManual(false);
                                              if (metodoPagoSeleccionado === "EFECTIVO") {
                                                setEfectivoRecibido(selectedAmount);
                                              }
                                            }
                                          }}
                                          disabled={selectionDisabled}
                                          style={{
                                            padding: "6px 10px",
                                            borderRadius: 999,
                                            border: selected ? "1px solid var(--primary)" : "1px solid var(--border)",
                                            background: selected ? "var(--primary-ghost)" : isLocked ? "rgba(148,163,184,0.08)" : "transparent",
                                            cursor: selectionDisabled ? "not-allowed" : "pointer",
                                            fontSize: 12,
                                            color: isLocked ? "var(--text-secondary)" : "inherit",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 4,
                                          }}
                                        >
                                          {isLocked ? "✓ " : selected ? "✓ " : "○ "}
                                          {item.nombre}
                                          {item.pagado && <span style={{ fontSize: 11, color: "var(--success)", marginLeft: 4 }}>(Pagado)</span>}
                                          {item.estado === "CANCELADO" && <span style={{ fontSize: 11, color: "var(--warning)", marginLeft: 4 }}>(Cancelado)</span>}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  {metodoPagoSeleccionado === 'EFECTIVO' ? (
                                    <>
                                      <label style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                                        <span style={{ fontSize: 12, fontWeight: 600 }}>Monto a pagar con {metodoPagoSeleccionado}</span>
                                        <input
                                          type="number"
                                          min="0"
                                          value={montoAPagar !== undefined ? montoAPagar : ""}
                                          onChange={(e) => {
                                            const value = e.target.value;
                                            const parsed = value === "" ? undefined : Number(value);
                                            setMontoAPagar(parsed);
                                            setEfectivoRecibido(parsed);
                                            if (!detallePagoIds.size) {
                                              setMontoManual(parsed !== undefined);
                                            }
                                            if (parsed !== undefined && detallePagoIds.size > 0) {
                                              setDetallePagoIds(new Set());
                                            }
                                          }}
                                          placeholder="Ej. 56"
                                          className="input"
                                          style={{ width: 140 }}
                                        />
                                      </label>
                                      <button
                                        type="button"
                                        className="btn btn-primary btn-sm"
                                        disabled={vm.procesando || montoAPagar === undefined || montoAPagar <= 0}
                                        onClick={() => {
                                          vm.confirmarPago(p.id, "EFECTIVO", montoAPagar, undefined, montoAPagar);
                                          setPagoIndividual(false);
                                          setPedidoActivo(null);
                                          setEfectivoRecibido(undefined);
                                          setMetodoPagoSeleccionado(null);
                                          setMontoAPagar(undefined);
                                        }}
                                      >
                                        Registrar pago en efectivo parcial
                                      </button>
                                    </>
                                  ) : (
                                    metodoPagoSeleccionado && (
                                      <>
                                        <label style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                                          <span style={{ fontSize: 12, fontWeight: 600 }}>Monto a pagar con {metodoPagoSeleccionado}</span>
                                          <input
                                            type="number"
                                            min="0"
                                            value={montoAPagar !== undefined ? montoAPagar : ""}
                                            onChange={(e) => {
                                              const value = e.target.value;
                                              const parsed = value === "" ? undefined : Number(value);
                                              setMontoAPagar(parsed);
                                              if (!detallePagoIds.size) {
                                                setMontoManual(parsed !== undefined);
                                              }
                                              if (parsed !== undefined && detallePagoIds.size > 0) {
                                                setDetallePagoIds(new Set());
                                              }
                                            }}
                                            placeholder="Ej. 56"
                                            className="input"
                                            style={{ width: 140 }}
                                          />
                                        </label>
                                        <button
                                          type="button"
                                          className="btn btn-primary btn-sm"
                                          disabled={vm.procesando || montoAPagar === undefined || montoAPagar <= 0}
                                          onClick={() => {
                                            vm.confirmarPago(p.id, metodoPagoSeleccionado, undefined, undefined, montoAPagar);
                                            setPagoIndividual(false);
                                            setPedidoActivo(null);
                                            setEfectivoRecibido(undefined);
                                            setMetodoPagoSeleccionado(null);
                                            setMontoAPagar(undefined);
                                          }}
                                        >
                                          Registrar pago parcial con {metodoPagoSeleccionado}
                                        </button>
                                      </>
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {vm.mesasFiltradas.length === 0 && (
              <div className="card-flat" style={{ padding: 48, textAlign: "center" }}>
                <CheckCircle2 size={36} color="var(--success)" style={{ margin: "0 auto 12px", display: "block", opacity: 0.5 }} />
                <p style={{ color: "var(--text-muted)", fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>No hay pedidos pendientes de cobro</p>
                <p style={{ color: "var(--text-muted)", fontSize: 12, margin: 0 }}>Los pedidos pagados se encuentran en el historial</p>
              </div>
            )}

            {vm.mesasFiltradas.length > 3 && (
              <button className="btn btn-ghost" style={{ color: "var(--primary)", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                Ver todos los pendientes ({vm.pendientes.length}) <ChevronDown size={14} />
              </button>
            )}
          </div>

          {/* Right: Cuadre + Monitor */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Cuadre de caja */}
            <div className="dash-panel-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <p className="dash-panel-title" style={{ margin: 0 }}>Cuadre de caja</p>
                <span className="badge badge-ready" style={{ fontSize: 10 }}>Turno actual: Abierto</span>
              </div>
              {/* Summary row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "10px 0", borderBottom: "1px solid var(--border)", marginBottom: 12 }}>
                {[
                  { label: "Total ventas", value: formatPrecio(vm.cuadre.totalVentas), color: "var(--text)" },
                  { label: "Pedidos cobrados", value: String(vm.cuadre.cantidadPedidos), color: "var(--text)" },
                  { label: "Ticket promedio", value: formatPrecio(vm.cuadre.ticketPromedio), color: "var(--text)" },
                  { label: "Pendientes de cobro", value: formatPrecio(vm.cuadre.pendientesCobro), color: "var(--secondary)" },
                ].map((s) => (
                  <div key={s.label}>
                    <p style={{ fontSize: 10, color: "var(--text-muted)", margin: 0 }}>{s.label}</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: s.color, margin: "2px 0 0" }}>{s.value}</p>
                  </div>
                ))}
              </div>
              {/* By payment method */}
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Ventas por método de pago</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(Object.entries(vm.cuadre.porMetodo) as [string, { total: number; cantidad: number }][]).map(([metodo, data]) => {
                  const pct = vm.cuadre.totalVentas > 0 ? ((data.total / vm.cuadre.totalVentas) * 100) : 0;
                  const colors: Record<string, string> = { YAPE: "#7C3AED", PLIN: "#0EA5E9", EFECTIVO: "#16A34A", BCP: "#00529B" };
                  const color = colors[metodo] || "var(--primary)";
                  return (
                    <div key={metodo}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {metodoImages[metodo] ? <Image src={metodoImages[metodo]} alt={metodo} width={16} height={16} style={{ objectFit: "contain", borderRadius: 3 }} /> : <span style={{ fontSize: 12, fontWeight: 700 }}>{metodo.charAt(0)}</span>}
                          <span style={{ fontSize: 12, color: "var(--text)" }}>{metodo}</span>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{formatPrecio(data.total)}</span>
                          <span style={{ fontSize: 11, color: "var(--text-muted)", minWidth: 32, textAlign: "right" }}>{pct.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div style={{ height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 2, background: color, transition: "width 0.5s ease" }} />
                      </div>
                    </div>
                  );
                })}
                {Object.keys(vm.cuadre.porMetodo).length === 0 && (
                  <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 12, padding: "12px 0" }}>Sin pagos registrados hoy</p>
                )}
              </div>
            </div>

            {/* Monitor de mesas */}
            <div className="dash-panel-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <p className="dash-panel-title" style={{ margin: 0 }}>Monitor de mesas</p>
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "var(--success)" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)" }} />
                  Actualización automática
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                {vm.monitorData.map((mesa) => {
                  const progress = mesa.platosTotal > 0 ? (mesa.platosEntregados / mesa.platosTotal) * 100 : 0;
                  const statusText = progress >= 100 ? "Entregado" : progress > 0 ? "En preparación" : "En cocina";
                  const color = monitorColors[statusText] || "var(--text-muted)";
                  return (
                    <div key={mesa.mesa} className="monitor-cell">
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 13, color, fontWeight: 700 }}>⊞</span>
                      </div>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text)", margin: 0 }}>Mesa {mesa.mesa}</p>
                      <div style={{ width: "100%", height: 3, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ width: `${progress}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.5s" }} />
                      </div>
                      <p style={{ fontSize: 9, color, margin: 0, fontWeight: 600 }}>{statusText}</p>
                    </div>
                  );
                })}
                {vm.monitorData.length === 0 && (
                  <p style={{ gridColumn: "1/-1", textAlign: "center", color: "var(--text-muted)", fontSize: 12, padding: "12px 0" }}>Sin mesas activas</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ CUADRE tab ═══ */}
      {vm.activeTab === "cuadre" && (
        <div className="animate-fade-in" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          <div className="card-flat" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", margin: "0 0 20px", display: "flex", alignItems: "center", gap: 8 }}>
              <BarChart3 size={18} color="var(--primary)" /> Resumen del día
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "Total ventas cobradas", value: formatPrecio(vm.cuadre.totalVentas), big: true },
                { label: "Pedidos cobrados", value: String(vm.cuadre.cantidadPedidos) },
                { label: "Ticket promedio", value: formatPrecio(vm.cuadre.ticketPromedio) },
                { label: "Pendientes", value: `${vm.cuadre.cantidadPendientes} (${formatPrecio(vm.cuadre.pendientesCobro)})`, warn: true },
              ].map((r) => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{r.label}</span>
                  <span style={{ fontSize: r.big ? 18 : 15, fontWeight: 700, color: r.warn ? "var(--warning)" : "var(--primary)" }}>{r.value}</span>
                </div>
              ))}
            </div>
            <button onClick={() => window.print()} className="btn btn-secondary" style={{ width: "100%", marginTop: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Printer size={14} /> Imprimir cuadre
            </button>
          </div>
          <div className="card-flat" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", margin: "0 0 20px" }}>Por método de pago</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {(Object.entries(vm.cuadre.porMetodo) as [string, { total: number; cantidad: number }][]).map(([metodo, data]) => {
                const pct = vm.cuadre.totalVentas > 0 ? ((data.total / vm.cuadre.totalVentas) * 100) : 0;
                return (
                  <div key={metodo}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {metodoImages[metodo] ? <Image src={metodoImages[metodo]} alt={metodo} width={18} height={18} style={{ objectFit: "contain", borderRadius: 4 }} /> : <CreditCard size={16} color="var(--text-secondary)" />}
                        <span style={{ fontSize: 13, color: "var(--text)" }}>{metodo}</span>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--primary)" }}>{formatPrecio(data.total)}</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: "var(--border)", overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: "var(--primary)", transition: "width 0.5s" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══ MONITOR tab ═══ */}
      {vm.activeTab === "monitor" && (
        <div className="animate-fade-in">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
            {vm.monitorData.map((mesa) => {
              const progress = mesa.platosTotal > 0 ? (mesa.platosEntregados / mesa.platosTotal) * 100 : 0;
              return (
                <div key={mesa.mesa} className="card-flat" style={{ padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--primary-ghost)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "var(--primary)" }}>{mesa.mesa}</div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: 0 }}>Mesa {mesa.mesa}</p>
                        <p style={{ fontSize: 10, color: "var(--text-muted)", margin: 0 }}>{mesa.platosTotal} platos</p>
                      </div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)" }}>{Math.round(progress)}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: "var(--border)", overflow: "hidden" }}>
                    <div style={{ width: `${progress}%`, height: "100%", borderRadius: 3, background: "var(--primary)", transition: "width 0.5s" }} />
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

      {/* ═══ HISTORIAL tab ═══ */}
      {vm.activeTab === "historial" && (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Filtros */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", gap: 6 }}>
              {([
                { key: "dia", label: "Hoy" },
                { key: "semana", label: "Últimos 7 días" },
                { key: "mes", label: "Últimos 30 días" },
              ] as const).map((f) => (
                <button
                  key={f.key}
                  onClick={() => setHistorialFiltro(f.key)}
                  className={`wine-chip ${historialFiltro === f.key ? "wine-chip--active" : ""}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <button className="btn btn-secondary btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }} onClick={() => window.print()}>
              <Printer size={14} /> Imprimir historial
            </button>
          </div>

          {/* Resumen del período */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {[
              { label: "Total cobrado", value: formatPrecio(historialPedidos.flatMap(p => p.pagos).reduce((s, pay) => s + pay.monto, 0)), iconColor: "var(--success)", Icon: DollarSign },
              { label: "Pedidos", value: String(historialPedidos.length), iconColor: "var(--primary)", Icon: ShoppingBag },
              { label: "Ticket promedio", value: historialPedidos.length > 0 ? formatPrecio(historialPedidos.flatMap(p => p.pagos).reduce((s, pay) => s + pay.monto, 0) / historialPedidos.length) : "S/ 0.00", iconColor: "var(--tertiary)", Icon: TrendingUp },
            ].map((s) => (
              <div key={s.label} className="dash-stat-card">
                <div className="dash-stat-icon" style={{ background: `${s.iconColor}20` }}>
                  <s.Icon size={17} color={s.iconColor} />
                </div>
                <div className="dash-stat-body">
                  <p className="dash-stat-label">{s.label}</p>
                  <p className="dash-stat-value">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Tabla de historial */}
          <div className="card-flat" style={{ overflow: "hidden" }}>
            <div className="table-container" style={{ border: "none" }}>
              <table>
                <thead>
                  <tr>
                    <th>Fecha y hora</th>
                    <th>Mesa</th>
                    <th># Pedido</th>
                    <th>Productos</th>
                    <th>Método de pago</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {historialPedidos.map((p) => {
                    const fechaPago = new Date(p.hora);
                    const metodo = p.pagos[0]?.metodoPago || p.metodoPago || "—";
                    const imgSrc = metodoImages[metodo] || null;
                    const MetodoIcon = metodoIcons[metodo] || CreditCard;
                    return (
                      <tr key={p.id}>
                        <td style={{ whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <span style={{ fontSize: 12, color: "var(--text)", fontWeight: 500 }}>
                              {fechaPago.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}
                            </span>
                            <span style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 3 }}>
                              <Clock size={10} />
                              {fechaPago.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </td>
                        <td style={{ fontWeight: 600 }}>Mesa {p.mesa}</td>
                        <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{p.numeroPedido}</td>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 220 }}>
                            {p.items.slice(0, 3).map((item, i) => (
                              <span key={i} style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                                {item.cantidad}× {item.nombre}
                              </span>
                            ))}
                            {p.items.length > 3 && (
                              <span style={{ fontSize: 10, color: "var(--text-muted)" }}>+{p.items.length - 3} más</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            {imgSrc ? (
                              <Image src={imgSrc} alt={metodo} width={18} height={18} style={{ objectFit: "contain", borderRadius: 3 }} />
                            ) : (
                              <MetodoIcon size={14} color="var(--text-muted)" />
                            )}
                            <span style={{ fontSize: 12, color: "var(--text)" }}>{metodo}</span>
                          </div>
                        </td>
                        <td style={{ fontWeight: 700, color: "var(--success)" }}>{formatPrecio(p.pagos.reduce((s, pay) => s + pay.monto, 0) || p.total)}</td>
                      </tr>
                    );
                  })}
                  {historialPedidos.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", fontSize: 13 }}>
                        No hay pedidos pagados en este período.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
