"use client";

import { useState, useEffect, useCallback } from "react";
import { formatPrecio, formatHora } from "@/lib/utils";
import { getPedidos, registrarPago } from "@/lib/api";
import { usePedidosRealtime } from "@/lib/realtime";
import { useNotificaciones } from "@/lib/store";
import {
  CreditCard,
  CheckCircle2,
  Clock,
  Receipt,
  DollarSign,
  Eye,
  Printer,
  X,
  Smartphone,
  Banknote,
  Wallet,
  Image as ImageIcon,
  AlertCircle,
  BarChart3,
  ShoppingBag,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   CAJA DASHBOARD (FUNCIONAL)
   Flujo correcto: cajero valida primero → cliente sube captura
   Voucher visible como imagen, no "archivo adjunto"
   ═══════════════════════════════════════════════════════════ */

const ID_RESTAURANTE = "a0000000-0000-0000-0000-000000000001";

interface PedidoCaja {
  id: string;
  numeroPedido: string;
  mesa: number;
  items: { nombre: string; precio: number }[];
  total: number;
  estadoPago: "PENDIENTE" | "PAGADO" | "ANULADO";
  metodoPago: string | null;
  hora: string;
  comprobanteUrl: string | null;
}

export default function CajaDashboard() {
  const [pedidos, setPedidos] = useState<PedidoCaja[]>([]);
  const [selectedPedido, setSelectedPedido] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<"TODOS" | "PENDIENTE" | "PAGADO">("TODOS");
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [showComprobante, setShowComprobante] = useState<string | null>(null);
  const { add: addNotif } = useNotificaciones();

  const loadPedidos = useCallback(async () => {
    try {
      const data = await getPedidos({ id_restaurante: ID_RESTAURANTE });
      const mapped: PedidoCaja[] = (data || []).map((p: any) => ({
        id: p.id,
        numeroPedido: `PED-${String(p.numero_pedido).padStart(3, "0")}`,
        mesa: p.mesa?.numero || 0,
        items: (p.detalle_pedido || []).map((d: any) => ({
          nombre: d.producto?.nombre || "Plato",
          precio: Number(d.precio_unitario),
        })),
        total: Number(p.total),
        estadoPago: p.estado_pago,
        metodoPago: p.metodo_pago,
        hora: p.created_at,
        comprobanteUrl: p.comprobante_url,
      }));
      setPedidos(mapped);
    } catch (err) {
      console.error("Error loading caja data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPedidos(); }, [loadPedidos]);

  const handleRealtimeChange = useCallback(() => { loadPedidos(); }, [loadPedidos]);
  usePedidosRealtime(ID_RESTAURANTE, handleRealtimeChange, handleRealtimeChange);

  const pendientes = pedidos.filter((p) => p.estadoPago === "PENDIENTE");
  const pagados = pedidos.filter((p) => p.estadoPago === "PAGADO");
  const totalDia = pagados.reduce((s, p) => s + p.total, 0);

  const confirmarPago = async (id: string, metodo: string) => {
    setProcesando(true);
    try {
      await registrarPago(id, metodo);
      setPedidos((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, estadoPago: "PAGADO" as const, metodoPago: metodo } : p
        )
      );
      const ped = pedidos.find((p) => p.id === id);
      addNotif({
        tipo: "success",
        titulo: `Pago registrado — ${ped?.numeroPedido}`,
        mensaje: `Mesa ${ped?.mesa} pagó ${formatPrecio(ped?.total || 0)} vía ${metodo}.`,
      });
      setSelectedPedido(null);
    } catch (err) {
      console.error("Error processing payment:", err);
    } finally {
      setProcesando(false);
    }
  };

  const pedidosFiltrados = pedidos.filter(
    (p) => filtro === "TODOS" || p.estadoPago === filtro
  );

  const pedidoSeleccionado = pedidos.find((p) => p.id === selectedPedido);

  const metodoIcons: Record<string, any> = {
    YAPE: Smartphone,
    EFECTIVO: Banknote,
    PLIN: Smartphone,
    TARJETA: CreditCard,
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: 80, borderRadius: 16 }} />
          ))}
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
          { label: "Por cobrar", value: String(pendientes.length), color: "var(--secondary)", Icon: Clock },
          { label: "Pagados", value: String(pagados.length), color: "var(--success)", Icon: CheckCircle2 },
          { label: "Ingresos hoy", value: formatPrecio(totalDia), color: "var(--primary)", Icon: DollarSign },
          { label: "Total pedidos", value: String(pedidos.length), color: "var(--tertiary)", Icon: ShoppingBag },
        ].map((s) => (
          <div key={s.label} className="card-flat" style={{ padding: "16px 20px", borderLeft: `3px solid ${s.color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
                  {s.label}
                </p>
                <p style={{ fontSize: 28, fontWeight: 700, color: s.color, margin: "4px 0 0" }}>
                  {s.value}
                </p>
              </div>
              <s.Icon size={24} color={s.color} style={{ opacity: 0.4 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Layout */}
      <div style={{ display: "grid", gridTemplateColumns: selectedPedido ? "1fr 380px" : "1fr", gap: 24 }}>
        {/* Left — Pedidos List */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", gap: 6 }}>
              {(["TODOS", "PENDIENTE", "PAGADO"] as const).map((f) => {
                const icons = { TODOS: Receipt, PENDIENTE: Clock, PAGADO: CheckCircle2 };
                const Icon = icons[f];
                return (
                  <button
                    key={f}
                    onClick={() => setFiltro(f)}
                    className={`btn btn-sm ${filtro === f ? "btn-primary" : "btn-secondary"}`}
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <Icon size={12} />
                    {f === "TODOS" ? "Todos" : f === "PENDIENTE" ? "Pendientes" : "Pagados"}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Orders Table */}
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Mesa</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Método</th>
                  <th>Hora</th>
                </tr>
              </thead>
              <tbody>
                {pedidosFiltrados.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedPedido(p.id === selectedPedido ? null : p.id)}
                    style={{
                      cursor: "pointer",
                      background: selectedPedido === p.id ? "var(--primary-ghost)" : undefined,
                    }}
                  >
                    <td style={{ fontWeight: 600, color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>
                      {p.numeroPedido}
                    </td>
                    <td>Mesa {p.mesa}</td>
                    <td>{p.items.length} platos</td>
                    <td style={{ fontWeight: 600, color: "var(--primary)", fontVariantNumeric: "tabular-nums" }}>
                      {formatPrecio(p.total)}
                    </td>
                    <td>
                      <span className={`badge ${p.estadoPago === "PENDIENTE" ? "badge-pending" : "badge-ready"}`} style={{ display: "flex", alignItems: "center", gap: 4, width: "fit-content" }}>
                        {p.estadoPago === "PENDIENTE" ? <Clock size={10} /> : <CheckCircle2 size={10} />}
                        {p.estadoPago}
                      </span>
                    </td>
                    <td style={{ color: "var(--text-muted)" }}>{p.metodoPago || "—"}</td>
                    <td style={{ fontVariantNumeric: "tabular-nums", color: "var(--text-muted)" }}>
                      {formatHora(p.hora)}
                    </td>
                  </tr>
                ))}
                {pedidosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
                      No hay pedidos con este filtro
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right — Detail Panel */}
        {pedidoSeleccionado && (
          <div className="card-flat animate-slide-right" style={{ padding: "24px", alignSelf: "start" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--text)", margin: "0 0 4px" }}>
                  {pedidoSeleccionado.numeroPedido}
                </h3>
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
                  Mesa {pedidoSeleccionado.mesa} · {formatHora(pedidoSeleccionado.hora)}
                </p>
              </div>
              <button
                onClick={() => setSelectedPedido(null)}
                style={{
                  background: "var(--surface-hover)",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 10px",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Comprobante visible como imagen */}
            {pedidoSeleccionado.comprobanteUrl && (
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    padding: "10px 14px",
                    background: "rgba(151,176,255,0.08)",
                    border: "1px solid rgba(151,176,255,0.2)",
                    borderRadius: "var(--radius-md)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 12, color: "var(--tertiary)", display: "flex", alignItems: "center", gap: 6 }}>
                    <ImageIcon size={14} /> Comprobante adjunto
                  </span>
                  <button
                    onClick={() => setShowComprobante(pedidoSeleccionado.comprobanteUrl)}
                    className="btn btn-ghost btn-sm"
                    style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 8px" }}
                  >
                    <Eye size={12} /> Ver
                  </button>
                </div>
              </div>
            )}

            {/* Items */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {pedidoSeleccionado.items.map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{item.nombre}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>
                    {formatPrecio(item.precio)}
                  </span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderTop: "2px solid var(--border)" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Total</span>
              <span style={{ fontSize: 22, fontWeight: 700, color: "var(--primary)" }}>
                {formatPrecio(pedidoSeleccionado.total)}
              </span>
            </div>

            {/* Payment Actions — Cajero valida primero */}
            {pedidoSeleccionado.estadoPago === "PENDIENTE" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
                <p className="label" style={{ marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                  <Wallet size={12} /> Registrar pago
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {["YAPE", "EFECTIVO", "PLIN", "TARJETA"].map((m) => {
                    const Icon = metodoIcons[m] || CreditCard;
                    return (
                      <button
                        key={m}
                        onClick={() => confirmarPago(pedidoSeleccionado.id, m)}
                        className="btn btn-secondary btn-sm"
                        disabled={procesando}
                        style={{ opacity: procesando ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                      >
                        <Icon size={14} /> {m}
                      </button>
                    );
                  })}
                </div>
                <p style={{ fontSize: 10, color: "var(--text-muted)", margin: "8px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
                  <AlertCircle size={10} />
                  El cajero debe confirmar el pago antes de que el cliente suba su comprobante.
                </p>
              </div>
            )}

            {pedidoSeleccionado.estadoPago === "PAGADO" && (
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{
                  textAlign: "center",
                  padding: "12px",
                  background: "rgba(74,222,128,0.06)",
                  border: "1px solid rgba(74,222,128,0.2)",
                  borderRadius: "var(--radius-md)",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--success)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}>
                  <CheckCircle2 size={14} /> Pagado vía {pedidoSeleccionado.metodoPago}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Comprobante Modal */}
      {showComprobante && (
        <>
          <div className="overlay" onClick={() => setShowComprobante(null)} />
          <div
            className="modal animate-fade-in"
            style={{
              background: "var(--bg-elevated)",
              borderRadius: 20,
              padding: 24,
              width: "90%",
              maxWidth: 480,
              border: "1px solid var(--border)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <ImageIcon size={16} /> Comprobante de pago
              </h3>
              <button
                onClick={() => setShowComprobante(null)}
                style={{ background: "var(--surface-hover)", border: "none", borderRadius: 6, padding: "6px", cursor: "pointer" }}
              >
                <X size={14} color="var(--text-muted)" />
              </button>
            </div>
            <div
              style={{
                background: "var(--surface)",
                borderRadius: "var(--radius-md)",
                padding: 16,
                textAlign: "center",
                border: "1px solid var(--border)",
                minHeight: 200,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={showComprobante}
                alt="Comprobante de pago"
                style={{ maxWidth: "100%", maxHeight: 400, borderRadius: 8, objectFit: "contain" }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent) {
                    parent.innerHTML = `<div style="padding:24px;text-align:center;color:var(--text-muted)"><p style="font-size:12px">No se pudo cargar la imagen del comprobante.</p><p style="font-size:10px;color:var(--text-muted);margin-top:4px">${showComprobante}</p></div>`;
                  }
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
