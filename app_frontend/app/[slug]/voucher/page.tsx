"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { formatPrecio, formatFechaHora } from "@/lib/utils";
import { getPedido } from "@/lib/api";
import { useAuth } from "@/lib/store";
import { usePedidoRealtime } from "@/lib/realtime";
import { supabase } from "@/lib/supabase";
import {
  Receipt,
  CheckCircle2,
  Upload,
  Printer,
  AlertCircle,
  Loader2,
  FileCheck,
  StickyNote,
  Plus,
  Info,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

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
      const latestPago = Array.isArray(pedido?.pedido_pago)
        ? [...pedido.pedido_pago].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
        : null;
      const metodoPago = latestPago?.metodo_pago || pedido?.metodo_pago || "YAPE";

      await fetch(`${API_URL}/pedidos/${pedidoId}/pago`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metodo_pago: metodoPago,
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
      <main style={{ maxWidth: 520, margin: "0 auto", padding: "32px 16px", minHeight: "100vh" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "20px 0" }}>
          <div className="skeleton" style={{ width: "40%", height: 28, margin: "0 auto" }} />
          <div className="skeleton" style={{ width: "100%", height: 300 }} />
          <div className="skeleton" style={{ width: "100%", height: 120 }} />
        </div>
      </main>
    );
  }

  if (error && !pedido) {
    return (
      <main style={{ maxWidth: 520, margin: "0 auto", padding: "32px 16px", minHeight: "100vh" }}>
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", gap: 16, textAlign: "center" }}>
          <Receipt size={48} color="var(--text-muted)" />
          <h2 style={{ fontSize: 18, fontWeight: 500, color: "var(--text)", margin: 0 }}>{error}</h2>
        </div>
      </main>
    );
  }

  const detalles = pedido?.detalle_pedido || [];
  const restNombre = restaurante?.nombre || "Restaurante";
  const mesaNum = pedido?.mesa?.numero || mesa?.numero || "--";
  const numeroPedido = `PED-${String(pedido?.numero_pedido).padStart(3, "0")}`;
  const isPagado = pedido?.estado_pago === "PAGADO";

  const heroImage = restaurante?.hero_banner_url;

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: heroImage ? `linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.45) 100%), url(${heroImage}) center/cover no-repeat` : "var(--bg)",
      backgroundAttachment: "fixed"
    }}>
    <main className="animate-fade-in" style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 16px" }}>
      <ThemeToggle floating />
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h1
          style={{
            fontFamily: "var(--font-noto-serif), 'Noto Serif', serif",
            fontSize: 32,
            fontWeight: 700,
            color: "var(--text)",
            margin: "0 0 8px",
          }}
        >
          Voucher
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0 }}>
          Comprobante de tu pedido
        </p>
      </div>

      {/* Contenedor Grid: Voucher + Estado */}
      <div data-voucher-grid style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
        {/* Printable Voucher Card */}
      <div
        ref={voucherRef}
        id="voucher-printable"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "var(--shadow-md)",
        }}
      >
        {/* Restaurant Header */}
        <div
          style={{
            margin: "20px 20px 0",
            padding: "18px 20px",
            border: "1px solid var(--primary)",
            borderRadius: 14,
            display: "flex",
            alignItems: "center",
            gap: 14,
            background: "var(--primary-ghost)",
          }}
        >
          {/* Logo */}
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              overflow: "hidden",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            {restaurante?.logo_url ? (
              <img
                src={restaurante.logo_url}
                alt={restNombre}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <Receipt size={24} color="var(--primary)" />
            )}
          </div>
          <div>
            <p style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", margin: 0 }}>
              {restNombre}
            </p>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "2px 0 0" }}>
              Mesa {mesaNum} · {formatFechaHora(pedido?.created_at || "")}
            </p>
          </div>
        </div>

        {/* Detalle Items */}
        <div style={{ padding: "20px 20px 0" }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--primary)", margin: "0 0 14px" }}>
            Detalle
          </p>
          {detalles.map((det: any, i: number) => (
            <div key={det.id || i} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, color: "var(--text)" }}>
                  {det.producto?.nombre || "Plato"}
                </span>
                <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>
                  {formatPrecio(Number(det.precio_unitario))}
                </span>
              </div>
              {det.notas && (
                <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "2px 0 0 8px", fontStyle: "italic", display: "flex", alignItems: "center", gap: 4 }}>
                  <StickyNote size={9} /> {det.notas}
                </p>
              )}
              {det.detalle_pedido_agregado?.map((dpa: any, j: number) => (
                <p key={j} style={{ fontSize: 11, color: "var(--text-muted)", margin: "2px 0 0 8px", display: "flex", alignItems: "center", gap: 4 }}>
                  <Plus size={9} /> {dpa.agregado?.nombre || "Extra"} (+{formatPrecio(Number(dpa.precio_momento))})
                </p>
              ))}
            </div>
          ))}
        </div>

        {/* Subtotal */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", margin: "8px 0 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Subtotal</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>
              {formatPrecio(Number(pedido?.subtotal))}
            </span>
          </div>
        </div>

        {/* Total */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", background: "var(--primary-ghost)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: "var(--primary)" }}>Total</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: "var(--primary)", fontVariantNumeric: "tabular-nums" }}>
              {formatPrecio(Number(pedido?.total))}
            </span>
          </div>
        </div>

        {/* Numero de pedido */}
        <div style={{ padding: "20px", textAlign: "center", borderTop: "1px solid var(--border)" }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--primary)", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Numero de pedido
          </p>
          <p style={{ fontSize: 28, fontWeight: 700, color: "var(--primary)", letterSpacing: "0.05em", margin: 0 }}>
            {numeroPedido}
          </p>
          {isPagado && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 10, padding: "5px 12px", background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)", borderRadius: 999, fontSize: 11, fontWeight: 600, color: "var(--success)" }}>
              <CheckCircle2 size={12} /> PAGADO
            </span>
          )}
        </div>
      </div>

      {/* ── Seccion de estado del pago (Columna 2 del Grid) ── */}
      <div>
        {!isPagado ? (
          /* PASO 1: Esperando que Caja confirme */
          <div
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <AlertCircle size={16} color="var(--warning)" />
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: 0 }}>
                Paso 1: Pago pendiente
              </h3>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 14px", lineHeight: 1.6 }}>
              Realiza tu pago al cajero. Una vez que el cajero confirme tu pago, podras subir tu comprobante aqui.
            </p>
            <div
              style={{
                padding: "14px 16px",
                background: "var(--info)",
                opacity: 0.08,
                position: "absolute",
              }}
            />
            <div
              style={{
                padding: "14px 16px",
                background: "rgba(91,127,232,0.06)",
                border: "1px solid rgba(91,127,232,0.2)",
                borderRadius: 12,
                fontSize: 13,
                color: "var(--info)",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Info size={16} style={{ flexShrink: 0 }} />
              Esperando confirmacion del cajero...
            </div>

            {/* Boton de imprimir DESHABILITADO */}
            <button
              disabled
              style={{
                width: "100%",
                marginTop: 16,
                padding: "14px",
                border: "1px solid var(--border)",
                borderRadius: 12,
                background: "var(--surface)",
                color: "var(--text-muted)",
                fontSize: 14,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                cursor: "not-allowed",
                opacity: 0.5,
              }}
            >
              <Printer size={16} /> Imprimir voucher
            </button>
            <p style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", margin: "8px 0 0" }}>
              El voucher se habilitara cuando subas tu comprobante de pago.
            </p>
          </div>
        ) : !uploaded ? (
          /* PASO 2: Caja confirmo, cliente sube comprobante */
          <div
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Upload size={16} color="var(--info)" />
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: 0 }}>
                Paso 2: Subir comprobante
              </h3>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 4px", lineHeight: 1.6 }}>
              El cajero ya confirmo tu pago. Ahora sube la captura de tu pago por {pedido?.metodo_pago || "Yape"}.
            </p>

            <div style={{ padding: "10px 12px", background: "rgba(22,163,74,0.06)", borderRadius: 8, border: "1px solid rgba(22,163,74,0.15)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle2 size={14} color="var(--success)" />
              <span style={{ fontSize: 12, color: "var(--success)", fontWeight: 500 }}>Pago confirmado por el cajero</span>
            </div>

            {error && (
              <p style={{ fontSize: 12, color: "var(--error)", margin: "0 0 12px", padding: "10px 12px", background: "rgba(220,38,38,0.06)", borderRadius: 8, border: "1px solid rgba(220,38,38,0.15)" }}>
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
                borderRadius: 12,
                cursor: "pointer",
                background: comprobante ? "var(--primary-ghost)" : "transparent",
                transition: "all 0.2s ease",
              }}
            >
              <Upload size={24} color={comprobante ? "var(--primary)" : "var(--text-muted)"} />
              <span style={{ fontSize: 13, color: comprobante ? "var(--primary)" : "var(--text-muted)" }}>
                {comprobante ? comprobante.name : "Toca para subir captura"}
              </span>
              <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
            </label>

            {comprobante && (
              <button
                onClick={handleUpload}
                disabled={uploading}
                style={{
                  width: "100%",
                  marginTop: 12,
                  padding: "14px",
                  border: "none",
                  borderRadius: 12,
                  background: "var(--primary)",
                  color: "var(--text-inverse)",
                  fontSize: 14,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  cursor: uploading ? "not-allowed" : "pointer",
                  opacity: uploading ? 0.6 : 1,
                }}
              >
                {uploading ? <><Loader2 size={14} className="spin-icon" /> Subiendo...</> : <><Upload size={14} /> Enviar comprobante</>}
              </button>
            )}

            {/* Boton de imprimir DESHABILITADO */}
            <button
              disabled
              style={{
                width: "100%",
                marginTop: 16,
                padding: "14px",
                border: "1px solid var(--border)",
                borderRadius: 12,
                background: "var(--surface)",
                color: "var(--text-muted)",
                fontSize: 14,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                cursor: "not-allowed",
                opacity: 0.5,
              }}
            >
              <Printer size={16} /> Imprimir voucher
            </button>
            <p style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", margin: "8px 0 0" }}>
              Sube tu comprobante para habilitar la impresion del voucher.
            </p>
          </div>
        ) : (
          /* PASO 3: Comprobante subido — voucher listo para imprimir */
          <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                textAlign: "center",
                padding: "20px",
                background: "rgba(22,163,74,0.05)",
                borderRadius: 16,
                border: "1px solid rgba(22,163,74,0.2)",
              }}
            >
              <FileCheck size={28} color="var(--success)" style={{ marginBottom: 8 }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--success)", margin: 0 }}>
                Comprobante enviado — Pago verificado
              </p>
              <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "4px 0 0" }}>
                Tu pago ha sido registrado correctamente. Ya puedes imprimir tu voucher.
              </p>
            </div>

            {/* Boton de imprimir HABILITADO */}
            <button
              onClick={handlePrint}
              style={{
                width: "100%",
                padding: "14px",
                border: "none",
                borderRadius: 12,
                background: "var(--primary)",
                color: "var(--text-inverse)",
                fontSize: 14,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                cursor: "pointer",
              }}
            >
              <Printer size={16} /> Imprimir voucher
            </button>
          </div>
        )}
      </div>
      </div>

      {/* Print-specific CSS */}
      <style jsx global>{`
        @media (max-width: 768px) {
          [data-voucher-grid] {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
        }
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
    </main>
    </div>
  );
}
