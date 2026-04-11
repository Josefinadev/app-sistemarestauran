"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { formatPrecio } from "@/lib/utils";
import { useAuth, useCarrito } from "@/lib/store";
import { crearPedido } from "@/lib/api";
import {
  ShoppingBag,
  Trash2,
  StickyNote,
  Plus,
  ArrowLeft,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   CONFIRMAR PEDIDO — Resumen del carrito + envío real
   Lucide icons — responsive
   ═══════════════════════════════════════════════════════════ */

export default function PedidoPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;
  const { restaurante, mesa } = useAuth();
  const { items, removeItem, clearCart, getTotal } = useCarrito();
  const [notas, setNotas] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const handleConfirmar = async () => {
    if (items.length === 0) return;
    if (!restaurante?.id || !mesa?.id) {
      setError("No se pudo identificar la mesa. Escanea el QR de nuevo.");
      return;
    }

    setSending(true);
    setError("");

    try {
      const pedidoData = {
        id_restaurante: restaurante.id,
        id_mesa: mesa.id,
        notas: notas || undefined,
        items: items.map((item) => ({
          id_producto: item.producto.id,
          notas: item.notas || undefined,
          agregados: item.agregados_seleccionados.map((a) => ({ id_agregado: a.id })),
        })),
      };

      const result = await crearPedido(pedidoData);
      clearCart();
      router.push(`/${slug}/estado?pedido=${result.id}`);
    } catch (err: any) {
      setError(err.message || "Error al enviar el pedido. Intenta de nuevo.");
    } finally {
      setSending(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", gap: 16, textAlign: "center" }}>
        <ShoppingBag size={48} color="var(--text-muted)" />
        <h2 style={{ fontSize: 18, color: "var(--text)", margin: 0 }}>Carrito vacío</h2>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>Agrega platos desde el menú</p>
        <button onClick={() => router.push(`/${slug}/menu`)} className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <ArrowLeft size={14} /> Volver al menú
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontFamily: "var(--font-noto-serif), 'Noto Serif', serif", fontSize: 22, fontWeight: 400, color: "var(--text)", margin: "0 0 4px" }}>
          Confirmar <em style={{ color: "var(--primary)" }}>Pedido</em>
        </h1>
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
          Mesa {mesa?.numero || "—"} · {items.length} item{items.length > 1 ? "s" : ""}
        </p>
      </div>

      {/* Items */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 14,
              padding: "16px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", margin: 0 }}>
                  {item.producto.nombre}
                </h3>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--primary)", flexShrink: 0, marginLeft: 12 }}>
                  {formatPrecio(item.precio_total)}
                </span>
              </div>
              {item.notas && (
                <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "4px 0 0", display: "flex", alignItems: "center", gap: 3 }}>
                  <StickyNote size={9} /> {item.notas}
                </p>
              )}
              {item.agregados_seleccionados.length > 0 && (
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                  {item.agregados_seleccionados.map((a) => (
                    <span key={a.id} style={{ fontSize: 9, padding: "2px 6px", background: "var(--primary-ghost)", borderRadius: "var(--radius-full)", color: "var(--primary-light)", display: "flex", alignItems: "center", gap: 2 }}>
                      <Plus size={7} /> {a.nombre}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => removeItem(item.id)}
              style={{ background: "var(--surface-hover)", border: "none", borderRadius: 6, padding: 6, cursor: "pointer", flexShrink: 0 }}
            >
              <Trash2 size={14} color="var(--text-muted)" />
            </button>
          </div>
        ))}
      </div>

      {/* Notas generales */}
      <div>
        <p className="label" style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
          <StickyNote size={12} /> Notas del pedido (opcional)
        </p>
        <input
          className="input"
          placeholder="Instrucciones especiales..."
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          style={{ width: "100%" }}
        />
      </div>

      {/* Total */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 0",
        borderTop: "2px solid var(--border)",
      }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: "var(--text)" }}>Total</span>
        <span style={{ fontSize: 24, fontWeight: 700, color: "var(--primary)" }}>{formatPrecio(getTotal())}</span>
      </div>

      {/* Error */}
      {error && (
        <div className="animate-fade-in" style={{
          padding: "12px 16px", background: "rgba(226,114,91,0.06)", border: "1px solid rgba(226,114,91,0.15)",
          borderRadius: "var(--radius-md)", fontSize: 12, color: "var(--secondary)", display: "flex", alignItems: "center", gap: 8,
        }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={() => router.push(`/${slug}/menu`)} className="btn btn-secondary" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <ArrowLeft size={14} /> Volver
        </button>
        <button
          onClick={handleConfirmar}
          className="btn btn-primary btn-lg"
          disabled={sending}
          style={{ flex: 2, opacity: sending ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
        >
          {sending ? (
            <><Loader2 size={14} className="spin-icon" /> Enviando...</>
          ) : (
            <><Send size={14} /> Confirmar pedido</>
          )}
        </button>
      </div>
    </div>
  );
}
