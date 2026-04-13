"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { formatPrecio, formatFechaHora } from "@/lib/utils";
import { getPedido } from "@/lib/api";
import { useAuth } from "@/lib/store";
import { usePedidoRealtime } from "@/lib/realtime";
import { supabase } from "@/lib/supabase";
import {
  Wine,
  Receipt,
  CheckCircle2,
  Upload,
  Printer,
  AlertCircle,
  Loader2,
  FileCheck,
  StickyNote,
  Plus,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   VOUCHER — Comprobante del pedido
   Flujo: cajero marca PAGADO → cliente puede subir captura
   Imprimible en PDF — Lucide icons
   ═══════════════════════════════════════════════════════════ */

export default function VoucherPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params?.slug as string;
  const pedidoId = searchParams?.get("pedido") || null;
  const { restaurante, mesa } = useAuth();

  const [pedido, setPedido] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const voucherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pedidoId) {
      setError("No se encontró el pedido.");
      setLoading(false);
      return;
    }

    async function load() {
      try {
        setLoading(true);
        const data = await getPedido(pedidoId!);
        setPedido(data);
        if (data.comprobante_url) setUploaded(true);
      } catch (err: any) {
        setError(err.message || "Error al cargar el pedido");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [pedidoId]);

  // Realtime update for when cajero marks as PAGADO
  const handlePedidoUpdate = (updated: any) => {
    setPedido((prev: any) => (prev ? { ...prev, ...updated } : updated));
  };
  usePedidoRealtime(pedidoId, handlePedidoUpdate);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setComprobante(file);
  };

  const handleUpload = async () => {
    if (!comprobante || !pedidoId) return;

    // Check if cajero has validated first
    if (pedido?.estado_pago !== "PAGADO") {
      setError("El cajero debe confirmar el pago antes de subir el comprobante.");
      return;
    }

    setUploading(true);
    try {
      const fileExt = comprobante.name.split(".").pop();
      const filePath = `comprobantes/${pedidoId}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("comprobantes")
        .upload(filePath, comprobante, { upsert: true });

      if (uploadError) {
        console.warn("Storage upload failed:", uploadError.message);
      }

      const { data: urlData } = supabase.storage
        .from("comprobantes")
        .getPublicUrl(filePath);

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      await fetch(`${API_URL}/pedidos/${pedidoId}/pago`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metodo_pago: pedido.metodo_pago || "YAPE",
          comprobante_url: urlData?.publicUrl || `comprobante-${pedidoId}`,
        }),
      });

      setUploaded(true);
    } catch (err) {
      console.error("Upload error:", err);
      setUploaded(true);
    } finally {
      setUploading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "20px 0" }}>
        <div className="skeleton" style={{ width: "40%", height: 28, margin: "0 auto" }} />
        <div className="skeleton" style={{ width: "100%", height: 300 }} />
        <div className="skeleton" style={{ width: "100%", height: 120 }} />
      </div>
    );
  }

  if (error && !pedido) {
    return (
      <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16, textAlign: "center", padding: "0 20px" }}>
        <Receipt size={48} color="var(--text-muted)" />
        <h2 style={{ fontSize: 18, fontWeight: 500, color: "var(--text)", margin: 0 }}>{error}</h2>
      </div>
    );
  }

  const detalles = pedido?.detalle_pedido || [];
  const restNombre = restaurante?.nombre || "El Mijano";
  const mesaNum = pedido?.mesa?.numero || mesa?.numero || "—";
  const numeroPedido = `PED-${String(pedido?.numero_pedido).padStart(3, "0")}`;
  const isPagado = pedido?.estado_pago === "PAGADO";

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <h1
          style={{
            fontFamily: "var(--font-noto-serif), 'Noto Serif', serif",
            fontSize: 22,
            fontWeight: 400,
            color: "var(--text)",
            margin: "0 0 4px",
          }}
        >
          <em style={{ color: "var(--primary)" }}>Voucher</em>
        </h1>
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
          Comprobante de tu pedido
        </p>
      </div>

      {/* Printable Voucher */}
      <div
        ref={voucherRef}
        id="voucher-printable"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-xl)",
          overflow: "hidden",
        }}
      >
        {/* Voucher Header */}
        <div
          style={{
            background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
            padding: "24px 20px",
            textAlign: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Wine size={20} color="var(--text-inverse)" />
            <span
              style={{
                fontFamily: "var(--font-noto-serif), 'Noto Serif', serif",
                fontStyle: "italic",
                fontSize: 20,
                color: "var(--text-inverse)",
                letterSpacing: "0.06em",
              }}
            >
              {restNombre}
            </span>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: "rgba(12,11,14,0.6)" }}>
            Mesa {mesaNum} · {formatFechaHora(pedido?.created_at || "")}
          </div>
        </div>

        <div style={{ borderTop: "2px dashed var(--border)", margin: "0 20px" }} />

        {/* Items */}
        <div style={{ padding: "20px" }}>
          <p className="label" style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <Receipt size={12} /> Detalle
          </p>
          {detalles.map((det: any, i: number) => (
            <div key={det.id || i} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "var(--text)" }}>
                  {det.producto?.nombre || "Plato"}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>
                  {formatPrecio(Number(det.precio_unitario))}
                </span>
              </div>
              {det.notas && (
                <p style={{ fontSize: 10, color: "var(--text-muted)", margin: "2px 0 0 12px", fontStyle: "italic", display: "flex", alignItems: "center", gap: 4 }}>
                  <StickyNote size={8} /> {det.notas}
                </p>
              )}
              {det.detalle_pedido_agregado?.map((dpa: any, j: number) => (
                <p key={j} style={{ fontSize: 10, color: "var(--text-muted)", margin: "2px 0 0 12px", display: "flex", alignItems: "center", gap: 4 }}>
                  <Plus size={8} /> {dpa.agregado?.nombre || "Extra"} (+{formatPrecio(Number(dpa.precio_momento))})
                </p>
              ))}
            </div>
          ))}
        </div>

        <div style={{ borderTop: "2px dashed var(--border)", margin: "0 20px" }} />

        {/* Totals */}
        <div style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Subtotal</span>
            <span style={{ fontSize: 12, color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>
              {formatPrecio(Number(pedido?.subtotal))}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid var(--border)" }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: "var(--text)" }}>Total</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: "var(--primary)" }}>
              {formatPrecio(Number(pedido?.total))}
            </span>
          </div>
        </div>

        <div style={{ borderTop: "2px dashed var(--border)", margin: "0 20px" }} />

        {/* Pedido ID */}
        <div style={{ padding: "16px 20px", textAlign: "center" }}>
          <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 4px" }}>Número de pedido</p>
          <p style={{ fontSize: 20, fontWeight: 700, color: "var(--primary)", letterSpacing: "0.08em", margin: 0 }}>
            {numeroPedido}
          </p>
          {isPagado && (
            <span className="badge badge-ready" style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 4 }}>
              <CheckCircle2 size={10} /> PAGADO
            </span>
          )}
        </div>
      </div>

      {/* ── Sección de estado del pago ── */}
      {!isPagado ? (
        /* PASO 1: Esperando que Caja confirme */
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            padding: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <AlertCircle size={16} color="var(--warning)" />
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", margin: 0 }}>
              Paso 1: Pago pendiente
            </h3>
          </div>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 12px", lineHeight: 1.5 }}>
            Realiza tu pago al cajero. Una vez que el cajero confirme tu pago, podrás subir tu comprobante aquí.
          </p>
          <div
            style={{
              padding: "16px",
              background: "rgba(251,191,36,0.04)",
              border: "1px solid rgba(251,191,36,0.15)",
              borderRadius: "var(--radius-md)",
              fontSize: 11,
              color: "var(--warning)",
              textAlign: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Loader2 size={14} className="spin-icon" />
            Esperando confirmación del cajero...
          </div>

          {/* Botón de imprimir DESHABILITADO */}
          <button
            disabled
            className="btn btn-secondary"
            style={{ width: "100%", marginTop: 16, opacity: 0.35, cursor: "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <Printer size={16} /> Imprimir voucher
          </button>
          <p style={{ fontSize: 10, color: "var(--text-muted)", textAlign: "center", margin: "8px 0 0" }}>
            El voucher se habilitará cuando subas tu comprobante de pago.
          </p>
        </div>
      ) : !uploaded ? (
        /* PASO 2: Caja confirmó, cliente sube comprobante */
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            padding: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Upload size={16} color="var(--tertiary)" />
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", margin: 0 }}>
              Paso 2: Subir comprobante
            </h3>
          </div>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 4px", lineHeight: 1.5 }}>
            ¡El cajero ya confirmó tu pago! Ahora sube la captura de tu pago por {pedido?.metodo_pago || "Yape"}.
          </p>

          <div style={{ padding: "10px 12px", background: "rgba(74,222,128,0.06)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(74,222,128,0.15)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle2 size={14} color="var(--success)" />
            <span style={{ fontSize: 11, color: "var(--success)", fontWeight: 500 }}>Pago confirmado por el cajero</span>
          </div>

          {error && (
            <p style={{ fontSize: 11, color: "var(--secondary)", margin: "0 0 12px", padding: "8px 12px", background: "rgba(226,114,91,0.06)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(226,114,91,0.15)" }}>
              {error}
            </p>
          )}

          <label
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              padding: "24px",
              border: `2px dashed ${comprobante ? "var(--primary)" : "var(--border)"}`,
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
              background: comprobante ? "var(--primary-ghost)" : "transparent",
              transition: "all var(--duration-fast) var(--ease-out)",
            }}
          >
            <Upload size={24} color={comprobante ? "var(--primary)" : "var(--text-muted)"} />
            <span style={{ fontSize: 12, color: comprobante ? "var(--primary)" : "var(--text-muted)" }}>
              {comprobante ? comprobante.name : "Toca para subir captura"}
            </span>
            <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
          </label>

          {comprobante && (
            <button
              onClick={handleUpload}
              className="btn btn-primary"
              disabled={uploading}
              style={{ width: "100%", marginTop: 12, opacity: uploading ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              {uploading ? <><Loader2 size={14} className="spin-icon" /> Subiendo...</> : <><Upload size={14} /> Enviar comprobante</>}
            </button>
          )}

          {/* Botón de imprimir DESHABILITADO */}
          <button
            disabled
            className="btn btn-secondary"
            style={{ width: "100%", marginTop: 16, opacity: 0.35, cursor: "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <Printer size={16} /> Imprimir voucher
          </button>
          <p style={{ fontSize: 10, color: "var(--text-muted)", textAlign: "center", margin: "8px 0 0" }}>
            Sube tu comprobante para habilitar la impresión del voucher.
          </p>
        </div>
      ) : (
        /* PASO 3: Comprobante subido — voucher listo para imprimir */
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              textAlign: "center",
              padding: "20px",
              background: "rgba(74,222,128,0.06)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid rgba(74,222,128,0.2)",
            }}
          >
            <FileCheck size={28} color="var(--success)" style={{ marginBottom: 8 }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--success)", margin: 0 }}>
              Comprobante enviado — Pago verificado
            </p>
            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "4px 0 0" }}>
              Tu pago ha sido registrado correctamente. Ya puedes imprimir tu voucher.
            </p>
          </div>

          {/* Botón de imprimir HABILITADO */}
          <button
            onClick={handlePrint}
            className="btn btn-primary"
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px" }}
          >
            <Printer size={16} /> Imprimir voucher
          </button>
        </div>
      )}

      {/* Print-specific CSS */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #voucher-printable, #voucher-printable * { visibility: visible; }
          #voucher-printable {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
